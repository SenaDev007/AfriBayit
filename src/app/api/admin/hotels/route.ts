import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const status = searchParams.get('status');
    const connectionLevel = searchParams.get('connectionLevel');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};
    if (country && country !== 'ALL') where.country = country;
    if (status) where.status = status;
    if (connectionLevel) where.connectionLevel = parseInt(connectionLevel);
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [hotels, total] = await Promise.all([
      db.hotel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { rooms: true, bookings: true } },
        },
      }),
      db.hotel.count({ where }),
    ]);

    const byStatus = await db.hotel.groupBy({ by: ['status'], _count: true });
    const byCountry = await db.hotel.groupBy({ by: ['country'], _count: true });

    return NextResponse.json({
      hotels,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { byStatus, byCountry },
    });
  } catch (error) {
    console.error('Admin hotels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}
