import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fedapayAdapter } from "@/lib/pal/fedapay";
import { writeLedgerEntry } from "@/lib/ledger";

/**
 * POST /api/payments/webhook/fedapay
 * Receives FedaPay webhook events and updates escrow state.
 * Register this URL in your FedaPay dashboard.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-fedapay-signature") ?? "";
  const payload = await request.text();

  const event = fedapayAdapter.verifyWebhook(payload, signature);

  // If no secret configured, parse raw (dev mode only)
  let afribayitRef = event?.afribayitRef;
  if (!event) {
    // Dev fallback: trust payload without signature check
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

  if (!afribayitRef) {
    return new NextResponse("Ref introuvable", { status: 400 });
  }

  const escrow = await prisma.escrowTransaction.findUnique({
    where: { id: afribayitRef },
  });

  if (!escrow) {
    return new NextResponse("Escrow introuvable", { status: 404 });
  }

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

    // Write ledger: DEPOSIT from buyer
    await writeLedgerEntry({
      escrowId: escrow.id,
      entryType: "DEPOSIT",
      debitAccount: `buyer:${escrow.buyerId}`,
      creditAccount: "escrow:platform",
      amount: escrow.amount,
      currency: escrow.currency,
      description: `Dépôt FedaPay — ${escrow.reference}`,
    });

    // Notify both parties
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
