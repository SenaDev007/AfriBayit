import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) {
      where.country = country;
    }
    if (status) {
      where.status = status;
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        select: {
          id: true, amount: true, commission: true, currency: true,
          status: true, country: true, createdAt: true,
          property: { select: { id: true, title: true } },
          buyer: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.transaction.count({ where }),
    ]);

    const pages = Math.ceil(total / limit);

    // Financial overview
    const allTransactions = await db.transaction.findMany({
      where,
      select: { amount: true, commission: true, status: true },
    });

    const totalVolume = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCommission = allTransactions.reduce((sum, t) => sum + (t.commission || 0), 0);

    const byStatus: Record<string, number> = {};
    for (const t of allTransactions) {
      const s = t.status || 'unknown';
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    return NextResponse.json({
      transactions,
      pagination: { page, limit, total, pages },
      financialOverview: { totalVolume, totalCommission, byStatus },
    });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
