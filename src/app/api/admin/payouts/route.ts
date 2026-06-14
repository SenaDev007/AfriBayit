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

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { destination: { contains: search, mode: 'insensitive' } },
        { providerRef: { contains: search, mode: 'insensitive' } },
        { confirmationRef: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [payouts, total] = await Promise.all([
      db.scheduledPayout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      db.scheduledPayout.count({ where }),
    ]);

    // Fetch recipient users separately since there's no relation
    const recipientIds = [...new Set(payouts.map((p) => p.recipientId))];
    const recipients = await db.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, name: true, email: true, country: true },
    });
    const recipientMap = new Map(recipients.map((r) => [r.id, r]));

    const payoutsWithUser = payouts.map(({ recipientId, ...payout }) => ({
      ...payout,
      user: recipientMap.get(recipientId) || null,
    }));

    const [totalPending, totalCompleted, totalAmountResult, pendingAmountResult] = await Promise.all([
      db.scheduledPayout.count({ where: { status: 'scheduled' } }),
      db.scheduledPayout.count({ where: { status: 'completed' } }),
      db.scheduledPayout.aggregate({ _sum: { amount: true } }),
      db.scheduledPayout.aggregate({ _sum: { amount: true }, where: { status: 'scheduled' } }),
    ]);

    return NextResponse.json({
      payouts: payoutsWithUser,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        total,
        pending: totalPending,
        completed: totalCompleted,
        totalAmount: totalAmountResult._sum.amount ?? 0,
        pendingAmount: pendingAmountResult._sum.amount ?? 0,
      },
    });
  } catch (error) {
    console.error('Admin payouts error:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { payoutId, action } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: 'Missing required fields: payoutId, action' }, { status: 400 });
    }

    const payout = await db.scheduledPayout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    if (action === 'process') {
      const updated = await db.scheduledPayout.update({
        where: { id: payoutId },
        data: {
          status: 'processing',
        },
      });
      return NextResponse.json({ success: true, payout: updated });
    }

    if (action === 'cancel') {
      const updated = await db.scheduledPayout.update({
        where: { id: payoutId },
        data: {
          status: 'failed',
          failureReason: 'Cancelled by admin',
        },
      });
      return NextResponse.json({ success: true, payout: updated });
    }

    return NextResponse.json({ error: 'Invalid action. Use process or cancel.' }, { status: 400 });
  } catch (error) {
    console.error('Admin payouts update error:', error);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}
