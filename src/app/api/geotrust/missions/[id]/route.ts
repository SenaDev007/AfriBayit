import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const mission = await db.geometerMission.findUnique({
      where: { id },
      include: {
        geometer: {
          select: {
            id: true,
            licenseNumber: true,
            specialities: true,
            certificationLevel: true,
            rating: true,
            certified: true,
            user: {
              select: { id: true, name: true, avatar: true, phone: true },
            },
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true,
            quartier: true,
            lat: true,
            lng: true,
          },
        },
        report: true,
        propertyGeom: true,
        waypoints: { orderBy: { capturedAt: 'asc' } },
        droneCoverages: { orderBy: { capturedAt: 'desc' } },
      },
    });

    if (!mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    return NextResponse.json({ data: mission });
  } catch (error) {
    console.error('Geometer mission detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch mission' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.geometerMission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Only the assigned geometer, the property owner, or admin can update
    const isGeometer = existing.geometerId === auth.userId;
    const property = await db.property.findUnique({ where: { id: existing.propertyId } });
    const isPropertyOwner = property?.agentId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isGeometer && !isPropertyOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to update this mission' }, { status: 403 });
    }

    // Validate status transitions
    const validStatuses = ['requested', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updated = await db.geometerMission.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.scheduledAt !== undefined && { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }),
        ...(body.completedAt !== undefined && { completedAt: body.completedAt ? new Date(body.completedAt) : null }),
        ...(body.reportUrl !== undefined && { reportUrl: body.reportUrl }),
        ...(body.result !== undefined && { result: body.result }),
        ...(body.aiScore !== undefined && { aiScore: body.aiScore }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Geometer mission update error:', error);
    return NextResponse.json({ error: 'Failed to update mission' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const existing = await db.geometerMission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 });
    }

    // Only the assigned geometer, the property owner, or admin can cancel
    const isGeometer = existing.geometerId === auth.userId;
    const property = await db.property.findUnique({ where: { id: existing.propertyId } });
    const isPropertyOwner = property?.agentId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isGeometer && !isPropertyOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to cancel this mission' }, { status: 403 });
    }

    // Cancel the mission (soft-delete via status)
    const updated = await db.geometerMission.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ message: 'Mission cancelled', data: updated });
  } catch (error) {
    console.error('Geometer mission delete error:', error);
    return NextResponse.json({ error: 'Failed to cancel mission' }, { status: 500 });
  }
}
