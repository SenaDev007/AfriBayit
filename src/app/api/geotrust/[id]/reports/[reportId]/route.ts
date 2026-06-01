import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, reportId } = await params;
    const body = await request.json();

    // Verify the report exists and belongs to this geometer's missions
    const existing = await db.geometerReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify the report's mission belongs to this geometer
    const mission = await db.geometerMission.findUnique({ where: { id: existing.missionId } });
    if (!mission || mission.geometerId !== id) {
      return NextResponse.json({ error: 'Report does not belong to this geometer' }, { status: 400 });
    }

    // Verify ownership: geometer owner or admin
    const geometer = await db.geometer.findUnique({ where: { id } });
    if (!geometer) {
      return NextResponse.json({ error: 'Geometer not found' }, { status: 404 });
    }
    if (geometer.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the geometer profile owner' }, { status: 403 });
    }

    // Validate validationStatus if provided
    const validStatuses = ['pending', 'validated', 'rejected'];
    if (body.validationStatus && !validStatuses.includes(body.validationStatus)) {
      return NextResponse.json(
        { error: `Invalid validationStatus. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await db.geometerReport.update({
      where: { id: reportId },
      data: {
        ...(body.validationStatus !== undefined && { validationStatus: body.validationStatus }),
        ...(body.aiScore !== undefined && { aiScore: body.aiScore }),
        ...(body.blockchainHash !== undefined && { blockchainHash: body.blockchainHash }),
        ...(body.pdfUrl !== undefined && { pdfUrl: body.pdfUrl }),
        ...(body.geojsonUrl !== undefined && { geojsonUrl: body.geojsonUrl }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Geometer report update error:', error);
    return NextResponse.json({ error: 'Failed to update geometer report' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reportId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, reportId } = await params;

    // Verify the report exists and belongs to this geometer's missions
    const existing = await db.geometerReport.findUnique({ where: { id: reportId } });
    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Verify the report's mission belongs to this geometer
    const mission = await db.geometerMission.findUnique({ where: { id: existing.missionId } });
    if (!mission || mission.geometerId !== id) {
      return NextResponse.json({ error: 'Report does not belong to this geometer' }, { status: 400 });
    }

    // Verify ownership: geometer owner or admin
    const geometer = await db.geometer.findUnique({ where: { id } });
    if (!geometer) {
      return NextResponse.json({ error: 'Geometer not found' }, { status: 404 });
    }
    if (geometer.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the geometer profile owner' }, { status: 403 });
    }

    await db.geometerReport.delete({ where: { id: reportId } });

    return NextResponse.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('Geometer report delete error:', error);
    return NextResponse.json({ error: 'Failed to delete geometer report' }, { status: 500 });
  }
}
