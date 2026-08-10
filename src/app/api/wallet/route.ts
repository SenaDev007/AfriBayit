import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId: auth.userId };

    if (type) where.type = type;

    const [user, transactions, total] = await Promise.all([
      db.user.findUnique({
        where: { id: auth.userId },
        select: {
          walletBalance: true,
          escrowHeld: true,
          pendingPayout: true,
          afriPoints: true,
          currency: true,
          kycLevel: true,
          name: true,
          avatar: true,
          score: true,
        },
      }),
      db.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.walletTransaction.count({ where }),
    ]);

    return NextResponse.json({
      summary: {
        balance: user?.walletBalance ?? 0,
        escrowHeld: user?.escrowHeld ?? 0,
        pendingPayout: user?.pendingPayout ?? 0,
        afriPoints: user?.afriPoints ?? 0,
        currency: user?.currency ?? 'XOF',
        kycLevel: user?.kycLevel ?? 0,
        name: user?.name ?? '',
        avatar: user?.avatar ?? null,
        score: user?.score ?? 0,
      },
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const transaction = await db.walletTransaction.create({
      data: {
        userId: auth.userId,
        type: body.type,
        amount: body.amount,
        balanceAfter: body.balanceAfter,
        currency: body.currency || 'XOF',
        status: body.status || 'pending',
        reference: body.reference,
        providerRef: body.providerRef,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Wallet transaction creation error:', error);
    return NextResponse.json({ error: 'Failed to create wallet transaction' }, { status: 500 });
  }
}
