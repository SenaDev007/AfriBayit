// GET /api/courses/[id] — Fetch course detail by ID
// PATCH /api/courses/[id] — Update course (admin: approve/unpublish/feature)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const course = await db.course.findUnique({
      where: { id },
      include: {
        enrollments: {
          select: {
            id: true,
            userId: true,
            progress: true,
            completed: true,
            enrolledAt: true,
            completedAt: true,
          },
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            timeLimit: true,
            passingScore: true,
            maxAttempts: true,
            _count: { select: { attempts: true } },
          },
        },
        certificates_rel: {
          select: {
            id: true,
            certificateId: true,
            userId: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Cours introuvable.' },
        { status: 404 }
      );
    }

    // Parse modules JSON
    let parsedModules = null;
    if (course.modules) {
      try {
        parsedModules = typeof course.modules === 'string'
          ? JSON.parse(course.modules)
          : course.modules;
      } catch {
        parsedModules = null;
      }
    }

    return NextResponse.json({
      ...course,
      modules: parsedModules,
    });
  } catch (error) {
    console.error('Course detail API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du cours.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'TRAINER'] });
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify course exists
    const existing = await db.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Cours introuvable.' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.published !== undefined) updateData.published = body.published;
    if (body.featured !== undefined) updateData.featured = body.featured;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.duration !== undefined) updateData.duration = body.duration;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.image !== undefined) updateData.image = body.image;
    if (body.certificate !== undefined) updateData.certificate = body.certificate;
    if (body.instructor !== undefined) updateData.instructor = body.instructor;
    if (body.modules !== undefined) {
      updateData.modules = typeof body.modules === 'string'
        ? body.modules
        : JSON.stringify(body.modules);
    }

    const updated = await db.course.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Course update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du cours.' },
      { status: 500 }
    );
  }
}
