import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantDb, extractTenantFromRequest } from '@/lib/db-tenant';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const propertyType = searchParams.get('propertyType');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const guests = searchParams.get('guests');
    const amenities = searchParams.get('amenities');
    const search = searchParams.get('search');
    const instantBooking = searchParams.get('instantBooking');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Use tenant-aware DB client for automatic country filtering
    const tenantCountry = extractTenantFromRequest(request);
    const tenantDb = getTenantDb(tenantCountry);

    const where: Record<string, unknown> = { status: 'active' };

    if (country) where.country = country;
    if (city) where.city = city;
    if (propertyType) where.propertyType = propertyType;
    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};
      if (priceMin) priceFilter.gte = parseFloat(priceMin);
      if (priceMax) priceFilter.lte = parseFloat(priceMax);
      where.pricePerNight = priceFilter;
    }
    if (guests) where.maxGuests = { gte: parseInt(guests) };
    if (instantBooking === 'true') where.instantBooking = true;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { quartier: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If dates provided, exclude rentals with conflicting bookings
    let excludeIds: string[] = [];
    if (checkIn && checkOut) {
      const conflictingBookings = await db.shortTermRentalBooking.findMany({
        where: {
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
          status: { in: ['pending', 'confirmed', 'checked_in'] },
        },
        select: { rentalId: true },
        distinct: ['rentalId'],
      });
      excludeIds = conflictingBookings.map((b) => b.rentalId);
    }

    if (excludeIds.length > 0) {
      where.id = { notIn: excludeIds };
    }

    const [rentals, total] = await Promise.all([
      tenantDb.shortTermRental.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
        include: {
          _count: { select: { bookings: true, reviews_str: true } },
          pricingRules: { where: { period: { in: ['high_season', 'low_season', 'weekend', 'event', 'holiday'] } } },
        },
      }),
      tenantDb.shortTermRental.count({ where }),
    ]);

    // Filter by amenities if specified (JSON field filter - post-query)
    let filtered = rentals;
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim().toLowerCase());
      filtered = rentals.filter((rental) => {
        try {
          const rentalAmenities = JSON.parse(rental.amenities || '[]') as string[];
          return amenityList.every((a) => rentalAmenities.some((ra) => ra.toLowerCase() === a));
        } catch {
          return false;
        }
      });
    }

    return NextResponse.json({
      rentals: filtered,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Short-term rentals API error:', error);
    return NextResponse.json({ error: 'Failed to fetch short-term rentals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const rental = await db.shortTermRental.create({
      data: {
        hostId: auth.userId,
        title: body.title,
        slug: body.slug,
        description: body.description,
        propertyType: body.propertyType || 'appartement',
        city: body.city,
        country: body.country,
        quartier: body.quartier,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        images: body.images ? JSON.stringify(body.images) : null,
        pricePerNight: body.pricePerNight,
        weeklyPrice: body.weeklyPrice,
        monthlyPrice: body.monthlyPrice,
        currency: body.currency || 'XOF',
        maxGuests: body.maxGuests || 2,
        bedrooms: body.bedrooms || 1,
        bathrooms: body.bathrooms || 1,
        beds: body.beds || 1,
        amenities: body.amenities ? JSON.stringify(body.amenities) : null,
        houseRules: body.houseRules ? JSON.stringify(body.houseRules) : null,
        instantBooking: body.instantBooking ?? false,
        minStayNights: body.minStayNights || 1,
        maxStayNights: body.maxStayNights,
        cancellationPolicy: body.cancellationPolicy || 'flexible',
        cleaningFee: body.cleaningFee || 0,
        securityDeposit: body.securityDeposit || 0,
        otaRefs: body.otaRefs ? JSON.stringify(body.otaRefs) : null,
        hostVerified: body.hostVerified ?? false,
        hostIdentityVerified: body.hostIdentityVerified ?? false,
        status: 'active',
      },
    });

    return NextResponse.json(rental, { status: 201 });
  } catch (error) {
    console.error('Short-term rental creation error:', error);
    return NextResponse.json({ error: 'Failed to create short-term rental' }, { status: 500 });
  }
}
