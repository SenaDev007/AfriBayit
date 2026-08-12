import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'listings';
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (tab === 'bookings') {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (country) where.rental = { country };

      if (search) {
        where.OR = [
          { bookingRef: { contains: search, mode: 'insensitive' } },
          { rental: { title: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [bookings, total] = await Promise.all([
        db.shortTermRentalBooking.findMany({
          where,
          include: {
            rental: { select: { id: true, title: true, city: true, country: true } },
            user: { select: { id: true, name: true, email: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.shortTermRentalBooking.count({ where }),
      ]);

      const [totalListings, totalBookings, activeListings, pendingBookings] = await Promise.all([
        db.shortTermRental.count(),
        db.shortTermRentalBooking.count(),
        db.shortTermRental.count({ where: { status: 'active' } }),
        db.shortTermRentalBooking.count({ where: { status: 'pending' } }),
      ]);

      return NextResponse.json({
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { totalListings, totalBookings, activeListings, pendingBookings },
      });
    }

    // Default: tab === 'listings'
    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { propertyType: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      db.shortTermRental.findMany({
        where,
        select: {
          id: true,
          title: true,
          propertyType: true,
          city: true,
          country: true,
          pricePerNight: true,
          currency: true,
          rating: true,
          status: true,
          hostVerified: true,
          createdAt: true,
          hostId: true,
          _count: { select: { bookings: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.shortTermRental.count({ where }),
    ]);

    // Fetch host data separately since there's no relation
    const hostIds = [...new Set(listings.map((l) => l.hostId))];
    const hosts = await db.user.findMany({
      where: { id: { in: hostIds } },
      select: { id: true, name: true, email: true, avatar: true },
    });
    const hostMap = new Map(hosts.map((h) => [h.id, h]));
    const listingsWithHost = listings.map(({ hostId, ...listing }) => ({
      ...listing,
      owner: hostMap.get(hostId) || null,
    }));

    const [totalListings, totalBookings, activeListings, pendingBookings] = await Promise.all([
      db.shortTermRental.count(),
      db.shortTermRentalBooking.count(),
      db.shortTermRental.count({ where: { status: 'active' } }),
      db.shortTermRentalBooking.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({
      listings: listingsWithHost,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { totalListings, totalBookings, activeListings, pendingBookings },
    });
  } catch (error) {
    console.error('Admin short-term-rentals error:', error);
    return NextResponse.json({ error: 'Failed to fetch short-term rentals data' }, { status: 500 });
  }
}
