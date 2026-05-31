import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};
    if (country && country !== 'ALL') where.country = country;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { walletBalance: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          country: true,
          currency: true,
          walletBalance: true,
          escrowHeld: true,
          pendingPayout: true,
          role: true,
          createdAt: true,
          _count: { select: { walletTxns: true } },
        },
      }),
      db.user.count({ where }),
    ]);

    const totals = await db.user.aggregate({
      _sum: { walletBalance: true, escrowHeld: true, pendingPayout: true },
    });

    return NextResponse.json({
      wallets: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalBalance: totals._sum.walletBalance || 0,
        totalEscrow: totals._sum.escrowHeld || 0,
        totalPendingPayout: totals._sum.pendingPayout || 0,
      },
    });
  } catch (error) {
    console.error('Admin wallets API error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 });
  }
}
