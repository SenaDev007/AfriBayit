import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const stars = searchParams.get('stars');
    const connectionLevel = searchParams.get('connectionLevel');
    const available = searchParams.get('available');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { status: 'active' };

    if (city) where.city = city;
    if (country) where.country = country;
    if (stars) where.stars = parseInt(stars);
    if (connectionLevel) where.connectionLevel = parseInt(connectionLevel);
    if (available === 'true') where.available = true;

    const [hotels, total] = await Promise.all([
      db.hotel.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          rooms: { take: 1 },
          _count: { select: { reviews_hotel: true } },
        },
      }),
      db.hotel.count({ where }),
    ]);

    return NextResponse.json({
      hotels,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Hotels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const hotel = await db.hotel.create({
      data: {
        name: body.name,
        slug: body.slug,
        city: body.city,
        country: body.country,
        stars: body.stars || 3,
        pricePerNight: body.pricePerNight,
        currency: body.currency || 'XOF',
        amenities: body.amenities ? JSON.stringify(body.amenities) : null,
        images: body.images ? JSON.stringify(body.images) : null,
        policies: body.policies ? JSON.stringify(body.policies) : null,
        available: body.available ?? true,
        connectionLevel: body.connectionLevel || 1,
        ownerId: auth.userId,
        otaRefs: body.otaRefs ? JSON.stringify(body.otaRefs) : null,
        lat: body.lat,
        lng: body.lng,
        status: 'active',
      },
    });

    return NextResponse.json(hotel, { status: 201 });
  } catch (error) {
    console.error('Hotel creation error:', error);
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 });
  }
}
