-- AlterTable
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "orderUpdates" JSONB;

