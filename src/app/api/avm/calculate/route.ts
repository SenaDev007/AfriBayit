// AfriBayit — AVM Calculate Endpoint
// POST /api/avm/calculate — Get AVM weighted score for a property

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateAVM, type AVMInput, type AVMScore } from '@/lib/avm/scorer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, property } = body as {
      propertyId?: string;
      property?: Partial<AVMInput>;
    };

    let avmInput: AVMInput;

    if (propertyId) {
      // Fetch property from database
      const dbProperty = await db.property.findUnique({
        where: { id: propertyId },
      });

      if (!dbProperty) {
        return NextResponse.json(
          { error: 'Bien non trouvé' },
          { status: 404 }
        );
      }

      const features = (() => {
        try { return dbProperty.features ? JSON.parse(dbProperty.features) : []; } catch { return []; }
      })();

      avmInput = {
        propertyId: dbProperty.id,
        type: dbProperty.type,
        transaction: dbProperty.transaction,
        price: dbProperty.price,
        surface: dbProperty.surface,
        rooms: dbProperty.rooms,
        bedrooms: dbProperty.bedrooms,
        bathrooms: dbProperty.bathrooms,
        city: dbProperty.city,
        country: dbProperty.country,
        quartier: dbProperty.quartier,
        lat: dbProperty.lat,
        lng: dbProperty.lng,
        verified: dbProperty.verified,
        geoTrust: dbProperty.geoTrust,
        views: dbProperty.views,
        favorites: dbProperty.favorites,
        features: Array.isArray(features) ? features : [],
      };
    } else if (property) {
      // Validate required fields
      if (!property.type || !property.city || !property.country || !property.surface) {
        return NextResponse.json(
          { error: 'Propriété incomplète: type, city, country et surface sont requis' },
          { status: 400 }
        );
      }

      avmInput = {
        propertyId: property.propertyId,
        type: property.type,
        transaction: property.transaction || 'achat',
        price: property.price || 0,
        surface: property.surface,
        rooms: property.rooms || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        city: property.city,
        country: property.country,
        quartier: property.quartier || '',
        lat: property.lat || null,
        lng: property.lng || null,
        verified: property.verified || false,
        geoTrust: property.geoTrust || false,
        views: property.views || 0,
        favorites: property.favorites || 0,
        features: property.features || [],
      };
    } else {
      return NextResponse.json(
        { error: 'propertyId ou property est requis' },
        { status: 400 }
      );
    }

    // Run the AVM calculation
    const result: AVMScore = await calculateAVM(avmInput);

    // Format response
    return NextResponse.json({
      property: {
        id: avmInput.propertyId,
        type: avmInput.type,
        city: avmInput.city,
        country: avmInput.country,
        quartier: avmInput.quartier,
        surface: avmInput.surface,
      },
      avm: {
        estimatedValue: result.estimatedValue,
        estimatedValueFormatted: `${new Intl.NumberFormat('fr-FR').format(result.estimatedValue)} FCFA`,
        confidenceScore: result.confidenceScore,
        confidenceLevel: result.confidenceScore >= 70 ? 'Élevé' :
          result.confidenceScore >= 40 ? 'Moyen' : 'Faible',
        pricePerSqm: result.pricePerSqm,
        pricePerSqmFormatted: `${new Intl.NumberFormat('fr-FR').format(result.pricePerSqm)} FCFA/m²`,
        comparableCount: result.comparableCount,
        marketTrend: result.marketTrend,
        trendPercentage: result.trendPercentage,
        range: result.range,
        rangeFormatted: {
          low: `${new Intl.NumberFormat('fr-FR').format(result.range.low)} FCFA`,
          high: `${new Intl.NumberFormat('fr-FR').format(result.range.high)} FCFA`,
        },
      },
      factors: result.factors.map(f => ({
        name: f.name,
        weight: `${f.weight}%`,
        score: f.score,
        contribution: f.contribution,
        detail: f.detail,
      })),
    });
  } catch (error) {
    console.error('AVM calculate API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du calcul AVM' },
      { status: 500 }
    );
  }
}
