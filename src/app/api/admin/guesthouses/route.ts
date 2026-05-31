import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const search = searchParams.get('search') || '';
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');

    if (!country) {
      return NextResponse.json({ error: 'Country parameter is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { country };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [guesthouses, total] = await Promise.all([
      db.guesthouse.findMany({
        where,
        select: {
          id: true, name: true, city: true, country: true,
          overallRating: true, certificationStatus: true, status: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      db.guesthouse.count({ where }),
    ]);

    return NextResponse.json({ data: guesthouses, total });
  } catch (error) {
    console.error('Admin guesthouses error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouses' }, { status: 500 });
  }
}
