import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    const countryFilter = country && country !== 'ALL' ? { country } : {};

    // Run all aggregations in parallel
    const [
      totalUsers,
      usersByRole,
      usersByCountry,
      recentUsers7d,
      recentUsers30d,
      totalProperties,
      propertiesByStatus,
      propertiesByCountry,
      pendingProperties,
      totalTransactions,
      transactionsByStatus,
      transactionStats,
      activeEscrow,
      escrowHeld,
      pendingKyc,
    ] = await Promise.all([
      // Users
      db.user.count({ where: countryFilter }),
      db.user.groupBy({ by: ['role'], where: countryFilter, _count: true }),
      db.user.groupBy({ by: ['country'], where: { ...countryFilter, country: { not: null } }, _count: true }),
      db.user.count({
        where: {
          ...countryFilter,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      db.user.count({
        where: {
          ...countryFilter,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      // Properties
      db.property.count({ where: countryFilter }),
      db.property.groupBy({ by: ['status'], where: countryFilter, _count: true }),
      db.property.groupBy({ by: ['country'], where: countryFilter, _count: true }),
      db.property.count({ where: { status: 'pending', ...countryFilter } }),
      // Transactions
      db.transaction.count({ where: countryFilter }),
      db.transaction.groupBy({ by: ['status'], where: countryFilter, _count: true }),
      db.transaction.aggregate({
        where: countryFilter,
        _sum: { amount: true, commission: true },
      }),
      // Escrow
      db.escrowAccount.count({
        where: { status: { in: ['FUNDED', 'PARTIAL_RELEASE'] } },
      }),
      db.escrowAccount.aggregate({
        where: { status: { in: ['FUNDED', 'PARTIAL_RELEASE'] } },
        _sum: { heldAmount: true },
      }),
      // KYC
      db.kycDocument.count({ where: { status: 'pending' } }),
    ]);

    // Build byRole map
    const byRoleMap: Record<string, number> = {};
    usersByRole.forEach((item) => {
      byRoleMap[item.role] = item._count;
    });

    // Build byCountry map
    const byCountryMap: Record<string, number> = {};
    usersByCountry.forEach((item) => {
      if (item.country) {
        byCountryMap[item.country] = item._count;
      }
    });

    // Build properties by status
    const propByStatusMap: Record<string, number> = {};
    propertiesByStatus.forEach((item) => {
      propByStatusMap[item.status] = item._count;
    });

    // Build properties by country
    const propByCountryMap: Record<string, number> = {};
    propertiesByCountry.forEach((item) => {
      propByCountryMap[item.country] = item._count;
    });

    // Build transactions by status
    const txByStatusMap: Record<string, number> = {};
    transactionsByStatus.forEach((item) => {
      txByStatusMap[item.status] = item._count;
    });

    // Generate monthly revenue data (last 12 months)
    const monthlyRevenue: Array<{ month: string; amount: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthLabel = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });

      // Get transactions completed in this month
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const monthCommission = await db.transaction.aggregate({
        where: {
          ...countryFilter,
          status: 'RELEASED',
          escrowReleasedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { commission: true },
      });

      monthlyRevenue.push({
        month: monthLabel,
        amount: monthCommission._sum.commission || 0,
      });
    }

    // Active users in last 24h (approximation from lastSeenAt)
    const activeUsers24h = await db.user.count({
      where: {
        ...countryFilter,
        lastSeenAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        byRole: byRoleMap,
        byCountry: byCountryMap,
        recent7d: recentUsers7d,
        recent30d: recentUsers30d,
      },
      properties: {
        total: totalProperties,
        byStatus: propByStatusMap,
        byCountry: propByCountryMap,
        pending: pendingProperties,
      },
      transactions: {
        total: totalTransactions,
        totalVolume: transactionStats._sum.amount || 0,
        totalCommission: transactionStats._sum.commission || 0,
        byStatus: txByStatusMap,
      },
      escrow: {
        active: activeEscrow,
        totalHeld: escrowHeld._sum.heldAmount || 0,
      },
      kyc: {
        pending: pendingKyc,
      },
      revenue: {
        monthly: monthlyRevenue,
      },
      platform: {
        activeUsers24h,
        uptime: 99.9,
      },
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
