import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const status = body.status as string; // 'ai_validated', 'human_validated', or 'rejected'

    if (!['ai_validated', 'human_validated', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be ai_validated, human_validated, or rejected' }, { status: 400 });
    }

    const document = await db.kycDocument.update({
      where: { id },
      data: {
        status,
        ...(body.rejectionReason && { rejectionReason: body.rejectionReason }),
        ...(body.aiScore !== undefined && { aiScore: body.aiScore }),
        ...(body.ocrValid !== undefined && { ocrValid: body.ocrValid }),
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('KYC validation error:', error);
    return NextResponse.json({ error: 'Failed to validate KYC document' }, { status: 500 });
  }
}
