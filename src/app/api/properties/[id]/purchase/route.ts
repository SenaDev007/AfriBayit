import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { venteCommissionRate } from '@/lib/payments/fees';

/**
 * POST /api/properties/[id]/purchase — initier l'achat d'un bien.
 *
 * Branché sur le bouton « Acheter ce bien » de la fiche publique (retour
 * client 02/10 : le bouton renvoyait une erreur car la route n'existait pas).
 *
 * Crée :
 *   1. Une Transaction (status=CREATED, buyer=requesteur, seller=agent du bien)
 *      avec la commission canonique T-1 (vente : grille dégressive 5/4/3/2 %).
 *   2. Un EscrowAccount vide rattaché (le financement — FedaPay/Stripe — se
 *      fait ensuite sur /escrow, qui exige KYC niveau 1).
 *   3. Un événement TransactionTimeline (traçabilité CDC §7).
 *
 * Réponse : { transaction, escrow, message, nextStep, paymentUrl } —
 * paymentUrl pointe vers /escrow?transactionId=… (fiche de financement).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const { id } = await params;
    const property = await db.property.findUnique({
      where: { id },
      select: {
        id: true, title: true, type: true, transaction: true,
        price: true, currency: true, country: true, status: true,
        agentId: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 });
    }
    if (property.status !== 'published') {
      return NextResponse.json(
        { error: 'Ce bien n’est plus disponible à l’achat' },
        { status: 409 }
      );
    }
    if (property.agentId === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas acheter votre propre bien' },
        { status: 400 }
      );
    }

    // Commission canonique T-1 — vente immobilière (5/4/3/2 % dégressif)
    const rate = venteCommissionRate(property.price);
    const commission = Math.round(property.price * rate);

    // Transaction + Escrow + Timeline atomiques
    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          propertyId: property.id,
          buyerId: auth.userId,
          sellerId: property.agentId,
          amount: property.price,
          commission,
          commissionRate: rate,
          currency: property.currency,
          country: property.country,
          status: 'CREATED',
          conditions: {
            type: 'vente_immobiliere',
            propertyTitle: property.title,
            initiatedFrom: 'property_detail_buy_button',
          },
        },
      });

      const escrow = await tx.escrowAccount.create({
        data: {
          transactionId: transaction.id,
          currency: property.currency,
          status: 'EMPTY',
        },
      });

      await tx.transactionTimeline.create({
        data: {
          transactionId: transaction.id,
          fromStatus: '—',
          toStatus: 'CREATED',
          actorType: 'buyer',
          actorId: auth.userId,
          description: 'Transaction d’achat initiée depuis la fiche du bien',
        },
      });

      return { transaction, escrow };
    });

    return NextResponse.json(
      {
        transaction: {
          id: result.transaction.id,
          propertyId: result.transaction.propertyId,
          amount: result.transaction.amount,
          commission: Number(result.transaction.commission),
          commissionRate: rate,
          currency: result.transaction.currency,
          country: result.transaction.country,
          status: result.transaction.status,
        },
        escrow: { id: result.escrow.id, status: result.escrow.status },
        message: 'Transaction d’achat créée. Sécurisez le paiement via l’escrow AfriBayit.',
        nextStep: 'Approvisionner l’escrow (KYC niveau 1 requis) pour réserver le bien.',
        paymentUrl: `/escrow?transactionId=${result.transaction.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Purchase initiation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l’initiation de la transaction' },
      { status: 500 }
    );
  }
}
