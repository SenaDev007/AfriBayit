import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const country = searchParams.get('country');
    const level = searchParams.get('level');
    const published = searchParams.get('published');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (country && country !== 'ALL') where.country = country;
    if (level) where.level = level;
    if (published !== null && published !== undefined && published !== '') where.published = published === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { instructor: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { enrollments: true } },
        },
      }),
      db.course.count({ where }),
    ]);

    const publishedCount = await db.course.count({ where: { published: true } });
    const byCategory = await db.course.groupBy({ by: ['category'], _count: true });

    return NextResponse.json({
      courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { published: publishedCount, byCategory },
    });
  } catch (error) {
    console.error('Admin courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
