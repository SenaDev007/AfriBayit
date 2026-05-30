import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { transactionCreateSchema } from '@/lib/validations/transaction.schema';
import { authGuard } from '@/lib/auth-guard';

export async function GET() {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const transactions = await db.transaction.findMany({
      where: {
        OR: [
          { buyerId: auth.userId },
          { sellerId: auth.userId },
        ],
      },
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
    const auth = await authGuard({ requireKycLevel: 1 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const validated = transactionCreateSchema.parse(body);

    const transaction = await db.transaction.create({
      data: {
        propertyId: validated.propertyId,
        buyerId: validated.buyerId,
        sellerId: validated.sellerId,
        amount: validated.amount,
        commission: validated.commission,
        currency: validated.currency,
        status: 'CREATED',
        notaryId: validated.notaryId,
        geometerId: validated.geometerId,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    console.error('Transaction creation error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
