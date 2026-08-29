-- AfriBayit — Status Enum Trigger Migration (Phase A of cutover)
--
-- This migration adds PostgreSQL triggers that automatically sync the *Enum columns
-- whenever the legacy String status columns are written. This allows the application
-- to continue using the legacy status columns while the *Enum columns stay populated
-- and can be used for typed queries.
--
-- After all application code is migrated to use *Enum columns (Phase B),
-- the legacy String columns can be dropped (Phase C).
--
-- CDC §3.3 — typed statuses for critical models

BEGIN;

-- ============ 1. PROPERTIES ============
CREATE OR REPLACE FUNCTION sync_property_status_enum()
RETURNS TRIGGER AS $$
BEGIN
  NEW."statusEnum" = CASE
    WHEN NEW.status = 'draft' THEN 'DRAFT'::"PropertyStatus"
    WHEN NEW.status = 'pending_review' THEN 'PENDING_REVIEW'::"PropertyStatus"
    WHEN NEW.status = 'published' THEN 'PUBLISHED'::"PropertyStatus"
    WHEN NEW.status = 'rejected' THEN 'REJECTED'::"PropertyStatus"
    WHEN NEW.status = 'expired' THEN 'EXPIRED'::"PropertyStatus"
    WHEN NEW.status = 'sold' THEN 'SOLD'::"PropertyStatus"
    WHEN NEW.status = 'rented' THEN 'RENTED'::"PropertyStatus"
    ELSE 'DRAFT'::"PropertyStatus"
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS property_status_enum_sync ON properties;
CREATE TRIGGER property_status_enum_sync
  BEFORE INSERT OR UPDATE OF status ON properties
  FOR EACH ROW EXECUTE FUNCTION sync_property_status_enum();

-- ============ 2. TRANSACTIONS ============
CREATE OR REPLACE FUNCTION sync_transaction_status_enum()
RETURNS TRIGGER AS $$
BEGIN
  NEW."statusEnum" = CASE
    WHEN NEW.status = 'pending' THEN 'PENDING'::"TransactionStatus"
    WHEN NEW.status = 'escrow_funded' THEN 'ESCROW_FUNDED'::"TransactionStatus"
    WHEN NEW.status = 'in_review' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN NEW.status = 'completed' THEN 'COMPLETED'::"TransactionStatus"
    WHEN NEW.status = 'cancelled' THEN 'CANCELLED'::"TransactionStatus"
    WHEN NEW.status = 'failed' THEN 'FAILED'::"TransactionStatus"
    WHEN NEW.status = 'disputed' THEN 'DISPUTED'::"TransactionStatus"
    WHEN NEW.status = 'refunded' THEN 'REFUNDED'::"TransactionStatus"
    -- Escrow lifecycle states
    WHEN NEW.status = 'CREATED' THEN 'PENDING'::"TransactionStatus"
    WHEN NEW.status = 'FUNDED' THEN 'ESCROW_FUNDED'::"TransactionStatus"
    WHEN NEW.status = 'DOCS_VALIDATED' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN NEW.status = 'GEOTRUST_VALIDATED' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN NEW.status = 'GEO_VERIFIED' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN NEW.status = 'NOTARY_ASSIGNED' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN NEW.status = 'NOTARY_IN_PROGRESS' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN NEW.status = 'DEED_SIGNED' THEN 'COMPLETED'::"TransactionStatus"
    WHEN NEW.status = 'ANDF_REGISTERED' THEN 'COMPLETED'::"TransactionStatus"
    WHEN NEW.status = 'RELEASED' THEN 'COMPLETED'::"TransactionStatus"
    WHEN NEW.status = 'DISPUTED' THEN 'DISPUTED'::"TransactionStatus"
    WHEN NEW.status = 'REFUNDED' THEN 'REFUNDED'::"TransactionStatus"
    WHEN NEW.status = 'CANCELLED' THEN 'CANCELLED'::"TransactionStatus"
    ELSE 'PENDING'::"TransactionStatus"
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transaction_status_enum_sync ON transactions;
CREATE TRIGGER transaction_status_enum_sync
  BEFORE INSERT OR UPDATE OF status ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_transaction_status_enum();

-- ============ 3. ESCROW_ACCOUNTS ============
CREATE OR REPLACE FUNCTION sync_escrow_state_enum()
RETURNS TRIGGER AS $$
BEGIN
  NEW."stateEnum" = CASE
    WHEN NEW.status = 'EMPTY' THEN 'CREATED'::"EscrowState"
    WHEN NEW.status = 'FUNDED' THEN 'FUNDED'::"EscrowState"
    WHEN NEW.status = 'PARTIAL_RELEASE' THEN 'PARTIAL_RELEASE'::"EscrowState"
    WHEN NEW.status = 'FULL_RELEASE' THEN 'RELEASED'::"EscrowState"
    WHEN NEW.status = 'REFUNDED' THEN 'REFUNDED'::"EscrowState"
    WHEN NEW.status = 'DISPUTED' THEN 'DISPUTED'::"EscrowState"
    WHEN NEW.status = 'CREATED' THEN 'CREATED'::"EscrowState"
    WHEN NEW.status = 'RELEASED' THEN 'RELEASED'::"EscrowState"
    WHEN NEW.status = 'CANCELLED' THEN 'CANCELLED'::"EscrowState"
    WHEN NEW.status = 'FAILED' THEN 'FAILED'::"EscrowState"
    ELSE 'CREATED'::"EscrowState"
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS escrow_state_enum_sync ON escrow_accounts;
CREATE TRIGGER escrow_state_enum_sync
  BEFORE INSERT OR UPDATE OF status ON escrow_accounts
  FOR EACH ROW EXECUTE FUNCTION sync_escrow_state_enum();

-- ============ 4. KYC_DOCUMENTS ============
CREATE OR REPLACE FUNCTION sync_kyc_status_enum()
RETURNS TRIGGER AS $$
BEGIN
  NEW."statusEnum" = CASE
    WHEN NEW.status = 'pending' THEN 'PENDING'::"KycStatus"
    WHEN NEW.status = 'ai_validated' THEN 'AI_VALIDATED'::"KycStatus"
    WHEN NEW.status = 'human_validated' THEN 'HUMAN_VALIDATED'::"KycStatus"
    WHEN NEW.status = 'rejected' THEN 'REJECTED'::"KycStatus"
    WHEN NEW.status = 'expired' THEN 'EXPIRED'::"KycStatus"
    ELSE 'PENDING'::"KycStatus"
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kyc_status_enum_sync ON kyc_documents;
CREATE TRIGGER kyc_status_enum_sync
  BEFORE INSERT OR UPDATE OF status ON kyc_documents
  FOR EACH ROW EXECUTE FUNCTION sync_kyc_status_enum();

-- ============ 5. USERS (kycLevel → kycLevelEnum) ============
CREATE OR REPLACE FUNCTION sync_user_kyc_level_enum()
RETURNS TRIGGER AS $$
BEGIN
  NEW."kycLevelEnum" = CASE
    WHEN NEW."kycLevel" = 0 THEN 'LEVEL_0'::"KycLevel"
    WHEN NEW."kycLevel" = 1 THEN 'LEVEL_1'::"KycLevel"
    WHEN NEW."kycLevel" = 2 THEN 'LEVEL_2'::"KycLevel"
    WHEN NEW."kycLevel" = 3 THEN 'LEVEL_3'::"KycLevel"
    ELSE 'LEVEL_0'::"KycLevel"
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_kyc_level_enum_sync ON users;
CREATE TRIGGER user_kyc_level_enum_sync
  BEFORE INSERT OR UPDATE OF "kycLevel" ON users
  FOR EACH ROW EXECUTE FUNCTION sync_user_kyc_level_enum();

-- ============ 6. BACKFILL EXISTING ROWS ============
-- Run the trigger logic on all existing rows to populate *Enum columns
UPDATE properties SET status = status WHERE "statusEnum" IS NULL;
UPDATE transactions SET status = status WHERE "statusEnum" IS NULL;
UPDATE escrow_accounts SET status = status WHERE "stateEnum" IS NULL;
UPDATE kyc_documents SET status = status WHERE "statusEnum" IS NULL;
UPDATE users SET "kycLevel" = "kycLevel" WHERE "kycLevelEnum" IS NULL;

-- ============ 7. VERIFICATION ============
SELECT 'properties' AS t, count(*) FILTER (WHERE "statusEnum" IS NOT NULL) AS with_enum, count(*) AS total FROM properties
UNION ALL
SELECT 'transactions', count(*) FILTER (WHERE "statusEnum" IS NOT NULL), count(*) FROM transactions
UNION ALL
SELECT 'escrow_accounts', count(*) FILTER (WHERE "stateEnum" IS NOT NULL), count(*) FROM escrow_accounts
UNION ALL
SELECT 'kyc_documents', count(*) FILTER (WHERE "statusEnum" IS NOT NULL), count(*) FROM kyc_documents
UNION ALL
SELECT 'users', count(*) FILTER (WHERE "kycLevelEnum" IS NOT NULL), count(*) FROM users;

COMMIT;
