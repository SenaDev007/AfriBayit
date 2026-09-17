import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { toJsonInput, fromJson, toNumber } from '@/lib/db-helpers';

export async function GET(request: Request) {
  // Public review listings (testimonials, property reviews) — cacheable at
  // the CDN edge like the other public listing routes. Fresh 5 min, then
  // stale-while-revalidate for an hour: the homepage testimonials section
  // must not pay a Neon cold start on every visit.
  const CDN_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  };
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType');
    const rating = searchParams.get('rating');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (targetId) where.targetId = targetId;
    if (targetType) where.targetType = targetType;
    if (rating) where.rating = parseInt(rating);
    if (country) where.country = country;

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, name: true, avatar: true, reputation: true },
          },
        },
      }),
      db.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    }, { headers: CDN_CACHE_HEADERS });
  } catch (error) {
    console.error('Reviews API error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const review = await db.review.create({
      data: {
        reviewerId: auth.userId,
        targetId: body.targetId,
        targetType: body.targetType,
        country: body.country || null,
        rating: body.rating,
        subRatings: toJsonInput(body.subRatings),
        comment: body.comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Review creation error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
