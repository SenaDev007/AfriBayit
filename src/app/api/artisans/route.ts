import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trade = searchParams.get('trade');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { certified: true };

    if (trade) where.trade = trade;
    if (city) where.city = city;
    if (country) where.country = country;

    const [artisans, total] = await Promise.all([
      db.artisan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      db.artisan.count({ where }),
    ]);

    return NextResponse.json({
      artisans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Artisans API error:', error);
    return NextResponse.json({ error: 'Failed to fetch artisans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    if (!body.userId || !body.trade) {
      return NextResponse.json(
        { error: 'userId and trade are required' },
        { status: 400 }
      );
    }

    const artisan = await db.artisan.create({
      data: {
        userId: body.userId,
        trade: body.trade,
        specialties: body.specialties ? JSON.stringify(body.specialties) : null,
        certified: body.certified ?? false,
        kybValid: body.kybValid ?? false,
        available: body.available ?? true,
        emergency: body.emergency ?? false,
        priceRange: body.priceRange,
        dailyRate: body.dailyRate,
        portfolio: body.portfolio ? JSON.stringify(body.portfolio) : null,
        zone: body.zone,
        city: body.city,
        country: body.country,
        subscriptionTier: body.subscriptionTier,
        responseTime: body.responseTime,
      },
    });

    return NextResponse.json(artisan, { status: 201 });
  } catch (error) {
    console.error('Artisan creation error:', error);
    return NextResponse.json({ error: 'Failed to create artisan' }, { status: 500 });
  }
}
