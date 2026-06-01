import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantDb, extractTenantFromRequest } from '@/lib/db-tenant';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Use tenant-aware DB client for automatic country filtering
    const tenantCountry = extractTenantFromRequest(request);
    const tenantDb = getTenantDb(tenantCountry);

    const where: Record<string, unknown> = { published: true };

    if (category) where.category = category;
    if (level) where.level = level;
    if (country) where.country = country;

    const [courses, total] = await Promise.all([
      tenantDb.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { students: 'desc' },
      }),
      tenantDb.course.count({ where }),
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

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    if (!body.title || !body.instructorId || !body.instructor || !body.duration) {
      return NextResponse.json(
        { error: 'title, instructorId, instructor, and duration are required' },
        { status: 400 }
      );
    }

    const course = await db.course.create({
      data: {
        title: body.title,
        slug: body.slug,
        category: body.category,
        country: body.country || 'BJ',
        instructorId: body.instructorId,
        instructor: body.instructor,
        description: body.description,
        duration: body.duration,
        price: body.price ?? 0,
        currency: body.currency || 'XOF',
        level: body.level || 'debutant',
        certificate: body.certificate ?? false,
        videoUrl: body.videoUrl,
        modules: body.modules ? JSON.stringify(body.modules) : null,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error('Course creation error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
