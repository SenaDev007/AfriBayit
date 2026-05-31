import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const entryType = searchParams.get('entryType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify user is a participant in the escrow transaction
    const account = await db.escrowAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Escrow account not found' }, { status: 404 });
    }

    // Only allow buyer, seller, or admin to view ledger
    if (account.buyerId !== auth.userId && account.sellerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const where: Record<string, unknown> = { escrowAccountId: id };
    if (entryType) where.entryType = entryType;

    const [entries, total] = await Promise.all([
      db.escrowLedger.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.escrowLedger.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Escrow ledger API error:', error);
    return NextResponse.json({ error: 'Failed to fetch escrow ledger' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Get current escrow account to calculate balance
    const account = await db.escrowAccount.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json({ error: 'Escrow account not found' }, { status: 404 });
    }

    // Only allow buyer, seller, or admin to create ledger entries
    if (account.buyerId !== auth.userId && account.sellerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    let newBalance = account.balance;
    let newHeld = account.heldAmount;
    let newReleased = account.releasedAmount;
    let newRefunded = account.refundedAmount;
    let newStatus = account.status;

    switch (body.entryType) {
      case 'CREDIT':
        newBalance += body.amount;
        newStatus = 'FUNDED';
        break;
      case 'HOLD':
        newHeld += body.amount;
        break;
      case 'RELEASE':
        newBalance -= body.amount;
        newReleased += body.amount;
        newStatus = newBalance <= 0 ? 'FULL_RELEASE' : 'PARTIAL_RELEASE';
        break;
      case 'REFUND':
        newBalance -= body.amount;
        newRefunded += body.amount;
        newStatus = 'REFUNDED';
        break;
      case 'COMMISSION':
        newBalance -= body.amount;
        newReleased += body.amount;
        break;
      case 'DEBIT':
        newBalance -= body.amount;
        break;
    }

    // Create ledger entry and update account in transaction
    const [entry] = await db.$transaction([
      db.escrowLedger.create({
        data: {
          escrowAccountId: id,
          entryType: body.entryType,
          amount: body.amount,
          balanceAfter: newBalance,
          currency: body.currency || account.currency,
          reference: body.reference,
          providerRef: body.providerRef,
          metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        },
      }),
      db.escrowAccount.update({
        where: { id },
        data: {
          balance: newBalance,
          heldAmount: newHeld,
          releasedAmount: newReleased,
          refundedAmount: newRefunded,
          status: newStatus,
          ...(body.entryType === 'CREDIT' && { fundedAt: new Date() }),
          ...(body.entryType === 'RELEASE' && newBalance <= 0 && { releasedAt: new Date() }),
          ...(body.entryType === 'REFUND' && { refundedAt: new Date() }),
        },
      }),
    ]);

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Escrow ledger entry creation error:', error);
    return NextResponse.json({ error: 'Failed to add ledger entry' }, { status: 500 });
  }
}
