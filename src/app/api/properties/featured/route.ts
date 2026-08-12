import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, buildCacheKey } from '@/lib/cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 12);

    const cacheKey = buildCacheKey(
      'properties',
      `featured:${country || 'all'}:${limit}`,
      country || undefined
    );

    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch featured properties: premium + verified, with images, diverse types
    const properties = await db.property.findMany({
      where: {
        status: 'published',
        ...(country ? { country } : {}),
        images: { not: null },
      },
      orderBy: [
        { premium: 'desc' },
        { verified: 'desc' },
        { views: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        transaction: true,
        price: true,
        currency: true,
        city: true,
        country: true,
        quartier: true,
        images: true,
        verified: true,
        premium: true,
        bedrooms: true,
        surface: true,
      },
    });

    // Parse images and format for hero display
    const formatted = properties.map((p) => {
      let images: string[] = [];
      try {
        images = p.images ? JSON.parse(p.images) : [];
      } catch {
        images = [];
      }

      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        type: p.type,
        transaction: p.transaction,
        price: p.price,
        currency: p.currency,
        city: p.city,
        country: p.country,
        quartier: p.quartier,
        image: images[0] || null,
        verified: p.verified,
        premium: p.premium,
        bedrooms: p.bedrooms,
        surface: p.surface,
      };
    });

    // Only return properties that have at least one image
    const withImages = formatted.filter((p) => p.image);

    // If no properties with images, return fallback placeholder data
    if (withImages.length === 0) {
      const fallback = [
        {
          id: 'fallback-1',
          title: 'Villa Cocotiers',
          slug: 'villa-cocotiers',
          type: 'villa',
          transaction: 'achat',
          price: 85000000,
          currency: 'FCFA',
          city: 'Cotonou',
          country: 'BJ',
          quartier: 'Ganhi',
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&h=200&fit=crop',
          verified: true,
          premium: true,
          bedrooms: 5,
          surface: 350,
        },
        {
          id: 'fallback-2',
          title: 'Appart. Plateau',
          slug: 'appart-plateau',
          type: 'appartement',
          transaction: 'location',
          price: 350000,
          currency: 'FCFA',
          city: 'Abidjan',
          country: 'CI',
          quartier: 'Plateau',
          image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop',
          verified: true,
          premium: false,
          bedrooms: 2,
          surface: 85,
        },
        {
          id: 'fallback-3',
          title: 'Hotel du Lac',
          slug: 'hotel-du-lac',
          type: 'guesthouse',
          transaction: 'location_courte_duree',
          price: 45000,
          currency: 'FCFA',
          city: 'Cotonou',
          country: 'BJ',
          quartier: 'Ganhi',
          image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop',
          verified: true,
          premium: true,
          bedrooms: 1,
          surface: 45,
        },
        {
          id: 'fallback-4',
          title: 'Terrain Akpakpa',
          slug: 'terrain-akpakpa',
          type: 'terrain',
          transaction: 'achat',
          price: 12000000,
          currency: 'FCFA',
          city: 'Cotonou',
          country: 'BJ',
          quartier: 'Akpakpa',
          image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=300&h=200&fit=crop',
          verified: false,
          premium: false,
          bedrooms: null,
          surface: 500,
        },
        {
          id: 'fallback-5',
          title: 'Villa Les Almadies',
          slug: 'villa-les-almadies',
          type: 'villa',
          transaction: 'achat',
          price: 250000000,
          currency: 'FCFA',
          city: 'Dakar',
          country: 'SN',
          quartier: 'Les Almadies',
          image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=300&h=200&fit=crop',
          verified: true,
          premium: true,
          bedrooms: 6,
          surface: 480,
        },
        {
          id: 'fallback-6',
          title: 'Appart. Ouaga 2000',
          slug: 'appart-ouaga-2000',
          type: 'appartement',
          transaction: 'location',
          price: 200000,
          currency: 'FCFA',
          city: 'Ouagadougou',
          country: 'BF',
          quartier: 'Ouaga 2000',
          image: 'https://images.unsplash.com/photo-1493809842364-78228defb686?w=300&h=200&fit=crop',
          verified: true,
          premium: false,
          bedrooms: 3,
          surface: 120,
        },
        {
          id: 'fallback-7',
          title: 'Guesthouse Lome',
          slug: 'guesthouse-lome',
          type: 'guesthouse',
          transaction: 'location_courte_duree',
          price: 25000,
          currency: 'FCFA',
          city: 'Lomé',
          country: 'TG',
          quartier: 'Tokoin',
          image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=300&h=200&fit=crop',
          verified: true,
          premium: false,
          bedrooms: 1,
          surface: 35,
        },
        {
          id: 'fallback-8',
          title: 'Bureau Treichville',
          slug: 'bureau-treichville',
          type: 'bureau',
          transaction: 'location',
          price: 500000,
          currency: 'FCFA',
          city: 'Abidjan',
          country: 'CI',
          quartier: 'Treichville',
          image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop',
          verified: false,
          premium: false,
          bedrooms: null,
          surface: 200,
        },
      ];

      await cache.set(cacheKey, fallback, 300);
      return NextResponse.json(fallback);
    }

    await cache.set(cacheKey, withImages, 300);
    return NextResponse.json(withImages);
  } catch (error) {
    console.error('Featured properties API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
