import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const planType = searchParams.get('planType');
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');

    const where: Record<string, unknown> = {};
    if (planType) where.planType = planType;
    if (status) where.status = status;
    if (country && country !== 'ALL') where.country = country;

    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true, country: true },
          },
        },
      }),
      db.subscription.count({ where }),
    ]);

    const activeCount = await db.subscription.count({ where: { status: 'active' } });
    const mrrResult = await db.subscription.aggregate({
      where: { status: 'active', autoRenew: true },
      _sum: { priceXof: true },
    });
    const byPlan = await db.subscription.groupBy({ by: ['planType'], where: { status: 'active' }, _count: true });
    const byStatus = await db.subscription.groupBy({ by: ['status'], _count: true });

    const mostPopular = byPlan.sort((a, b) => b._count - a._count)[0]?.planType || '-';

    return NextResponse.json({
      subscriptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        active: activeCount,
        mrr: mrrResult._sum.priceXof || 0,
        churnRate: byStatus.find((s) => s.status === 'cancelled')?._count
          ? Math.round(
              (byStatus.find((s) => s.status === 'cancelled')!._count /
                (activeCount + byStatus.find((s) => s.status === 'cancelled')!._count || 1)) *
                100
            )
          : 0,
        mostPopularPlan: mostPopular,
      },
    });
  } catch (error) {
    console.error('Admin subscriptions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
  }
}
