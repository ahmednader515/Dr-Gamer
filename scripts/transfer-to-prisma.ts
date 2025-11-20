/**
 * Transfer script to import data from backup files to Prisma database
 * This script imports data from JSON backup files to the target Prisma database
 * 
 * Usage:
 * 1. Set PRISMA_DATABASE_URL in your environment
 * 2. Run: npx tsx scripts/transfer-to-prisma.ts [backup-directory-path]
 * 
 * If no backup directory is provided, it will use the most recent backup
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { loadEnvFromFile } from '../lib/env-loader'

// Parse database URL
function parseDatabaseUrl(url: string) {
  try {
    const urlObj = new URL(url)
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '5432'),
      database: urlObj.pathname.slice(1), // Remove leading /
      user: urlObj.username,
      password: urlObj.password,
      ssl: urlObj.searchParams.get('sslmode') === 'require' ? { rejectUnauthorized: false } : false,
    }
  } catch (error) {
    throw new Error(`Invalid database URL: ${error}`)
  }
}

// Get target database connection
function getTargetPool(): Pool {
  const url = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
  if (!url) {
    throw new Error('PRISMA_DATABASE_URL, DATABASE_URL, or DIRECT_DATABASE_URL environment variable is not set')
  }
  
  // If it's a prisma:// URL, we need the direct URL
  if (url.startsWith('prisma://')) {
    const directUrl = process.env.DIRECT_DATABASE_URL
    if (!directUrl) {
      throw new Error('DIRECT_DATABASE_URL is required when using Prisma Accelerate URL. Please set DIRECT_DATABASE_URL in your .env file.')
    }
    const config = parseDatabaseUrl(directUrl)
    return new Pool(config)
  }
  
  // Use direct PostgreSQL URL
  const config = parseDatabaseUrl(url)
  return new Pool(config)
}

// Table order respecting foreign key dependencies
const TABLE_ORDER = [
  'users',
  'categories',
  'products',
  'settings',
  'user_addresses',
  'password_reset_tokens',
  'orders',
  'order_shipping_addresses',
  'order_items',
  'reviews',
  'favorites',
  'promo_codes',
  'promo_code_products',
  'web_pages',
  'faq_categories',
  'faq_questions',
]

function findLatestBackup(): string | null {
  const backupsDir = path.join(process.cwd(), 'backups')
  
  if (!fs.existsSync(backupsDir)) {
    return null
  }
  
  const backups = fs.readdirSync(backupsDir)
    .filter(dir => dir.startsWith('aiven-backup-'))
    .map(dir => ({
      name: dir,
      time: parseInt(dir.replace('aiven-backup-', '')),
      path: path.join(backupsDir, dir)
    }))
    .sort((a, b) => b.time - a.time)
  
  return backups.length > 0 ? backups[0].path : null
}

async function loadBackupData(backupDir: string, tableName: string): Promise<any[]> {
  const filePath = path.join(backupDir, `${tableName}.json`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Backup file not found: ${filePath}`)
    return []
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  let data: any[]
  
  try {
    data = JSON.parse(fileContent)
  } catch (error) {
    console.error(`⚠️  Error parsing JSON for ${tableName}:`, error)
    return []
  }
  
  if (!Array.isArray(data)) {
    console.log(`⚠️  Invalid backup data format for ${tableName}`)
    return []
  }
  
  // Ensure arrays and JSON fields are properly parsed (not JSON strings)
  // This handles cases where arrays/JSON might have been stringified during backup
  const arrayColumns = ['images', 'tags', 'colors', 'sizes', 'variationnames']
  const jsonColumns = ['variations', 'ratingdistribution', 'paymentresult', 'common', 'site', 'carousels', 'availablelanguages', 'availablecurrencies', 'availablepaymentmethods', 'availabledeliverydates']
  
  return data.map(row => {
    const processed: any = { ...row }
    
    // Check each field - if it's an array/JSON column and looks like a JSON string, parse it
    for (const [key, value] of Object.entries(processed)) {
      const lowerKey = key.toLowerCase()
      
      // Only check columns that might be stored as JSON strings
      if ((arrayColumns.includes(lowerKey) || jsonColumns.includes(lowerKey)) && typeof value === 'string') {
        const trimmed = value.trim()
        
        // Skip empty strings
        if (trimmed === '' || trimmed === 'null') {
          processed[key] = null
          continue
        }
        
        // Check if it looks like a JSON string (starts with [ or {)
        // Also check for quoted JSON strings like "[\"...]" or '{\"...}'
        if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
            (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('"[') && trimmed.endsWith(']"')) ||
            (trimmed.startsWith('"{') && trimmed.endsWith('}"')) ||
            (trimmed.startsWith("'[") && trimmed.endsWith("]'")) ||
            (trimmed.startsWith("'{") && trimmed.endsWith("}'"))) {
          try {
            let toParse = trimmed
            
            // If it's a quoted JSON string, unquote it first
            if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
                (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
              // Remove outer quotes and unescape
              toParse = trimmed.slice(1, -1)
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .replace(/\\\\/g, '\\')
            }
            
            // Try to parse as JSON
            const parsed = JSON.parse(toParse)
            // Store the parsed value (object or array)
            processed[key] = parsed
          } catch (e) {
            // Not a valid JSON string, leave as-is
            // This will be handled later in the import function
          }
        }
      }
    }
    
    return processed
  })
}

function convertValue(value: any, originalValue: any): any {
  if (value === null || value === undefined) {
    return null
  }
  
  // Handle dates (from ISO strings)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    try {
      return new Date(value)
    } catch {
      return value
    }
  }
  
  // Handle JSON fields (already parsed from JSON file)
  if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
    // Check if it's already a parsed JSON object
    if (value && typeof value === 'object') {
      return value
    }
    // If it's a string, try to parse
    if (typeof originalValue === 'string') {
      try {
        return JSON.parse(originalValue)
      } catch {
        return value
      }
    }
    return value
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return value
  }
  
  // Handle Decimal (from number)
  if (typeof value === 'number') {
    return value
  }
  
  // Try to parse string numbers
  if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value)
  }
  
  return value
}

async function importTable(tableName: string, data: any[], pool: Pool) {
  if (data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} (no data)`)
    return { table: tableName, inserted: 0, errors: 0 }
  }
  
  console.log(`📥 Importing ${data.length} records into ${tableName}...`)
  
  let inserted = 0
  let errors = 0
  
  // Process in batches to avoid overwhelming the database
  const BATCH_SIZE = 100
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE)
    
    // Process each record individually for better error handling
    for (const row of batch) {
      try {
        // Build INSERT query - use snake_case column names (as stored in database)
        const columns = Object.keys(row).map(key => `"${key}"`).join(', ')
        
        // PostgreSQL array columns that need special formatting
        const arrayColumns = ['images', 'tags', 'colors', 'sizes', 'variationnames'] // lowercase column names
        const jsonColumns = ['variations', 'ratingdistribution', 'paymentresult', 'common', 'site', 'carousels', 'availablelanguages', 'availablecurrencies', 'availablepaymentmethods', 'availabledeliverydates'] // JSON/JSONB columns
        
        const values: any[] = []
        const placeholders: string[] = []
        let paramIndex = 1
        
        Object.keys(row).forEach(key => {
          const val = row[key]
          const lowerKey = key.toLowerCase()
          
          if (val === null || val === undefined) {
            placeholders.push(`$${paramIndex}`)
            values.push(null)
            paramIndex++
            return
          }
          
          // Handle PostgreSQL array columns - pass as array for pg to handle
          if (arrayColumns.includes(lowerKey)) {
            let arrayValue: string[] = []
            
            if (Array.isArray(val)) {
              // Already an array, convert all items to strings
              arrayValue = val.map(item => String(item))
            } else if (typeof val === 'string') {
              // Try multiple parsing strategies
              const trimmed = val.trim()
              
              // Strategy 1: Try parsing as JSON (handles both ["url"] and "[\"url\"]")
              try {
                // First, try direct parse
                let parsed: any = null
                try {
                  parsed = JSON.parse(trimmed)
                } catch {
                  // If that fails, try removing outer quotes first (handles escaped strings)
                  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
                      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
                    const unquoted = trimmed.slice(1, -1)
                      .replace(/\\"/g, '"')
                      .replace(/\\'/g, "'")
                      .replace(/\\\\/g, '\\')
                    parsed = JSON.parse(unquoted)
                  }
                }
                
                if (Array.isArray(parsed)) {
                  arrayValue = parsed.map(item => String(item))
                } else if (parsed !== null && parsed !== undefined) {
                  arrayValue = [String(parsed)]
                }
              } catch (e1) {
                // Strategy 2: Try PostgreSQL array format {value1,value2}
                if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                  const arrayContent = trimmed.slice(1, -1).trim()
                  if (arrayContent === '') {
                    arrayValue = []
                  } else {
                    // Parse PostgreSQL array format more carefully
                    const items: string[] = []
                    let current = ''
                    let inQuotes = false
                    
                    for (let i = 0; i < arrayContent.length; i++) {
                      const char = arrayContent[i]
                      
                      // Handle escaped characters
                      if (i > 0 && arrayContent[i - 1] === '\\') {
                        current += char
                        continue
                      }
                      
                      if (char === '\\') {
                        continue // Skip escape char, next char will be added
                      }
                      
                      if (char === '"' && !inQuotes) {
                        inQuotes = true
                        continue
                      } else if (char === '"' && inQuotes) {
                        inQuotes = false
                        continue
                      }
                      
                      if (char === ',' && !inQuotes) {
                        if (current.trim()) {
                          const cleaned = current.trim().replace(/^["']|["']$/g, '')
                          if (cleaned) items.push(cleaned)
                        }
                        current = ''
                      } else {
                        current += char
                      }
                    }
                    
                    if (current.trim()) {
                      const cleaned = current.trim().replace(/^["']|["']$/g, '')
                      if (cleaned) items.push(cleaned)
                    }
                    
                    arrayValue = items
                  }
                } else if (trimmed) {
                  // Single value, convert to array
                  arrayValue = [trimmed]
                }
              }
            } else if (val !== null && val !== undefined) {
              // Convert single value to array
              arrayValue = [String(val)]
            }
            
            // Pass array to pg library - it will handle PostgreSQL array formatting
            placeholders.push(`$${paramIndex}::text[]`)
            values.push(arrayValue)
            paramIndex++
            return
          }
          
          // Handle Date objects
          if (val instanceof Date) {
            placeholders.push(`$${paramIndex}`)
            values.push(val)
            paramIndex++
            return
          }
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
            placeholders.push(`$${paramIndex}`)
            values.push(new Date(val))
            paramIndex++
            return
          }
          
          // Handle JSON/JSONB columns
          if (jsonColumns.includes(lowerKey)) {
            // PostgreSQL's JSONB type expects valid JSON strings when using ::jsonb cast
            // The pg library needs the value to be a JSON string for ::jsonb cast to work properly
            // So we'll stringify objects/arrays and keep strings as-is (after validation)
            let jsonValue: string | null = null
            
            if (val === null || val === undefined) {
              jsonValue = null
            } else if (typeof val === 'string') {
              // If it's already a JSON string, validate it's valid JSON
              const trimmed = val.trim()
              
              // Skip empty strings
              if (trimmed === '' || trimmed === 'null') {
                jsonValue = null
              } else {
                // Validate it's valid JSON by parsing it
                try {
                  JSON.parse(trimmed)
                  // Valid JSON string, use it directly
                  jsonValue = trimmed
                } catch (e1) {
                  // Not valid JSON, throw error
                  throw new Error(`Invalid JSON string for column ${key}: ${trimmed.substring(0, 100)}`)
                }
              }
            } else if (typeof val === 'object' && val !== null && !Array.isArray(val) && !(val instanceof Date)) {
              // Already an object, stringify it to JSON string
              jsonValue = JSON.stringify(val)
            } else if (Array.isArray(val)) {
              // Already an array, stringify it to JSON string
              jsonValue = JSON.stringify(val)
            } else {
              // Other types (numbers, booleans) - stringify them
              jsonValue = JSON.stringify(val)
            }
            
            // Pass the JSON string to pg library
            // Cast through text first, then to jsonb - this ensures proper type handling
            placeholders.push(`$${paramIndex}::text::jsonb`)
            values.push(jsonValue)
            paramIndex++
            return
          }
          
          // Handle regular arrays (not array columns) - convert to JSON
          if (Array.isArray(val)) {
            placeholders.push(`$${paramIndex}::jsonb`)
            values.push(val)
            paramIndex++
            return
          }
          
          // Handle JSON objects (not in jsonColumns list)
          if (typeof val === 'object' && !(val instanceof Date)) {
            placeholders.push(`$${paramIndex}::jsonb`)
            values.push(val)
            paramIndex++
            return
          }
          
          // Handle numbers
          if (typeof val === 'number') {
            placeholders.push(`$${paramIndex}`)
            values.push(val)
            paramIndex++
            return
          }
          
          // Handle booleans
          if (typeof val === 'boolean') {
            placeholders.push(`$${paramIndex}`)
            values.push(val)
            paramIndex++
            return
          }
          
          // Everything else as string
          placeholders.push(`$${paramIndex}`)
          values.push(String(val))
          paramIndex++
        })
        
        // Use ON CONFLICT DO NOTHING to skip duplicates (assuming 'id' is primary key)
        const query = `
          INSERT INTO ${tableName} (${columns})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (id) DO NOTHING
        `
        
        const result = await pool.query(query, values)
        
        // Check if row was actually inserted (rowCount > 0) or skipped (rowCount = 0)
        if (result.rowCount && result.rowCount > 0) {
          inserted++
        }
        
        // Progress reporting
        const currentIndex = i + batch.indexOf(row) + 1
        if (currentIndex % 500 === 0) {
          console.log(`  Progress: ${currentIndex}/${data.length}`)
        }
      } catch (error: any) {
        errors++
        if (errors <= 5) {
          console.error(`  Error importing record:`, error.message)
          // Log more details for first few errors
          if (errors === 1) {
            console.error(`    Table: ${tableName}, Record keys:`, Object.keys(row).join(', '))
            // Log JSON column values for debugging
            const jsonCols = ['variations', 'ratingdistribution', 'paymentresult', 'common', 'site', 'carousels']
            const jsonDebug: any = {}
            Object.keys(row).forEach(key => {
              const lowerKey = key.toLowerCase()
              if (jsonCols.includes(lowerKey)) {
                const val = row[key]
                jsonDebug[key] = {
                  type: typeof val,
                  isArray: Array.isArray(val),
                  value: typeof val === 'string' ? val.substring(0, 100) : val
                }
              }
            })
            if (Object.keys(jsonDebug).length > 0) {
              console.error(`    JSON columns debug:`, JSON.stringify(jsonDebug, null, 2))
            }
          }
        }
      }
    }
  }
  
  console.log(`✅ Imported ${inserted} records into ${tableName}${errors > 0 ? ` (${errors} errors)` : ''}`)
  
  return { table: tableName, inserted, errors }
}

async function main() {
  console.log('🚀 Starting data transfer to Prisma database...\n')
  
  // Load environment variables from .env file
  loadEnvFromFile()
  
  // Get backup directory
  const backupDirArg = process.argv[2]
  let backupDir: string | null = null
  
  if (backupDirArg) {
    backupDir = path.isAbsolute(backupDirArg) 
      ? backupDirArg 
      : path.join(process.cwd(), backupDirArg)
    
    if (!fs.existsSync(backupDir)) {
      console.error(`❌ Error: Backup directory not found: ${backupDir}`)
      process.exit(1)
    }
  } else {
    backupDir = findLatestBackup()
    
    if (!backupDir) {
      console.error('❌ Error: No backup directory found')
      console.log('\nPlease provide a backup directory path or create a backup first:')
      console.log('  npx tsx scripts/backup-from-aiven.ts')
      process.exit(1)
    }
    
    console.log(`📁 Using latest backup: ${backupDir}\n`)
  }
  
  // Verify backup info
  const infoPath = path.join(backupDir, 'backup-info.json')
  if (fs.existsSync(infoPath)) {
    const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'))
    console.log(`📦 Backup Info:`)
    console.log(`   Source: ${info.source}`)
    console.log(`   Timestamp: ${info.timestamp}`)
    console.log(`   Tables: ${info.tables.length}\n`)
  }
  
  // Create target database connection pool
  const targetPool = getTargetPool()
  console.log(`✅ Connected to target database\n`)
  
  const results: any[] = []
  
  // Import all tables in order
  for (const table of TABLE_ORDER) {
    const data = await loadBackupData(backupDir, table)
    const result = await importTable(table, data, targetPool)
    results.push(result)
  }
  
  // Close connection pool
  await targetPool.end()
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Transfer Summary')
  console.log('='.repeat(60))
  
  let totalInserted = 0
  let totalErrors = 0
  
  results.forEach((result) => {
    if (result.errors > 0) {
      console.log(`⚠️  ${result.table}: ${result.inserted} inserted, ${result.errors} errors`)
    } else {
      console.log(`✅ ${result.table}: ${result.inserted} records`)
    }
    totalInserted += result.inserted
    totalErrors += result.errors
  })
  
  console.log('='.repeat(60))
  console.log(`📦 Total records imported: ${totalInserted}`)
  if (totalErrors > 0) {
    console.log(`⚠️  Total errors: ${totalErrors}`)
  }
  console.log('='.repeat(60) + '\n')
  
  console.log('✅ Transfer completed successfully!')
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some records had errors during import. Please review the output above.')
    process.exit(1)
  }
}

// Run transfer
main().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
