import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    const { id } = await params;
    const body = await request.json();

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
