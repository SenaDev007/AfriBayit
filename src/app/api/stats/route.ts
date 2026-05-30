import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [
      propertiesCount,
      transactionsCount,
      agentsCount,
      artisansCount,
      coursesCount,
      reviewsCount,
    ] = await Promise.all([
      db.property.count({ where: { status: 'published' } }),
      db.transaction.count({
        where: { status: { in: ['DEED_SIGNED', 'RELEASED', 'ANDF_REGISTERED'] } },
      }),
      db.user.count({ where: { role: { in: ['agent', 'admin'] }, verified: true } }),
      db.artisan.count({ where: { certified: true } }),
      db.course.count({ where: { published: true } }),
      db.review.count({ where: { rating: { gte: 4 } } }),
    ]);

    // Count distinct countries with published properties
    const countriesRaw = await db.property.findMany({
      where: { status: 'published' },
      select: { country: true },
      distinct: ['country'],
    });
    const countriesCount = countriesRaw.length || 4; // fallback to 4 pilot countries

    // Compute satisfaction from total reviews vs positive reviews
    const totalReviews = await db.review.count();
    const satisfaction = totalReviews > 0
      ? Math.round((reviewsCount / totalReviews) * 100)
      : 98; // fallback

    return NextResponse.json({
      properties: propertiesCount,
      transactions: transactionsCount,
      countries: countriesCount,
      agents: agentsCount,
      satisfaction,
      artisans: artisansCount,
      courses: coursesCount,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    // Return fallback values on error
    return NextResponse.json({
      properties: 0,
      transactions: 0,
      countries: 4,
      agents: 0,
      satisfaction: 98,
      artisans: 0,
      courses: 0,
    });
  }
}
