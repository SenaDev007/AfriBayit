import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Users can only see their own KYC docs; admins can see all
    const filterUserId = auth.role === 'admin' ? (userId || auth.userId) : auth.userId;

    const where: Record<string, unknown> = { userId: filterUserId };
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
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const document = await db.kycDocument.create({
      data: {
        userId: auth.userId,
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
