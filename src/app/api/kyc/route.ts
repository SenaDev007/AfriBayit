import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const documents = await db.kycDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('KYC API error:', error);
    return NextResponse.json({ error: 'Failed to fetch KYC documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const document = await db.kycDocument.create({
      data: {
        userId: body.userId,
        docType: body.docType,
        docUrl: body.docUrl,
        ocrResult: body.ocrResult ? JSON.stringify(body.ocrResult) : null,
        ocrValid: body.ocrValid ?? false,
        aiScore: body.aiScore,
        status: 'pending',
        country: body.country,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('KYC document creation error:', error);
    return NextResponse.json({ error: 'Failed to upload KYC document' }, { status: 500 });
  }
}
