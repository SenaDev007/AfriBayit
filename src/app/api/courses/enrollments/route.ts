import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const completed = searchParams.get('completed');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    // Users can see their own enrollments; admins can see all
    if (auth.role !== 'admin') {
      where.userId = auth.userId;
    } else if (userId) {
      where.userId = userId;
    }

    if (courseId) where.courseId = courseId;
    if (completed !== null && completed !== undefined) {
      where.completed = completed === 'true';
    }

    const [enrollments, total] = await Promise.all([
      db.courseEnrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              level: true,
              image: true,
              instructor: true,
            },
          },
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      db.courseEnrollment.count({ where }),
    ]);

    return NextResponse.json({
      data: enrollments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Enrollments API error:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    if (!body.courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // Check if course exists and is published
    const course = await db.course.findUnique({ where: { id: body.courseId } });
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (!course.published) {
      return NextResponse.json({ error: 'Course is not available for enrollment' }, { status: 400 });
    }

    // Check for existing enrollment
    const existing = await db.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: auth.userId, courseId: body.courseId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already enrolled in this course' }, { status: 409 });
    }

    const enrollment = await db.courseEnrollment.create({
      data: {
        userId: auth.userId,
        courseId: body.courseId,
        progress: 0,
        completed: false,
      },
    });

    // Increment student count on the course
    await db.course.update({
      where: { id: body.courseId },
      data: { students: { increment: 1 } },
    });

    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    console.error('Enrollment creation error:', error);
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 });
  }
}
