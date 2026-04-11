import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { initiatePayment } from "@/lib/pal";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { sendBookingConfirmationSMS } from "@/lib/sms";

const createBookingSchema = z.object({
  propertyId: z.string(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
  guestNote: z.string().max(500).optional(),
  paymentMethod: z.enum(["mobile_money", "card"]).default("mobile_money"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Connexion requise pour réserver" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { propertyId, checkIn: checkInStr, checkOut: checkOutStr, guests, guestNote, paymentMethod } = parsed.data;
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (checkOut <= checkIn) {
      return NextResponse.json({ error: "La date de départ doit être après la date d'arrivée" }, { status: 400 });
    }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      return NextResponse.json({ error: "La date d'arrivée ne peut pas être dans le passé" }, { status: 400 });
    }

    // Load property + owner
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
    });

    if (!property) return NextResponse.json({ error: "Propriété introuvable" }, { status: 404 });
    if (property.status !== "ACTIVE") return NextResponse.json({ error: "Cette propriété n'est pas disponible" }, { status: 400 });
    if (property.ownerId === session.user.id) {
      return NextResponse.json({ error: "Vous ne pouvez pas réserver votre propre annonce" }, { status: 400 });
    }

    // Check for date conflicts
    const conflict = await prisma.booking.findFirst({
      where: {
        propertyId,
        status: { in: ["PENDING", "CONFIRMED"] },
        AND: [
          { checkIn: { lt: checkOut } },
          { checkOut: { gt: checkIn } },
        ],
      },
    });
    if (conflict) {
      return NextResponse.json({ error: "Ces dates ne sont plus disponibles" }, { status: 409 });
    }

    // Price calculation
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86400000);
    const nightlyRate = Number(property.price);
    const baseAmount = nightlyRate * nights;
    const guestCommissionRate = 0.13;  // 13% frais voyageur (CDC §6.2)
    const hostCommissionRate = 0.03;   // 3% hôte (CDC §6.2)
    const serviceFee = Math.round(baseAmount * guestCommissionRate);
    const hostAmount = Math.round(baseAmount * (1 - hostCommissionRate));
    const totalAmount = baseAmount + serviceFee;

    // Commission platform = hostCommissionRate × baseAmount
    const platformCommission = baseAmount - hostAmount;

    // Generate check-in QR code reference
    const checkInCode = `AB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // Load guest info
    const guest = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, phone: true },
    });

    // ── Create booking ──────────────────────────────────────────
    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestId: session.user.id,
        hostId: property.ownerId,
        checkIn,
        checkOut,
        nights,
        guests,
        nightlyRate,
        totalAmount,
        serviceFee,
        hostAmount,
        guestNote,
        paymentMethod,
        checkInCode,
        status: "PENDING",
        currency: property.currency as any,
      },
    });

    // ── Create EscrowTransaction ────────────────────────────────
    const commissionRate = 0.03;
    const escrowAmount = totalAmount;
    const escrowCommission = Math.round(escrowAmount * commissionRate);
    const escrowNet = escrowAmount - escrowCommission;

    const escrow = await prisma.escrowTransaction.create({
      data: {
        type: "SHORT_TERM_RENTAL",
        buyerId: session.user.id,
        sellerId: property.ownerId,
        propertyId,
        bookingId: booking.id,
        amount: escrowAmount,
        commission: escrowCommission,
        netAmount: escrowNet,
        currency: property.currency as any,
        paymentMethod,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h to complete payment
      },
    });

    // ── Initiate payment via PAL ────────────────────────────────
    let paymentUrl: string | null = null;
    try {
      const intent = await initiatePayment({
        afribayitRef: escrow.id,
        amount: escrowAmount,
        currency: property.currency as "XOF" | "EUR" | "USD" | "GHS" | "NGN",
        method: paymentMethod,
        description: `Réservation ${property.title} · ${nights} nuit${nights > 1 ? "s" : ""} · ${checkInStr} → ${checkOutStr}`,
        customerEmail: guest?.email ?? "",
        customerName: guest?.name ?? "Voyageur",
        customerPhone: guest?.phone ?? undefined,
        returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/transactions?booking=${booking.id}`,
      });

      paymentUrl = intent.paymentUrl ?? null;

      // Save payment ref on escrow
      await prisma.escrowTransaction.update({
        where: { id: escrow.id },
        data: { paymentRef: intent.providerRef },
      });
    } catch (err) {
      console.error("[booking] PAL initiation failed:", err);
      // Non-blocking — booking exists, payment can be retried
    }

    // ── In-app notifications ────────────────────────────────────
    await prisma.notification.createMany({
      data: [
        {
          userId: session.user.id,
          type: "booking",
          title: "Réservation créée",
          message: `Votre réservation pour ${property.title} est en attente de paiement.`,
          href: "/dashboard/transactions",
        },
        {
          userId: property.ownerId,
          type: "booking",
          title: "Nouvelle demande de réservation",
          message: `${guest?.name ?? "Un voyageur"} a réservé votre bien "${property.title}" du ${checkInStr} au ${checkOutStr}.`,
          href: "/dashboard/transactions",
        },
      ],
    });

    // ── Emails + SMS (non-bloquants) ────────────────────────────
    if (guest?.email) {
      sendBookingConfirmationEmail({
        to: guest.email,
        name: guest.name ?? guest.email,
        propertyTitle: property.title,
        checkIn,
        checkOut,
        guests,
        totalAmount,
        bookingRef: booking.id,
      }).catch(() => {});
    }
    if (guest?.phone) {
      sendBookingConfirmationSMS(guest.phone, property.title, checkIn, booking.id).catch(() => {});
    }

    return NextResponse.json(
      {
        data: { bookingId: booking.id, escrowId: escrow.id },
        paymentUrl,
        message: paymentUrl
          ? "Réservation créée. Procédez au paiement."
          : "Réservation créée. En attente de paiement.",
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const role = searchParams.get("role") ?? "guest"; // guest | host

    const where = role === "host"
      ? { hostId: session.user.id }
      : { guestId: session.user.id };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true, title: true, slug: true, city: true, country: true,
            images: { where: { isPrimary: true }, take: 1 },
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
