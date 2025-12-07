-- Reset only the users table while preserving other data
-- This will drop and recreate the users table with the correct email field

-- Step 1: Drop foreign key constraints that reference users
ALTER TABLE IF EXISTS "user_addresses" DROP CONSTRAINT IF EXISTS "user_addresses_userId_fkey";
ALTER TABLE IF EXISTS "order_items" DROP CONSTRAINT IF EXISTS "order_items_orderId_fkey";
ALTER TABLE IF EXISTS "reviews" DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE IF EXISTS "orders" DROP CONSTRAINT IF EXISTS "orders_userId_fkey";
-- Only drop favorites constraint if table exists
DO $$ BEGIN
    ALTER TABLE IF EXISTS "favorites" DROP CONSTRAINT IF EXISTS "favorites_userId_fkey";
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Step 2: Delete dependent records (or set to null where possible)
DELETE FROM "user_addresses";
DELETE FROM "reviews";
-- Skip favorites delete if table doesn't exist - it will be created later
-- DELETE FROM "favorites" WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites');
-- Note: Orders are kept but will have orphaned userId references temporarily
-- You may need to handle orders separately if needed

-- Step 3: Drop the users table
DROP TABLE IF EXISTS "users" CASCADE;

-- Step 4: Recreate the users table with email instead of phone
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'User',
    "password" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Step 5: Create unique index on email
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Step 6: Recreate foreign key constraints
ALTER TABLE "user_addresses" ADD CONSTRAINT "user_addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 7: Create favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- Step 8: Create unique constraint on favorites
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_userId_productId_key" ON "favorites"("userId", "productId");

-- Step 9: Add foreign keys for favorites
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

