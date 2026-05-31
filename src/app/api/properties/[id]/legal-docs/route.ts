import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const legalDocs = await db.propertyLegalDoc.findMany({
      where: { propertyId: id },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json(legalDocs);
  } catch (error) {
    console.error('Property legal docs API error:', error);
    return NextResponse.json({ error: 'Failed to fetch legal docs' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify ownership: property owner or admin
    const property = await db.property.findUnique({ where: { id } });
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (property.agentId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the property owner' }, { status: 403 });
    }

    const legalDoc = await db.propertyLegalDoc.create({
      data: {
        propertyId: id,
        docType: body.docType,
        docUrl: body.docUrl,
        ocrValid: body.ocrValid ?? false,
        aiScore: body.aiScore,
        status: 'pending',
        country: body.country,
        rejectionReason: body.rejectionReason,
      },
    });

    return NextResponse.json(legalDoc, { status: 201 });
  } catch (error) {
    console.error('Property legal doc creation error:', error);
    return NextResponse.json({ error: 'Failed to upload legal doc' }, { status: 500 });
  }
}
