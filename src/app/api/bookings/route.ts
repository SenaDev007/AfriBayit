import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createBookingSchema = z.object({
  propertyId: z.string(),
  guestId: z.string(),
  checkIn: z.string().transform((s) => new Date(s)),
  checkOut: z.string().transform((s) => new Date(s)),
  guests: z.number().int().min(1).max(20),
  guestNote: z.string().optional(),
  paymentMethod: z.enum(["mobile_money", "card", "bank_transfer"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { propertyId, guestId, checkIn, checkOut, guests, guestNote, paymentMethod } = parsed.data;

    // Validate dates
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "La date de départ doit être après la date d'arrivée" },
        { status: 400 }
      );
    }

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: true },
    });

    if (!property) {
      return NextResponse.json({ error: "Propriété introuvable" }, { status: 404 });
    }

    if (property.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Cette propriété n'est pas disponible" },
        { status: 400 }
      );
    }

    // Check for conflicting bookings
    const conflict = await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          {
            checkIn: { lte: checkOut },
            checkOut: { gte: checkIn },
          },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Ces dates ne sont plus disponibles" },
        { status: 409 }
      );
    }

    // Calculate price
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    const nightlyRate = property.price;
    const totalAmount = nightlyRate * nights;

    // Commission structure (CDC Section 6.2)
    const guestCommissionRate =
      property.listingType === "SHORT_TERM_RENTAL" ? 0.13 : 0; // 12-15%
    const hostCommissionRate = 0.03; // 3% hôte

    const serviceFee = totalAmount * guestCommissionRate;
    const hostCommission = totalAmount * hostCommissionRate;
    const hostAmount = totalAmount - hostCommission;

    // Generate check-in QR code
    const checkInCode = `AB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestId,
        hostId: property.ownerId,
        checkIn,
        checkOut,
        nights,
        guests,
        nightlyRate,
        totalAmount: totalAmount + serviceFee,
        serviceFee,
        hostAmount,
        guestNote,
        paymentMethod,
        checkInCode,
        status: "PENDING",
        currency: property.currency as any,
      },
    });

    // TODO: Create escrow transaction
    // TODO: Send confirmation email/SMS

    return NextResponse.json(
      {
        data: booking,
        message: "Réservation créée. En attente de paiement.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const role = searchParams.get("role") || "guest"; // guest | host

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const where = role === "host"
      ? { hostId: userId }
      : { guestId: userId };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            city: true,
            country: true,
            images: { take: 1 },
          },
        },
        guest: { select: { id: true, name: true, image: true } },
        host: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ data: bookings });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
