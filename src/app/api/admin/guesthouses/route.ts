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

    const [guesthouses, total] = await Promise.all([
      db.guesthouse.findMany({
        where,
        select: {
          id: true, name: true, city: true, country: true,
          overallRating: true, certificationStatus: true, status: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.guesthouse.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    const [certified, pending] = await Promise.all([
      db.guesthouse.count({ where: { ...where, certificationStatus: 'certified' } }),
      db.guesthouse.count({ where: { ...where, status: 'pending' } }),
    ]);

    return NextResponse.json({
      guesthouses,
      pagination: { page, limit, total, pages },
      summary: { total, certified, pending },
    });
  } catch (error) {
    console.error('Admin guesthouses error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouses' }, { status: 500 });
  }
}
