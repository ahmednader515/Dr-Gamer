# Database Migration Scripts

This directory contains scripts to safely backup and transfer data from Aiven PostgreSQL to Prisma database.

## Scripts Overview

### 1. `backup-from-aiven.ts`
Exports all data from Aiven database to JSON files.

### 2. `transfer-to-prisma.ts`
Imports data from JSON backup files to Prisma database.

### 3. `transfer-data.ts`
Complete direct transfer script (Aiven → Prisma in one step).

## Setup

1. **Install required dependencies**:
```bash
npm install pg @types/pg --save-dev
```

2. **Set environment variables** in your `.env` file:

```env
# Aiven Database URL (source) - Use your direct PostgreSQL connection string
AIVEN_DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# Prisma Database URL (target) - Can use prisma:// or direct PostgreSQL URL
PRISMA_DATABASE_URL="prisma://your-prisma-url"
# OR use your existing DATABASE_URL if that's your Prisma database
DATABASE_URL="prisma://your-prisma-url"
```

**Important Notes:**
- The **Aiven URL** must be a direct PostgreSQL connection string (starts with `postgresql://`)
- The **Prisma URL** can be either:
  - Prisma Accelerate URL (starts with `prisma://`)
  - Direct PostgreSQL URL (starts with `postgresql://`)
- The scripts use the native PostgreSQL client (`pg`) for Aiven to avoid Prisma Accelerate protocol requirements

## Usage Options

### Option 1: Backup First, Then Transfer (Recommended)

This is the safest approach as it creates a backup before transferring.

#### Step 1: Create backup from Aiven
```bash
npx tsx scripts/backup-from-aiven.ts
```

This will:
- Connect to your Aiven database
- Export all tables to JSON files
- Save them in `backups/aiven-backup-[timestamp]/` directory
- Create a backup info file

#### Step 2: Transfer backup to Prisma
```bash
npx tsx scripts/transfer-to-prisma.ts [backup-directory-path]
```

If you don't provide a backup directory, it will use the most recent backup.

Example:
```bash
# Use latest backup
npx tsx scripts/transfer-to-prisma.ts

# Use specific backup
npx tsx scripts/transfer-to-prisma.ts backups/aiven-backup-1234567890
```

### Option 2: Direct Transfer (Faster)

For a direct one-step transfer:

```bash
npx tsx scripts/transfer-data.ts
```

This will:
- Read directly from Aiven database
- Write directly to Prisma database
- Verify the transfer was successful
- Show summary of transferred records

## Tables Transferred

The scripts transfer data in this order (respecting foreign key dependencies):

1. `users` - User accounts
2. `categories` - Product categories
3. `products` - Product catalog
4. `settings` - App settings
5. `user_addresses` - User shipping addresses
6. `password_reset_tokens` - Password reset tokens
7. `orders` - **All orders (important!)**
8. `order_shipping_addresses` - Order shipping addresses
9. `order_items` - **All order items (important!)**
10. `reviews` - Product reviews
11. `favorites` - User favorites
12. `promo_codes` - Promo codes
13. `promo_code_products` - Promo code assignments
14. `web_pages` - Web pages
15. `faq_categories` - FAQ categories
16. `faq_questions` - FAQ questions

## Important Notes

### Orders Data
The scripts are specifically designed to preserve all order data:
- ✅ All order records are transferred
- ✅ All order items are transferred
- ✅ All order shipping addresses are transferred
- ✅ Foreign key relationships are maintained

### Data Type Handling
The scripts automatically handle:
- ✅ Date/DateTime fields
- ✅ JSON fields (variations, payment results, etc.)
- ✅ Array fields (images, tags, colors, etc.)
- ✅ Decimal fields (prices)
- ✅ Boolean fields
- ✅ Null values

### Duplicate Handling
- Uses `skipDuplicates: true` to avoid conflicts
- If a record with the same ID exists, it will be skipped
- No existing data will be overwritten unless IDs match

### Error Handling
- Scripts continue processing even if individual records fail
- Errors are logged and included in the summary
- Failed records won't stop the entire migration

## Verification

After transfer, the scripts will:
1. Show a summary of transferred records per table
2. Verify critical tables (orders, order_items, users, products)
3. Display counts for verification

### Manual Verification

You can verify the transfer manually:

```bash
# Count records in Prisma database
npx prisma studio
```

Or check specific tables:
```typescript
// In your app or a script
const orderCount = await prisma.order.count()
const orderItemCount = await prisma.orderItem.count()
console.log(`Orders: ${orderCount}, Order Items: ${orderItemCount}`)
```

## Troubleshooting

### Connection Errors

**Error: "Connection refused"**
- Check that database URLs are correct
- Verify network connectivity
- Check firewall settings
- Ensure SSL mode is correct (`?sslmode=require`)

**Error: "Authentication failed"**
- Verify username and password
- Check database user permissions
- Ensure user has SELECT (for backup) and INSERT (for transfer) permissions

### Data Transfer Errors

**Error: "Foreign key constraint violation"**
- The scripts transfer data in the correct order to avoid this
- If you see this, check the table order in the script
- Ensure parent records (e.g., users) are transferred before child records (e.g., orders)

**Error: "Unique constraint violation"**
- This is normal if data already exists
- The script uses `skipDuplicates` to handle this
- Existing records won't be overwritten

**Error: "Invalid JSON"**
- Check that backup files are valid JSON
- Try recreating the backup
- Check for special characters in data

### Performance Issues

If transfer is slow:
- Process in smaller batches (reduce BATCH_SIZE in script)
- Transfer during off-peak hours
- Check database connection limits
- Consider using direct transfer script for faster performance

## Backup Files Location

Backups are stored in:
```
backups/
  └── aiven-backup-[timestamp]/
      ├── backup-info.json
      ├── users.json
      ├── categories.json
      ├── products.json
      ├── orders.json
      ├── order_items.json
      └── ... (other tables)
```

## Safety

- ✅ Scripts use transactions where possible
- ✅ No data is deleted from source (Aiven)
- ✅ Existing data in target is not overwritten (skipDuplicates)
- ✅ Backup files are created before transfer
- ✅ Verification is performed after transfer

## Next Steps

After successful migration:
1. Verify data in Prisma database
2. Test your application with the new database
3. Update your `.env` to use the new database URL
4. Keep backup files for a while in case you need to reference them

## Support

If you encounter issues:
1. Check the error messages in the console
2. Review the backup files to verify source data
3. Check database connectivity
4. Verify environment variables are set correctly
