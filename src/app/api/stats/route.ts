import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantDb, extractTenantFromRequest } from '@/lib/db-tenant';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // Use tenant-aware DB client for automatic country filtering
    const tenantCountry = extractTenantFromRequest(request);
    const tenantDb = getTenantDb(tenantCountry);

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
      shortTermBookingsCount,
    ] = await Promise.all([
      tenantDb.property.count({ where: { status: 'published', ...countryFilter } }),
      tenantDb.transaction.count({
        where: { status: { in: ['CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED', 'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED'] }, ...countryFilter },
      }),
      tenantDb.user.count({ where: { role: { in: ['agent', 'admin'] }, verified: true, ...countryFilter } }),
      tenantDb.artisan.count({ where: { certified: true, ...countryFilter } }),
      tenantDb.course.count({ where: { published: true, ...countryFilter } }),
      tenantDb.review.count({ where: { rating: { gte: 4 }, ...countryFilter } }),
      tenantDb.hotel.count({ where: { status: 'active', ...countryFilter } }),
      tenantDb.guesthouse.count({ where: { status: 'active', ...countryFilter } }),
      db.hotelBooking.count(),
      db.guesthouseBooking.count(),
      db.shortTermRentalBooking.count(),
    ]);

    // Count distinct countries with published properties
    const countriesRaw = await tenantDb.property.findMany({
      where: { status: 'published' },
      select: { country: true },
      distinct: ['country'],
    });
    const countriesCount = countriesRaw.length || 4; // fallback to 4 pilot countries

    // Compute satisfaction from total reviews vs positive reviews
    const totalReviews = await tenantDb.review.count({ where: countryFilter });
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
      hotels: hotelsCount,
      guesthouses: guesthousesCount,
      bookings: hotelBookingsCount + guesthouseBookingsCount + shortTermBookingsCount,
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
      hotels: 0,
      guesthouses: 0,
      bookings: 0,
      shortTermBookings: 0,
    });
  }
}
