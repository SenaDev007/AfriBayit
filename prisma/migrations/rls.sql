-- ============================================================================
-- AfriBayit Row-Level Security Policies
-- ============================================================================
-- Enable RLS on key tables for multi-tenant country isolation.
--
-- IMPORTANT: This migration is for PostgreSQL ONLY.
-- It must be run manually by an admin on the production database.
-- It is NOT auto-applied by Prisma migrations.
--
-- Prerequisites:
--   1. The database must be PostgreSQL (not SQLite)
--   2. The app schema variables must be supported
--   3. Run: psql -d "AfriBayit" -f prisma/migrations/rls.sql
--
-- How it works:
--   - Each request sets session variables via SET LOCAL:
--     SET LOCAL app.current_user_id = '...';
--     SET LOCAL app.current_country = 'BJ';
--   - RLS policies use current_setting() to read these variables
--   - When app.current_country = 'ALL', all rows are visible (super admin)
--   - When app.current_country = 'BJ', only BJ rows are visible
--
-- Table name mapping (Prisma model → actual table):
--   Property    → properties
--   Transaction → transactions
--   Hotel       → hotels
--   Artisan     → artisans
--   Guesthouse  → guesthouses
--   Notary      → notaries
-- ============================================================================

-- First, set a default so that unauthenticated requests see all
-- (the application layer handles public access control)
ALTER DATABASE "AfriBayit" SET app.current_country = 'ALL';
ALTER DATABASE "AfriBayit" SET app.current_user_id = '';

-- ============================================================================
-- Properties table
-- ============================================================================
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "properties_country_isolation" ON "properties";

CREATE POLICY "properties_country_isolation" ON "properties"
  USING (
    country = current_setting('app.current_country', true)
    OR current_setting('app.current_country', true) = 'ALL'
    OR current_setting('app.current_country', true) = ''
  );

-- ============================================================================
-- Transactions table
-- Transactions are scoped via the property's country
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
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
    OR current_setting('app.current_country', true) = ''
  );

-- ============================================================================
-- Verification: List all tables with RLS enabled
-- ============================================================================
-- Run this to verify: SELECT relname FROM pg_class WHERE relrowsecurity = true;
