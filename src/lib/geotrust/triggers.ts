/**
 * AfriBayit — Mandatory Inspection Triggers
 * Determines if a property requires mandatory GeoTrust inspection
 * + Auto Conflict Detection for property fraud prevention
 */

import { db } from '@/lib/db';

export interface InspectionTriggerResult {
  required: boolean;
  reason: string;
  severity: 'mandatory' | 'recommended' | 'optional';
  triggers: {
    condition: string;
    met: boolean;
    severity: 'mandatory' | 'recommended' | 'optional';
  }[];
}

// ============ Auto Conflict Detection ============

export interface ConflictAlert {
  type: 'duplicate_listing' | 'duplicate_deed' | 'price_anomaly' | 'boundary_overlap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  propertyIds: string[];
  description: string;
  autoAction: 'flag' | 'suspend' | 'notify_admin';
}

interface PropertyConflictData {
  id: string;
  title: string;
  type: string;
  price: number;
  lat: number | null;
  lng: number | null;
  address: string | null;
  agentId: string;
  country: string;
  city: string;
  surface: number;
}

/**
 * Calculate Haversine distance between two coordinate pairs in meters.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Detect potential property conflicts automatically.
 * Checks for:
 * 1. Duplicate listings (same coordinates within 50m)
 * 2. Duplicate title deed numbers (via PropertyLegalDoc)
 * 3. Price anomalies (>50% below market average for same area)
 * 4. Boundary overlaps using spatial queries (PropertyGeometry)
 */
export async function detectPropertyConflicts(propertyId: string): Promise<ConflictAlert[]> {
  const alerts: ConflictAlert[] = [];

  // Fetch the property in question
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      title: true,
      type: true,
      price: true,
      lat: true,
      lng: true,
      address: true,
      agentId: true,
      country: true,
      city: true,
      surface: true,
    },
  });

  if (!property) return alerts;

  // ── 1. Check for duplicate listings (same coordinates within 50m) ──
  if (property.lat !== null && property.lng !== null) {
    const nearbyProperties = await db.property.findMany({
      where: {
        id: { not: propertyId },
        status: { in: ['published', 'pending', 'human_review'] },
        type: property.type,
        lat: { not: null },
        lng: { not: null },
      },
      select: {
        id: true,
        title: true,
        type: true,
        price: true,
        lat: true,
        lng: true,
        address: true,
        agentId: true,
        country: true,
        city: true,
        surface: true,
      },
    });

    const duplicates: PropertyConflictData[] = [];
    for (const candidate of nearbyProperties) {
      if (candidate.lat !== null && candidate.lng !== null) {
        const distance = haversineDistance(property.lat, property.lng, candidate.lat, candidate.lng);
        if (distance <= 50) {
          duplicates.push(candidate);
        }
      }
    }

    if (duplicates.length > 0) {
      const sameAgent = duplicates.some(d => d.agentId === property.agentId);
      alerts.push({
        type: 'duplicate_listing',
        severity: sameAgent ? 'high' : 'critical',
        propertyIds: [propertyId, ...duplicates.map(d => d.id)],
        description: sameAgent
          ? `Doublon détecté : le même agent a ${duplicates.length} bien(s) à moins de 50m avec des coordonnées similaires.`
          : `Doublon possible : ${duplicates.length} bien(s) d'agents différents à moins de 50m — risque de conflit foncier.`,
        autoAction: sameAgent ? 'suspend' : 'notify_admin',
      });
    }
  }

  // ── 2. Check for duplicate title deed numbers ──
  const propertyDeeds = await db.propertyLegalDoc.findMany({
    where: {
      propertyId,
      docType: { in: ['titre_foncier', 'acd', 'acte_cession', 'certificat_propriete_andf'] },
    },
    select: { id: true, docType: true, ocrResult: true },
  });

  for (const deed of propertyDeeds) {
    if (!deed.ocrResult) continue;
    try {
      const ocrData = JSON.parse(deed.ocrResult) as Record<string, unknown>;
      const deedNumber = ocrData.numero_titre || ocrData.numero_acd || ocrData.reference;
      if (typeof deedNumber === 'string' && deedNumber.trim()) {
        // Search for other properties with the same deed number in their OCR results
        const matchingDeeds = await db.propertyLegalDoc.findMany({
          where: {
            id: { not: deed.id },
            docType: deed.docType,
            ocrResult: { contains: deedNumber.trim() },
          },
          select: { propertyId: true },
        });

        if (matchingDeeds.length > 0) {
          const otherPropertyIds = [...new Set(matchingDeeds.map(d => d.propertyId))];
          alerts.push({
            type: 'duplicate_deed',
            severity: 'critical',
            propertyIds: [propertyId, ...otherPropertyIds],
            description: `Numéro de titre foncier en doublon détecté (${deedNumber}). ${otherPropertyIds.length + 1} propriété(s) partagent le même numéro — fraude possible.`,
            autoAction: 'suspend',
          });
        }
      }
    } catch {
      // OCR data is not valid JSON, skip
    }
  }

  // ── 3. Check for price anomalies (>50% below market average) ──
  const sameAreaProperties = await db.property.findMany({
    where: {
      id: { not: propertyId },
      type: property.type,
      city: property.city,
      country: property.country,
      status: 'published',
      surface: { gte: property.surface * 0.5, lte: property.surface * 2 },
    },
    select: { price: true, surface: true },
    take: 20,
  });

  if (sameAreaProperties.length >= 3) {
    const avgPricePerSqm =
      sameAreaProperties.reduce((sum, p) => sum + p.price / Math.max(p.surface, 1), 0) /
      sameAreaProperties.length;
    const propertyPricePerSqm = property.price / Math.max(property.surface, 1);

    if (avgPricePerSqm > 0 && propertyPricePerSqm < avgPricePerSqm * 0.5) {
      alerts.push({
        type: 'price_anomaly',
        severity: 'high',
        propertyIds: [propertyId],
        description: `Anomalie de prix détectée : ${Math.round(propertyPricePerSqm).toLocaleString('fr-FR')} FCFA/m² vs moyenne du marché ${Math.round(avgPricePerSqm).toLocaleString('fr-FR')} FCFA/m² (-${Math.round((1 - propertyPricePerSqm / avgPricePerSqm) * 100)}%). Risque de fraude.`,
        autoAction: 'flag',
      });
    }
  }

  // ── 4. Check for boundary overlaps using spatial queries ──
  const propertyGeometry = await db.propertyGeometry.findUnique({
    where: { propertyId },
    select: { boundaryPolygon: true, id: true },
  });

  if (propertyGeometry?.boundaryPolygon) {
    // Find other geometries in the same city that might overlap
    const otherGeometries = await db.propertyGeometry.findMany({
      where: {
        propertyId: { not: propertyId },
      },
      select: {
        propertyId: true,
        boundaryPolygon: true,
      },
    });

    // Simple bounding box overlap check (production would use PostGIS)
    const propBbox = extractBbox(propertyGeometry.boundaryPolygon);
    if (propBbox) {
      for (const other of otherGeometries) {
        if (!other.boundaryPolygon) continue;
        const otherBbox = extractBbox(other.boundaryPolygon);
        if (!otherBbox) continue;

        // Check bounding box intersection
        if (
          propBbox.minLat <= otherBbox.maxLat &&
          propBbox.maxLat >= otherBbox.minLat &&
          propBbox.minLng <= otherBbox.maxLng &&
          propBbox.maxLng >= otherBbox.minLng
        ) {
          // Potential overlap — record it
          const existingConflict = await db.conflictZone.findFirst({
            where: {
              OR: [
                { propertyIdA: propertyId, propertyIdB: other.propertyId },
                { propertyIdA: other.propertyId, propertyIdB: propertyId },
              ],
              status: { in: ['detected', 'investigating'] },
            },
          });

          if (!existingConflict) {
            const overlapAreaSqm = estimateOverlapArea(propBbox, otherBbox);
            await db.conflictZone.create({
              data: {
                propertyIdA: propertyId,
                propertyIdB: other.propertyId,
                overlapPolygon: propertyGeometry.boundaryPolygon,
                areaSqmOverlap: overlapAreaSqm,
                status: 'detected',
              },
            });

            alerts.push({
              type: 'boundary_overlap',
              severity: 'high',
              propertyIds: [propertyId, other.propertyId],
              description: `Chevauchement de limites détecté entre les propriétés ${propertyId} et ${other.propertyId}. Superficie estimée en conflit : ${Math.round(overlapAreaSqm)} m².`,
              autoAction: 'notify_admin',
            });
          }
        }
      }
    }
  }

  // ── Execute auto-actions ──
  for (const alert of alerts) {
    if (alert.autoAction === 'suspend') {
      // Suspend the property pending review
      await db.property.update({
        where: { id: propertyId },
        data: {
          status: 'human_review',
          rejectionReason: `Suspendu automatiquement : ${alert.description}`,
        },
      });
    }

    // Always create admin notification for high/critical alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      const admins = await db.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
        take: 5,
      });

      await Promise.all(
        admins.map(admin =>
          db.notification.create({
            data: {
              userId: admin.id,
              type: 'alert',
              category: 'transactions',
              title: `GeoTrust Alerte — ${alert.type.replace(/_/g, ' ')}`,
              message: alert.description,
              actionUrl: `/admin/properties`,
              channels: JSON.stringify(['push', 'email']),
              metadata: JSON.stringify({
                alertType: alert.type,
                severity: alert.severity,
                propertyIds: alert.propertyIds,
                autoAction: alert.autoAction,
                source: 'geotrust_conflict_detection',
              }),
            },
          })
        )
      );
    }
  }

  return alerts;
}

/**
 * Extract a bounding box from a GeoJSON polygon string.
 * Returns { minLat, maxLat, minLng, maxLng } or null if parsing fails.
 */
function extractBbox(
  geojsonStr: string
): { minLat: number; maxLat: number; minLng: number; maxLng: number } | null {
  try {
    const geojson = JSON.parse(geojsonStr) as {
      type: string;
      coordinates: number[][][] | number[][][][];
    };
    let coords: number[][] = [];

    if (geojson.type === 'Polygon' && Array.isArray(geojson.coordinates)) {
      coords = geojson.coordinates[0] as number[][];
    } else if (geojson.type === 'MultiPolygon' && Array.isArray(geojson.coordinates)) {
      for (const polygon of geojson.coordinates) {
        coords = coords.concat(polygon[0] as number[][]);
      }
    }

    if (coords.length === 0) return null;

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);

    return {
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  } catch {
    return null;
  }
}

/**
 * Estimate overlap area between two bounding boxes in square meters.
 * Uses a rough approximation based on coordinate differences.
 */
function estimateOverlapArea(
  a: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  b: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): number {
  const overlapLat = Math.max(0, Math.min(a.maxLat, b.maxLat) - Math.max(a.minLat, b.minLat));
  const overlapLng = Math.max(0, Math.min(a.maxLng, b.maxLng) - Math.max(a.minLng, b.minLng));

  // Convert degrees to approximate meters at equator
  const metersPerDegLat = 111_320;
  const centerLat = (a.minLat + a.maxLat + b.minLat + b.maxLat) / 4;
  const metersPerDegLng = 111_320 * Math.cos((centerLat * Math.PI) / 180);

  return overlapLat * metersPerDegLat * overlapLng * metersPerDegLng;
}

/**
 * Check if a property requires mandatory inspection
 */
export function requiresMandatoryInspection(property: {
  type: string;
  price: number;
  country: string;
  geoTrustRequested?: boolean;
  isBareLand?: boolean;
}): InspectionTriggerResult {
  const triggers: InspectionTriggerResult['triggers'] = [];

  // Terrain > 10M XOF → mandatory
  if (property.type === 'terrain' && property.price > 10000000) {
    triggers.push({
      condition: `Terrain à ${new Intl.NumberFormat('fr-FR').format(property.price)} XOF — supérieur à 10M XOF`,
      met: true,
      severity: 'mandatory',
    });
  }

  // Terrain nu (bare land) → mandatory
  if (property.isBareLand || (property.type === 'terrain' && !property.isBareLand)) {
    triggers.push({
      condition: 'Terrain nu — inspection cadastrale obligatoire',
      met: true,
      severity: 'mandatory',
    });
  }

  // Property > 50M XOF → recommended
  if (property.price > 50000000) {
    triggers.push({
      condition: `Bien à ${new Intl.NumberFormat('fr-FR').format(property.price)} XOF — supérieur à 50M XOF`,
      met: true,
      severity: 'recommended',
    });
  }

  // GeoTrust certification requested → mandatory
  if (property.geoTrustRequested) {
    triggers.push({
      condition: 'Certification GeoTrust demandée — inspection obligatoire',
      met: true,
      severity: 'mandatory',
    });
  }

  // Country-specific triggers
  if (property.country === 'BJ') {
    // Bénin: TF verification mandatory per 2023 reform
    triggers.push({
      condition: 'Bénin — Vérification TF obligatoire (réforme 2023)',
      met: true,
      severity: 'mandatory',
    });
  }

  if (property.country === 'BF') {
    // BF: RAF 2025 requires PUH/APFR verification for terrain
    if (property.type === 'terrain') {
      triggers.push({
        condition: 'Burkina Faso — Vérification PUH/APFR (RAF 2025)',
        met: true,
        severity: 'mandatory',
      });
    }
  }

  if (property.country === 'TG') {
    // TG: DCCF 2025 mandatory registration verification
    triggers.push({
      condition: 'Togo — Vérification enregistrement CFD/DCCF 2025',
      met: true,
      severity: 'mandatory',
    });
  }

  const hasMandatory = triggers.some(t => t.severity === 'mandatory');
  const hasRecommended = triggers.some(t => t.severity === 'recommended');

  let reason = '';
  if (hasMandatory) {
    const mandatoryTriggers = triggers.filter(t => t.severity === 'mandatory');
    reason = `Inspection obligatoire : ${mandatoryTriggers.map(t => t.condition).join('; ')}`;
  } else if (hasRecommended) {
    reason = 'Inspection recommandée pour les biens de haute valeur';
  } else {
    reason = 'Aucune inspection obligatoire détectée';
  }

  return {
    required: hasMandatory,
    reason,
    severity: hasMandatory ? 'mandatory' : hasRecommended ? 'recommended' : 'optional',
    triggers,
  };
}
