import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// FedaPay integration for FCFA/Mobile Money payments
const FEDAPAY_BASE_URL =
  process.env.FEDAPAY_ENVIRONMENT === "live"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";

const initPaymentSchema = z.object({
  bookingId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default("XOF"),
  paymentMethod: z.enum(["mobile_money", "card"]),
  phone: z.string().optional(), // pour Mobile Money
  customerEmail: z.string().email(),
  customerName: z.string(),
  description: z.string(),
  callback_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = initPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      bookingId,
      amount,
      currency,
      paymentMethod,
      phone,
      customerEmail,
      customerName,
      description,
      callback_url,
    } = parsed.data;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 });
    }

    if (booking.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cette réservation ne peut plus être payée" },
        { status: 400 }
      );
    }

    // Initialize FedaPay transaction
    const fedapayPayload = {
      description,
      amount,
      currency: { iso: currency },
      callback_url: callback_url || `${process.env.NEXT_PUBLIC_APP_URL}/api/transactions/webhook`,
      customer: {
        email: customerEmail,
        lastname: customerName.split(" ").pop() || customerName,
        firstname: customerName.split(" ")[0] || customerName,
        phone_number: phone
          ? { number: phone.replace(/\D/g, ""), country: "BJ" }
          : undefined,
      },
    };

    // In production, call FedaPay API
    // const fedapayRes = await fetch(`${FEDAPAY_BASE_URL}/transactions`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
    //   },
    //   body: JSON.stringify(fedapayPayload),
    // });
    // const fedapayData = await fedapayRes.json();

    // Mock FedaPay response for development
    const mockFedapayRef = `FDP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const mockPaymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/confirm?ref=${mockFedapayRef}`;

    // Create transaction in escrow
    const transaction = await prisma.transaction.create({
      data: {
        bookingId,
        senderId: booking.guestId,
        receiverId: booking.hostId,
        amount,
        commission: amount * 0.03,
        netAmount: amount * 0.97,
        currency: currency as any,
        type: "short_rental",
        paymentMethod,
        fedapayRef: mockFedapayRef,
        inEscrow: true,
        escrowAt: new Date(),
        status: "PENDING",
      },
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "PENDING",
        paymentRef: mockFedapayRef,
      },
    });

    return NextResponse.json({
      data: {
        transactionId: transaction.id,
        fedapayRef: mockFedapayRef,
        paymentUrl: mockPaymentUrl, // Redirect user to this URL
        amount,
        currency,
      },
      message: "Transaction initiée. Procédez au paiement.",
    });
  } catch (error) {
    console.error("Transaction POST error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// Webhook FedaPay — libération de l'escrow
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { fedapayRef, status } = body;

    if (!fedapayRef || !status) {
      return NextResponse.json(
        { error: "fedapayRef et status requis" },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findFirst({
      where: { fedapayRef },
      include: { booking: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction introuvable" },
        { status: 404 }
      );
    }

    if (status === "approved") {
      // Update transaction & booking
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "ESCROW", escrowAt: new Date() },
        }),
        prisma.booking.update({
          where: { id: transaction.bookingId! },
          data: {
            status: "CONFIRMED",
            paidAt: new Date(),
            paymentRef: fedapayRef,
          },
        }),
      ]);

      // TODO: Send confirmation SMS/email to guest and host
      // TODO: Schedule escrow release after check-out + 48h
    } else if (status === "canceled" || status === "declined") {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "REFUNDED" },
      });
      await prisma.booking.update({
        where: { id: transaction.bookingId! },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
