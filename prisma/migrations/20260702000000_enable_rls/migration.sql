-- ============================================================================
-- AfriBayit Row-Level Security Policies (P2.5 — auto-applied via Prisma migration)
-- ============================================================================
-- Enable RLS on key tables for multi-tenant country isolation.
--
-- This migration is auto-applied via `prisma migrate deploy` (or manually via
-- `prisma db execute --file`). It supersedes the legacy `rls.sql` script which
-- had to be applied by hand.
--
-- CHANGES vs legacy rls.sql:
--   1. DB-level default for app.current_country changed from 'ALL' to 'NONE'.
--      Semantics: 'NONE' means "no country filter — super-admin / unauthenticated
--      public access". A country admin sets it to 'BJ' / 'CI' / 'BF' / 'TG' / 'SN'.
--      NOTE: On hosted Postgres providers (Neon, etc.) `ALTER DATABASE SET` may
--      require elevated privileges and silently fail; the policies below also
--      match when the GUC is unset (NULL) so the application keeps working
--      until setRLSContext() is called per-request.
--   2. All policies that previously fell back to `current_setting(...) = ''`
--      now check `current_setting(...) = 'NONE'` for consistency with the new
--      default, and additionally accept NULL (GUC unset) as an "open" state.
--      The legacy `= 'ALL'` check is retained for backward compatibility.
--   3. Coverage extended from 9 tables to 16 tables. Added: users,
--      kyc_documents, notifications, subscriptions, short_term_rentals,
--      professional_profiles, audit_logs. (`wallet_transactions` was skipped
--      because the table has no `country` column.)
--
-- How it works:
--   - Each request sets session variables via SET LOCAL (inside a transaction):
--     SET LOCAL app.current_user_id = '...';
--     SET LOCAL app.current_country = 'BJ';
--   - RLS policies use current_setting() to read these variables
--   - When app.current_country is unset / 'NONE' (default), all rows are visible
--   - When app.current_country = 'BJ', only BJ rows are visible
--
-- Table name mapping (Prisma model → actual table):
--   Property            → properties
--   Transaction         → transactions
--   Hotel               → hotels
--   Artisan             → artisans
--   Guesthouse          → guesthouses
--   Notary              → notaries
--   Course              → courses
--   Review              → reviews
--   HotelBooking        → hotel_bookings
--   User                → users               (P2.5 — added)
--   KycDocument         → kyc_documents       (P2.5 — added)
--   Notification        → notifications       (P2.5 — added)
--   Subscription        → subscriptions       (P2.5 — added)
--   ShortTermRental     → short_term_rentals  (P2.5 — added)
--   ProfessionalProfile → professional_profiles (P2.5 — added)
--   AuditLog            → audit_logs          (P2.5 — added)
--   WalletTransaction   → wallet_transactions (P2.5 — SKIPPED, no `country` column)
-- ============================================================================

-- Default to 'NONE' so that unauthenticated requests (or super-admin contexts
-- that don't set app.current_country) see all rows. The application layer
-- handles public access control via db-rls.ts / db-tenant.ts.
-- On providers where ALTER DATABASE SET is restricted (e.g. Neon's pooled
-- roles), the statement is silently skipped; policies below still match NULL.
DO $$
BEGIN
  BEGIN
    ALTER DATABASE "AfriBayit" SET app.current_country = 'NONE';
  EXCEPTION WHEN insufficient_privilege OR insufficient_privilege THEN
    RAISE NOTICE 'ALTER DATABASE SET app.current_country skipped (insufficient privileges); relying on application SET LOCAL';
  END;
  BEGIN
    ALTER DATABASE "AfriBayit" SET app.current_user_id = '';
  EXCEPTION WHEN insufficient_privilege OR insufficient_privilege THEN
    RAISE NOTICE 'ALTER DATABASE SET app.current_user_id skipped (insufficient privileges); relying on application SET LOCAL';
  END;
END $$;

-- ============================================================================
-- Properties table
-- ============================================================================
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_country_isolation" ON "properties";

CREATE POLICY "properties_country_isolation" ON "properties"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Transactions table
-- Transactions are scoped via the property's country OR the transaction's
-- own country column (added in V2).
-- ============================================================================
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_country_isolation" ON "transactions";

CREATE POLICY "transactions_country_isolation" ON "transactions"
  USING (
    "propertyId" IN (
      SELECT id FROM "properties"
      WHERE country = current_setting('app.current_country', true)
    )
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
    OR country = current_setting('app.current_country', true)
  );

-- ============================================================================
-- Hotels table
-- ============================================================================
ALTER TABLE "hotels" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotels_country_isolation" ON "hotels";

CREATE POLICY "hotels_country_isolation" ON "hotels"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Artisans table
-- ============================================================================
ALTER TABLE "artisans" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "artisans_country_isolation" ON "artisans";

CREATE POLICY "artisans_country_isolation" ON "artisans"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Guesthouses table
-- ============================================================================
ALTER TABLE "guesthouses" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guesthouses_country_isolation" ON "guesthouses";

CREATE POLICY "guesthouses_country_isolation" ON "guesthouses"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Notaries table
-- ============================================================================
ALTER TABLE "notaries" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notaries_country_isolation" ON "notaries";

CREATE POLICY "notaries_country_isolation" ON "notaries"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Courses table
-- ============================================================================
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "courses_country_isolation" ON "courses";

CREATE POLICY "courses_country_isolation" ON "courses"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Reviews table
-- ============================================================================
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_country_isolation" ON "reviews";

CREATE POLICY "reviews_country_isolation" ON "reviews"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
    OR country IS NULL
  );

-- ============================================================================
-- Hotel Bookings (scoped via hotel's country)
-- ============================================================================
ALTER TABLE "hotel_bookings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_bookings_country_isolation" ON "hotel_bookings";

CREATE POLICY "hotel_bookings_country_isolation" ON "hotel_bookings"
  USING (
    "hotelId" IN (
      SELECT id FROM "hotels"
      WHERE country = current_setting('app.current_country', true)
    )
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- P2.5 — Additional tables (7 new; wallet_transactions SKIPPED — no `country`)
-- Pattern uses the simpler `country = X OR X = 'NONE' OR X IS NULL` form.
-- ============================================================================

-- Users table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_country_isolation" ON "users";

CREATE POLICY "users_country_isolation" ON "users" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- KYC documents table
ALTER TABLE "kyc_documents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kyc_documents_country_isolation" ON "kyc_documents";

CREATE POLICY "kyc_documents_country_isolation" ON "kyc_documents" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- Notifications table
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_country_isolation" ON "notifications";

CREATE POLICY "notifications_country_isolation" ON "notifications" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- Subscriptions table
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_country_isolation" ON "subscriptions";

CREATE POLICY "subscriptions_country_isolation" ON "subscriptions" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- Short-term rentals table
ALTER TABLE "short_term_rentals" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "short_term_rentals_country_isolation" ON "short_term_rentals";

CREATE POLICY "short_term_rentals_country_isolation" ON "short_term_rentals" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- Professional profiles table
ALTER TABLE "professional_profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "professional_profiles_country_isolation" ON "professional_profiles";

CREATE POLICY "professional_profiles_country_isolation" ON "professional_profiles" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- Audit logs table
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_country_isolation" ON "audit_logs";

CREATE POLICY "audit_logs_country_isolation" ON "audit_logs" FOR ALL
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'NONE'
    OR current_setting('app.current_country', true) IS NULL
  );

-- ============================================================================
-- Verification: List all tables with RLS enabled
-- ============================================================================
-- Run this to verify: SELECT relname FROM pg_class WHERE relrowsecurity = true;
