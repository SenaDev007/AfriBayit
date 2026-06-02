-- AfriBayit — PostGIS Extension Activation & Spatial Index Migration
-- Enables native geometry support and creates GIST indexes for fast spatial queries
-- Requires: PostgreSQL with PostGIS extension installed (Neon supports this)

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable PostGIS topology (for boundary/overlap detection)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Create spatial indexes for faster queries using GIST (Generalized Search Tree)
-- These indexes enable ST_DWithin, ST_Contains, and ST_Intersects to use index scans
-- instead of sequential scans, dramatically improving query performance

-- Property spatial index — supports findNearbyProperties, detectSpatialConflicts
CREATE INDEX IF NOT EXISTS idx_property_location ON "Property" USING GIST (geometry);

-- Hotel spatial index — supports findNearbyHotels
CREATE INDEX IF NOT EXISTS idx_hotel_location ON "Hotel" USING GIST (geometry);

-- Guesthouse spatial index — supports findNearbyGuesthouses
CREATE INDEX IF NOT EXISTS idx_guesthouse_location ON "Guesthouse" USING GIST (geometry);

-- Set up RLS tenant context function
-- Used by tenant-guard to enforce country-level data isolation
CREATE OR REPLACE FUNCTION set_current_tenant(country_code TEXT) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', country_code, false);
END;
$$ LANGUAGE plpgsql;

-- Verify PostGIS installation
-- SELECT PostGIS_Version();
