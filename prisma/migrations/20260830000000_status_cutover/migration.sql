-- AfriBayit — Phase B/C: Status Column Cutover
BEGIN;

-- 1. DROP TRIGGERS AND FUNCTIONS
DROP TRIGGER IF EXISTS property_status_enum_sync ON properties;
DROP TRIGGER IF EXISTS transaction_status_enum_sync ON transactions;
DROP TRIGGER IF EXISTS escrow_state_enum_sync ON escrow_accounts;
DROP TRIGGER IF EXISTS kyc_status_enum_sync ON kyc_documents;
DROP TRIGGER IF EXISTS user_kyc_level_enum_sync ON users;
DROP FUNCTION IF EXISTS sync_property_status_enum();
DROP FUNCTION IF EXISTS sync_transaction_status_enum();
DROP FUNCTION IF EXISTS sync_escrow_state_enum();
DROP FUNCTION IF EXISTS sync_kyc_status_enum();
DROP FUNCTION IF EXISTS sync_user_kyc_level_enum();

-- 2. DROP *ENUM COLUMNS
ALTER TABLE properties DROP COLUMN IF EXISTS "statusEnum";
ALTER TABLE transactions DROP COLUMN IF EXISTS "statusEnum";
ALTER TABLE escrow_accounts DROP COLUMN IF EXISTS "stateEnum";
ALTER TABLE kyc_documents DROP COLUMN IF EXISTS "statusEnum";

-- 3. DROP DEFAULTS BEFORE CHANGING TYPE
ALTER TABLE properties ALTER COLUMN status DROP DEFAULT;
ALTER TABLE transactions ALTER COLUMN status DROP DEFAULT;
ALTER TABLE escrow_accounts ALTER COLUMN status DROP DEFAULT;
ALTER TABLE kyc_documents ALTER COLUMN status DROP DEFAULT;

-- 4. DROP OLD ENUM TYPES
DROP TYPE IF EXISTS "PropertyStatus" CASCADE;
DROP TYPE IF EXISTS "TransactionStatus" CASCADE;
DROP TYPE IF EXISTS "EscrowState" CASCADE;
DROP TYPE IF EXISTS "KycStatus" CASCADE;

-- 5. CREATE NEW ENUM TYPES
CREATE TYPE "PropertyStatus" AS ENUM ('draft','pending','pending_validation','ai_review','human_review','published','sold','rented','rejected','flagged');
CREATE TYPE "TransactionStatus" AS ENUM ('CREATED','FUNDED','DOCS_VALIDATED','GEOTRUST_VALIDATED','GEO_VERIFIED','NOTARY_ASSIGNED','NOTARY_IN_PROGRESS','DEED_SIGNED','ANDF_REGISTERED','RELEASED','DISPUTED','DISPUTED_MEDIATION','REFUNDED','CANCELLED','PARTIAL_RELEASE','PENDING');
CREATE TYPE "EscrowState" AS ENUM ('EMPTY','FUNDED','PARTIAL_RELEASE','FULL_RELEASE','REFUNDED','DISPUTED','NOTARY_IN_PROGRESS','DISPUTED_MEDIATION');
CREATE TYPE "KycStatus" AS ENUM ('pending','approved','ai_validated','human_validated','rejected','expired');

-- 6. CONVERT COLUMNS
ALTER TABLE properties ALTER COLUMN status TYPE "PropertyStatus" USING status::text::"PropertyStatus";
ALTER TABLE properties ALTER COLUMN status SET DEFAULT 'draft'::"PropertyStatus";
ALTER TABLE transactions ALTER COLUMN status TYPE "TransactionStatus" USING status::text::"TransactionStatus";
ALTER TABLE transactions ALTER COLUMN status SET DEFAULT 'CREATED'::"TransactionStatus";
ALTER TABLE escrow_accounts ALTER COLUMN status TYPE "EscrowState" USING status::text::"EscrowState";
ALTER TABLE escrow_accounts ALTER COLUMN status SET DEFAULT 'EMPTY'::"EscrowState";
ALTER TABLE kyc_documents ALTER COLUMN status TYPE "KycStatus" USING status::text::"KycStatus";
ALTER TABLE kyc_documents ALTER COLUMN status SET DEFAULT 'pending'::"KycStatus";

-- 7. INDEXES
DROP INDEX IF EXISTS "properties_statusEnum_createdAt_idx";
DROP INDEX IF EXISTS "transactions_statusEnum_createdAt_idx";
DROP INDEX IF EXISTS "escrow_accounts_stateEnum_idx";
CREATE INDEX IF NOT EXISTS "properties_status_createdAt_idx" ON properties (status, "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_status_createdAt_idx" ON transactions (status, "createdAt");
CREATE INDEX IF NOT EXISTS "escrow_accounts_status_idx" ON escrow_accounts (status);

COMMIT;
