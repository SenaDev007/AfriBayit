import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build escrow account filter
    const escrowWhere: Record<string, unknown> = {};
    if (status) escrowWhere.status = status;

    // Build transaction filter (for country/search)
    const txFilter: Record<string, unknown> = {};
    if (country) txFilter.country = country;
    if (search) {
      txFilter.OR = [
        { escrowReference: { contains: search } },
        { paymentRef: { contains: search } },
      ];
    }

    if (Object.keys(txFilter).length > 0) {
      escrowWhere.transaction = txFilter;
    }

    const [accounts, total] = await Promise.all([
      db.escrowAccount.findMany({
        where: escrowWhere,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          transaction: {
            select: {
              id: true,
              propertyId: true,
              buyerId: true,
              sellerId: true,
              amount: true,
              commission: true,
              currency: true,
              country: true,
              status: true,
              escrowReference: true,
              disputeReason: true,
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
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      }),
      db.escrowAccount.count({ where: escrowWhere }),
    ]);

    // Enrich with seller info
    const enrichedAccounts = await Promise.all(
      accounts.map(async (account) => {
        const tx = account.transaction as Record<string, unknown> | null;
        let seller: { id: string; name: string; email: string } | null = null;
        if (tx && tx.sellerId) {
          seller = await db.user.findUnique({
            where: { id: tx.sellerId as string },
            select: { id: true, name: true, email: true },
          });
        }
        return {
          ...account,
          transaction: {
            ...(tx || {}),
            seller,
          },
        };
      })
    );

    // Summary stats
    const [totalHeldResult, activeDisputes, releasedTodayResult] = await Promise.all([
      db.escrowAccount.aggregate({
        where: { status: { in: ['FUNDED', 'PARTIAL_RELEASE'] } },
        _sum: { heldAmount: true },
      }),
      db.escrowAccount.count({
        where: { status: 'DISPUTED' },
      }),
      db.escrowAccount.count({
        where: {
          status: 'FULL_RELEASE',
          releasedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    // Compute average hold time (from fundedAt to releasedAt for FULL_RELEASE accounts)
    const releasedAccounts = await db.escrowAccount.findMany({
      where: {
        status: 'FULL_RELEASE',
        fundedAt: { not: null },
        releasedAt: { not: null },
      },
      select: { fundedAt: true, releasedAt: true },
      take: 100,
      orderBy: { releasedAt: 'desc' },
    });

    let avgHoldTimeHours = 0;
    if (releasedAccounts.length > 0) {
      const totalHours = releasedAccounts.reduce((acc, a) => {
        if (a.fundedAt && a.releasedAt) {
          return acc + (new Date(a.releasedAt).getTime() - new Date(a.fundedAt).getTime()) / (1000 * 60 * 60);
        }
        return acc;
      }, 0);
      avgHoldTimeHours = Math.round((totalHours / releasedAccounts.length) * 10) / 10;
    }

    return NextResponse.json({
      accounts: enrichedAccounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalHeld: totalHeldResult._sum.heldAmount || 0,
        activeDisputes,
        releasedToday: releasedTodayResult,
        avgHoldTimeHours,
      },
    });
  } catch (error) {
    console.error('Admin escrow API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escrow accounts' },
      { status: 500 }
    );
  }
}
