import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fedapayAdapter } from "@/lib/pal/fedapay";
import { writeLedgerEntry } from "@/lib/ledger";
import { sendEscrowStatusEmail } from "@/lib/email";
import { sendPaymentReceivedSMS } from "@/lib/sms";

/**
 * POST /api/payments/webhook/fedapay
 * Receives FedaPay webhook events and updates escrow state.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-fedapay-signature") ?? "";
  const payload = await request.text();

  const event = fedapayAdapter.verifyWebhook(payload, signature);

  let afribayitRef = event?.afribayitRef;
  if (!event) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse("Signature invalide", { status: 401 });
    }
    try {
      const raw = JSON.parse(payload);
      afribayitRef = raw?.entity?.metadata?.afribayit_ref;
    } catch {
      return new NextResponse("Payload invalide", { status: 400 });
    }
  }

  if (!afribayitRef) return new NextResponse("Ref introuvable", { status: 400 });

  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: afribayitRef },
    include: {
      buyer: { select: { email: true, name: true, phone: true } },
      seller: { select: { email: true, name: true, phone: true } },
    },
  });

  if (!escrow) return new NextResponse("Escrow introuvable", { status: 404 });

  const eventType = event?.eventType;

  if (eventType === "payment.succeeded" && escrow.state === "CREATED") {
    const now = new Date();
    const history = (escrow.stateHistory as Array<Record<string, string>>) ?? [];

    await prisma.escrowTransaction.update({
      where: { id: afribayitRef },
      data: {
        state: "FUNDED",
        fundedAt: now,
        stateHistory: [
          ...history,
          { state: "FUNDED", at: now.toISOString(), by: "fedapay_webhook" },
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
      description: `Dépôt FedaPay — ${escrow.reference}`,
    });

    // In-app notifications
    await prisma.notification.createMany({
      data: [
        {
          userId: escrow.buyerId,
          type: "payment",
          title: "Paiement confirmé",
          message: `Votre paiement de ${escrow.amount.toLocaleString("fr-FR")} FCFA a été reçu. Les fonds sont sécurisés.`,
          href: "/dashboard",
        },
        {
          userId: escrow.sellerId,
          type: "payment",
          title: "Fonds sécurisés en escrow",
          message: `${escrow.amount.toLocaleString("fr-FR")} FCFA reçus et sécurisés. Démarrez la prestation.`,
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

  if (eventType === "payment.failed") {
    await prisma.notification.create({
      data: {
        userId: escrow.buyerId,
        type: "payment",
        title: "Paiement échoué",
        message: "Votre paiement Mobile Money a échoué. Réessayez ou choisissez un autre moyen.",
        href: "/dashboard",
      },
    });
  }

  return NextResponse.json({ received: true });
}
