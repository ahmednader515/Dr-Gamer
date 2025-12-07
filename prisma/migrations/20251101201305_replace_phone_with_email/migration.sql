-- Migration: Replace phone with email in users table
-- This migration safely converts the phone column to email without data loss

-- Step 1: Add email column as nullable (temporarily)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Step 2: Generate email addresses from phone numbers for existing users
-- Format: phone@drgamer.local (temporary format - users should update these)
UPDATE "users" 
SET "email" = REPLACE(REPLACE(REPLACE("phone", '+', ''), '-', ''), ' ', '') || '@drgamer.local'
WHERE "email" IS NULL AND "phone" IS NOT NULL;

-- Step 3: For any remaining NULL emails, set a default
UPDATE "users" 
SET "email" = 'user' || id || '@drgamer.local'
WHERE "email" IS NULL;

-- Step 4: Make email column NOT NULL
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- Step 5: Drop the unique constraint on phone
DROP INDEX IF EXISTS "users_phone_key";

-- Step 6: Create unique constraint on email
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Step 7: Drop the phone column
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";

