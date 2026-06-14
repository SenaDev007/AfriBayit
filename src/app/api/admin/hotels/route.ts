import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) {
      where.country = country;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [hotels, total] = await Promise.all([
      db.hotel.findMany({
        where,
        select: {
          id: true, name: true, city: true, country: true,
          stars: true, rating: true, pricePerNight: true, currency: true,
          status: true, available: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.hotel.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    const [published, pending] = await Promise.all([
      db.hotel.count({ where: { ...where, status: 'published' } }),
      db.hotel.count({ where: { ...where, status: 'pending' } }),
    ]);

    return NextResponse.json({
      hotels,
      pagination: { page, limit, total, pages },
      summary: { total, published, pending },
    });
  } catch (error) {
    console.error('Admin hotels error:', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}
