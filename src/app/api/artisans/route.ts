import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const artisans = await db.artisan.findMany({
      where: { certified: true },
      orderBy: { rating: 'desc' },
    });

    return NextResponse.json(artisans);
  } catch (error) {
    console.error('Artisans API error:', error);
    return NextResponse.json({ error: 'Failed to fetch artisans' }, { status: 500 });
  }
}
