import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, docId } = await params;
    const body = await request.json();

    // Verify the legal doc belongs to this property
    const existing = await db.propertyLegalDoc.findUnique({ where: { id: docId } });
    if (!existing) {
      return NextResponse.json({ error: 'Legal doc not found' }, { status: 404 });
    }
    if (existing.propertyId !== id) {
      return NextResponse.json({ error: 'Legal doc does not belong to this property' }, { status: 400 });
    }

    // Verify ownership: property owner or admin
    const property = await db.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (property.agentId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the property owner' }, { status: 403 });
    }

    // Validate status if provided
    const validStatuses = ['pending', 'ai_validated', 'human_validated', 'rejected'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await db.propertyLegalDoc.update({
      where: { id: docId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.rejectionReason !== undefined && { rejectionReason: body.rejectionReason }),
        ...(body.ocrValid !== undefined && { ocrValid: body.ocrValid }),
        ...(body.aiScore !== undefined && { aiScore: body.aiScore }),
        ...(body.docType !== undefined && { docType: body.docType }),
        ...(body.docUrl !== undefined && { docUrl: body.docUrl }),
        ...(body.country !== undefined && { country: body.country }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Property legal doc update error:', error);
    return NextResponse.json({ error: 'Failed to update legal doc' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, docId } = await params;

    // Verify the legal doc belongs to this property
    const existing = await db.propertyLegalDoc.findUnique({ where: { id: docId } });
    if (!existing) {
      return NextResponse.json({ error: 'Legal doc not found' }, { status: 404 });
    }
    if (existing.propertyId !== id) {
      return NextResponse.json({ error: 'Legal doc does not belong to this property' }, { status: 400 });
    }

    // Verify ownership: property owner or admin
    const property = await db.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (property.agentId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the property owner' }, { status: 403 });
    }

    await db.propertyLegalDoc.delete({ where: { id: docId } });

    return NextResponse.json({ message: 'Legal doc deleted' });
  } catch (error) {
    console.error('Property legal doc delete error:', error);
    return NextResponse.json({ error: 'Failed to delete legal doc' }, { status: 500 });
  }
}
