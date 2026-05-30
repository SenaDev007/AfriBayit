import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (transactionId) where.transactionId = transactionId;

    const [accounts, total] = await Promise.all([
      db.escrowAccount.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            select: {
              id: true,
              propertyId: true,
              buyerId: true,
              status: true,
              amount: true,
              currency: true,
            },
          },
        },
      }),
      db.escrowAccount.count({ where }),
    ]);

    return NextResponse.json({
      accounts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Escrow API error:', error);
    return NextResponse.json({ error: 'Failed to fetch escrow accounts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const escrowAccount = await db.escrowAccount.create({
      data: {
        transactionId: body.transactionId,
        balance: 0,
        heldAmount: 0,
        releasedAmount: 0,
        refundedAmount: 0,
        currency: body.currency || 'XOF',
        status: 'EMPTY',
      },
    });

    return NextResponse.json(escrowAccount, { status: 201 });
  } catch (error) {
    console.error('Escrow creation error:', error);
    return NextResponse.json({ error: 'Failed to create escrow account' }, { status: 500 });
  }
}
