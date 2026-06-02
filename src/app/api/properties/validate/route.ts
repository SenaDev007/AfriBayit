// AfriBayit — Property Validation Endpoint
// POST /api/properties/validate — Validate a property before publication
//
// Runs both fraud detection and GeoTrust conflict detection.
// If high-risk, auto-rejects with explanation.
// Returns validation result with recommendations.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectFraud, type FraudResult } from '@/lib/security/fraud-detector';
import { detectBoundaryConflicts, type ConflictResult, type PropertyWithBoundary } from '@/lib/geotrust/conflict-detector';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId } = body as { propertyId?: string };

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId est requis' },
        { status: 400 }
      );
    }

    // Fetch property from database
    const dbProperty = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        propertyImages: { select: { url: true } },
      },
    });

    if (!dbProperty) {
      return NextResponse.json(
        { error: 'Bien non trouvé' },
        { status: 404 }
      );
    }

    // Prepare inputs for detection
    const fraudInput = {
      propertyId: dbProperty.id,
      title: dbProperty.title,
      type: dbProperty.type,
      transaction: dbProperty.transaction,
      price: dbProperty.price,
      surface: dbProperty.surface,
      city: dbProperty.city,
      country: dbProperty.country,
      quartier: dbProperty.quartier,
      address: dbProperty.address,
      lat: dbProperty.lat,
      lng: dbProperty.lng,
      images: dbProperty.propertyImages.map(img => img.url),
      agentId: dbProperty.agentId,
      description: dbProperty.description,
      bedrooms: dbProperty.bedrooms,
      bathrooms: dbProperty.bathrooms,
    };

    const conflictInput: PropertyWithBoundary = {
      propertyId: dbProperty.id,
      title: dbProperty.title,
      type: dbProperty.type,
      price: dbProperty.price,
      surface: dbProperty.surface,
      city: dbProperty.city,
      country: dbProperty.country,
      quartier: dbProperty.quartier,
      address: dbProperty.address,
      lat: dbProperty.lat,
      lng: dbProperty.lng,
      agentId: dbProperty.agentId,
      geoTrustLevel: dbProperty.geoTrustLevel,
    };

    // Run both detections in parallel
    const [fraudResult, conflictResult] = await Promise.all([
      detectFraud(fraudInput),
      detectBoundaryConflicts(conflictInput),
    ]);

    // Determine overall validation status
    const validation = determineValidationStatus(fraudResult, conflictResult);

    // If auto-reject, update property status
    if (validation.status === 'rejected') {
      try {
        await db.property.update({
          where: { id: propertyId },
          data: {
            status: 'rejected',
            rejectionReason: validation.reason,
          },
        });

        // Create conflict zone records for boundary conflicts
        for (const conflict of conflictResult.conflicts) {
          if (conflict.type === 'overlapping_boundary' || conflict.type === 'duplicate_coordinates') {
            await db.conflictZone.create({
              data: {
                propertyIdA: propertyId,
                propertyIdB: conflict.conflictingPropertyId,
                areaSqmOverlap: conflict.overlapArea || 0,
                status: 'detected',
              },
            }).catch(() => {}); // Ignore if already exists
          }
        }
      } catch (updateError) {
        console.error('Failed to update property status:', updateError);
      }
    } else if (validation.status === 'pending_validation') {
      // Set to pending_validation for manual review
      try {
        await db.property.update({
          where: { id: propertyId },
          data: {
            status: 'pending_validation',
          },
        });
      } catch (updateError) {
        console.error('Failed to update property status:', updateError);
      }
    }

    return NextResponse.json({
      propertyId,
      validation: {
        status: validation.status,
        reason: validation.reason,
        canPublish: validation.canPublish,
      },
      fraud: {
        riskScore: fraudResult.riskScore,
        riskLevel: fraudResult.riskLevel,
        requiresManualReview: fraudResult.requiresManualReview,
        flags: fraudResult.flags.map(f => ({
          type: f.type,
          severity: f.severity,
          message: f.message,
          detail: f.detail,
        })),
        recommendation: fraudResult.recommendation,
      },
      conflicts: {
        hasConflicts: conflictResult.hasConflicts,
        riskLevel: conflictResult.riskLevel,
        checkedProperties: conflictResult.checkedProperties,
        conflicts: conflictResult.conflicts.map(c => ({
          type: c.type,
          severity: c.severity,
          message: c.message,
          detail: c.detail,
          conflictingPropertyId: c.conflictingPropertyId,
          conflictingPropertyTitle: c.conflictingPropertyTitle,
          distanceMeters: c.distanceMeters,
        })),
        recommendation: conflictResult.recommendation,
      },
    });
  } catch (error) {
    console.error('Property validation API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation du bien' },
      { status: 500 }
    );
  }
}

// ============ Helpers ============

type ValidationStatus = 'approved' | 'pending_validation' | 'rejected';

interface ValidationResult {
  status: ValidationStatus;
  reason: string;
  canPublish: boolean;
}

function determineValidationStatus(
  fraud: FraudResult,
  conflict: ConflictResult
): ValidationResult {
  // Critical fraud → auto-reject
  if (fraud.riskLevel === 'critical') {
    return {
      status: 'rejected',
      reason: `Risque de fraude critique (score: ${fraud.riskScore}/100). ${fraud.flags.filter(f => f.severity === 'critical').map(f => f.message).join('; ')}`,
      canPublish: false,
    };
  }

  // Critical boundary conflict → auto-reject
  if (conflict.riskLevel === 'critical') {
    return {
      status: 'rejected',
      reason: `Conflit de limite critique détecté. ${conflict.conflicts.filter(c => c.severity === 'critical').map(c => c.message).join('; ')}`,
      canPublish: false,
    };
  }

  // High fraud risk or high conflict → pending validation
  if (fraud.riskLevel === 'high' || conflict.riskLevel === 'high') {
    return {
      status: 'pending_validation',
      reason: `Validation manuelle requise. Fraude: ${fraud.riskLevel}, Conflits: ${conflict.riskLevel}`,
      canPublish: false,
    };
  }

  // Medium risk → pending validation with note
  if (fraud.riskLevel === 'medium' || conflict.riskLevel === 'medium') {
    return {
      status: 'pending_validation',
      reason: `Risques modérés détectés — révision recommandée. Fraude: ${fraud.riskLevel}, Conflits: ${conflict.riskLevel}`,
      canPublish: false,
    };
  }

  // Low or no risk → approved
  return {
    status: 'approved',
    reason: 'Aucun risque significatif détecté. Publication autorisée.',
    canPublish: true,
  };
}
