import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const transaction = searchParams.get('transaction');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const verified = searchParams.get('verified');
    const geoTrust = searchParams.get('geoTrust');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { status: 'published' };

    if (type) where.type = type;
    if (transaction) where.transaction = transaction;
    if (city) where.city = city;
    if (country) where.country = country;
    if (verified === 'true') where.verified = true;
    if (geoTrust === 'true') where.geoTrust = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const property = await db.property.create({
      data: {
        title: body.title,
        type: body.type,
        transaction: body.transaction,
        price: body.price,
        surface: body.surface,
        rooms: body.rooms || 0,
        bedrooms: body.bedrooms || 0,
        bathrooms: body.bathrooms || 0,
        city: body.city,
        country: body.country,
        quartier: body.quartier,
        description: body.description,
        features: body.features ? JSON.stringify(body.features) : null,
        images: body.images ? JSON.stringify(body.images) : null,
        lat: body.lat,
        lng: body.lng,
        agentId: body.agentId,
        status: 'draft',
      },
    });

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Property creation error:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
