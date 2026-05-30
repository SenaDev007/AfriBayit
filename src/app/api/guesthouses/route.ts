import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const certificationStatus = searchParams.get('certificationStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { status: 'active' };

    if (city) where.city = city;
    if (country) where.country = country;
    if (certificationStatus) where.certificationStatus = certificationStatus;

    const [guesthouses, total] = await Promise.all([
      db.guesthouse.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { overallRating: 'desc' },
        include: {
          rooms: { take: 3 },
          _count: { select: { bookings: true } },
        },
      }),
      db.guesthouse.count({ where }),
    ]);

    return NextResponse.json({
      guesthouses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Guesthouses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const guesthouse = await db.guesthouse.create({
      data: {
        ownerId: auth.userId,
        name: body.name,
        slug: body.slug,
        description: body.description,
        city: body.city,
        country: body.country,
        quartier: body.quartier,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        images: body.images ? JSON.stringify(body.images) : null,
        amenities: body.amenities ? JSON.stringify(body.amenities) : null,
        rules: body.rules ? JSON.stringify(body.rules) : null,
        certificationStatus: 'pending',
        breakfastAvailable: body.breakfastAvailable ?? false,
        breakfastPrice: body.breakfastPrice,
        currency: body.currency || 'XOF',
        hasStaff: body.hasStaff ?? false,
        status: 'active',
      },
    });

    return NextResponse.json(guesthouse, { status: 201 });
  } catch (error) {
    console.error('Guesthouse creation error:', error);
    return NextResponse.json({ error: 'Failed to create guesthouse' }, { status: 500 });
  }
}
