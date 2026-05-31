// AfriBayit — API: PMS Reservations
// GET: Liste des réservations / POST: Créer une réservation

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reserveRoom } from '@/lib/ota/overbooking-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId requis' }, { status: 400 });
    }

    const where: Record<string, unknown> = { hotelId };

    if (status) where.status = status;
    if (source) where.sourceChannel = source;
    if (startDate || endDate) {
      const checkIn: Record<string, Date> = {};
      if (startDate) checkIn.gte = new Date(startDate);
      if (endDate) checkIn.lte = new Date(endDate);
      where.checkIn = checkIn;
    }

    const [bookings, total] = await Promise.all([
      db.hotelBooking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { checkIn: 'desc' },
        include: {
          hotel: { select: { name: true } },
        },
      }),
      db.hotelBooking.count({ where }),
    ]);

    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        hotelId: b.hotelId,
        hotelName: b.hotel.name,
        roomId: b.roomId,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        guests: b.guests,
        totalPrice: b.totalPrice,
        currency: b.currency,
        sourceChannel: b.sourceChannel,
        status: b.status,
        specialRequests: b.specialRequests,
        paymentRef: b.paymentRef,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('PMS Reservations GET error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des réservations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      hotelId,
      roomType,
      checkIn,
      checkOut,
      source = 'direct',
      userId = 'guest',
      guests = 1,
      totalPrice,
      specialRequests,
    } = body;

    if (!hotelId || !roomType || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'hotelId, roomType, checkIn et checkOut sont requis' },
        { status: 400 }
      );
    }

    // Obtenir le prix de base si non fourni
    let calculatedPrice = totalPrice;
    if (!calculatedPrice) {
      const room = await db.hotelRoom.findFirst({
        where: { hotelId, type: roomType },
      });
      if (room) {
        const nights = Math.max(1, Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        ));
        calculatedPrice = room.basePriceXof * nights;
      }
    }

    // Réserver avec protection contre le surbooking
    const result = await reserveRoom(hotelId, roomType, checkIn, checkOut, source, {
      userId,
      guests,
      totalPrice: calculatedPrice || 0,
      currency: 'XOF',
      specialRequests,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Impossible de créer la réservation' },
        { status: 409 }
      );
    }

    const booking = await db.hotelBooking.findUnique({
      where: { id: result.bookingId! },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('PMS Reservations POST error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500 });
  }
}
