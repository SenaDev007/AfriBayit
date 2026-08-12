// PATCH /api/courses/enrollments/[id] — Update enrollment progress

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify enrollment exists and belongs to user (or user is admin)
    const enrollment = await db.courseEnrollment.findUnique({
      where: { id },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Inscription introuvable.' },
        { status: 404 }
      );
    }

    // Only allow owner or admin to update
    if (enrollment.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé.' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.progress !== undefined) {
      updateData.progress = Math.min(100, Math.max(0, Number(body.progress)));
    }
    if (body.completed !== undefined) {
      updateData.completed = Boolean(body.completed);
      if (body.completed) {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }
    }
    if (body.completedModules !== undefined) {
      updateData.completedModules = JSON.stringify(body.completedModules);
    }

    const updated = await db.courseEnrollment.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            category: true,
            level: true,
            instructor: true,
          },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Enrollment update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'inscription.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const { id } = await params;

    const enrollment = await db.courseEnrollment.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Inscription introuvable.' },
        { status: 404 }
      );
    }

    // Only allow owner or admin to view
    if (enrollment.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ data: enrollment });
  } catch (error) {
    console.error('Enrollment fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'inscription.' },
      { status: 500 }
    );
  }
}
