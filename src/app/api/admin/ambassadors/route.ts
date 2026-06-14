import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'ambassadors';
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const tier = searchParams.get('tier') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (tab === 'commissions') {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (country) where.ambassador = { user: { country } };

      if (search) {
        where.OR = [
          { ambassador: { referralCode: { contains: search, mode: 'insensitive' } } },
          { ambassador: { user: { name: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      const [commissions, total] = await Promise.all([
        db.ambassadorCommission.findMany({
          where,
          include: {
            ambassador: { include: { user: { select: { id: true, name: true } } } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.ambassadorCommission.count({ where }),
      ]);

      const [totalAmbassadors, totalCommissions, totalEarnings, byTierRaw] = await Promise.all([
        db.ambassador.count(),
        db.ambassadorCommission.count(),
        db.ambassador.aggregate({ _sum: { totalEarnings: true } }),
        db.ambassador.groupBy({ by: ['tier'], _count: { tier: true } }),
      ]);

      const byTier: Record<string, number> = {};
      for (const row of byTierRaw) {
        byTier[row.tier] = row._count.tier;
      }

      return NextResponse.json({
        commissions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: {
          totalAmbassadors,
          totalCommissions,
          totalEarnings: totalEarnings._sum.totalEarnings ?? 0,
          byTier,
        },
      });
    }

    // Default: tab === 'ambassadors'
    const where: Record<string, unknown> = {};
    if (tier) where.tier = tier;
    if (status) where.status = status;
    if (country) where.user = { country };

    if (search) {
      where.OR = [
        { referralCode: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [ambassadors, total] = await Promise.all([
      db.ambassador.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, country: true } },
          _count: { select: { commissions: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.ambassador.count({ where }),
    ]);

    const [totalAmbassadors, totalCommissions, totalEarnings, byTierRaw] = await Promise.all([
      db.ambassador.count(),
      db.ambassadorCommission.count(),
      db.ambassador.aggregate({ _sum: { totalEarnings: true } }),
      db.ambassador.groupBy({ by: ['tier'], _count: { tier: true } }),
    ]);

    const byTier: Record<string, number> = {};
    for (const row of byTierRaw) {
      byTier[row.tier] = row._count.tier;
    }

    return NextResponse.json({
      ambassadors,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalAmbassadors,
        totalCommissions,
        totalEarnings: totalEarnings._sum.totalEarnings ?? 0,
        byTier,
      },
    });
  } catch (error) {
    console.error('Admin ambassadors error:', error);
    return NextResponse.json({ error: 'Failed to fetch ambassadors data' }, { status: 500 });
  }
}
