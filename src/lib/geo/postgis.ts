// AfriBayit — PostGIS Geo Library
// Native geometry operations using PostgreSQL PostGIS extension
// Supports: point creation, nearby search, distance, polygon, overlap detection

import { db } from '@/lib/db';

// ── WKT Point Creation ──────────────────────────────────────

/**
 * Create a WKT (Well-Known Text) Point in SRID 4326 format.
 * Used for writing geometry fields to PostGIS columns.
 * 
 * @param lat - Latitude (-90 to 90)
 * @param lng - Longitude (-180 to 180)
 * @returns WKT string: `SRID=4326;POINT(lng lat)`
 */
export function createPoint(lat: number, lng: number): string {
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
  }
  if (lng < -180 || lng > 180) {
    throw new Error(`Invalid longitude: ${lng}. Must be between -180 and 180.`);
  }
  return `SRID=4326;POINT(${lng} ${lat})`;
}

/**
 * Create a WKT Polygon from an array of [lng, lat] coordinate pairs.
 * The polygon is automatically closed (first point = last point).
 * 
 * @param coordinates - Array of [longitude, latitude] pairs
 * @returns WKT string: `SRID=4326;POLYGON((lng1 lat1, lng2 lat2, ...))`
 */
export function createPolygon(coordinates: [number, number][]): string {
  if (coordinates.length < 3) {
    throw new Error('Polygon requires at least 3 coordinate pairs.');
  }
  // Close the ring if not already closed
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const closed = first[0] === last[0] && first[1] === last[1]
    ? coordinates
    : [...coordinates, first];

  const points = closed.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
  return `SRID=4326;POLYGON((${points}))`;
}

// ── Nearby Search ───────────────────────────────────────────

type GeoModel = 'Property' | 'Hotel' | 'Guesthouse';

interface NearbyResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distanceKm: number;
  type: string;
  city: string;
  country: string;
  [key: string]: unknown;
}

/**
 * Find records within a radius of a point using PostGIS ST_DWithin.
 * Falls back to Haversine-based filtering if PostGIS is unavailable.
 * 
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Search radius in kilometers
 * @param model - Which model to search: 'Property', 'Hotel', 'Guesthouse'
 */
export async function findNearby(
  lat: number,
  lng: number,
  radiusKm: number,
  model: GeoModel = 'Property'
): Promise<NearbyResult[]> {
  const pointWkt = createPoint(lat, lng);
  const radiusMeters = radiusKm * 1000;

  try {
    // Try PostGIS ST_DWithin query via $queryRaw
    const results = await db.$queryRawUnsafe<
      Array<{ id: string; name: string; lat: number; lng: number; distance_km: number; type: string; city: string; country: string }>
    >(
      `SELECT 
        id,
        CASE 
          WHEN $4 = 'Property' THEN title
          WHEN $4 = 'Hotel' THEN name
          WHEN $4 = 'Guesthouse' THEN name
        END as name,
        lat,
        lng,
        ST_DistanceSphere(
          geometry,
          ST_GeomFromText($1, 4326)
        ) / 1000.0 as distance_km,
        CASE
          WHEN $4 = 'Property' THEN type
          WHEN $4 = 'Hotel' THEN 'hotel'
          WHEN $4 = 'Guesthouse' THEN 'guesthouse'
        END as type,
        city,
        country
      FROM ${model === 'Property' ? 'properties' : model === 'Hotel' ? 'hotels' : 'guesthouses'}
      WHERE geometry IS NOT NULL
        AND ST_DWithin(
          geometry,
          ST_GeomFromText($1, 4326),
          $2
        )
        AND ${model === 'Property' ? "status = 'published'" : model === 'Hotel' ? "status = 'active'" : "status = 'active'"}
      ORDER BY distance_km ASC
      LIMIT 50`,
      pointWkt,
      radiusMeters,
      radiusKm,
      model
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      distanceKm: Math.round(r.distance_km * 100) / 100,
      type: r.type,
      city: r.city,
      country: r.country,
    }));
  } catch {
    // Fallback: Haversine-based search using lat/lng columns
    console.info('[PostGIS] ST_DWithin failed, falling back to Haversine search');
    return findNearbyHaversine(lat, lng, radiusKm, model);
  }
}

// ── Haversine Fallback ──────────────────────────────────────

async function findNearbyHaversine(
  lat: number,
  lng: number,
  radiusKm: number,
  model: GeoModel
): Promise<NearbyResult[]> {
  // Approximate degree offsets for the radius
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  const statusFilter =
    model === 'Property' ? 'published' : 'active';

  let records: Array<{
    id: string;
    name: string;
    lat: number | null;
    lng: number | null;
    type: string;
    city: string;
    country: string;
  }> = [];

  if (model === 'Property') {
    const props = await db.property.findMany({
      where: {
        status: statusFilter,
        lat: { gte: lat - latOffset, lte: lat + latOffset },
        lng: { gte: lng - lngOffset, lte: lng + lngOffset },
      },
      select: {
        id: true,
        title: true,
        lat: true,
        lng: true,
        type: true,
        city: true,
        country: true,
      },
      take: 100,
    });
    records = props.map((p) => ({ ...p, name: p.title }));
  } else if (model === 'Hotel') {
    const hotels = await db.hotel.findMany({
      where: {
        status: statusFilter,
        lat: { gte: lat - latOffset, lte: lat + latOffset },
        lng: { gte: lng - lngOffset, lte: lng + lngOffset },
      },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        city: true,
        country: true,
      },
      take: 100,
    });
    records = hotels.map((h) => ({ ...h, type: 'hotel' }));
  } else {
    const guesthouses = await db.guesthouse.findMany({
      where: {
        status: statusFilter,
        lat: { gte: lat - latOffset, lte: lat + latOffset },
        lng: { gte: lng - lngOffset, lte: lng + lngOffset },
      },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        city: true,
        country: true,
      },
      take: 100,
    });
    records = guesthouses.map((g) => ({ ...g, type: 'guesthouse' }));
  }

  // Calculate exact Haversine distance and filter
  return records
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat!,
      lng: r.lng!,
      distanceKm: haversineDistance(lat, lng, r.lat!, r.lng!),
      type: r.type,
      city: r.city,
      country: r.country,
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 50);
}

// ── Distance Calculation ────────────────────────────────────

/**
 * Calculate the distance between two points using PostGIS ST_DistanceSphere.
 * Falls back to Haversine formula if PostGIS is unavailable.
 * 
 * @returns Distance in kilometers
 */
export async function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): Promise<number> {
  try {
    const result = await db.$queryRawUnsafe<Array<{ distance_km: number }>>(
      `SELECT ST_DistanceSphere(
        ST_MakePoint($1, $2)::geography,
        ST_MakePoint($3, $4)::geography
      ) / 1000.0 as distance_km`,
      lng1,
      lat1,
      lng2,
      lat2
    );
    return Math.round(result[0].distance_km * 100) / 100;
  } catch {
    // Fallback to Haversine
    return haversineDistance(lat1, lng1, lat2, lng2);
  }
}

/**
 * Haversine formula for great-circle distance between two points.
 * 
 * @returns Distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ── Polygon / Boundary Queries ──────────────────────────────

/**
 * Find all records whose geometry falls within a given polygon boundary.
 * Uses PostGIS ST_Contains for precise boundary queries.
 * 
 * @param polygon - Array of [longitude, latitude] pairs defining the boundary
 * @param model - Which model to search
 */
export async function findWithinPolygon(
  polygon: [number, number][],
  model: GeoModel = 'Property'
): Promise<NearbyResult[]> {
  const polygonWkt = createPolygon(polygon);
  const tableName =
    model === 'Property' ? 'properties' : model === 'Hotel' ? 'hotels' : 'guesthouses';
  const statusFilter =
    model === 'Property' ? "status = 'published'" : "status = 'active'";

  try {
    const results = await db.$queryRawUnsafe<
      Array<{ id: string; name: string; lat: number; lng: number; type: string; city: string; country: string }>
    >(
      `SELECT 
        id,
        CASE 
          WHEN $2 = 'Property' THEN title
          ELSE name
        END as name,
        lat,
        lng,
        CASE
          WHEN $2 = 'Property' THEN type
          WHEN $2 = 'Hotel' THEN 'hotel'
          ELSE 'guesthouse'
        END as type,
        city,
        country
      FROM ${tableName}
      WHERE geometry IS NOT NULL
        AND ST_Contains(
          ST_GeomFromText($1, 4326),
          geometry
        )
        AND ${statusFilter}
      LIMIT 100`,
      polygonWkt,
      model
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      distanceKm: 0,
      type: r.type,
      city: r.city,
      country: r.country,
    }));
  } catch (error) {
    console.error('[PostGIS] findWithinPolygon failed:', error);
    return [];
  }
}

/**
 * Detect overlapping records for a given boundary polygon.
 * Uses PostGIS ST_Intersects to find conflicting geometries.
 * Useful for GeoTrust boundary conflict detection.
 * 
 * @param boundary - Array of [longitude, latitude] pairs defining the boundary
 * @param model - Which model to check for overlaps
 */
export async function detectOverlaps(
  boundary: [number, number][],
  model: GeoModel = 'Property'
): Promise<Array<{ id: string; name: string; overlapArea: number }>> {
  const polygonWkt = createPolygon(boundary);
  const tableName =
    model === 'Property' ? 'properties' : model === 'Hotel' ? 'hotels' : 'guesthouses';

  try {
    const results = await db.$queryRawUnsafe<
      Array<{ id: string; name: string; overlap_area_sqm: number }>
    >(
      `SELECT 
        p.id,
        CASE 
          WHEN $2 = 'Property' THEN p.title
          ELSE p.name
        END as name,
        ST_Area(
          ST_Intersection(
            ST_GeomFromText($1, 4326),
            p.geometry
          )::geography
        ) as overlap_area_sqm
      FROM ${tableName} p
      WHERE p.geometry IS NOT NULL
        AND ST_Intersects(
          ST_GeomFromText($1, 4326),
          p.geometry
        )
      LIMIT 50`,
      polygonWkt,
      model
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      overlapArea: Math.round(r.overlap_area_sqm),
    }));
  } catch (error) {
    console.error('[PostGIS] detectOverlaps failed:', error);
    return [];
  }
}
