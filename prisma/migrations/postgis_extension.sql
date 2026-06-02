-- AfriBayit — PostGIS Extension Migration
-- Enable PostGIS for native geometry support (geospatial queries)
-- Requires: PostgreSQL with PostGIS extension installed

-- Enable core PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable PostGIS topology (for boundary/overlap detection)
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify installation
-- SELECT PostGIS_Version();
