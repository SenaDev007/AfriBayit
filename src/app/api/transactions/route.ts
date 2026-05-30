import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const transactions = await db.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const stats = {
      total: transactions.length,
      byStatus: {} as Record<string, number>,
      totalVolume: 0,
    };

    transactions.forEach((t) => {
      stats.byStatus[t.status] = (stats.byStatus[t.status] || 0) + 1;
      if (t.status === 'RELEASED') stats.totalVolume += t.amount;
    });

    return NextResponse.json({ transactions, stats });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const transaction = await db.transaction.create({
      data: {
        propertyId: body.propertyId,
        buyerId: body.buyerId,
        sellerId: body.sellerId,
        amount: body.amount,
        commission: body.commission || 0,
        currency: body.currency || 'XOF',
        status: 'CREATED',
        paymentProvider: body.paymentProvider,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
