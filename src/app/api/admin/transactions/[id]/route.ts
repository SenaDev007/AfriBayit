import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, reason } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, city: true, country: true } },
        buyer: { select: { id: true, name: true, email: true } },
        escrowAccount: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (action === 'flag') {
      const updated = await db.transaction.update({
        where: { id },
        data: {
          disputeReason: reason
            ? `[FLAGGED] ${reason}`
            : '[FLAGGED] Flagged by admin',
        },
        include: {
          property: { select: { id: true, title: true, city: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          escrowAccount: true,
        },
      });
      return NextResponse.json({ success: true, transaction: updated });
    }

    if (action === 'escalate') {
      const updated = await db.transaction.update({
        where: { id },
        data: {
          status: 'DISPUTED',
          disputeReason: transaction.disputeReason
            ? `${transaction.disputeReason} [ESCALATED${reason ? ': ' + reason : ''}]`
            : `[ESCALATED${reason ? ': ' + reason : ''}]`,
        },
        include: {
          property: { select: { id: true, title: true, city: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          escrowAccount: true,
        },
      });

      // Also update escrow account status
      if (transaction.escrowAccount) {
        await db.escrowAccount.update({
          where: { id: transaction.escrowAccount.id },
          data: { status: 'DISPUTED' },
        });
      }

      return NextResponse.json({ success: true, transaction: updated });
    }

    if (action === 'unflag') {
      const updated = await db.transaction.update({
        where: { id },
        data: {
          disputeReason: null,
          status: transaction.status === 'DISPUTED' ? 'FUNDED' : transaction.status,
        },
        include: {
          property: { select: { id: true, title: true, city: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          escrowAccount: true,
        },
      });

      // Restore escrow account status
      if (transaction.escrowAccount && transaction.escrowAccount.status === 'DISPUTED') {
        await db.escrowAccount.update({
          where: { id: transaction.escrowAccount.id },
          data: { status: 'FUNDED' },
        });
      }

      return NextResponse.json({ success: true, transaction: updated });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use flag, escalate, or unflag.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Admin transaction update error:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
