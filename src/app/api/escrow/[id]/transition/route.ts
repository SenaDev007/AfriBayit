import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  const { newState, paymentRef, note } = await req.json();

  const escrow = await prisma.escrowTransaction.findUnique({ where: { id } });
  if (!escrow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Check permission — buyer or seller
  const isBuyer = escrow.buyerId === session.user.id;
  const isSeller = escrow.sellerId === session.user.id;
  if (!isBuyer && !isSeller) {
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

  // Build state timestamp fields
  const now = new Date();
  const timestamps: Record<string, Date> = {};
  if (newState === "FUNDED") timestamps.fundedAt = now;
  if (newState === "IN_PROGRESS") timestamps.startedAt = now;
  if (newState === "VALIDATION") timestamps.validationAt = now;
  if (newState === "RELEASED") timestamps.releasedAt = now;
  if (newState === "REFUNDED") timestamps.refundedAt = now;

  // Validation logic — both parties must validate before release
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

  // Notify the other party
  const otherPartyId = isBuyer ? escrow.sellerId : escrow.buyerId;
  const stateLabels: Record<string, string> = {
    FUNDED: "La transaction a été financée. Les fonds sont sécurisés.",
    IN_PROGRESS: "La prestation a démarré.",
    VALIDATION: "En attente de validation des deux parties.",
    RELEASED: "Les fonds ont été libérés. Transaction terminée. ✅",
    REFUNDED: "Les fonds ont été remboursés.",
    DISPUTED: "Un litige a été ouvert. Notre équipe vous contactera.",
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
  }

  return NextResponse.json(updated);
}
