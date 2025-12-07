-- AlterTable
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "featuredProducts" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "newlyAddedProducts" JSONB DEFAULT '[]'::jsonb;

