import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { disputeReason: { not: null } };
    if (country) where.country = country;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { disputeReason: { contains: search, mode: 'insensitive' } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { buyer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [disputes, total] = await Promise.all([
      db.transaction.findMany({
        where,
        select: {
          id: true,
          amount: true,
          commission: true,
          currency: true,
          country: true,
          status: true,
          disputeReason: true,
          createdAt: true,
          updatedAt: true,
          property: { select: { id: true, title: true, city: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          propertyId: true,
          escrowAccount: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.transaction.count({ where }),
    ]);

    // Enrich with seller data from property owner
    const propertyIds = disputes.map((d) => d.propertyId);
    const properties = await db.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, agentId: true },
    });
    const propertyOwnerMap = new Map(properties.map((p) => [p.id, p.agentId]));

    const sellerIds = [...new Set(properties.map((p) => p.agentId))];
    const sellers = await db.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    const disputesWithSeller = disputes.map(({ propertyId, ...d }) => {
      const sellerId = propertyOwnerMap.get(propertyId);
      return {
        ...d,
        seller: sellerId ? sellerMap.get(sellerId) || null : null,
      };
    });

    const [open, inMediation, resolved] = await Promise.all([
      db.transaction.count({ where: { disputeReason: { not: null }, status: 'DISPUTED' } }),
      db.transaction.count({ where: { disputeReason: { not: null }, status: 'NOTARY_IN_PROGRESS' } }),
      db.transaction.count({ where: { disputeReason: { not: null }, status: 'REFUNDED' } }),
    ]);

    return NextResponse.json({
      disputes: disputesWithSeller,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { total, open, inMediation, resolved },
    });
  } catch (error) {
    console.error('Admin disputes error:', error);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactionId, action, resolution, splitBuyer, splitSeller } = body;

    if (!transactionId || !action) {
      return NextResponse.json({ error: 'Missing required fields: transactionId, action' }, { status: 400 });
    }

    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: { escrowAccount: true },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    if (action === 'escalate') {
      const updated = await db.transaction.update({
        where: { id: transactionId },
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
      const updateData: Record<string, unknown> = {
        status: 'REFUNDED',
      };

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

        updateData.commission = transaction.commission;
      }

      const updated = await db.transaction.update({
        where: { id: transactionId },
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
    console.error('Admin disputes update error:', error);
    return NextResponse.json({ error: 'Failed to update dispute' }, { status: 500 });
  }
}
