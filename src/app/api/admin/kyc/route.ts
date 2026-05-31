import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const docType = searchParams.get('docType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (country) where.country = country;
    if (docType) where.docType = docType;

    const [documents, total] = await Promise.all([
      db.kycDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              country: true,
            },
          },
        },
      }),
      db.kycDocument.count({ where }),
    ]);

    // Summary stats
    const [pendingCount, avgScoreResult, validatedToday] = await Promise.all([
      db.kycDocument.count({ where: { status: 'pending' } }),
      db.kycDocument.aggregate({
        where: { aiScore: { not: null } },
        _avg: { aiScore: true },
      }),
      db.kycDocument.count({
        where: {
          status: 'human_validated',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        pending: pendingCount,
        avgAiScore: Math.round((avgScoreResult._avg.aiScore || 0) * 10) / 10,
        validatedToday,
      },
    });
  } catch (error) {
    console.error('Admin KYC list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC documents' },
      { status: 500 }
    );
  }
}
