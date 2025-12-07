/**
 * Backup script to export all data from Aiven PostgreSQL database
 * This script exports data from all tables to JSON files for safe transfer
 * 
 * Usage:
 * 1. Set AIVEN_DATABASE_URL in your environment
 * 2. Run: npx tsx scripts/backup-from-aiven.ts
 * 
 * This will create a backup directory with all table data as JSON files
 */

import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { loadEnvFromFile } from '../lib/env-loader'

// Parse Aiven database URL
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

// Create PostgreSQL connection pool for Aiven
let aivenPool: Pool | null = null

function getAivenPool(): Pool {
  if (!process.env.AIVEN_DATABASE_URL) {
    throw new Error('AIVEN_DATABASE_URL environment variable is not set')
  }
  
  if (!aivenPool) {
    const config = parseDatabaseUrl(process.env.AIVEN_DATABASE_URL)
    aivenPool = new Pool(config)
  }
  
  return aivenPool
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

// Create backup directory with timestamp
const backupDir = path.join(process.cwd(), 'backups', `aiven-backup-${Date.now()}`)
fs.mkdirSync(backupDir, { recursive: true })

async function backupTable(tableName: string) {
  console.log(`📦 Backing up table: ${tableName}...`)
  
  try {
    const pool = getAivenPool()
    
    // Use pg client to get all data from table
    const result = await pool.query(`SELECT * FROM ${tableName}`)
    const data = result.rows
    
    // Handle special data types
    const processedData = data.map((row: any) => {
      const processed: any = {}
      
      for (const [key, value] of Object.entries(row)) {
        // Handle Date objects
        if (value instanceof Date) {
          processed[key] = value.toISOString()
        }
        // Handle Decimal/Number types
        else if (typeof value === 'object' && value !== null && 'toNumber' in value) {
          processed[key] = Number(value)
        }
        // Handle JSON fields
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          processed[key] = value
        }
        // Handle arrays
        else if (Array.isArray(value)) {
          processed[key] = value
        }
        // Everything else as-is
        else {
          processed[key] = value
        }
      }
      
      return processed
    })
    
    // Write to JSON file
    const filePath = path.join(backupDir, `${tableName}.json`)
    fs.writeFileSync(filePath, JSON.stringify(processedData, null, 2), 'utf-8')
    
    console.log(`✅ Backed up ${processedData.length} records from ${tableName}`)
    return { table: tableName, count: processedData.length, filePath }
  } catch (error: any) {
    console.error(`❌ Error backing up ${tableName}:`, error.message)
    
    // If table doesn't exist, create empty file
    const filePath = path.join(backupDir, `${tableName}.json`)
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8')
    
    return { table: tableName, count: 0, filePath, error: error.message }
  }
}

async function createBackupInfo() {
  const info = {
    timestamp: new Date().toISOString(),
    source: 'Aiven PostgreSQL',
    tables: TABLE_ORDER,
    backupDir,
  }
  
  fs.writeFileSync(
    path.join(backupDir, 'backup-info.json'),
    JSON.stringify(info, null, 2),
    'utf-8'
  )
}

async function main() {
  console.log('🚀 Starting Aiven database backup...\n')
  
  // Load environment variables from .env file
  loadEnvFromFile()
  
  if (!process.env.AIVEN_DATABASE_URL) {
    console.error('❌ Error: AIVEN_DATABASE_URL environment variable is not set')
    console.log('\nPlease set it in your .env file:')
    console.log('AIVEN_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"')
    process.exit(1)
  }
  
  console.log(`✅ Found AIVEN_DATABASE_URL (host: ${new URL(process.env.AIVEN_DATABASE_URL).hostname})\n`)
  
  console.log(`📁 Backup directory: ${backupDir}\n`)
  
  const results: any[] = []
  
  // Backup all tables in order
  for (const table of TABLE_ORDER) {
    const result = await backupTable(table)
    results.push(result)
  }
  
  // Create backup info file
  await createBackupInfo()
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Backup Summary')
  console.log('='.repeat(60))
  
  let totalRecords = 0
  results.forEach((result) => {
    if (result.error) {
      console.log(`⚠️  ${result.table}: ${result.error}`)
    } else {
      console.log(`✅ ${result.table}: ${result.count} records`)
      totalRecords += result.count
    }
  })
  
  console.log('='.repeat(60))
  console.log(`📦 Total records backed up: ${totalRecords}`)
  console.log(`📁 Backup location: ${backupDir}`)
  console.log('='.repeat(60) + '\n')
  
  // Close connection pool
  if (aivenPool) {
    await aivenPool.end()
  }
  
  console.log('✅ Backup completed successfully!')
}

// Run backup
main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    if (aivenPool) {
      aivenPool.end().finally(() => process.exit(1))
    } else {
      process.exit(1)
    }
  })
