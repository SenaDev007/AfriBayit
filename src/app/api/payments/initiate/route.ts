import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { initiatePayment } from "@/lib/pal";
import { z } from "zod";

const schema = z.object({
  escrowId: z.string(),
  method: z.enum(["mobile_money", "card"]),
  customerPhone: z.string().optional(), // required for mobile_money
  returnUrl: z.string().url(),
});

/**
 * POST /api/payments/initiate
 * Initiates a payment for an escrow transaction via PAL.
 * Returns a paymentUrl for the user to complete payment.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { escrowId, method, customerPhone, returnUrl } = parsed.data;

  // Load escrow
  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: escrowId },
    include: {
      buyer: { select: { id: true, email: true, name: true, phone: true } },
    },
  });

  if (!escrow) {
    return NextResponse.json({ error: "Transaction escrow introuvable" }, { status: 404 });
  }

  if (escrow.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (escrow.state !== "CREATED") {
    return NextResponse.json(
      { error: `La transaction est déjà dans l'état "${escrow.state}"` },
      { status: 409 }
    );
  }

  if (method === "mobile_money" && !customerPhone) {
    return NextResponse.json(
      { error: "customerPhone requis pour le Mobile Money" },
      { status: 400 }
    );
  }

  // Initiate payment via PAL
  const intent = await initiatePayment({
    afribayitRef: escrow.id,
    amount: escrow.amount,
    currency: escrow.currency as "XOF" | "EUR",
    description: `AfriBayit — Transaction ${escrow.type} #${escrow.reference}`,
    customerEmail: escrow.buyer.email ?? "",
    customerName: escrow.buyer.name ?? undefined,
    customerPhone: customerPhone ?? escrow.buyer.phone ?? undefined,
    method,
    returnUrl,
    metadata: {
      escrow_id: escrow.id,
      escrow_type: escrow.type,
    },
  });

  // Save payment reference on the escrow
  await prisma.escrowTransaction.update({
    where: { id: escrowId },
    data: {
      paymentMethod: method,
      paymentRef: intent.providerRef,
      ...(method === "mobile_money" ? { fedapayRef: intent.providerRef } : {}),
    },
  });

  return NextResponse.json({
    providerRef: intent.providerRef,
    paymentUrl: intent.paymentUrl,
    provider: intent.provider,
    status: intent.status,
  });
}
