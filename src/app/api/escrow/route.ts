import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { escrowCreateSchema } from '@/lib/validations/escrow.schema';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const transactionId = searchParams.get('transactionId');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (transactionId) where.transactionId = transactionId;
    if (country) {
      where.transaction = { country };
    }

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
    const auth = await authGuard({ requireKycLevel: 1 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const validated = escrowCreateSchema.parse(body);

    const escrowAccount = await db.escrowAccount.create({
      data: {
        transactionId: validated.transactionId,
        balance: 0,
        heldAmount: 0,
        releasedAmount: 0,
        refundedAmount: 0,
        currency: validated.currency,
        status: 'EMPTY',
      },
    });

    return NextResponse.json(escrowAccount, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    console.error('Escrow creation error:', error);
    return NextResponse.json({ error: 'Failed to create escrow account' }, { status: 500 });
  }
}
