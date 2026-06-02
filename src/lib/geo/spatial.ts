// AfriBayit — PostGIS Spatial Query Utilities
// Provides GeoJSON support and spatial queries for properties
//
// PostGIS queries are used when available (PostgreSQL + PostGIS in production).
// Falls back to Haversine formula in the application layer for SQLite dev
// or Neon without PostGIS extension.

import { db } from '@/lib/db';

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PropertyWithDistance {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  quartier: string;
  country: string;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
  distance_km: number;
}

export interface SpatialQueryOptions {
  type?: string;
  transaction?: string;
  country?: string;
  limit?: number;
}

/**
 * Find properties within a radius of a point using PostGIS.
 * Falls back to simple lat/lng Haversine calculation if PostGIS is not available.
 *
 * The Prisma schema uses `lat` and `lng` fields on the Property model.
 */
export async function findPropertiesNearPoint(
  point: GeoPoint,
  radiusKm: number,
  options?: SpatialQueryOptions
): Promise<PropertyWithDistance[]> {
  const limit = options?.limit || 20;

  try {
    // Try PostGIS query first (PostgreSQL + PostGIS)
    // Uses the actual Prisma column names: lat, lng
    const typeFilter = options?.type ? `AND type = '${escapeSQL(options.type)}'` : '';
    const transactionFilter = options?.transaction
      ? `AND transaction = '${escapeSQL(options.transaction)}'`
      : '';
    const countryFilter = options?.country
      ? `AND country = '${escapeSQL(options.country)}'`
      : '';

    const results = await db.$queryRawUnsafe(`
      SELECT id, title, type, transaction, price, surface, bedrooms, bathrooms,
             city, quartier, country,
             (SELECT url FROM property_images WHERE "propertyId" = p.id AND "isPrimary" = true LIMIT 1) AS "imageUrl",
             lat, lng,
             ST_Distance(
               ST_MakePoint(lng, lat)::geography,
               ST_MakePoint(${point.lng}, ${point.lat})::geography
             ) / 1000 AS distance_km
      FROM properties p
      WHERE status = 'published'
        AND lat IS NOT NULL AND lng IS NOT NULL
        AND ST_DWithin(
          ST_MakePoint(lng, lat)::geography,
          ST_MakePoint(${point.lng}, ${point.lat})::geography,
          ${radiusKm * 1000}
        )
        ${typeFilter}
        ${transactionFilter}
        ${countryFilter}
      ORDER BY distance_km ASC
      LIMIT ${limit}
    `);
    return results as PropertyWithDistance[];
  } catch {
    // Fallback: Haversine formula in application layer
    // This is used when PostGIS is not available (SQLite, or Neon without PostGIS)
    return findPropertiesNearPointFallback(point, radiusKm, options);
  }
}

/**
 * Haversine fallback implementation for when PostGIS is not available.
 * Fetches properties and calculates distances in the application layer.
 */
async function findPropertiesNearPointFallback(
  point: GeoPoint,
  radiusKm: number,
  options?: SpatialQueryOptions
): Promise<PropertyWithDistance[]> {
  const where: Record<string, unknown> = {
    status: 'published',
    lat: { not: null },
    lng: { not: null },
  };
  if (options?.type) where.type = options.type;
  if (options?.transaction) where.transaction = options.transaction;
  if (options?.country) where.country = options.country;

  const properties = await db.property.findMany({
    where,
    select: {
      id: true,
      title: true,
      type: true,
      transaction: true,
      price: true,
      surface: true,
      bedrooms: true,
      bathrooms: true,
      city: true,
      quartier: true,
      country: true,
      lat: true,
      lng: true,
      propertyImages: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
    take: 500,
  });

  // Calculate distances using Haversine and filter by radius
  const withDistance: PropertyWithDistance[] = properties
    .filter((p) => p.lat !== null && p.lng !== null)
    .map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      transaction: p.transaction,
      price: p.price,
      surface: p.surface,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      city: p.city,
      quartier: p.quartier,
      country: p.country,
      imageUrl: p.propertyImages[0]?.url ?? null,
      lat: p.lat,
      lng: p.lng,
      distance_km: haversineDistance(point.lat, point.lng, p.lat!, p.lng!),
    }))
    .filter((p) => p.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, options?.limit || 20);

  return withDistance;
}

/**
 * Calculate the Haversine distance between two points on Earth.
 * Returns the distance in kilometers.
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Find properties within a bounding box.
 * Works with both PostGIS and SQLite (uses Prisma ORM queries).
 */
export async function findPropertiesInBounds(
  bounds: BoundingBox,
  options?: SpatialQueryOptions
): Promise<PropertyWithDistance[]> {
  const where: Record<string, unknown> = {
    status: 'published',
    lat: { not: null, gte: bounds.south, lte: bounds.north },
    lng: { not: null, gte: bounds.west, lte: bounds.east },
  };
  if (options?.type) where.type = options.type;
  if (options?.transaction) where.transaction = options.transaction;
  if (options?.country) where.country = options.country;

  const properties = await db.property.findMany({
    where,
    select: {
      id: true,
      title: true,
      type: true,
      transaction: true,
      price: true,
      surface: true,
      bedrooms: true,
      bathrooms: true,
      city: true,
      quartier: true,
      country: true,
      lat: true,
      lng: true,
      propertyImages: {
        where: { isPrimary: true },
        select: { url: true },
        take: 1,
      },
    },
    take: 100,
  });

  return properties.map((p) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    transaction: p.transaction,
    price: p.price,
    surface: p.surface,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    city: p.city,
    quartier: p.quartier,
    country: p.country,
    imageUrl: p.propertyImages[0]?.url ?? null,
    lat: p.lat,
    lng: p.lng,
    distance_km: 0, // No distance calculation for bounds queries
  }));
}

/**
 * Get the approximate center point of a country for initial map positioning.
 */
export function getCountryCenter(country: string): GeoPoint {
  const centers: Record<string, GeoPoint> = {
    BJ: { lat: 9.3077, lng: 2.3158 }, // Bénin
    CI: { lat: 7.54, lng: -5.5471 },   // Côte d'Ivoire
    BF: { lat: 12.2383, lng: -1.5616 }, // Burkina Faso
    TG: { lat: 8.6195, lng: 0.8248 },   // Togo
    SN: { lat: 14.4974, lng: -14.4524 }, // Sénégal
  };
  return centers[country] || centers.BJ;
}

/**
 * Escape a string value for use in raw SQL queries.
 * This is a basic defense against SQL injection.
 */
function escapeSQL(value: string): string {
  return value.replace(/'/g, "''").replace(/;/g, '').replace(/--/g, '');
}
