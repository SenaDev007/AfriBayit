import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    const transactionWhere = country && country !== 'ALL' ? { country } : {};

    // Country comparison data
    const PILOT_COUNTRIES = ['BJ', 'CI', 'BF', 'TG'];
    const countryComparison = await Promise.all(
      PILOT_COUNTRIES.map(async (code) => {
        const [users, properties, transactions, txAgg] = await Promise.all([
          db.user.count({ where: { country: code } }),
          db.property.count({ where: { country: code } }),
          db.transaction.count({ where: { country: code } }),
          db.transaction.aggregate({
            where: { country: code },
            _sum: { amount: true, commission: true },
          }),
        ]);
        return {
          code,
          users,
          properties,
          transactions,
          volume: txAgg._sum.amount || 0,
          commission: txAgg._sum.commission || 0,
        };
      })
    );

    // Monthly trends (last 6 months) for users, properties, transactions
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTransactions = await db.transaction.findMany({
      where: {
        ...transactionWhere,
        createdAt: { gte: sixMonthsAgo },
      },
      select: { amount: true, commission: true, country: true, createdAt: true, status: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Revenue by country for pie chart
    const revenueByCountry = countryComparison.map((c) => ({
      country: c.code,
      revenue: c.commission,
    }));

    // Properties by type
    const propertiesByType = await db.property.groupBy({
      by: ['type'],
      where: country && country !== 'ALL' ? { country } : {},
      _count: { type: true },
    });

    // Transaction status distribution
    const txStatusDist = await db.transaction.groupBy({
      by: ['status'],
      where: transactionWhere,
      _count: { status: true },
    });

    return NextResponse.json({
      countryComparison,
      revenueByCountry,
      recentTransactions,
      propertiesByType: propertiesByType.map((p) => ({ type: p.type, count: p._count.type })),
      transactionStatusDistribution: txStatusDist.map((t) => ({
        status: t.status,
        count: t._count.status,
      })),
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
