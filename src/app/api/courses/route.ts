import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { published: true };

    if (category) where.category = category;
    if (level) where.level = level;
    if (country) where.country = country;

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { students: 'desc' },
      }),
      db.course.count({ where }),
    ]);

    return NextResponse.json({
      courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
