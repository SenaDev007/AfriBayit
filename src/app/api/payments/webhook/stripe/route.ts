import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripeAdapter } from "@/lib/pal/stripe";
import { writeLedgerEntry } from "@/lib/ledger";
import { sendEscrowStatusEmail } from "@/lib/email";
import { sendPaymentReceivedSMS } from "@/lib/sms";

/**
 * POST /api/payments/webhook/stripe
 * Receives Stripe webhook events and updates escrow state.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();

  const event = stripeAdapter.verifyWebhook(payload, signature);

  if (!event && process.env.NODE_ENV === "production") {
    return new NextResponse("Signature invalide", { status: 401 });
  }

  const afribayitRef = event?.afribayitRef;
  if (!afribayitRef) return NextResponse.json({ received: true });

  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: afribayitRef },
    include: {
      buyer: { select: { email: true, name: true, phone: true } },
      seller: { select: { email: true, name: true, phone: true } },
    },
  });

  if (!escrow) return NextResponse.json({ received: true });

  if (event?.eventType === "payment.succeeded" && escrow.state === "CREATED") {
    const now = new Date();
    const history = (escrow.stateHistory as Array<Record<string, string>>) ?? [];

    await prisma.escrowTransaction.update({
      where: { id: afribayitRef },
      data: {
        state: "FUNDED",
        fundedAt: now,
        paymentRef: event.providerRef,
        stateHistory: [
          ...history,
          { state: "FUNDED", at: now.toISOString(), by: "stripe_webhook" },
        ],
      },
    });

    await writeLedgerEntry({
      escrowId: escrow.id,
      entryType: "DEPOSIT",
      debitAccount: `buyer:${escrow.buyerId}`,
      creditAccount: "escrow:platform",
      amount: escrow.amount,
      currency: escrow.currency,
      description: `Dépôt Stripe — ${escrow.reference}`,
    });

    await prisma.notification.createMany({
      data: [
        {
          userId: escrow.buyerId,
          type: "payment",
          title: "Paiement carte confirmé",
          message: `Paiement de ${escrow.amount.toLocaleString("fr-FR")} FCFA confirmé. Fonds sécurisés.`,
          href: "/dashboard",
        },
        {
          userId: escrow.sellerId,
          type: "payment",
          title: "Fonds sécurisés en escrow",
          message: `Paiement reçu. Vous pouvez démarrer la prestation.`,
          href: "/dashboard",
        },
      ],
    });

    // Emails + SMS (non-bloquants)
    if (escrow.buyer?.email) {
      sendEscrowStatusEmail(escrow.buyer.email, escrow.buyer.name ?? "", "FUNDED", escrow.id, escrow.amount).catch(() => {});
    }
    if (escrow.seller?.email) {
      sendEscrowStatusEmail(escrow.seller.email, escrow.seller.name ?? "", "FUNDED", escrow.id, escrow.amount).catch(() => {});
    }
    if (escrow.seller?.phone) {
      sendPaymentReceivedSMS(escrow.seller.phone, escrow.amount).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
