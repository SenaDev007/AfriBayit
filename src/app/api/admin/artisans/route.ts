import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status === 'verified') where.certified = true;
    else if (status === 'pending') where.certified = false;
    else if (status) where.available = status === 'available';

    if (search) {
      where.OR = [
        { trade: { contains: search, mode: 'insensitive' } },
        { specialties: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [artisans, total] = await Promise.all([
      db.artisan.findMany({
        where,
        select: {
          id: true,
          trade: true,
          specialties: true,
          country: true,
          city: true,
          rating: true,
          certified: true,
          available: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { services: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.artisan.count({ where }),
    ]);

    const [totalVerified, totalPending, byCountryRaw] = await Promise.all([
      db.artisan.count({ where: { certified: true } }),
      db.artisan.count({ where: { certified: false } }),
      db.artisan.groupBy({ by: ['country'], _count: { country: true }, where: { country: { not: null } } }),
    ]);

    const byCountry: Record<string, number> = {};
    for (const row of byCountryRaw) {
      if (row.country) byCountry[row.country] = row._count.country;
    }

    return NextResponse.json({
      artisans,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { total, verified: totalVerified, pending: totalPending, byCountry },
    });
  } catch (error) {
    console.error('Admin artisans error:', error);
    return NextResponse.json({ error: 'Failed to fetch artisans' }, { status: 500 });
  }
}
