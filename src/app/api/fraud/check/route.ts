// AfriBayit — Fraud Check Endpoint
// POST /api/fraud/check — Check a listing for fraud indicators

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { detectFraud, type FraudCheckInput, type FraudResult } from '@/lib/security/fraud-detector';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, listing } = body as {
      propertyId?: string;
      listing?: Partial<FraudCheckInput>;
    };

    let fraudInput: FraudCheckInput;

    if (propertyId) {
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

      fraudInput = {
        propertyId: dbProperty.id,
        title: dbProperty.title,
        type: dbProperty.type,
        transaction: dbProperty.transaction,
        price: dbProperty.price,
        surface: dbProperty.surface,
        city: dbProperty.city,
        country: dbProperty.country,
        quartier: dbProperty.quartier,
        address: dbProperty.address ?? undefined,
        lat: dbProperty.lat,
        lng: dbProperty.lng,
        images: dbProperty.propertyImages.map(img => img.url),
        agentId: dbProperty.agentId,
        description: dbProperty.description,
        bedrooms: dbProperty.bedrooms,
        bathrooms: dbProperty.bathrooms,
      };
    } else if (listing) {
      // Validate required fields
      if (!listing.type || !listing.city || !listing.country || !listing.agentId) {
        return NextResponse.json(
          { error: 'Données incomplètes: type, city, country et agentId sont requis' },
          { status: 400 }
        );
      }

      fraudInput = {
        propertyId: listing.propertyId,
        title: listing.title || '',
        type: listing.type,
        transaction: listing.transaction || 'achat',
        price: listing.price || 0,
        surface: listing.surface || 0,
        city: listing.city,
        country: listing.country,
        quartier: listing.quartier || '',
        address: listing.address,
        lat: listing.lat,
        lng: listing.lng,
        images: listing.images || [],
        agentId: listing.agentId,
        description: listing.description || '',
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
      };
    } else {
      return NextResponse.json(
        { error: 'propertyId ou listing est requis' },
        { status: 400 }
      );
    }

    // Run fraud detection
    const result: FraudResult = await detectFraud(fraudInput);

    // Format response
    return NextResponse.json({
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      requiresManualReview: result.requiresManualReview,
      flags: result.flags.map(f => ({
        type: f.type,
        severity: f.severity,
        message: f.message,
        detail: f.detail,
        score: f.score,
      })),
      recommendation: result.recommendation,
      summary: {
        totalFlags: result.flags.length,
        criticalFlags: result.flags.filter(f => f.severity === 'critical').length,
        dangerFlags: result.flags.filter(f => f.severity === 'danger').length,
        warningFlags: result.flags.filter(f => f.severity === 'warning').length,
        infoFlags: result.flags.filter(f => f.severity === 'info').length,
      },
    });
  } catch (error) {
    console.error('Fraud check API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de fraude' },
      { status: 500 }
    );
  }
}
