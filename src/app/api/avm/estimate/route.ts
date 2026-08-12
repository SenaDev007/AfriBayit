// AfriBayit — AVM Estimate Endpoint
// POST /api/avm/estimate — Get property valuation

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runValuation, type PropertyData } from '@/lib/avm';
import { cache, buildCacheKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, property } = body as {
      propertyId?: string;
      property?: Partial<PropertyData>;
    };

    let propertyData: PropertyData;

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

      propertyData = {
        id: dbProperty.id,
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
        features: Array.isArray(features) ? features : [],
        lat: dbProperty.lat,
        lng: dbProperty.lng,
        createdAt: dbProperty.createdAt,
        verified: dbProperty.verified,
        geoTrust: dbProperty.geoTrust,
      };
    } else if (property) {
      // Use provided property data
      if (!property.type || !property.city || !property.country || !property.surface) {
        return NextResponse.json(
          { error: 'Propriété incomplète: type, city, country et surface sont requis' },
          { status: 400 }
        );
      }

      propertyData = {
        id: property.id || 'manual',
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
        features: property.features || [],
        lat: property.lat || null,
        lng: property.lng || null,
        createdAt: property.createdAt || new Date(),
        verified: property.verified || false,
        geoTrust: property.geoTrust || false,
      };
    } else {
      return NextResponse.json(
        { error: 'propertyId ou property est requis' },
        { status: 400 }
      );
    }

    // Run the full valuation
    // Try cache first (15 min TTL for AVM estimates)
    const cacheKey = buildCacheKey(
      'avm',
      `estimate:${propertyData.id}:${propertyData.type}:${propertyData.city}:${propertyData.country}:${propertyData.surface}`,
      propertyData.country || undefined
    );

    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const report = await runValuation(propertyData);

    // Format the response
    const formattedValue = new Intl.NumberFormat('fr-FR').format(report.valuation.estimatedValue);
    const formattedRange = {
      low: new Intl.NumberFormat('fr-FR').format(report.valuation.range.low),
      high: new Intl.NumberFormat('fr-FR').format(report.valuation.range.high),
    };
    const formattedPricePerM2 = new Intl.NumberFormat('fr-FR').format(report.valuation.pricePerM2);

    const responseData = {
      property: {
        id: propertyData.id,
        type: propertyData.type,
        city: propertyData.city,
        country: propertyData.country,
        quartier: propertyData.quartier,
        surface: propertyData.surface,
      },
      valuation: {
        estimatedValue: report.valuation.estimatedValue,
        estimatedValueFormatted: `${formattedValue} FCFA`,
        confidenceScore: report.valuation.confidenceScore,
        confidenceLevel: report.valuation.confidenceScore >= 70 ? 'Élevé' :
          report.valuation.confidenceScore >= 40 ? 'Moyen' : 'Faible',
        range: report.valuation.range,
        rangeFormatted: formattedRange,
        pricePerM2: report.valuation.pricePerM2,
        pricePerM2Formatted: `${formattedPricePerM2} FCFA/m²`,
        comparablesUsed: report.valuation.comparablesUsed,
        adjustments: report.valuation.adjustments,
        marketTrend: report.valuation.marketTrend,
        trendPercentage: report.valuation.trendPercentage,
        methodology: report.valuation.methodology,
      },
      comparables: report.comparables,
      marketStats: report.marketStats ? {
        totalListings: report.marketStats.totalListings,
        averagePrice: report.marketStats.averagePrice,
        pricePerM2: report.marketStats.pricePerM2,
        trend: report.marketStats.trend,
        trendPercentage: report.marketStats.trendPercentage,
      } : null,
      aiInsight: report.aiInsight || null,
    };

    // Cache AVM estimates for 15 minutes
    await cache.set(cacheKey, responseData, 900);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('AVM estimate API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'estimation de la valeur du bien' },
      { status: 500 }
    );
  }
}
