import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateEscrowOTP, REQUIRES_2FA } from "@/lib/otp";

/**
 * POST /api/escrow/[id]/request-release-otp
 * Generates and "sends" (email/SMS) a 6-digit OTP required to release funds.
 * Required when escrow amount >= 500 000 FCFA (CDC §10.5).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id },
    include: {
      buyer: { select: { id: true, email: true, name: true } },
    },
  });

  if (!escrow) {
    return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 });
  }

  // Only the buyer can request fund release
  if (escrow.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (escrow.state !== "VALIDATION") {
    return NextResponse.json(
      { error: "La transaction doit être en état VALIDATION pour libérer les fonds." },
      { status: 409 }
    );
  }

  if (!REQUIRES_2FA(escrow.amount)) {
    return NextResponse.json(
      { error: "La 2FA n'est pas requise pour les transactions inférieures à 500 000 FCFA." },
      { status: 400 }
    );
  }

  const otp = await generateEscrowOTP(id, session.user.id);

  // TODO: Send via SMS (Africa's Talking) or WhatsApp (Twilio)
  // For now: email via notification + console log in dev
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] OTP pour libération escrow ${id}: ${otp}`);
  }

  // Always create an in-app notification with OTP (dev shortcut — remove in prod)
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "SYSTEM",
      title: "Code de confirmation (2FA)",
      message: `Votre code de libération : ${process.env.NODE_ENV !== "production" ? otp : "envoyé par SMS"}. Valide 10 minutes.`,
      href: "/dashboard",
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Code OTP envoyé. Valide 10 minutes.",
    // In dev: include OTP in response for testing
    ...(process.env.NODE_ENV !== "production" ? { otp } : {}),
  });
}
