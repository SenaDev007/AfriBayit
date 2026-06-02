// AfriBayit — PostGIS Native Spatial Query Library
// Replaces lat/lng bounding box approach with PostGIS ST_DWithin, ST_Distance, ST_MakeEnvelope
// Supports: Property, Hotel, Guesthouse models with geometry(Point, 4326) fields
// Fallback: Haversine JS calculation when PostGIS is unavailable

import { db } from '@/lib/db';

// ── Types ───────────────────────────────────────────────────

export interface NearbyResult {
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

export interface SpatialConflictResult {
  id: string;
  title: string;
  type: string;
  surface: number;
  lat: number;
  lng: number;
  distanceMeters: number;
  agentId: string;
  geoTrust: boolean;
  geoTrustLevel: string | null;
}

export interface NearbyFilters {
  type?: string;        // property type filter (e.g., 'villa', 'terrain')
  minPrice?: number;    // minimum price
  maxPrice?: number;    // maximum price
  minSurface?: number;  // minimum surface area
  maxSurface?: number;  // maximum surface area
  quartier?: string;    // neighborhood filter
  status?: string;      // status filter override
  limit?: number;       // max results (default 50)
}

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
    throw new Error(`Latitude invalide : ${lat}. Doit être entre -90 et 90.`);
  }
  if (lng < -180 || lng > 180) {
    throw new Error(`Longitude invalide : ${lng}. Doit être entre -180 et 180.`);
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
    throw new Error('Un polygone nécessite au moins 3 paires de coordonnées.');
  }
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const closed = first[0] === last[0] && first[1] === last[1]
    ? coordinates
    : [...coordinates, first];

  const points = closed.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
  return `SRID=4326;POLYGON((${points}))`;
}

// ── Core Nearby Search Functions ────────────────────────────

/**
 * Find properties near a geographic point using PostGIS ST_DWithin.
 * Falls back to Haversine-based filtering if PostGIS is unavailable.
 *
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Search radius in kilometers
 * @param country - Optional country filter (BJ, CI, BF, TG)
 * @param filters - Optional additional filters
 */
export async function findNearbyProperties(
  lat: number,
  lng: number,
  radiusKm: number,
  country?: string,
  filters?: NearbyFilters
): Promise<NearbyResult[]> {
  const pointWkt = createPoint(lat, lng);
  const radiusMeters = radiusKm * 1000;
  const limit = filters?.limit ?? 50;
  const status = filters?.status ?? 'published';

  try {
    const results = await db.$queryRawUnsafe<
      Array<{
        id: string; title: string; lat: number; lng: number;
        distance_km: number; type: string; city: string; country: string;
        price: number; surface: number; quartier: string;
      }>
    >(
      `SELECT
        id,
        title as name,
        lat,
        lng,
        ST_DistanceSphere(
          geometry,
          ST_GeomFromText($1, 4326)
        ) / 1000.0 as distance_km,
        type,
        city,
        country
      FROM properties
      WHERE geometry IS NOT NULL
        AND ST_DWithin(
          geometry,
          ST_GeomFromText($1, 4326),
          $2
        )
        AND status = $3
        ${country ? 'AND country = $4' : ''}
        ${filters?.type ? 'AND type = $5' : ''}
        ${filters?.quartier ? 'AND quartier = $6' : ''}
        ${filters?.minPrice !== undefined ? 'AND price >= $7' : ''}
        ${filters?.maxPrice !== undefined ? 'AND price <= $8' : ''}
        ${filters?.minSurface !== undefined ? 'AND surface >= $9' : ''}
        ${filters?.maxSurface !== undefined ? 'AND surface <= $10' : ''}
      ORDER BY distance_km ASC
      LIMIT ${limit}`,
      pointWkt,
      radiusMeters,
      status,
      ...(country ? [country] : []),
      ...(filters?.type ? [filters.type] : []),
      ...(filters?.quartier ? [filters.quartier] : []),
      ...(filters?.minPrice !== undefined ? [filters.minPrice] : []),
      ...(filters?.maxPrice !== undefined ? [filters.maxPrice] : []),
      ...(filters?.minSurface !== undefined ? [filters.minSurface] : []),
      ...(filters?.maxSurface !== undefined ? [filters.maxSurface] : [])
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
      price: r.price,
      surface: r.surface,
      quartier: r.quartier,
    }));
  } catch (error) {
    console.info('[PostGIS] findNearbyProperties ST_DWithin échoué, repli Haversine :', error);
    return findNearbyPropertiesHaversine(lat, lng, radiusKm, country, filters);
  }
}

/**
 * Find hotels near a geographic point using PostGIS ST_DWithin.
 * Falls back to Haversine-based filtering if PostGIS is unavailable.
 */
export async function findNearbyHotels(
  lat: number,
  lng: number,
  radiusKm: number,
  country?: string,
  filters?: NearbyFilters
): Promise<NearbyResult[]> {
  const pointWkt = createPoint(lat, lng);
  const radiusMeters = radiusKm * 1000;
  const limit = filters?.limit ?? 50;
  const status = filters?.status ?? 'active';

  try {
    const results = await db.$queryRawUnsafe<
      Array<{
        id: string; name: string; lat: number; lng: number;
        distance_km: number; city: string; country: string;
        stars: number; price_per_night: number;
      }>
    >(
      `SELECT
        id,
        name,
        lat,
        lng,
        ST_DistanceSphere(
          geometry,
          ST_GeomFromText($1, 4326)
        ) / 1000.0 as distance_km,
        'hotel' as type,
        city,
        country
      FROM hotels
      WHERE geometry IS NOT NULL
        AND ST_DWithin(
          geometry,
          ST_GeomFromText($1, 4326),
          $2
        )
        AND status = $3
        ${country ? 'AND country = $4' : ''}
        ${filters?.minPrice !== undefined ? 'AND "pricePerNight" >= $5' : ''}
        ${filters?.maxPrice !== undefined ? 'AND "pricePerNight" <= $6' : ''}
      ORDER BY distance_km ASC
      LIMIT ${limit}`,
      pointWkt,
      radiusMeters,
      status,
      ...(country ? [country] : []),
      ...(filters?.minPrice !== undefined ? [filters.minPrice] : []),
      ...(filters?.maxPrice !== undefined ? [filters.maxPrice] : [])
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      distanceKm: Math.round(r.distance_km * 100) / 100,
      type: 'hotel',
      city: r.city,
      country: r.country,
      stars: r.stars,
      pricePerNight: r.price_per_night,
    }));
  } catch (error) {
    console.info('[PostGIS] findNearbyHotels ST_DWithin échoué, repli Haversine :', error);
    return findNearbyHotelsHaversine(lat, lng, radiusKm, country, filters);
  }
}

/**
 * Find guesthouses near a geographic point using PostGIS ST_DWithin.
 * Falls back to Haversine-based filtering if PostGIS is unavailable.
 */
export async function findNearbyGuesthouses(
  lat: number,
  lng: number,
  radiusKm: number,
  country?: string,
  filters?: NearbyFilters
): Promise<NearbyResult[]> {
  const pointWkt = createPoint(lat, lng);
  const radiusMeters = radiusKm * 1000;
  const limit = filters?.limit ?? 50;
  const status = filters?.status ?? 'active';

  try {
    const results = await db.$queryRawUnsafe<
      Array<{
        id: string; name: string; lat: number; lng: number;
        distance_km: number; city: string; country: string;
        overall_rating: number;
      }>
    >(
      `SELECT
        id,
        name,
        lat,
        lng,
        ST_DistanceSphere(
          geometry,
          ST_GeomFromText($1, 4326)
        ) / 1000.0 as distance_km,
        'guesthouse' as type,
        city,
        country
      FROM guesthouses
      WHERE geometry IS NOT NULL
        AND ST_DWithin(
          geometry,
          ST_GeomFromText($1, 4326),
          $2
        )
        AND status = $3
        ${country ? 'AND country = $4' : ''}
        ${filters?.quartier ? 'AND quartier = $5' : ''}
      ORDER BY distance_km ASC
      LIMIT ${limit}`,
      pointWkt,
      radiusMeters,
      status,
      ...(country ? [country] : []),
      ...(filters?.quartier ? [filters.quartier] : [])
    );

    return results.map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.lat,
      lng: r.lng,
      distanceKm: Math.round(r.distance_km * 100) / 100,
      type: 'guesthouse',
      city: r.city,
      country: r.country,
      overallRating: r.overall_rating,
    }));
  } catch (error) {
    console.info('[PostGIS] findNearbyGuesthouses ST_DWithin échoué, repli Haversine :', error);
    return findNearbyGuesthousesHaversine(lat, lng, radiusKm, country, filters);
  }
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

// ── Bounding Box Search ─────────────────────────────────────

/**
 * Find all records within a bounding box using PostGIS ST_MakeEnvelope + ST_Contains.
 * Falls back to lat/lng range queries if PostGIS is unavailable.
 *
 * @param swLat - Southwest latitude
 * @param swLng - Southwest longitude
 * @param neLat - Northeast latitude
 * @param neLng - Northeast longitude
 * @param country - Optional country filter
 */
export async function findWithinBoundingBox(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  country?: string
): Promise<NearbyResult[]> {
  try {
    // Use PostGIS ST_MakeEnvelope for precise bounding box
    const properties = await db.$queryRawUnsafe<
      Array<{
        id: string; title: string; lat: number; lng: number;
        type: string; city: string; country: string;
      }>
    >(
      `SELECT id, title as name, lat, lng, type, city, country
       FROM properties
       WHERE geometry IS NOT NULL
         AND ST_Contains(
           ST_MakeEnvelope($1, $2, $3, $4, 4326),
           geometry
         )
         AND status = 'published'
         ${country ? 'AND country = $5' : ''}
       LIMIT 100`,
      swLng, swLat, neLng, neLat,
      ...(country ? [country] : [])
    );

    const hotels = await db.$queryRawUnsafe<
      Array<{
        id: string; name: string; lat: number; lng: number;
        city: string; country: string;
      }>
    >(
      `SELECT id, name, lat, lng, 'hotel' as type, city, country
       FROM hotels
       WHERE geometry IS NOT NULL
         AND ST_Contains(
           ST_MakeEnvelope($1, $2, $3, $4, 4326),
           geometry
         )
         AND status = 'active'
         ${country ? 'AND country = $5' : ''}
       LIMIT 100`,
      swLng, swLat, neLng, neLat,
      ...(country ? [country] : [])
    );

    const guesthouses = await db.$queryRawUnsafe<
      Array<{
        id: string; name: string; lat: number; lng: number;
        city: string; country: string;
      }>
    >(
      `SELECT id, name, lat, lng, 'guesthouse' as type, city, country
       FROM guesthouses
       WHERE geometry IS NOT NULL
         AND ST_Contains(
           ST_MakeEnvelope($1, $2, $3, $4, 4326),
           geometry
         )
         AND status = 'active'
         ${country ? 'AND country = $5' : ''}
       LIMIT 100`,
      swLng, swLat, neLng, neLat,
      ...(country ? [country] : [])
    );

    return [
      ...properties.map((r) => ({ ...r, distanceKm: 0 })),
      ...hotels.map((r) => ({ ...r, distanceKm: 0 })),
      ...guesthouses.map((r) => ({ ...r, distanceKm: 0 })),
    ];
  } catch (error) {
    console.info('[PostGIS] findWithinBoundingBox échoué, repli lat/lng :', error);
    return findWithinBoundingBoxFallback(swLat, swLng, neLat, neLng, country);
  }
}

// ── Spatial Conflict Detection ──────────────────────────────

/**
 * Detect spatial conflicts for a property using PostGIS ST_DWithin.
 * Finds nearby properties with potentially overlapping boundaries.
 * Falls back to Haversine JS if PostGIS is unavailable.
 *
 * @param propertyId - ID of the property being checked (excluded from results)
 * @param lat - Property latitude
 * @param lng - Property longitude
 * @param radiusMeters - Search radius in meters for conflict detection
 */
export async function detectSpatialConflicts(
  propertyId: string,
  lat: number,
  lng: number,
  radiusMeters: number = 30
): Promise<SpatialConflictResult[]> {
  const pointWkt = createPoint(lat, lng);

  try {
    const results = await db.$queryRawUnsafe<
      Array<{
        id: string; title: string; type: string; surface: number;
        lat: number; lng: number; distance_meters: number;
        agent_id: string; geo_trust: boolean; geo_trust_level: string | null;
      }>
    >(
      `SELECT
        id,
        title,
        type,
        surface,
        lat,
        lng,
        ST_DistanceSphere(
          geometry,
          ST_GeomFromText($1, 4326)
        ) as distance_meters,
        "agentId" as agent_id,
        "geoTrust" as geo_trust,
        "geoTrustLevel" as geo_trust_level
      FROM properties
      WHERE geometry IS NOT NULL
        AND ST_DWithin(
          geometry,
          ST_GeomFromText($1, 4326),
          $2
        )
        AND id != $3
        AND status IN ('published', 'pending', 'ai_review', 'human_review', 'draft')
      ORDER BY distance_meters ASC
      LIMIT 50`,
      pointWkt,
      radiusMeters,
      propertyId
    );

    return results.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      surface: r.surface,
      lat: r.lat,
      lng: r.lng,
      distanceMeters: Math.round(r.distance_meters * 10) / 10,
      agentId: r.agent_id,
      geoTrust: r.geo_trust,
      geoTrustLevel: r.geo_trust_level,
    }));
  } catch (error) {
    console.info('[PostGIS] detectSpatialConflicts échoué, repli Haversine :', error);
    return detectSpatialConflictsHaversine(propertyId, lat, lng, radiusMeters);
  }
}

// ── Legacy findNearby (kept for backward compatibility) ─────

type GeoModel = 'Property' | 'Hotel' | 'Guesthouse';

/**
 * @deprecated Use findNearbyProperties, findNearbyHotels, or findNearbyGuesthouses instead.
 * Find records within a radius of a point using PostGIS ST_DWithin.
 * Falls back to Haversine-based filtering if PostGIS is unavailable.
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
        AND ${model === 'Property' ? "status = 'published'" : "status = 'active'"}
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
    console.info('[PostGIS] ST_DWithin échoué, repli Haversine');
    return findNearbyHaversine(lat, lng, radiusKm, model);
  }
}

// ── Haversine Fallbacks ─────────────────────────────────────

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

async function findNearbyHaversine(
  lat: number,
  lng: number,
  radiusKm: number,
  model: GeoModel
): Promise<NearbyResult[]> {
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const statusFilter = model === 'Property' ? 'published' : 'active';

  let records: Array<{
    id: string; name: string; lat: number | null; lng: number | null;
    type: string; city: string; country: string;
  }> = [];

  if (model === 'Property') {
    const props = await db.property.findMany({
      where: {
        status: statusFilter,
        lat: { gte: lat - latOffset, lte: lat + latOffset },
        lng: { gte: lng - lngOffset, lte: lng + lngOffset },
      },
      select: { id: true, title: true, lat: true, lng: true, type: true, city: true, country: true },
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
      select: { id: true, name: true, lat: true, lng: true, city: true, country: true },
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
      select: { id: true, name: true, lat: true, lng: true, city: true, country: true },
      take: 100,
    });
    records = guesthouses.map((g) => ({ ...g, type: 'guesthouse' }));
  }

  return records
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r) => ({
      id: r.id, name: r.name, lat: r.lat!, lng: r.lng!,
      distanceKm: haversineDistance(lat, lng, r.lat!, r.lng!),
      type: r.type, city: r.city, country: r.country,
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 50);
}

async function findNearbyPropertiesHaversine(
  lat: number,
  lng: number,
  radiusKm: number,
  country?: string,
  filters?: NearbyFilters
): Promise<NearbyResult[]> {
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const status = filters?.status ?? 'published';

  const props = await db.property.findMany({
    where: {
      status,
      ...(country ? { country } : {}),
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.quartier ? { quartier: filters.quartier } : {}),
      lat: { gte: lat - latOffset, lte: lat + latOffset },
      lng: { gte: lng - lngOffset, lte: lng + lngOffset },
      ...(filters?.minPrice !== undefined ? { price: { gte: filters.minPrice } } : {}),
      ...(filters?.maxPrice !== undefined ? { price: { lte: filters.maxPrice } } : {}),
      ...(filters?.minSurface !== undefined ? { surface: { gte: filters.minSurface } } : {}),
      ...(filters?.maxSurface !== undefined ? { surface: { lte: filters.maxSurface } } : {}),
    },
    select: { id: true, title: true, lat: true, lng: true, type: true, city: true, country: true },
    take: 100,
  });

  return props
    .filter((p) => p.lat !== null && p.lng !== null)
    .map((p) => ({
      id: p.id, name: p.title, lat: p.lat!, lng: p.lng!,
      distanceKm: haversineDistance(lat, lng, p.lat!, p.lng!),
      type: p.type, city: p.city, country: p.country,
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, filters?.limit ?? 50);
}

async function findNearbyHotelsHaversine(
  lat: number,
  lng: number,
  radiusKm: number,
  country?: string,
  filters?: NearbyFilters
): Promise<NearbyResult[]> {
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const status = filters?.status ?? 'active';

  const hotels = await db.hotel.findMany({
    where: {
      status,
      ...(country ? { country } : {}),
      lat: { gte: lat - latOffset, lte: lat + latOffset },
      lng: { gte: lng - lngOffset, lte: lng + lngOffset },
      ...(filters?.minPrice !== undefined ? { pricePerNight: { gte: filters.minPrice } } : {}),
      ...(filters?.maxPrice !== undefined ? { pricePerNight: { lte: filters.maxPrice } } : {}),
    },
    select: { id: true, name: true, lat: true, lng: true, city: true, country: true },
    take: 100,
  });

  return hotels
    .filter((h) => h.lat !== null && h.lng !== null)
    .map((h) => ({
      id: h.id, name: h.name, lat: h.lat!, lng: h.lng!,
      distanceKm: haversineDistance(lat, lng, h.lat!, h.lng!),
      type: 'hotel' as const, city: h.city, country: h.country,
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, filters?.limit ?? 50);
}

async function findNearbyGuesthousesHaversine(
  lat: number,
  lng: number,
  radiusKm: number,
  country?: string,
  filters?: NearbyFilters
): Promise<NearbyResult[]> {
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  const status = filters?.status ?? 'active';

  const guesthouses = await db.guesthouse.findMany({
    where: {
      status,
      ...(country ? { country } : {}),
      ...(filters?.quartier ? { quartier: filters.quartier } : {}),
      lat: { gte: lat - latOffset, lte: lat + latOffset },
      lng: { gte: lng - lngOffset, lte: lng + lngOffset },
    },
    select: { id: true, name: true, lat: true, lng: true, city: true, country: true },
    take: 100,
  });

  return guesthouses
    .filter((g) => g.lat !== null && g.lng !== null)
    .map((g) => ({
      id: g.id, name: g.name, lat: g.lat!, lng: g.lng!,
      distanceKm: haversineDistance(lat, lng, g.lat!, g.lng!),
      type: 'guesthouse' as const, city: g.city, country: g.country,
    }))
    .filter((r) => r.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, filters?.limit ?? 50);
}

async function findWithinBoundingBoxFallback(
  swLat: number,
  swLng: number,
  neLat: number,
  neLng: number,
  country?: string
): Promise<NearbyResult[]> {
  const countryFilter = country ? { country } : {};

  const [properties, hotels, guesthouses] = await Promise.all([
    db.property.findMany({
      where: {
        status: 'published',
        ...countryFilter,
        lat: { gte: swLat, lte: neLat },
        lng: { gte: swLng, lte: neLng },
      },
      select: { id: true, title: true, lat: true, lng: true, type: true, city: true, country: true },
      take: 100,
    }),
    db.hotel.findMany({
      where: {
        status: 'active',
        ...countryFilter,
        lat: { gte: swLat, lte: neLat },
        lng: { gte: swLng, lte: neLng },
      },
      select: { id: true, name: true, lat: true, lng: true, city: true, country: true },
      take: 100,
    }),
    db.guesthouse.findMany({
      where: {
        status: 'active',
        ...countryFilter,
        lat: { gte: swLat, lte: neLat },
        lng: { gte: swLng, lte: neLng },
      },
      select: { id: true, name: true, lat: true, lng: true, city: true, country: true },
      take: 100,
    }),
  ]);

  return [
    ...properties
      .filter((p) => p.lat !== null && p.lng !== null)
      .map((p) => ({ id: p.id, name: p.title, lat: p.lat!, lng: p.lng!, distanceKm: 0, type: p.type, city: p.city, country: p.country })),
    ...hotels
      .filter((h) => h.lat !== null && h.lng !== null)
      .map((h) => ({ id: h.id, name: h.name, lat: h.lat!, lng: h.lng!, distanceKm: 0, type: 'hotel' as const, city: h.city, country: h.country })),
    ...guesthouses
      .filter((g) => g.lat !== null && g.lng !== null)
      .map((g) => ({ id: g.id, name: g.name, lat: g.lat!, lng: g.lng!, distanceKm: 0, type: 'guesthouse' as const, city: g.city, country: g.country })),
  ];
}

async function detectSpatialConflictsHaversine(
  propertyId: string,
  lat: number,
  lng: number,
  radiusMeters: number
): Promise<SpatialConflictResult[]> {
  // Convert radius to approximate degree offsets (for bounding box pre-filter)
  const radiusKm = radiusMeters / 1000;
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  const nearbyProps = await db.property.findMany({
    where: {
      status: { in: ['published', 'pending', 'ai_review', 'human_review', 'draft'] },
      lat: { gte: lat - latOffset, lte: lat + latOffset },
      lng: { gte: lng - lngOffset, lte: lng + lngOffset },
    },
    select: {
      id: true, title: true, type: true, surface: true,
      lat: true, lng: true, agentId: true, geoTrust: true, geoTrustLevel: true,
    },
    take: 100,
  });

  return nearbyProps
    .filter((p) => p.id !== propertyId && p.lat !== null && p.lng !== null)
    .map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      surface: p.surface,
      lat: p.lat!,
      lng: p.lng!,
      distanceMeters: Math.round(haversineDistance(lat, lng, p.lat!, p.lng!) * 1000 * 10) / 10,
      agentId: p.agentId,
      geoTrust: p.geoTrust,
      geoTrustLevel: p.geoTrustLevel,
    }))
    .filter((p) => p.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
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
    console.error('[PostGIS] findWithinPolygon échoué :', error);
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
    console.error('[PostGIS] detectOverlaps échoué :', error);
    return [];
  }
}

// ── PostGIS Availability Check ──────────────────────────────

/**
 * Check if PostGIS extension is available in the database.
 * Useful for health checks and determining query strategy.
 */
export async function isPostGISAvailable(): Promise<boolean> {
  try {
    const result = await db.$queryRawUnsafe<Array<{ extversion: string }>>(
      `SELECT extversion FROM pg_extension WHERE extname = 'postgis'`
    );
    return result.length > 0;
  } catch {
    return false;
  }
}
