import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'posts';
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const rating = searchParams.get('rating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    if (tab === 'posts') {
      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (country && country !== 'ALL') where.country = country;

      const [posts, total] = await Promise.all([
        db.communityPost.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: limit,
          include: {
            author: { select: { id: true, name: true, avatar: true, country: true } },
            _count: { select: { replies_rel: true, likes_rel: true } },
          },
        }),
        db.communityPost.count({ where }),
      ]);
      return NextResponse.json({ tab, data: posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    if (tab === 'groups') {
      const where: Record<string, unknown> = {};
      if (country && country !== 'ALL') where.country = country;

      const [groups, total] = await Promise.all([
        db.communityGroup.findMany({
          where, orderBy: { members: 'desc' },
          skip: (page - 1) * limit, take: limit,
          include: { _count: { select: { memberships: true } } },
        }),
        db.communityGroup.count({ where }),
      ]);
      return NextResponse.json({ tab, data: groups, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    if (tab === 'events') {
      const where: Record<string, unknown> = {};
      if (country && country !== 'ALL') where.country = country;

      const [events, total] = await Promise.all([
        db.communityEvent.findMany({
          where, orderBy: { eventDate: 'asc' },
          skip: (page - 1) * limit, take: limit,
          include: { _count: { select: { registrations: true } } },
        }),
        db.communityEvent.count({ where }),
      ]);
      return NextResponse.json({ tab, data: events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    if (tab === 'reviews') {
      const where: Record<string, unknown> = {};
      if (rating) where.rating = parseInt(rating);
      if (country && country !== 'ALL') where.country = country;

      const [reviews, total] = await Promise.all([
        db.review.findMany({
          where, orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit, take: limit,
          include: {
            reviewer: { select: { id: true, name: true, avatar: true } },
          },
        }),
        db.review.count({ where }),
      ]);
      return NextResponse.json({ tab, data: reviews, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }

    return NextResponse.json({ tab, data: [], pagination: { page, limit, total: 0, pages: 0 } });
  } catch (error) {
    console.error('Admin community API error:', error);
    return NextResponse.json({ error: 'Failed to fetch community data' }, { status: 500 });
  }
}
