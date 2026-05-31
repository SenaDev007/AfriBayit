import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
