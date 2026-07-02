import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const country = searchParams.get('country') || '';

    const where: Record<string, unknown> = {};
    if (country) where.country = country;

    // Total revenue
    const totalRevenueResult = await db.transaction.aggregate({
      _sum: { amount: true, commission: true },
      _count: true,
      where: { ...where, status: 'RELEASED' },
    });

    // Revenue by country
    const byCountryRaw = await db.transaction.groupBy({
      by: ['country'],
      _sum: { amount: true },
      _count: { id: true },
      where: { ...where, status: 'RELEASED' },
    });

    const byCountry = byCountryRaw.map((row) => ({
      country: row.country,
      revenue: row._sum.amount ?? 0,
      count: row._count.id,
    }));

    // Monthly trend — compute date range based on period
    const now = new Date();
    let monthsBack = 12;
    if (period === 'quarter') monthsBack = 3;
    if (period === 'year') monthsBack = 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

    const monthlyTransactions = await db.transaction.findMany({
      where: { ...where, status: 'RELEASED', createdAt: { gte: startDate } },
      select: { amount: true, commission: true, createdAt: true },
    });

    const monthlyMap = new Map<string, { revenue: number; commission: number }>();
    for (const txn of monthlyTransactions) {
      const monthKey = txn.createdAt.toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyMap.get(monthKey) || { revenue: 0, commission: 0 };
      existing.revenue += txn.amount;
      existing.commission += txn.commission;
      monthlyMap.set(monthKey, existing);
    }

    const monthlyTrend = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, revenue: data.revenue, commission: data.commission }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // By source (using paymentProvider field)
    const bySourceRaw = await db.transaction.groupBy({
      by: ['paymentProvider'],
      _sum: { amount: true },
      where: { ...where, status: 'RELEASED' },
    });

    const bySource = bySourceRaw.map((row) => ({
      source: row.paymentProvider || 'unknown',
      revenue: row._sum.amount ?? 0,
    }));

    // Top agents (property owners by revenue)
    const releasedTransactions = await db.transaction.findMany({
      where: { ...where, status: 'RELEASED' },
      select: { propertyId: true, amount: true, commission: true },
    });

    const propertyIds = releasedTransactions.map((t) => t.propertyId);
    const properties = await db.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, agentId: true },
    });
    const propertyAgentMap = new Map(properties.map((p) => [p.id, p.agentId]));

    const agentRevenueMap = new Map<string, { revenue: number; commission: number }>();
    for (const txn of releasedTransactions) {
      const agentId = propertyAgentMap.get(txn.propertyId);
      if (!agentId) continue;
      const existing = agentRevenueMap.get(agentId) || { revenue: 0, commission: 0 };
      existing.revenue += txn.amount;
      existing.commission += txn.commission;
      agentRevenueMap.set(agentId, existing);
    }

    const topAgentIds = [...agentRevenueMap.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 10)
      .map(([id]) => id);

    const topAgentUsers = await db.user.findMany({
      where: { id: { in: topAgentIds } },
      select: { id: true, name: true },
    });
    const agentUserMap = new Map(topAgentUsers.map((u) => [u.id, u.name]));

    const topAgents = topAgentIds.map((agentId) => {
      const data = agentRevenueMap.get(agentId)!;
      return {
        agentId,
        agentName: agentUserMap.get(agentId) || 'Unknown',
        revenue: data.revenue,
        commission: data.commission,
      };
    });

    // Subscription tiers
    const subscriptionTiersRaw = await db.subscription.groupBy({
      by: ['planType'],
      _sum: { priceXof: true },
      _count: { id: true },
      where: { status: 'active' },
    });

    const subscriptionTiers = subscriptionTiersRaw.map((row) => ({
      tier: row.planType,
      count: row._count.id,
      revenue: row._sum.priceXof ?? 0,
    }));

    return NextResponse.json({
      totalRevenue: totalRevenueResult._sum.amount ?? 0,
      totalCommission: totalRevenueResult._sum.commission ?? 0,
      transactionCount: totalRevenueResult._count,
      byCountry,
      monthlyTrend,
      bySource,
      topAgents,
      subscriptionTiers,
    });
  } catch (error) {
    console.error('Admin revenue error:', error);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
