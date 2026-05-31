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
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { quartier: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        select: {
          id: true, title: true, type: true, transaction: true,
          price: true, currency: true, city: true, quartier: true,
          status: true, verified: true, createdAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({ data: properties, total });
  } catch (error) {
    console.error('Admin properties error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}
