// AfriBayit AVM — Comparable Properties Finder
// Finds similar properties (comps) for valuation

import { db } from '@/lib/db';

export interface PropertyData {
  id: string;
  type: string;
  transaction: string;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  features?: string[];
  lat?: number | null;
  lng?: number | null;
  createdAt: Date;
  verified: boolean;
  geoTrust: boolean;
}

export interface Comparable {
  property: PropertyData;
  pricePerM2: number;
  similarityScore: number; // 0-1 how similar to target
  adjustmentFactor: number; // multiplier to adjust comp price to target
  distanceFromTarget?: number; // km if coordinates available
}

/**
 * Find comparable properties for valuation
 * Searches for properties in the same area with similar characteristics
 */
export async function findComparables(
  target: PropertyData,
  options?: {
    maxDistance?: number; // km radius
    surfaceTolerance?: number; // ±% surface difference
    maxResults?: number;
  }
): Promise<Comparable[]> {
  const {
    surfaceTolerance = 0.2, // ±20%
    maxResults = 10,
  } = options || {};

  const minSurface = target.surface * (1 - surfaceTolerance);
  const maxSurface = target.surface * (1 + surfaceTolerance);

  try {
    // Search for comparable properties
    const candidates = await db.property.findMany({
      where: {
        status: 'published',
        type: target.type,
        transaction: target.transaction,
        country: target.country,
        surface: { gte: minSurface, lte: maxSurface },
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    // If we don't have enough comps from same quartier, expand to same city
    let comps = candidates;
    if (comps.length < 5) {
      const cityComps = await db.property.findMany({
        where: {
          status: 'published',
          type: target.type,
          transaction: target.transaction,
          country: target.country,
          city: target.city,
          surface: { gte: minSurface, lte: maxSurface },
        },
        take: 30,
        orderBy: { createdAt: 'desc' },
      });
      const existingIds = new Set(comps.map((c) => c.id));
      comps = [...comps, ...cityComps.filter((c) => !existingIds.has(c.id))];
    }

    // Score and rank comparables
    const scored: Comparable[] = comps
      .filter((c) => c.id !== target.id && c.surface > 0)
      .map((c) => {
        const features = (() => {
          try { return c.features ? JSON.parse(c.features) : []; } catch { return []; }
        })();

        const pricePerM2 = c.price / c.surface;

        // Calculate similarity score
        let similarity = 0;

        // Quartier match (strong signal)
        if (c.quartier.toLowerCase() === target.quartier.toLowerCase()) {
          similarity += 0.35;
        } else if (c.city.toLowerCase() === target.city.toLowerCase()) {
          similarity += 0.15;
        }

        // Surface similarity
        const surfaceDiff = Math.abs(c.surface - target.surface) / target.surface;
        similarity += Math.max(0, 0.2 * (1 - surfaceDiff));

        // Bedroom match
        const bedroomDiff = Math.abs(c.bedrooms - target.bedrooms);
        similarity += Math.max(0, 0.15 * (1 - bedroomDiff * 0.2));

        // Bathroom match
        const bathroomDiff = Math.abs(c.bathrooms - target.bathrooms);
        similarity += Math.max(0, 0.1 * (1 - bathroomDiff * 0.2));

        // Feature overlap
        if (Array.isArray(features) && Array.isArray(target.features)) {
          const targetFeatures = new Set(target.features.map((f) => String(f).toLowerCase()));
          const matchCount = features.filter((f: string) => targetFeatures.has(String(f).toLowerCase())).length;
          const totalFeatures = Math.max(target.features.length, 1);
          similarity += 0.1 * (matchCount / totalFeatures);
        }

        // Recency bonus (newer listings weighted higher)
        const daysSinceListing = (Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBonus = Math.max(0, 0.1 * (1 - daysSinceListing / 365));
        similarity += recencyBonus;

        // Verified/GeoTrust bonus
        if (c.verified) similarity += 0.05;
        if (c.geoTrust) similarity += 0.05;

        // Calculate adjustment factor
        let adjustment = 1.0;
        // Adjust for surface difference
        if (c.surface !== target.surface) {
          adjustment *= target.surface / c.surface;
        }
        // Adjust for bedroom difference
        if (c.bedrooms !== target.bedrooms && c.bedrooms > 0) {
          adjustment *= 1 + (target.bedrooms - c.bedrooms) * 0.05;
        }

        // Calculate distance if coordinates available
        let distanceFromTarget: number | undefined;
        if (target.lat && target.lng && c.lat && c.lng) {
          distanceFromTarget = haversineDistance(
            target.lat, target.lng,
            c.lat, c.lng
          );
        }

        return {
          property: {
            ...c,
            features,
            lat: c.lat,
            lng: c.lng,
            createdAt: c.createdAt,
          },
          pricePerM2,
          similarityScore: Math.min(similarity, 1),
          adjustmentFactor: adjustment,
          distanceFromTarget,
        };
      });

    return scored
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, maxResults);
  } catch (error) {
    console.error('Comparable finding error:', error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
