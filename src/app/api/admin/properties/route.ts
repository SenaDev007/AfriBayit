import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { quartier: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
              verified: true,
            },
          },
          legalDocs: {
            select: {
              id: true,
              docType: true,
              status: true,
              aiScore: true,
            },
          },
          _count: {
            select: {
              propertyImages: true,
              geoInspections: true,
            },
          },
        },
      }),
      db.property.count({ where }),
    ]);

    // Summary stats
    const [pendingCount, flaggedCount, publishedCount] = await Promise.all([
      db.property.count({ where: { status: 'pending', ...where } }),
      db.property.count({ where: { status: 'rejected', ...where } }),
      db.property.count({ where: { status: 'published', ...where } }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        pending: pendingCount,
        flagged: flaggedCount,
        published: publishedCount,
      },
    });
  } catch (error) {
    console.error('Admin properties API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
