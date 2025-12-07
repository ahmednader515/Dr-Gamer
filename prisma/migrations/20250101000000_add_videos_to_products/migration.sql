-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];

