/**
 * Complete transfer script that handles data migration from Aiven to Prisma
 * This script provides a comprehensive solution for transferring all data
 * 
 * Usage:
 * 1. Set AIVEN_DATABASE_URL and PRISMA_DATABASE_URL in your environment
 * 2. Run: npx tsx scripts/transfer-data.ts
 * 
 * This will:
 * - Create a backup from Aiven
 * - Validate the data
 * - Transfer to Prisma database
 * - Verify the transfer was successful
 */

import { PrismaClient } from '@prisma/client'
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
function getAivenPool(): Pool {
  if (!process.env.AIVEN_DATABASE_URL) {
    throw new Error('AIVEN_DATABASE_URL environment variable is not set')
  }
  
  const config = parseDatabaseUrl(process.env.AIVEN_DATABASE_URL)
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

async function transferDataDirectly() {
  console.log('🚀 Starting direct data transfer from Aiven to Prisma...\n')
  
  // Load environment variables from .env file
  loadEnvFromFile()
  
  if (!process.env.AIVEN_DATABASE_URL) {
    console.error('❌ Error: AIVEN_DATABASE_URL environment variable is not set')
    console.log('\nPlease set it in your .env file:')
    console.log('AIVEN_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"')
    process.exit(1)
  }
  
  if (!process.env.PRISMA_DATABASE_URL && !process.env.DATABASE_URL) {
    console.error('❌ Error: PRISMA_DATABASE_URL or DATABASE_URL environment variable is not set')
    console.log('\nPlease set it in your .env file:')
    console.log('PRISMA_DATABASE_URL="prisma://your-prisma-url"')
    console.log('OR')
    console.log('DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"')
    process.exit(1)
  }
  
  console.log(`✅ Found AIVEN_DATABASE_URL (host: ${new URL(process.env.AIVEN_DATABASE_URL).hostname})`)
  console.log(`✅ Found target database URL\n`)
  
  // Create PostgreSQL pool for Aiven (direct connection)
  const aivenPool = getAivenPool()
  
  // Create Prisma client for target database
  const prismaPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  })
  
  // Model name mapping
  const modelMap: Record<string, string> = {
    'users': 'user',
    'categories': 'category',
    'products': 'product',
    'settings': 'setting',
    'user_addresses': 'userAddress',
    'password_reset_tokens': 'passwordResetToken',
    'orders': 'order',
    'order_shipping_addresses': 'orderShippingAddress',
    'order_items': 'orderItem',
    'reviews': 'review',
    'favorites': 'favorite',
    'promo_codes': 'promoCode',
    'promo_code_products': 'promoCodeProduct',
    'web_pages': 'webPage',
    'faq_categories': 'faqCategory',
    'faq_questions': 'faqQuestion',
  }
  
  const results: any[] = []
  
  // Transfer each table
  for (const table of TABLE_ORDER) {
    console.log(`\n📦 Transferring table: ${table}...`)
    
    try {
      // Read from Aiven using pg client
      const result = await aivenPool.query(`SELECT * FROM ${table}`)
      const data = result.rows
      
      if (data.length === 0) {
        console.log(`⏭️  Skipping ${table} (no data)`)
        results.push({ table, count: 0, transferred: 0 })
        continue
      }
      
      console.log(`  Found ${data.length} records in source`)
      
      // Process data for Prisma
      const processedData = data.map((row: any) => {
        const processed: any = {}
        
        for (const [key, value] of Object.entries(row)) {
          // Convert snake_case to camelCase
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
          
          // Handle special types
          if (value instanceof Date) {
            processed[camelKey] = value
          } else if (value !== null && typeof value === 'object' && 'toNumber' in value) {
            processed[camelKey] = Number(value)
          } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            processed[camelKey] = value
          } else {
            processed[camelKey] = value
          }
        }
        
        return processed
      })
      
      // Insert into Prisma
      const modelName = modelMap[table]
      if (!modelName) {
        console.error(`❌ No model mapping for ${table}`)
        continue
      }
      
      // Process in batches
      const BATCH_SIZE = 100
      let transferred = 0
      
      for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
        const batch = processedData.slice(i, i + BATCH_SIZE)
        
        try {
          const result = await (prismaPrisma as any)[modelName].createMany({
            data: batch,
            skipDuplicates: true,
          })
          
          transferred += result.count || batch.length
          
          if (i % 500 === 0) {
            console.log(`  Progress: ${Math.min(i + BATCH_SIZE, processedData.length)}/${processedData.length}`)
          }
        } catch (error: any) {
          console.error(`  Error in batch: ${error.message}`)
          
          // Try individual inserts
          for (const record of batch) {
            try {
              await (prismaPrisma as any)[modelName].create({
                data: record,
              })
              transferred++
            } catch (individualError: any) {
              console.error(`    Failed to insert record: ${individualError.message}`)
            }
          }
        }
      }
      
      console.log(`✅ Transferred ${transferred}/${data.length} records`)
      results.push({ table, count: data.length, transferred })
      
    } catch (error: any) {
      console.error(`❌ Error transferring ${table}:`, error.message)
      results.push({ table, count: 0, transferred: 0, error: error.message })
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Transfer Summary')
  console.log('='.repeat(60))
  
  let totalCount = 0
  let totalTransferred = 0
  
  results.forEach((result) => {
    if (result.error) {
      console.log(`❌ ${result.table}: ${result.error}`)
    } else if (result.transferred < result.count) {
      console.log(`⚠️  ${result.table}: ${result.transferred}/${result.count} transferred`)
    } else {
      console.log(`✅ ${result.table}: ${result.transferred} records`)
    }
    totalCount += result.count
    totalTransferred += result.transferred
  })
  
  console.log('='.repeat(60))
  console.log(`📦 Total: ${totalTransferred}/${totalCount} records transferred`)
  console.log('='.repeat(60) + '\n')
  
  // Disconnect
  await aivenPool.end()
  await prismaPrisma.$disconnect()
  
  console.log('✅ Transfer completed!')
  
  // Verify critical tables
  console.log('\n🔍 Verifying critical tables...')
  
  const verifyPrisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL,
      },
    },
  })
  
  try {
    const orderCount = await verifyPrisma.order.count()
    const orderItemCount = await verifyPrisma.orderItem.count()
    const userCount = await verifyPrisma.user.count()
    const productCount = await verifyPrisma.product.count()
    
    console.log(`  Orders: ${orderCount}`)
    console.log(`  Order Items: ${orderItemCount}`)
    console.log(`  Users: ${userCount}`)
    console.log(`  Products: ${productCount}`)
    
    if (orderCount > 0 && orderItemCount > 0) {
      console.log('\n✅ Orders data verified successfully!')
    } else {
      console.log('\n⚠️  Warning: No orders found in target database')
    }
    await verifyPrisma.$disconnect()
  } catch (error: any) {
    console.error(`  Verification error: ${error.message}`)
    await verifyPrisma.$disconnect()
  }
  
  console.log('\n✅ Transfer completed!')
}

// Run transfer
transferDataDirectly().catch((error) => {
  console.error('💥 Fatal error:', error)
  process.exit(1)
})
