import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');

    if (!country) {
      return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { country };
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
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({ data: transactions, total });
  } catch (error) {
    console.error('Admin transactions error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
