import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const speciality = searchParams.get('speciality');
    const certificationLevel = searchParams.get('certificationLevel');
    const zone = searchParams.get('zone');
    const available = searchParams.get('available');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { certified: true };

    if (speciality) {
      where.specialities = { contains: speciality };
    }
    if (certificationLevel) where.certificationLevel = certificationLevel;
    if (zone) where.zone = zone;
    if (available === 'true') where.available = true;

    const [geometers, total] = await Promise.all([
      db.geometer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      db.geometer.count({ where }),
    ]);

    return NextResponse.json({
      geometers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Geotrust geometers API error:', error);
    return NextResponse.json({ error: 'Failed to fetch geometers' }, { status: 500 });
  }
}
