-- AfriBayit — Cutover Enum Columns (P2.4 cutover)
-- Date: juillet 2026
--
-- Ce script bascule les reads/writes des anciennes colonnes String vers les
-- nouvelles colonnes *Enum créées en P2.4.
--
-- ⚠️ LIRE AVANT D'EXÉCUTER :
-- 1. Ce script suppose que les colonnes *Enum existent déjà (créées en P2.4)
-- 2. Faire un backup avant
-- 3. Exécuter en maintenance window
-- 4. Après ce script, l'application doit utiliser les colonnes *Enum
-- 5. Les anciennes colonnes String sont conservées (dépréciées) pour rollback

BEGIN;

-- 1. PROPERTY
UPDATE properties
SET "statusEnum" = CASE
    WHEN status = 'draft' THEN 'DRAFT'::"PropertyStatus"
    WHEN status = 'pending_review' THEN 'PENDING_REVIEW'::"PropertyStatus"
    WHEN status = 'published' THEN 'PUBLISHED'::"PropertyStatus"
    WHEN status = 'rejected' THEN 'REJECTED'::"PropertyStatus"
    WHEN status = 'expired' THEN 'EXPIRED'::"PropertyStatus"
    WHEN status = 'sold' THEN 'SOLD'::"PropertyStatus"
    WHEN status = 'rented' THEN 'RENTED'::"PropertyStatus"
    ELSE 'DRAFT'::"PropertyStatus"
END
WHERE "statusEnum" IS NULL OR "statusEnum" = 'DRAFT';

-- 2. TRANSACTION
UPDATE transactions
SET "statusEnum" = CASE
    WHEN status = 'pending' THEN 'PENDING'::"TransactionStatus"
    WHEN status = 'escrow_funded' THEN 'ESCROW_FUNDED'::"TransactionStatus"
    WHEN status = 'in_review' THEN 'IN_REVIEW'::"TransactionStatus"
    WHEN status = 'completed' THEN 'COMPLETED'::"TransactionStatus"
    WHEN status = 'cancelled' THEN 'CANCELLED'::"TransactionStatus"
    WHEN status = 'failed' THEN 'FAILED'::"TransactionStatus"
    WHEN status = 'disputed' THEN 'DISPUTED'::"TransactionStatus"
    WHEN status = 'refunded' THEN 'REFUNDED'::"TransactionStatus"
    ELSE 'PENDING'::"TransactionStatus"
END
WHERE "statusEnum" IS NULL OR "statusEnum" = 'PENDING';

-- 3. ESCROW_ACCOUNT
UPDATE escrow_accounts
SET "stateEnum" = CASE
    WHEN status = 'created' THEN 'CREATED'::"EscrowState"
    WHEN status = 'funded' THEN 'FUNDED'::"EscrowState"
    WHEN status = 'partial_release' THEN 'PARTIAL_RELEASE'::"EscrowState"
    WHEN status = 'released' THEN 'RELEASED'::"EscrowState"
    WHEN status = 'disputed' THEN 'DISPUTED'::"EscrowState"
    WHEN status = 'refunded' THEN 'REFUNDED'::"EscrowState"
    WHEN status = 'cancelled' THEN 'CANCELLED'::"EscrowState"
    WHEN status = 'failed' THEN 'FAILED'::"EscrowState"
    ELSE 'CREATED'::"EscrowState"
END
WHERE "stateEnum" IS NULL OR "stateEnum" = 'CREATED';

-- 4. KYC_DOCUMENT
UPDATE kyc_documents
SET "statusEnum" = CASE
    WHEN status = 'pending' THEN 'PENDING'::"KycStatus"
    WHEN status = 'ai_validated' THEN 'AI_VALIDATED'::"KycStatus"
    WHEN status = 'human_validated' THEN 'HUMAN_VALIDATED'::"KycStatus"
    WHEN status = 'rejected' THEN 'REJECTED'::"KycStatus"
    WHEN status = 'expired' THEN 'EXPIRED'::"KycStatus"
    ELSE 'PENDING'::"KycStatus"
END
WHERE "statusEnum" IS NULL OR "statusEnum" = 'PENDING';

-- 5. USER
UPDATE users
SET "kycLevelEnum" = CASE
    WHEN "kycLevel" = 0 THEN 'LEVEL_0'::"KycLevel"
    WHEN "kycLevel" = 1 THEN 'LEVEL_1'::"KycLevel"
    WHEN "kycLevel" = 2 THEN 'LEVEL_2'::"KycLevel"
    WHEN "kycLevel" = 3 THEN 'LEVEL_3'::"KycLevel"
    ELSE 'LEVEL_0'::"KycLevel"
END
WHERE "kycLevelEnum" IS NULL OR "kycLevelEnum" = 'LEVEL_0';

-- 6. VÉRIFICATION
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
