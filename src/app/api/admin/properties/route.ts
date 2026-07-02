import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) {
      where.country = country;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { quartier: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        select: {
          id: true, title: true, type: true, transaction: true,
          price: true, currency: true, city: true, quartier: true,
          status: true, verified: true, createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.property.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    const [pending, flagged, published] = await Promise.all([
      db.property.count({ where: { ...where, status: 'pending' } }),
      db.property.count({ where: { ...where, status: 'flagged' } }),
      db.property.count({ where: { ...where, status: 'published' } }),
    ]);

    return NextResponse.json({
      properties,
      pagination: { page, limit, total, pages },
      summary: { pending, flagged, published },
    });
  } catch (error) {
    console.error('Admin properties error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
