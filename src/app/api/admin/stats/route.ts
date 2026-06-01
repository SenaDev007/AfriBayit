import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // Base filters
    const userWhere = country && country !== 'ALL' ? { country } : {};
    const propertyWhere = country && country !== 'ALL' ? { country } : {};
    const transactionWhere = country && country !== 'ALL' ? { country } : {};

    // Users stats
    const [totalUsers, usersByCountry, usersByRole, recentUsers7d, recentUsers30d] = await Promise.all([
      db.user.count({ where: userWhere }),
      db.user.groupBy({ by: ['country'], where: userWhere, _count: { country: true } }),
      db.user.groupBy({ by: ['role'], where: userWhere, _count: { role: true } }),
      db.user.count({
        where: {
          ...userWhere,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      db.user.count({
        where: {
          ...userWhere,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Properties stats
    const [totalProperties, propertiesByCountry, propertiesByStatus, pendingProperties] =
      await Promise.all([
        db.property.count({ where: propertyWhere }),
        db.property.groupBy({ by: ['country'], where: propertyWhere, _count: { country: true } }),
        db.property.groupBy({ by: ['status'], where: propertyWhere, _count: { status: true } }),
        db.property.count({
          where: { ...propertyWhere, status: { in: ['pending', 'ai_review', 'human_review'] } },
        }),
      ]);

    // Transactions stats
    const [totalTransactions, transactionAggregates, transactionsByStatus] = await Promise.all([
      db.transaction.count({ where: transactionWhere }),
      db.transaction.aggregate({
        where: transactionWhere,
        _sum: { amount: true, commission: true },
      }),
      db.transaction.groupBy({
        by: ['status'],
        where: transactionWhere,
        _count: { status: true },
      }),
    ]);

    // Escrow stats
    const [activeEscrow, escrowAggregates] = await Promise.all([
      db.escrowAccount.count({
        where: { status: { in: ['FUNDED', 'PARTIAL_RELEASE'] } },
      }),
      db.escrowAccount.aggregate({
        where: { status: { in: ['FUNDED', 'PARTIAL_RELEASE'] } },
        _sum: { heldAmount: true },
      }),
    ]);

    // KYC pending
    const pendingKyc = await db.kycDocument.count({
      where: {
        status: 'pending',
        ...(country && country !== 'ALL' ? { country } : {}),
      },
    });

    // Active users in last 24h
    const activeUsers24h = await db.user.count({
      where: {
        ...userWhere,
        lastSeenAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    // Monthly revenue (commissions) for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTransactions = await db.transaction.findMany({
      where: {
        ...transactionWhere,
        status: 'RELEASED',
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { commission: true, createdAt: true },
    });

    const monthlyRevenue: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = 0;
    }

    for (const tx of monthlyTransactions) {
      const key = `${tx.createdAt.getFullYear()}-${String(tx.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += tx.commission;
      }
    }

    // Format response
    const byCountry: Record<string, number> = {};
    for (const item of usersByCountry) {
      if (item.country) byCountry[item.country] = item._count.country;
    }

    const byRole: Record<string, number> = {};
    for (const item of usersByRole) {
      byRole[item.role] = item._count.role;
    }

    const propByCountry: Record<string, number> = {};
    for (const item of propertiesByCountry) {
      propByCountry[item.country] = item._count.country;
    }

    const byStatus: Record<string, number> = {};
    for (const item of propertiesByStatus) {
      byStatus[item.status] = item._count.status;
    }

    const txByStatus: Record<string, number> = {};
    for (const item of transactionsByStatus) {
      txByStatus[item.status] = item._count.status;
    }

    // Hospitality stats
    const [totalHotels, totalGuesthouses, totalHotelBookings, totalGuesthouseBookings] =
      await Promise.all([
        db.hotel.count({ where: country && country !== 'ALL' ? { country } : {} }),
        db.guesthouse.count({ where: country && country !== 'ALL' ? { country } : {} }),
        db.hotelBooking.count({
          where: country && country !== 'ALL'
            ? { hotel: { country } }
            : {},
        }),
        db.guesthouseBooking.count({
          where: country && country !== 'ALL'
            ? { guesthouse: { country } }
            : {},
        }),
      ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        byCountry: byCountry,
        byRole: byRole,
        recent7d: recentUsers7d,
        recent30d: recentUsers30d,
      },
      properties: {
        total: totalProperties,
        byCountry: propByCountry,
        byStatus: byStatus,
        pending: pendingProperties,
      },
      transactions: {
        total: totalTransactions,
        totalVolume: transactionAggregates._sum.amount || 0,
        totalCommission: transactionAggregates._sum.commission || 0,
        byStatus: txByStatus,
      },
      escrow: {
        active: activeEscrow,
        totalHeld: escrowAggregates._sum.heldAmount || 0,
      },
      kyc: {
        pending: pendingKyc,
      },
      hospitality: {
        hotels: totalHotels,
        guesthouses: totalGuesthouses,
        hotelBookings: totalHotelBookings,
        guesthouseBookings: totalGuesthouseBookings,
      },
      revenue: {
        monthly: Object.entries(monthlyRevenue).map(([month, amount]) => ({ month, amount })),
      },
      platform: {
        activeUsers24h,
        uptime: 99.9,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
