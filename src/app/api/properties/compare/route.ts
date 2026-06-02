import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/properties/compare
// Accept array of property IDs (max 5), return properties side by side
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 5) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner entre 2 et 5 propriétés à comparer' },
        { status: 400 }
      );
    }

    const properties = await db.property.findMany({
      where: {
        id: { in: ids },
        status: 'published',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true,
            professionalProfile: {
              select: {
                agencyName: true,
              },
            },
          },
        },
      },
    });

    if (properties.length < 2) {
      return NextResponse.json(
        { error: 'Pas assez de propriétés publiées trouvées pour la comparaison' },
        { status: 404 }
      );
    }

    // Shape response
    const shaped = properties.map(p => {
      let images: string[] = [];
      try { images = p.images ? JSON.parse(p.images) : []; } catch { images = []; }
      let features: string[] = [];
      try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }

      return {
        id: p.id,
        title: p.title,
        type: p.type,
        transaction: p.transaction,
        price: p.price,
        currency: p.currency,
        surface: p.surface,
        pricePerSqm: Math.round(p.price / p.surface),
        rooms: p.rooms,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        city: p.city,
        country: p.country,
        quartier: p.quartier,
        description: p.description,
        images,
        features,
        lat: p.lat,
        lng: p.lng,
        verified: p.verified,
        geoTrust: p.geoTrust,
        geoTrustLevel: p.geoTrustLevel,
        premium: p.premium,
        investmentScore: p.investmentScore,
        walkScore: p.walkScore,
        views: p.views,
        favorites: p.favorites,
        hasVR: p.hasVR,
        hasDroneView: p.hasDroneView,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
        agent: p.owner
          ? {
              id: p.owner.id,
              name: p.owner.name,
              avatar: p.owner.avatar,
              company: p.owner.professionalProfile?.agencyName,
              certified: p.owner.verified,
            }
          : undefined,
      };
    });

    // Find best values for highlighting
    const bestValues = {
      lowestPrice: Math.min(...shaped.map(p => p.price)),
      highestScore: Math.max(...shaped.map(p => p.investmentScore || 0)),
      largestSurface: Math.max(...shaped.map(p => p.surface)),
      bestPricePerSqm: Math.min(...shaped.map(p => p.pricePerSqm)),
    };

    return NextResponse.json({
      properties: shaped,
      bestValues,
    });
  } catch (error) {
    console.error('Compare properties error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
