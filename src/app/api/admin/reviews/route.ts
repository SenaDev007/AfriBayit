import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const rating = searchParams.get('rating') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (rating) where.rating = parseInt(rating);

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        { targetType: { contains: search, mode: 'insensitive' } },
        { reviewer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          reviewer: { select: { id: true, name: true, avatar: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.review.count({ where }),
    ]);

    const [fiveStar, oneStar, flagged] = await Promise.all([
      db.review.count({ where: { rating: 5 } }),
      db.review.count({ where: { rating: 1 } }),
      db.review.count({ where: { verified: false } }),
    ]);

    const avgResult = await db.review.aggregate({ _avg: { rating: true } });
    const averageRating = avgResult._avg.rating ?? 0;

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { total, averageRating: Math.round(averageRating * 10) / 10, fiveStar, oneStar, flagged },
    });
  } catch (error) {
    console.error('Admin reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
