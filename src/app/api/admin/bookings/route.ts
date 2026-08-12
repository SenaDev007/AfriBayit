import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'hotels';
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (tab === 'guesthouses') {
      const where: Record<string, unknown> = {};
      if (status) where.status = status;
      if (country) where.guesthouse = { country };

      if (search) {
        where.OR = [
          { bookingRef: { contains: search, mode: 'insensitive' } },
          { guesthouse: { name: { contains: search, mode: 'insensitive' } } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
        ];
      }

      const [bookings, total] = await Promise.all([
        db.guesthouseBooking.findMany({
          where,
          include: {
            guesthouse: { select: { id: true, name: true, city: true, country: true } },
            user: { select: { id: true, name: true, email: true } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.guesthouseBooking.count({ where }),
      ]);

      const [totalHotel, totalGuesthouse, totalShortTerm] = await Promise.all([
        db.hotelBooking.count(),
        db.guesthouseBooking.count(),
        db.shortTermRentalBooking.count(),
      ]);
      const pendingTotal =
        (await db.hotelBooking.count({ where: { status: 'pending' } })) +
        (await db.guesthouseBooking.count({ where: { status: 'pending' } })) +
        (await db.shortTermRentalBooking.count({ where: { status: 'pending' } }));

      return NextResponse.json({
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { totalHotel, totalGuesthouse, totalShortTerm, pendingTotal },
      });
    }

    if (tab === 'short-term') {
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

      const [totalHotel, totalGuesthouse, totalShortTerm] = await Promise.all([
        db.hotelBooking.count(),
        db.guesthouseBooking.count(),
        db.shortTermRentalBooking.count(),
      ]);
      const pendingTotal =
        (await db.hotelBooking.count({ where: { status: 'pending' } })) +
        (await db.guesthouseBooking.count({ where: { status: 'pending' } })) +
        (await db.shortTermRentalBooking.count({ where: { status: 'pending' } }));

      return NextResponse.json({
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { totalHotel, totalGuesthouse, totalShortTerm, pendingTotal },
      });
    }

    // Default: tab === 'hotels'
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (country) where.hotel = { country };

    if (search) {
      where.OR = [
        { bookingRef: { contains: search, mode: 'insensitive' } },
        { hotel: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      db.hotelBooking.findMany({
        where,
        include: {
          hotel: { select: { id: true, name: true, city: true, country: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.hotelBooking.count({ where }),
    ]);

    const [totalHotel, totalGuesthouse, totalShortTerm] = await Promise.all([
      db.hotelBooking.count(),
      db.guesthouseBooking.count(),
      db.shortTermRentalBooking.count(),
    ]);
    const pendingTotal =
      (await db.hotelBooking.count({ where: { status: 'pending' } })) +
      (await db.guesthouseBooking.count({ where: { status: 'pending' } })) +
      (await db.shortTermRentalBooking.count({ where: { status: 'pending' } }));

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { totalHotel, totalGuesthouse, totalShortTerm, pendingTotal },
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
