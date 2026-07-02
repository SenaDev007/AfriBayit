import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, city: true, country: true, agentId: true } },
        buyer: { select: { id: true, name: true, email: true, avatar: true } },
        escrowAccount: { include: { ledger: true } },
        timelineEvents: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Fetch seller (property owner)
    let seller: { id: string; name: string; email: string; avatar: string | null } | null = null;
    if (transaction.property.agentId) {
      seller = await db.user.findUnique({
        where: { id: transaction.property.agentId },
        select: { id: true, name: true, email: true, avatar: true },
      });
    }

    return NextResponse.json({
      dispute: { ...transaction, seller },
    });
  } catch (error) {
    console.error('Admin dispute detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch dispute' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, resolution, splitBuyer, splitSeller } = body;

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: { escrowAccount: true },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    if (action === 'escalate') {
      const updated = await db.transaction.update({
        where: { id },
        data: { status: 'NOTARY_IN_PROGRESS' },
        include: {
          property: { select: { id: true, title: true, city: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          escrowAccount: true,
        },
      });
      return NextResponse.json({ success: true, transaction: updated });
    }

    if (action === 'resolve') {
      const updateData: Record<string, unknown> = { status: 'REFUNDED' };

      if (resolution) {
        updateData.disputeReason = `${transaction.disputeReason} [RESOLVED: ${resolution}]`;
      }

      if (splitBuyer !== undefined && splitSeller !== undefined && transaction.escrowAccount) {
        const totalHeld = transaction.escrowAccount.heldAmount;
        const buyerAmount = totalHeld * (splitBuyer / 100);
        const sellerAmount = totalHeld * (splitSeller / 100);

        await db.escrowAccount.update({
          where: { id: transaction.escrowAccount.id },
          data: {
            releasedAmount: buyerAmount,
            refundedAmount: sellerAmount,
            status: 'PARTIAL_RELEASE',
          },
        });
      }

      const updated = await db.transaction.update({
        where: { id },
        data: updateData,
        include: {
          property: { select: { id: true, title: true, city: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          escrowAccount: true,
        },
      });

      return NextResponse.json({ success: true, transaction: updated });
    }

    return NextResponse.json({ error: 'Invalid action. Use escalate or resolve.' }, { status: 400 });
  } catch (error) {
    console.error('Admin dispute update error:', error);
    return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 });
  }
}
