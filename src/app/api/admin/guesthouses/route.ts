import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const certificationStatus = searchParams.get('certificationStatus');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};
    if (country && country !== 'ALL') where.country = country;
    if (certificationStatus) where.certificationStatus = certificationStatus;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [guesthouses, total] = await Promise.all([
      db.guesthouse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { rooms: true, bookings: true } },
        },
      }),
      db.guesthouse.count({ where }),
    ]);

    const byCert = await db.guesthouse.groupBy({ by: ['certificationStatus'], _count: true });
    const byCountry = await db.guesthouse.groupBy({ by: ['country'], _count: true });

    return NextResponse.json({
      guesthouses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { byCert, byCountry },
    });
  } catch (error) {
    console.error('Admin guesthouses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouses' }, { status: 500 });
  }
}
