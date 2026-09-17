import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache, buildCacheKey } from '@/lib/cache';

export async function GET(request: Request) {
  // Aggregate stats are public and identical for every visitor — cache them
  // at the CDN edge (Vercel) to absorb Neon auto-suspend cold starts and make
  // the hero stats render instantly. Fresh window: 5 min; stale-while-revalidate
  // extended to 1h so the first visitor after an idle period gets instant
  // (slightly stale) stats while the edge refreshes in the background.
  const CDN_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
  };
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // Build cache key for stats (10 min TTL)
    const cacheKey = buildCacheKey(
      'stats',
      `platform:${country || 'global'}`,
      country || undefined
    );

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, { headers: CDN_CACHE_HEADERS });
    }

    const countryFilter = country ? { country } : {};

    const [
      propertiesCount,
      transactionsCount,
      agentsCount,
      artisansCount,
      coursesCount,
      reviewsCount,
      hotelsCount,
      guesthousesCount,
      hotelBookingsCount,
      guesthouseBookingsCount,
    ] = await Promise.all([
      db.property.count({ where: { status: 'published', ...countryFilter } }),
      db.transaction.count({
        where: { status: { in: ['CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED', 'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED'] }, ...countryFilter },
      }),
      db.user.count({ where: { role: { in: ['agent', 'admin'] }, verified: true, ...countryFilter } }),
      db.artisan.count({ where: { certified: true, ...countryFilter } }),
      db.course.count({ where: { published: true, ...countryFilter } }),
      db.review.count({ where: { rating: { gte: 4 }, ...countryFilter } }),
      db.hotel.count({ where: { status: 'active', ...countryFilter } }),
      db.guesthouse.count({ where: { status: 'active', ...countryFilter } }),
      db.hotelBooking.count(),
      db.guesthouseBooking.count(),
    ]);

    // Count distinct countries with published properties
    const countriesRaw = await db.property.findMany({
      where: { status: 'published' },
      select: { country: true },
      distinct: ['country'],
    });
    const countriesCount = countriesRaw.length || 4; // fallback to 4 pilot countries

    // Compute satisfaction from total reviews vs positive reviews
    const totalReviews = await db.review.count({ where: countryFilter });
    const satisfaction = totalReviews > 0
      ? Math.round((reviewsCount / totalReviews) * 100)
      : 98; // fallback

    const responseData = {
      properties: propertiesCount,
      transactions: transactionsCount,
      countries: countriesCount,
      agents: agentsCount,
      satisfaction,
      artisans: artisansCount,
      courses: coursesCount,
      hotels: hotelsCount,
      guesthouses: guesthousesCount,
      bookings: hotelBookingsCount + guesthouseBookingsCount,
    };

    // Cache platform stats for 10 minutes
    await cache.set(cacheKey, responseData, 600);

    return NextResponse.json(responseData, { headers: CDN_CACHE_HEADERS });
  } catch (error) {
    console.error('Stats API error:', error);
    // 503 (not 200 + fake zeros): the old fallback answered "properties: 0"
    // with a 200 status, so react-query cached it as a VALID result for the
    // whole staleTime (5 min) — visitors literally saw "0 biens" for minutes
    // before a refetch revealed the real numbers. A 503 is treated as
    // transient by both the browser retry layer and react-query, so the
    // request is re-attempted (typically succeeding right after the Neon
    // wake-up) and is never cached at the CDN.
    return NextResponse.json(
      { error: 'Stats temporarily unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
