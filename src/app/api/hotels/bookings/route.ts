import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bookingSchema = z.object({
  hotelId: z.string(),
  roomId: z.string(),
  checkIn: z.string().transform((s) => new Date(s)),
  checkOut: z.string().transform((s) => new Date(s)),
  guests: z.number().min(1).default(1),
  paymentMethod: z.string().optional(),
});

// CDC §6: commission hôtel 10-15%
const HOTEL_COMMISSION_RATE = 0.12;

// POST /api/hotels/bookings — create hotel booking
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const data = bookingSchema.parse(body);

  const room = await prisma.hotelRoom.findUnique({
    where: { id: data.roomId },
    include: { hotel: true },
  });

  if (!room) return NextResponse.json({ error: "Chambre introuvable" }, { status: 404 });
  if (!room.isAvailable) return NextResponse.json({ error: "Chambre indisponible" }, { status: 409 });

  const nights = Math.ceil(
    (data.checkOut.getTime() - data.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights < 1) return NextResponse.json({ error: "Dates invalides" }, { status: 422 });

  const roomRate = room.basePrice * nights;
  const taxes = Math.round(roomRate * 0.18); // 18% TVA UEMOA
  const totalAmount = roomRate + taxes;
  const commission = Math.round(totalAmount * HOTEL_COMMISSION_RATE);
  const netAmount = totalAmount - commission;

  const booking = await prisma.hotelBooking.create({
    data: {
      hotelId: data.hotelId,
      roomId: data.roomId,
      guestId: session.user.id,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      nights,
      guests: data.guests,
      roomRate,
      taxes,
      totalAmount,
      commission,
      netAmount,
      currency: room.currency,
      status: "PENDING",
      source: "direct",
    },
  });

  // Create escrow transaction for hotel booking
  if (room.hotel.ownerId) {
    await prisma.escrowTransaction.create({
      data: {
        type: "HOTEL_BOOKING",
        state: "CREATED",
        buyerId: session.user.id,
        sellerId: room.hotel.ownerId,
        amount: totalAmount,
        commission,
        netAmount,
        currency: room.currency,
        bookingId: booking.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        stateHistory: [{ state: "CREATED", at: new Date().toISOString(), by: session.user.id }],
      },
    });
  }

  // Notify user
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "booking",
      title: "Réservation hôtel confirmée",
      message: `Votre réservation à ${room.hotel.name} (${nights} nuit${nights > 1 ? "s" : ""}) est en attente de confirmation.`,
      href: "/dashboard",
    },
  });

  return NextResponse.json(booking, { status: 201 });
}

// GET /api/hotels/bookings — user's hotel bookings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookings = await prisma.hotelBooking.findMany({
    where: { guestId: session.user.id },
    include: {
      hotel: { select: { name: true, city: true, stars: true } },
      room: { select: { name: true, bedType: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
