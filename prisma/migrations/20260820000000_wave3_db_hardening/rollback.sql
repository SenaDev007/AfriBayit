-- Rollback — run ONLY if migration fails
BEGIN;
-- Drop indexes
DROP INDEX IF EXISTS "PropertyImage_propertyId_idx";
DROP INDEX IF EXISTS "VirtualTour_propertyId_idx";
DROP INDEX IF EXISTS "PropertyLegalDoc_propertyId_idx";
-- ... (drop all 25 indexes)
-- Drop deleted_at columns
ALTER TABLE "properties" DROP COLUMN IF EXISTS "deleted_at";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "deleted_at";
-- ... (drop from all 32 tables)
-- Drop wallet_transactions.country
DROP POLICY IF EXISTS "wallet_transactions_country_isolation" ON "wallet_transactions";
ALTER TABLE "wallet_transactions" DROP COLUMN IF EXISTS "country";
COMMIT;
