import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { rentalId: id };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      db.shortTermRentalBooking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, avatar: true } },
        },
      }),
      db.shortTermRentalBooking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Short-term rental bookings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Validate rental exists
    const rental = await db.shortTermRental.findUnique({ where: { id } });
    if (!rental) {
      return NextResponse.json({ error: 'Location non trouvee' }, { status: 404 });
    }
    if (rental.status !== 'active') {
      return NextResponse.json({ error: 'Cette location n\'est pas disponible' }, { status: 400 });
    }

    // Validate dates
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    if (checkIn >= checkOut) {
      return NextResponse.json({ error: 'La date de depart doit etre apres la date d\'arrivee' }, { status: 400 });
    }

    // Check minimum stay
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < rental.minStayNights) {
      return NextResponse.json(
        { error: `Sejour minimum de ${rental.minStayNights} nuit(s) requis` },
        { status: 400 }
      );
    }

    // Check maximum stay
    if (rental.maxStayNights && nights > rental.maxStayNights) {
      return NextResponse.json(
        { error: `Sejour maximum de ${rental.maxStayNights} nuit(s)` },
        { status: 400 }
      );
    }

    // Check guest count
    if (body.guests && body.guests > rental.maxGuests) {
      return NextResponse.json(
        { error: `Maximum ${rental.maxGuests} voyageurs autorises` },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const conflictingBookings = await db.shortTermRentalBooking.findFirst({
      where: {
        rentalId: id,
        status: { in: ['pending', 'confirmed', 'checked_in'] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });

    if (conflictingBookings) {
      return NextResponse.json(
        { error: 'Ces dates sont deja reservees' },
        { status: 409 }
      );
    }

    // Calculate pricing
    const pricePerNight = rental.pricePerNight;
    const cleaningFee = rental.cleaningFee;
    const securityDeposit = rental.securityDeposit;
    const serviceFee = Math.round(pricePerNight * nights * 0.1); // 10% service fee
    const totalPrice = pricePerNight * nights + cleaningFee + securityDeposit + serviceFee;

    // Determine booking type
    const bookingType = rental.instantBooking ? 'instant' : 'request';
    const initialStatus = rental.instantBooking ? 'confirmed' : 'pending';

    // Generate booking reference
    const bookingRef = `STR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const booking = await db.shortTermRentalBooking.create({
      data: {
        rentalId: id,
        userId: auth.userId,
        bookingRef,
        checkIn,
        checkOut,
        guests: body.guests || 1,
        nights,
        pricePerNight,
        cleaningFee,
        securityDeposit,
        totalPrice,
        serviceFee,
        currency: rental.currency,
        bookingType,
        sourceChannel: 'direct',
        status: initialStatus,
        paymentProvider: 'fedapay',
        specialRequests: body.specialRequests,
      },
    });

    // Block availability for booked dates
    const availUpserts: Promise<unknown>[] = [];
    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      availUpserts.push(
        db.shortTermRentalAvailability.upsert({
          where: {
            rentalId_date: { rentalId: id, date: new Date(d) },
          },
          create: {
            rentalId: id,
            date: new Date(d),
            status: 'BOOKED',
            currency: rental.currency,
            source: 'manual',
          },
          update: {
            status: 'BOOKED',
          },
        })
      );
    }
    await Promise.all(availUpserts);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Short-term rental booking creation error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
