-- AfriBayit — Backfill NotarySignature et Dispute depuis TransactionTimeline.metadata
-- Task: P2.2 backfill
-- Date: juillet 2026
--
-- Ce script migre les signatures notariales et disputes stockées en JSON
-- dans TransactionTimeline.metadata vers les nouvelles tables dédiées.
--
-- ⚠️ LIRE AVANT D'EXÉCUTER :
-- 1. Faire un backup de la DB avant : pg_dump ou snapshot Neon
-- 2. Exécuter en maintenance window (locks sur TransactionTimeline)
-- 3. Vérifier les counts après exécution
-- 4. Ne pas supprimer les données JSON de TransactionTimeline immédiatement
--    (conservation pour audit 90 jours)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════
-- 1. BACKFILL NotarySignature depuis TransactionTimeline
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO notary_signatures (
  id,
  "requestId",
  "transactionId",
  "documentId",
  "signerId",
  "signerRole",
  "signatureData",
  "ipAddress",
  "userAgent",
  "isValid",
  "signedAt",
  "createdAt"
)
SELECT
  gen_random_uuid()::text,
  COALESCE(
    (metadata::jsonb)->>'"requestId"',
    'req_' || t.id || '_' || t."createdAt"::text
  ),
  t."transactionId",
  COALESCE((metadata::jsonb)->>'"documentId"', t.id),
  COALESCE(
    (metadata::jsonb)->>'"signerId"',
    t."actorId",
    'unknown'
  ),
  COALESCE((metadata::jsonb)->>'"signerRole"', t."actorType", 'notary'),
  COALESCE((metadata::jsonb)->>'"signatureData"', '{}'),
  (metadata::jsonb)->>'"ipAddress"',
  (metadata::jsonb)->>'"userAgent"',
  COALESCE(((metadata::jsonb)->>'"isValid"')::boolean, true),
  t."createdAt",
  t."createdAt"
FROM transaction_timeline t
WHERE t."actorType" = 'notary'
  AND (t.description ILIKE '%signature%' OR t.description ILIKE '%sign%')
  AND t.metadata IS NOT NULL
  AND t.metadata::jsonb ? '"signatureData"'
ON CONFLICT ("requestId") DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. BACKFILL Dispute depuis TransactionTimeline
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO disputes (
  id,
  "transactionId",
  "initiatedBy",
  reason,
  description,
  status,
  "evidenceUrls",
  "mediatorId",
  "mediatorNotes",
  resolution,
  "resolvedAt",
  "resolutionAmount",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  t."transactionId",
  COALESCE(
    (metadata::jsonb)->>'"initiatedBy"',
    t."actorId",
    'unknown'
  ),
  COALESCE(
    (metadata::jsonb)->>'reason',
    CASE
      WHEN t.description ILIKE '%payment%' THEN 'payment_issue'
      WHEN t.description ILIKE '%fraud%' THEN 'fraud_suspected'
      WHEN t.description ILIKE '%item%' THEN 'item_not_as_described'
      ELSE 'other'
    END
  ),
  COALESCE(
    (metadata::jsonb)->>'description',
    t.description
  ),
  CASE
    WHEN t."toStatus" = 'RESOLVED' OR t."toStatus" = 'COMPLETED' THEN 'resolved'
    WHEN t."toStatus" = 'REFUNDED' THEN 'resolved'
    WHEN t."toStatus" = 'CANCELLED' THEN 'rejected'
    WHEN (metadata::jsonb)->>'"mediatorId"' IS NOT NULL THEN 'mediation'
    ELSE 'open'
  END,
  (metadata::jsonb)->>'"evidenceUrls"',
  (metadata::jsonb)->>'"mediatorId"',
  (metadata::jsonb)->>'"mediatorNotes"',
  (metadata::jsonb)->>'resolution',
  CASE
    WHEN t."toStatus" IN ('RESOLVED', 'COMPLETED', 'REFUNDED') THEN t."createdAt"
    ELSE NULL
  END,
  CASE
    WHEN (metadata::jsonb)->>'"resolutionAmount"' IS NOT NULL
    THEN ((metadata::jsonb)->>'"resolutionAmount"')::float
    ELSE NULL
  END,
  t."createdAt",
  t."createdAt"
FROM transaction_timeline t
WHERE (
    t."toStatus" = 'DISPUTED'
    OR t.description ILIKE '%dispute%'
    OR t.description ILIKE '%litige%'
  )
  AND t.metadata IS NOT NULL
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. VÉRIFICATION
-- ═══════════════════════════════════════════════════════════════════════

SELECT 'notary_signatures' AS table_name, count(*) AS migrated FROM notary_signatures
UNION ALL
SELECT 'disputes' AS table_name, count(*) AS migrated FROM disputes;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. NOTE DE CONSERVATION
-- ═══════════════════════════════════════════════════════════════════════
-- Les données JSON dans TransactionTimeline.metadata NE SONT PAS supprimées.
-- Conservation pour audit 90 jours. Après 90 jours (octobre 2026), exécuter
-- le script de purge fourni séparément (purge_timeline_metadata.sql).
