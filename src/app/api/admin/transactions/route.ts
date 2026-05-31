import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};

    if (status) where.status = status;
    if (country) where.country = country;
    if (search) {
      where.OR = [
        { escrowReference: { contains: search } },
        { paymentRef: { contains: search } },
      ];
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              type: true,
              city: true,
              country: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          escrowAccount: {
            select: {
              id: true,
              status: true,
              balance: true,
              heldAmount: true,
            },
          },
          timelineEvents: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      db.transaction.count({ where }),
    ]);

    // Financial overview
    const financialOverview = await db.transaction.aggregate({
      where,
      _sum: {
        amount: true,
        commission: true,
      },
      _count: true,
    });

    const byStatus = await db.transaction.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusMap[item.status] = item._count;
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      financialOverview: {
        totalAmount: financialOverview._sum.amount || 0,
        totalCommission: financialOverview._sum.commission || 0,
        totalTransactions: financialOverview._count,
        byStatus: statusMap,
      },
    });
  } catch (error) {
    console.error('Admin transactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
