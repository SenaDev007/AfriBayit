import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { computeLLDCommission } from '@/lib/payments/fees';

/**
 * POST /api/properties/[id]/rent — initier une location longue durée.
 *
 * Branché sur le bouton « Louer ce bien » de la fiche publique (retour client
 * 02/10 : le bouton renvoyait une erreur car la route n'existait pas).
 *
 * Crée :
 *   1. Une Transaction (status=CREATED) dont le montant à sécuriser en escrow
 *      = 1er loyer + caution (2 mois par défaut, paramétrable).
 *   2. Un EscrowAccount vide (le financement se fait sur /escrow, KYC 1 requis).
 *   3. Les conditions du bail (durée, caution, meublé, charges, date d'entrée)
 *      dans Transaction.conditions — le CDC V4 ne prévoit pas encore de modèle
 *      Lease dédié, la source de vérité à ce stade est la transaction.
 *   4. Un événement TransactionTimeline.
 *
 * Commission canonique T-2 : 1 mois de loyer, partagé 50/50
 * propriétaire/locataire, prélevée à la signature (conditions.split).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Paramètres du bail (valeurs par défaut prudentes, surchargeables)
    let body: {
      leaseTermMonths?: number;
      securityDepositMonths?: number;
      startDate?: string;
      furnished?: boolean;
      chargesIncluded?: boolean;
      notes?: string;
    } = {};
    try {
      body = await request.json();
    } catch {
      // Corps vide accepté — defaults ci-dessous
    }

    const leaseTermMonths = Math.min(Math.max(Number(body.leaseTermMonths) || 12, 1), 36);
    const securityDepositMonths = Math.min(Math.max(Number(body.securityDepositMonths) || 2, 0), 6);
    const startDate =
      body.startDate && !Number.isNaN(Date.parse(body.startDate))
        ? body.startDate
        : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

    const property = await db.property.findUnique({
      where: { id },
      select: {
        id: true, title: true, transaction: true,
        price: true, currency: true, country: true, status: true,
        agentId: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 });
    }
    if (property.status !== 'published') {
      return NextResponse.json(
        { error: 'Ce bien n’est plus disponible à la location' },
        { status: 409 }
      );
    }
    if (property.agentId === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas louer votre propre bien' },
        { status: 400 }
      );
    }

    // Commission canonique T-2 — LLD : 1 mois de loyer, 50/50
    const lld = computeLLDCommission(property.price);

    // Montant initial à sécuriser : 1er loyer + caution
    const initialPayment = property.price + property.price * securityDepositMonths;

    const result = await db.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          propertyId: property.id,
          buyerId: auth.userId,
          sellerId: property.agentId,
          amount: initialPayment,
          commission: lld.totalCommission,
          commissionRate: 1, // 1 mois de loyer (taux exprimé en mois, T-2)
          currency: property.currency,
          country: property.country,
          status: 'CREATED',
          conditions: {
            type: 'location_longue_duree',
            propertyTitle: property.title,
            monthlyRent: property.price,
            securityDepositMonths,
            securityDeposit: property.price * securityDepositMonths,
            firstMonthRent: property.price,
            leaseTermMonths,
            startDate,
            furnished: body.furnished ?? null,
            chargesIncluded: body.chargesIncluded ?? null,
            commissionSplit: {
              total: lld.totalCommission,
              proprietaire: lld.proprietairePart,
              locataire: lld.locatairePart,
            },
            notes: body.notes || null,
            initiatedFrom: 'property_detail_rent_button',
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
          description:
            'Location longue durée initiée depuis la fiche du bien (1er loyer + caution en escrow)',
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
          monthlyRent: property.price,
          securityDeposit: property.price * securityDepositMonths,
          commission: lld.totalCommission,
          currency: result.transaction.currency,
          country: result.transaction.country,
          status: result.transaction.status,
          leaseTermMonths,
          startDate,
        },
        escrow: { id: result.escrow.id, status: result.escrow.status },
        message:
          'Demande de location créée. Sécurisez le 1er loyer et la caution via l’escrow AfriBayit.',
        nextStep: 'Approvisionner l’escrow (KYC niveau 1 requis) pour bloquer le bien.',
        paymentUrl: `/escrow?transactionId=${result.transaction.id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Rent initiation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l’initiation de la location' },
      { status: 500 }
    );
  }
}
