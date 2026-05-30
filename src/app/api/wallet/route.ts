import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };

    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.walletTransaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Wallet API error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const transaction = await db.walletTransaction.create({
      data: {
        userId: body.userId,
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
