import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyEscrowOTP, REQUIRES_2FA } from "@/lib/otp";
import { writeLedgerRelease, writeLedgerRefund, writeLedgerEntry } from "@/lib/ledger";
import { refundPayment } from "@/lib/pal";

// Valid state transitions (CDC §7B escrow state machine)
const TRANSITIONS: Record<string, string[]> = {
  CREATED: ["FUNDED", "EXPIRED"],
  FUNDED: ["IN_PROGRESS", "REFUNDED"],
  IN_PROGRESS: ["VALIDATION", "DISPUTED"],
  VALIDATION: ["RELEASED", "REFUNDED", "DISPUTED"],
  RELEASED: [],
  REFUNDED: [],
  EXPIRED: [],
  DISPUTED: ["RELEASED", "REFUNDED"],
};

// PATCH /api/escrow/[id]/transition
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { newState, paymentRef, note, otp } = body;

  const escrow = await prisma.escrowTransaction.findUnique({ where: { id } });
  if (!escrow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isBuyer = escrow.buyerId === session.user.id;
  const isSeller = escrow.sellerId === session.user.id;
  const isAdmin = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userType: true },
  }))?.userType === "ADMIN";

  if (!isBuyer && !isSeller && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Validate transition
  const allowed = TRANSITIONS[escrow.state] ?? [];
  if (!allowed.includes(newState)) {
    return NextResponse.json(
      { error: `Transition ${escrow.state} → ${newState} non autorisée` },
      { status: 422 }
    );
  }

  // ── 2FA check for RELEASED (§10.5 CDC) ──────────────────────
  // Buyer must provide OTP if amount >= 500K FCFA
  if (newState === "RELEASED" && isBuyer && REQUIRES_2FA(escrow.amount)) {
    if (!otp) {
      return NextResponse.json(
        {
          error: "Code OTP requis pour libérer des fonds >= 500 000 FCFA.",
          requires2FA: true,
          hint: "Appelez POST /api/escrow/{id}/request-release-otp pour recevoir votre code.",
        },
        { status: 403 }
      );
    }

    const { valid, reason } = await verifyEscrowOTP(id, session.user.id, otp);
    if (!valid) {
      return NextResponse.json({ error: reason ?? "OTP invalide", requires2FA: true }, { status: 403 });
    }
  }

  // Both parties must have validated before RELEASED (unless admin override)
  if (newState === "RELEASED" && !isAdmin) {
    const updatedEscrow = {
      buyerValidated: escrow.buyerValidated || (isBuyer && escrow.state === "VALIDATION"),
      sellerValidated: escrow.sellerValidated || (isSeller && escrow.state === "VALIDATION"),
    };
    if (!updatedEscrow.buyerValidated || !updatedEscrow.sellerValidated) {
      return NextResponse.json(
        { error: "Les deux parties doivent valider avant la libération des fonds." },
        { status: 409 }
      );
    }
  }

  const now = new Date();
  const timestamps: Record<string, Date> = {};
  if (newState === "FUNDED") timestamps.fundedAt = now;
  if (newState === "IN_PROGRESS") timestamps.startedAt = now;
  if (newState === "VALIDATION") timestamps.validationAt = now;
  if (newState === "RELEASED") timestamps.releasedAt = now;
  if (newState === "REFUNDED") timestamps.refundedAt = now;

  const updateData: Record<string, unknown> = { state: newState, ...timestamps };
  if (newState === "VALIDATION") {
    if (isBuyer) updateData.buyerValidated = true;
    if (isSeller) updateData.sellerValidated = true;
  }
  if (paymentRef) updateData.paymentRef = paymentRef;

  const history = (escrow.stateHistory as Array<Record<string, string>>) ?? [];
  updateData.stateHistory = [
    ...history,
    { state: newState, at: now.toISOString(), by: session.user.id, note },
  ];

  const updated = await prisma.escrowTransaction.update({
    where: { id },
    data: updateData as any,
  });

  // ── Ledger entries ──────────────────────────────────────────
  if (newState === "FUNDED") {
    await writeLedgerEntry({
      escrowId: escrow.id,
      entryType: "DEPOSIT",
      debitAccount: `buyer:${escrow.buyerId}`,
      creditAccount: "escrow:platform",
      amount: escrow.amount,
      currency: escrow.currency,
      description: `Dépôt escrow — ${escrow.reference}`,
    });
  }

  if (newState === "RELEASED") {
    await writeLedgerRelease(escrow as Parameters<typeof writeLedgerRelease>[0]);
  }

  if (newState === "REFUNDED") {
    await writeLedgerRefund(escrow as Parameters<typeof writeLedgerRefund>[0]);

    // Trigger provider refund if we have a payment reference
    if (escrow.paymentRef && escrow.paymentMethod) {
      const method = escrow.paymentMethod as "mobile_money" | "card";
      await refundPayment(method, escrow.paymentRef, escrow.amount).catch((err) => {
        console.error("Provider refund failed:", err);
        // Non-blocking — admin can trigger manually
      });
    }
  }

  // ── Notifications ───────────────────────────────────────────
  const otherPartyId = isBuyer ? escrow.sellerId : escrow.buyerId;
  const stateLabels: Record<string, string> = {
    FUNDED: "La transaction a été financée. Les fonds sont sécurisés en escrow.",
    IN_PROGRESS: "La prestation a démarré. Confirmez à la fin pour libérer les fonds.",
    VALIDATION: "En attente de validation des deux parties.",
    RELEASED: "✅ Les fonds ont été libérés. Transaction terminée avec succès.",
    REFUNDED: "💸 Les fonds ont été remboursés à l'acheteur.",
    DISPUTED: "⚠️ Un litige a été ouvert. Notre équipe vous contactera sous 24h.",
  };

  if (stateLabels[newState]) {
    await prisma.notification.create({
      data: {
        userId: otherPartyId,
        type: "payment",
        title: `Escrow — ${newState}`,
        message: stateLabels[newState],
        href: "/dashboard",
      },
    });

    // Also notify the acting party for terminal states
    if (["RELEASED", "REFUNDED", "DISPUTED"].includes(newState)) {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: "payment",
          title: `Escrow — ${newState}`,
          message: stateLabels[newState],
          href: "/dashboard",
        },
      });
    }
  }

  return NextResponse.json(updated);
}
