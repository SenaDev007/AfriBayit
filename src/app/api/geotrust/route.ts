import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const speciality = searchParams.get('speciality');
    const certificationLevel = searchParams.get('certificationLevel');
    const zone = searchParams.get('zone');
    const available = searchParams.get('available');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { certified: true };

    if (speciality) {
      where.specialities = { contains: speciality };
    }
    if (certificationLevel) where.certificationLevel = certificationLevel;
    if (zone) where.zone = zone;
    if (available === 'true') where.available = true;
    if (country) where.country = country;

    const [geometers, total] = await Promise.all([
      db.geometer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              city: true,
              country: true,
              reputation: true,
            },
          },
        },
      }),
      db.geometer.count({ where }),
    ]);

    return NextResponse.json({
      geometers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Geotrust geometers API error:', error);
    return NextResponse.json({ error: 'Failed to fetch geometers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    if (!body.userId || !body.licenseNumber) {
      return NextResponse.json(
        { error: 'userId and licenseNumber are required' },
        { status: 400 }
      );
    }

    const geometer = await db.geometer.create({
      data: {
        userId: body.userId,
        licenseNumber: body.licenseNumber,
        specialities: body.specialities ? JSON.stringify(body.specialities) : null,
        certificationLevel: body.certificationLevel || 'standard',
        zone: body.zone,
        city: body.city,
        country: body.country,
        available: body.available ?? true,
        lat: body.lat,
        lng: body.lng,
        subscriptionTier: body.subscriptionTier,
      },
    });

    return NextResponse.json(geometer, { status: 201 });
  } catch (error) {
    console.error('Geometer creation error:', error);
    return NextResponse.json({ error: 'Failed to create geometer' }, { status: 500 });
  }
}
