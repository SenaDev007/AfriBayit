// AfriBayit — GeoTrust Boundary Conflict Detector
// CDC §6.4 — Auto-detection of boundary conflicts when a property is published
//
// Checks:
//   1. Overlapping boundaries (using PostGIS ST_DWithin with haversine fallback)
//   2. Same address different owner
//   3. Duplicate coordinates
//   4. Area discrepancy
//
// Primary: PostGIS spatial queries (ST_DWithin, ST_DistanceSphere)
// Fallback: Haversine distance in JS when PostGIS is unavailable
// Returns: { hasConflicts, conflicts: ConflictDetail[], riskLevel }

import { db } from '@/lib/db';
import { detectSpatialConflicts, haversineDistance } from '@/lib/geo/postgis';

// ============ Types ============

export interface PropertyWithBoundary {
  propertyId?: string;
  title: string;
  type: string;
  price: number;
  surface: number;
  city: string;
  country: string;
  quartier: string;
  address?: string;
  lat?: number | null;
  lng?: number | null;
  agentId: string;
  geoTrustLevel?: string | null;
}

export type ConflictType =
  | 'overlapping_boundary'
  | 'same_address_different_owner'
  | 'duplicate_coordinates'
  | 'area_discrepancy';

export type ConflictRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ConflictDetail {
  type: ConflictType;
  severity: ConflictRiskLevel;
  message: string;
  detail: string;
  conflictingPropertyId: string;
  conflictingPropertyTitle: string;
  conflictingAgentId: string;
  distanceMeters?: number;
  overlapArea?: number;
}

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: ConflictDetail[];
  riskLevel: ConflictRiskLevel;
  checkedProperties: number;
  recommendation: string;
}

// ============ Constants ============

/** Minimum distance (meters) to consider properties as potentially overlapping */
const OVERLAP_THRESHOLD_METERS = 30;

/** Distance (meters) for exact coordinate duplicate detection */
const DUPLICATE_COORDINATE_THRESHOLD_METERS = 5;

/** Surface area discrepancy threshold (%) */
const AREA_DISCREPANCY_THRESHOLD_PCT = 15;

// ============ Main Function ============

/**
 * Detect boundary conflicts for a property being published.
 * Compares against existing properties in the same quartier/city.
 */
export async function detectBoundaryConflicts(
  property: PropertyWithBoundary
): Promise<ConflictResult> {
  const conflicts: ConflictDetail[] = [];

  // Run all conflict checks in parallel
  const [overlapConflicts, addressConflicts, coordConflicts, areaConflicts] = await Promise.all([
    detectOverlappingBoundaries(property),
    detectSameAddressDifferentOwner(property),
    detectDuplicateCoordinates(property),
    detectAreaDiscrepancy(property),
  ]);

  conflicts.push(...overlapConflicts, ...addressConflicts, ...coordConflicts, ...areaConflicts);

  // Determine overall risk level
  const riskLevel = determineRiskLevel(conflicts);

  // Count checked properties
  const checkedProperties = await countNearbyProperties(property);

  // Generate recommendation
  const recommendation = generateConflictRecommendation(riskLevel, conflicts);

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    riskLevel,
    checkedProperties,
    recommendation,
  };
}

// ============ Check Functions ============

/**
 * Check 1: Overlapping boundaries
 * Uses PostGIS ST_DWithin for spatial search, falls back to haversine JS
 */
async function detectOverlappingBoundaries(property: PropertyWithBoundary): Promise<ConflictDetail[]> {
  const conflicts: ConflictDetail[] = [];

  if (!property.lat || !property.lng || !property.propertyId) {
    return conflicts; // Can't check without coordinates or property ID
  }

  try {
    // Use PostGIS detectSpatialConflicts for accurate spatial search
    // Search within OVERLAP_THRESHOLD_METERS radius
    const nearbyConflicts = await detectSpatialConflicts(
      property.propertyId,
      property.lat,
      property.lng,
      OVERLAP_THRESHOLD_METERS
    );

    for (const candidate of nearbyConflicts) {
      // Check if similar surface area (same parcel)
      const surfaceRatio = property.surface > 0 && candidate.surface > 0
        ? Math.min(property.surface, candidate.surface) / Math.max(property.surface, candidate.surface)
        : 0;

      const isLikelySameParcel = surfaceRatio > 0.7; // Similar size = likely same parcel

      conflicts.push({
        type: 'overlapping_boundary',
        severity: isLikelySameParcel ? 'critical' : 'high',
        message: isLikelySameParcel
          ? 'Parcelle probablement en double'
          : 'Chevauchement de parcelle détecté',
        detail: `Bien à ${Math.round(candidate.distanceMeters)}m — "${candidate.title}" (${candidate.type}, ${candidate.surface}m², ${candidate.geoTrust ? 'GeoTrust' : 'non vérifié'})`,
        conflictingPropertyId: candidate.id,
        conflictingPropertyTitle: candidate.title,
        conflictingAgentId: candidate.agentId,
        distanceMeters: Math.round(candidate.distanceMeters),
      });
    }
  } catch {
    // PostGIS failed — fall back to haversine-based detection
    console.info('[GeoTrust] detectSpatialConflicts échoué, repli haversine');
    return detectOverlappingBoundariesHaversine(property);
  }

  return conflicts;
}

/**
 * Fallback: Overlapping boundary detection using haversine distance
 * Used when PostGIS is unavailable
 */
async function detectOverlappingBoundariesHaversine(property: PropertyWithBoundary): Promise<ConflictDetail[]> {
  const conflicts: ConflictDetail[] = [];

  if (!property.lat || !property.lng) {
    return conflicts;
  }

  try {
    const nearbyProperties = await db.property.findMany({
      where: {
        status: { in: ['published', 'pending', 'ai_review', 'human_review', 'draft'] },
        country: property.country,
        city: property.city,
        quartier: property.quartier,
        lat: { not: null },
        lng: { not: null },
      },
      select: {
        id: true,
        title: true,
        type: true,
        surface: true,
        lat: true,
        lng: true,
        agentId: true,
        geoTrust: true,
        geoTrustLevel: true,
      },
      take: 100,
    });

    const candidates = property.propertyId
      ? nearbyProperties.filter(p => p.id !== property.propertyId)
      : nearbyProperties;

    for (const candidate of candidates) {
      if (!candidate.lat || !candidate.lng) continue;

      const distance = haversineDistanceMeters(
        property.lat, property.lng,
        candidate.lat, candidate.lng
      );

      if (distance <= OVERLAP_THRESHOLD_METERS) {
        const surfaceRatio = property.surface > 0 && candidate.surface > 0
          ? Math.min(property.surface, candidate.surface) / Math.max(property.surface, candidate.surface)
          : 0;

        const isLikelySameParcel = surfaceRatio > 0.7;

        conflicts.push({
          type: 'overlapping_boundary',
          severity: isLikelySameParcel ? 'critical' : 'high',
          message: isLikelySameParcel
            ? 'Parcelle probablement en double'
            : 'Chevauchement de parcelle détecté',
          detail: `Bien à ${Math.round(distance)}m — "${candidate.title}" (${candidate.type}, ${candidate.surface}m², ${candidate.geoTrust ? 'GeoTrust' : 'non vérifié'})`,
          conflictingPropertyId: candidate.id,
          conflictingPropertyTitle: candidate.title,
          conflictingAgentId: candidate.agentId,
          distanceMeters: Math.round(distance),
        });
      }
    }
  } catch {
    // DB error — skip
  }

  return conflicts;
}

/**
 * Check 2: Same address different owner
 * Detects properties at the same address listed by different agents
 */
async function detectSameAddressDifferentOwner(property: PropertyWithBoundary): Promise<ConflictDetail[]> {
  const conflicts: ConflictDetail[] = [];

  if (!property.address || property.address.trim().length < 5) {
    return conflicts; // Can't check without a meaningful address
  }

  try {
    const normalizedAddress = property.address.toLowerCase().trim();

    const sameAddressProperties = await db.property.findMany({
      where: {
        status: { in: ['published', 'pending', 'ai_review', 'human_review', 'draft'] },
        country: property.country,
        city: property.city,
        address: { not: null },
      },
      select: {
        id: true,
        title: true,
        address: true,
        agentId: true,
        type: true,
        price: true,
        createdAt: true,
      },
      take: 100,
    });

    // Filter to matching addresses and different owners
    const matches = sameAddressProperties.filter(p => {
      if (property.propertyId && p.id === property.propertyId) return false;
      if (p.agentId === property.agentId) return false; // Same agent is OK
      if (!p.address) return false;

      const pAddress = p.address.toLowerCase().trim();
      return pAddress === normalizedAddress ||
        levenshteinDistance(pAddress, normalizedAddress) <= 3;
    });

    for (const match of matches) {
      conflicts.push({
        type: 'same_address_different_owner',
        severity: 'critical',
        message: 'Même adresse, propriétaire différent',
        detail: `"${match.title}" par un autre agent — adresse: "${match.address}"`,
        conflictingPropertyId: match.id,
        conflictingPropertyTitle: match.title,
        conflictingAgentId: match.agentId,
      });
    }
  } catch {
    // DB error — skip
  }

  return conflicts;
}

/**
 * Check 3: Duplicate coordinates
 * Detects exact or near-exact coordinate matches
 */
async function detectDuplicateCoordinates(property: PropertyWithBoundary): Promise<ConflictDetail[]> {
  const conflicts: ConflictDetail[] = [];

  if (!property.lat || !property.lng || !property.propertyId) {
    return conflicts;
  }

  try {
    // Use PostGIS detectSpatialConflicts with a very small radius for duplicate detection
    const nearbyConflicts = await detectSpatialConflicts(
      property.propertyId,
      property.lat,
      property.lng,
      DUPLICATE_COORDINATE_THRESHOLD_METERS
    );

    for (const candidate of nearbyConflicts) {
      const sameOwner = candidate.agentId === property.agentId;

      conflicts.push({
        type: 'duplicate_coordinates',
        severity: sameOwner ? 'high' : 'critical',
        message: sameOwner
          ? 'Coordonnées en double (même agent)'
          : 'Coordonnées identiques à un autre bien',
        detail: `Distance: ${candidate.distanceMeters}m — "${candidate.title}"`,
        conflictingPropertyId: candidate.id,
        conflictingPropertyTitle: candidate.title,
        conflictingAgentId: candidate.agentId,
        distanceMeters: candidate.distanceMeters,
      });
    }
  } catch {
    // PostGIS failed — fall back to bounding box + haversine
    console.info('[GeoTrust] detectDuplicateCoordinates PostGIS échoué, repli haversine');
    return detectDuplicateCoordinatesHaversine(property);
  }

  return conflicts;
}

/**
 * Fallback: Duplicate coordinate detection using haversine distance
 */
async function detectDuplicateCoordinatesHaversine(property: PropertyWithBoundary): Promise<ConflictDetail[]> {
  const conflicts: ConflictDetail[] = [];

  if (!property.lat || !property.lng) {
    return conflicts;
  }

  try {
    // Search for properties with very close coordinates
    const latDelta = 0.001; // ~111m
    const lngDelta = 0.001 / Math.cos(property.lat * Math.PI / 180);

    const nearbyProps = await db.property.findMany({
      where: {
        status: { in: ['published', 'pending', 'ai_review', 'human_review', 'draft'] },
        country: property.country,
        lat: {
          gte: property.lat - latDelta,
          lte: property.lat + latDelta,
        },
        lng: {
          gte: property.lng - lngDelta,
          lte: property.lng + lngDelta,
        },
      },
      select: {
        id: true,
        title: true,
        lat: true,
        lng: true,
        agentId: true,
        type: true,
      },
      take: 50,
    });

    const candidates = property.propertyId
      ? nearbyProps.filter(p => p.id !== property.propertyId)
      : nearbyProps;

    for (const candidate of candidates) {
      if (!candidate.lat || !candidate.lng) continue;

      const distance = haversineDistanceMeters(
        property.lat, property.lng,
        candidate.lat, candidate.lng
      );

      if (distance <= DUPLICATE_COORDINATE_THRESHOLD_METERS) {
        const sameOwner = candidate.agentId === property.agentId;

        conflicts.push({
          type: 'duplicate_coordinates',
          severity: sameOwner ? 'high' : 'critical',
          message: sameOwner
            ? 'Coordonnées en double (même agent)'
            : 'Coordonnées identiques à un autre bien',
          detail: `Distance: ${Math.round(distance * 10) / 10}m — "${candidate.title}"`,
          conflictingPropertyId: candidate.id,
          conflictingPropertyTitle: candidate.title,
          conflictingAgentId: candidate.agentId,
          distanceMeters: Math.round(distance * 10) / 10,
        });
      }
    }
  } catch {
    // DB error — skip
  }

  return conflicts;
}

/**
 * Check 4: Area discrepancy
 * Compares declared surface against measured surface from geometry data
 */
async function detectAreaDiscrepancy(property: PropertyWithBoundary): Promise<ConflictDetail[]> {
  const conflicts: ConflictDetail[] = [];

  if (!property.propertyId) return conflicts;

  try {
    const geometry = await db.propertyGeometry.findUnique({
      where: { propertyId: property.propertyId },
    });

    if (!geometry || !geometry.areaSqmMeasured) return conflicts;

    const declared = geometry.areaSqmDeclared || property.surface;
    if (declared <= 0) return conflicts;

    const discrepancy = Math.abs(geometry.areaSqmMeasured - declared) / declared * 100;

    if (discrepancy > AREA_DISCREPANCY_THRESHOLD_PCT) {
      conflicts.push({
        type: 'area_discrepancy',
        severity: discrepancy > 30 ? 'critical' : discrepancy > 20 ? 'high' : 'medium',
        message: `Écart de surface significatif (${Math.round(discrepancy)}%)`,
        detail: `Surface déclarée: ${declared}m², mesurée: ${geometry.areaSqmMeasured}m²`,
        conflictingPropertyId: property.propertyId,
        conflictingPropertyTitle: property.title,
        conflictingAgentId: property.agentId,
        overlapArea: Math.abs(geometry.areaSqmMeasured - declared),
      });
    }
  } catch {
    // DB error — skip
  }

  return conflicts;
}

// ============ Helpers ============

function determineRiskLevel(conflicts: ConflictDetail[]): ConflictRiskLevel {
  if (conflicts.some(c => c.severity === 'critical')) return 'critical';
  if (conflicts.some(c => c.severity === 'high')) return 'high';
  if (conflicts.some(c => c.severity === 'medium')) return 'medium';
  if (conflicts.length > 0) return 'low';
  return 'low';
}

async function countNearbyProperties(property: PropertyWithBoundary): Promise<number> {
  try {
    return await db.property.count({
      where: {
        status: { in: ['published', 'pending', 'draft'] },
        country: property.country,
        city: property.city,
        quartier: property.quartier,
      },
    });
  } catch {
    return 0;
  }
}

function generateConflictRecommendation(
  riskLevel: ConflictRiskLevel,
  conflicts: ConflictDetail[]
): string {
  if (riskLevel === 'critical') {
    const criticals = conflicts.filter(c => c.severity === 'critical');
    return `CONFLIT CRITIQUE — ${criticals.length} conflit(s) critique(s) détecté(s). ` +
      `Publication bloquée. Résolution requise avant publication. ` +
      `Types: ${[...new Set(criticals.map(c => c.type))].join(', ')}.`;
  }

  if (riskLevel === 'high') {
    const highs = conflicts.filter(c => c.severity === 'high');
    return `CONFLIT ÉLEVÉ — ${highs.length} conflit(s) important(s). ` +
      `Validation manuelle requise avant publication. ` +
      `Types: ${[...new Set(highs.map(c => c.type))].join(', ')}.`;
  }

  if (riskLevel === 'medium') {
    return `CONFLIT MODÉRÉ — ${conflicts.length} conflit(s) détecté(s). ` +
      `Publication possible avec avertissement. Surveillance recommandée.`;
  }

  if (conflicts.length > 0) {
    return `CONFLIT MINEUR — ${conflicts.length} conflit(s) mineur(s). Publication autorisée.`;
  }

  return 'AUCUN CONFLIT — Aucun conflit de limite détecté. Publication autorisée.';
}

/**
 * Haversine distance in meters
 */
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Levenshtein distance for fuzzy address matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
