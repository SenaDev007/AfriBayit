import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// ============ Escrow State Machine — CDC §5.0bis.4 ============
// Normal flow: CREATED → FUNDED → DOCS_VALIDATED → GEOTRUST_VALIDATED → NOTARY_ASSIGNED → NOTARY_IN_PROGRESS → DEED_SIGNED → ANDF_REGISTERED → RELEASED
// Exception states: DISPUTED (from any active state), REFUNDED, EXPIRED

type EscrowState =
  | 'CREATED'
  | 'FUNDED'
  | 'DOCS_VALIDATED'
  | 'GEOTRUST_VALIDATED'
  | 'NOTARY_ASSIGNED'
  | 'NOTARY_IN_PROGRESS'
  | 'DEED_SIGNED'
  | 'ANDF_REGISTERED'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'EXPIRED';

/** Valid forward transitions from each state */
const VALID_TRANSITIONS: Record<EscrowState, EscrowState[]> = {
  CREATED: ['FUNDED', 'EXPIRED', 'DISPUTED'],
  FUNDED: ['DOCS_VALIDATED', 'DISPUTED', 'REFUNDED', 'EXPIRED'],
  DOCS_VALIDATED: ['GEOTRUST_VALIDATED', 'DISPUTED', 'REFUNDED'],
  GEOTRUST_VALIDATED: ['NOTARY_ASSIGNED', 'DISPUTED', 'REFUNDED'],
  NOTARY_ASSIGNED: ['NOTARY_IN_PROGRESS', 'DISPUTED', 'REFUNDED'],
  NOTARY_IN_PROGRESS: ['DEED_SIGNED', 'DISPUTED', 'REFUNDED'],
  DEED_SIGNED: ['ANDF_REGISTERED', 'DISPUTED', 'REFUNDED'],
  ANDF_REGISTERED: ['RELEASED', 'DISPUTED', 'REFUNDED'],
  RELEASED: [], // Terminal state
  DISPUTED: ['REFUNDED', 'FUNDED', 'NOTARY_IN_PROGRESS'], // Can resolve back or refund
  REFUNDED: [], // Terminal state
  EXPIRED: [], // Terminal state
};

/** States considered "active" — DISPUTED can transition from any of these */
const ACTIVE_STATES: EscrowState[] = [
  'CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED',
  'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED',
];

/** Timestamp field to update for each state transition */
const STATE_TIMESTAMP_FIELD: Partial<Record<EscrowState, string>> = {
  FUNDED: 'escrowFundedAt',
  NOTARY_ASSIGNED: 'notaryAssignedAt',
  DEED_SIGNED: 'deedSignedAt',
  ANDF_REGISTERED: 'andfRegisteredAt',
  RELEASED: 'escrowReleasedAt',
};

/** Human-readable descriptions for state transitions */
const TRANSITION_DESCRIPTIONS: Record<string, string> = {
  'CREATED→FUNDED': 'Fonds déposés en escrow',
  'FUNDED→DOCS_VALIDATED': 'Documents légaux validés par IA',
  'DOCS_VALIDATED→GEOTRUST_VALIDATED': 'Validation géomatique GeoTrust confirmée',
  'GEOTRUST_VALIDATED→NOTARY_ASSIGNED': 'Notaire assigné à la transaction',
  'NOTARY_ASSIGNED→NOTARY_IN_PROGRESS': 'Notaire a commencé la rédaction de l\'acte',
  'NOTARY_IN_PROGRESS→DEED_SIGNED': 'Acte de vente signé par les parties',
  'DEED_SIGNED→ANDF_REGISTERED': 'Acte enregistré à l\'ANDF',
  'ANDF_REGISTERED→RELEASED': 'Fonds libérés au vendeur',
  'CREATED→DISPUTED': 'Litige signalé (depuis état Créé)',
  'FUNDED→DISPUTED': 'Litige signalé (depuis état Financé)',
  'DOCS_VALIDATED→DISPUTED': 'Litige signalé (depuis état Docs validés)',
  'GEOTRUST_VALIDATED→DISPUTED': 'Litige signalé (depuis état GeoTrust)',
  'NOTARY_ASSIGNED→DISPUTED': 'Litige signalé (depuis état Notaire assigné)',
  'NOTARY_IN_PROGRESS→DISPUTED': 'Litige signalé (depuis état Notaire en cours)',
  'DEED_SIGNED→DISPUTED': 'Litige signalé (depuis état Acte signé)',
  'ANDF_REGISTERED→DISPUTED': 'Litige signalé (depuis état ANDF enregistré)',
  'DISPUTED→REFUNDED': 'Fonds remboursés suite au litige',
  'DISPUTED→FUNDED': 'Litige résolu — retour à l\'état Financé',
  'DISPUTED→NOTARY_IN_PROGRESS': 'Litige résolu — retour au notaire',
  'FUNDED→REFUNDED': 'Fonds remboursés à l\'acheteur',
  'DOCS_VALIDATED→REFUNDED': 'Fonds remboursés — documents non valides',
  'GEOTRUST_VALIDATED→REFUNDED': 'Fonds remboursés — problème géomatique',
  'NOTARY_ASSIGNED→REFUNDED': 'Fonds remboursés — notaire non disponible',
  'NOTARY_IN_PROGRESS→REFUNDED': 'Fonds remboursés — acte non signé',
  'DEED_SIGNED→REFUNDED': 'Fonds remboursés — problème d\'enregistrement',
  'ANDF_REGISTERED→REFUNDED': 'Fonds remboursés — refus ANDF',
  'FUNDED→EXPIRED': 'Transaction expirée',
  'CREATED→EXPIRED': 'Transaction expirée sans financement',
};

function isValidTransition(from: EscrowState, to: EscrowState): boolean {
  // DISPUTED can be reached from any active state (not just those listed in VALID_TRANSITIONS)
  if (to === 'DISPUTED' && ACTIVE_STATES.includes(from)) {
    return true;
  }
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * GET /api/escrow/[id]
 * Get a specific escrow transaction with timeline events
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            type: true,
            city: true,
            country: true,
            images: true,
          },
        },
        buyer: {
          select: { id: true, name: true, email: true },
        },
        escrowAccount: {
          include: {
            ledger: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        },
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    // Authorization: only buyer, seller, or admin can view
    if (
      transaction.buyerId !== auth.userId &&
      (transaction as unknown as Record<string, unknown>).sellerId !== auth.userId &&
      auth.role !== 'admin'
    ) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Escrow GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch escrow transaction' }, { status: 500 });
  }
}

/**
 * PATCH /api/escrow/[id]
 * Transition the escrow to a new state with validation
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { targetStatus, actorType, reason, metadata } = body as {
      targetStatus: string;
      actorType?: string;
      reason?: string;
      metadata?: Record<string, unknown>;
    };

    // Validate targetStatus
    const validStates: EscrowState[] = [
      'CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED',
      'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED',
      'ANDF_REGISTERED', 'RELEASED', 'DISPUTED', 'REFUNDED', 'EXPIRED',
    ];

    if (!targetStatus || !validStates.includes(targetStatus as EscrowState)) {
      return NextResponse.json(
        { error: 'État cible invalide', validStates },
        { status: 400 }
      );
    }

    const targetState = targetStatus as EscrowState;

    // Fetch current transaction
    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    const currentState = transaction.status as EscrowState;

    // Check if already in a terminal state
    if (['RELEASED', 'REFUNDED', 'EXPIRED'].includes(currentState)) {
      return NextResponse.json(
        { error: `Impossible de modifier une transaction terminée (${currentState})`, currentState },
        { status: 409 }
      );
    }

    // Validate the transition
    if (!isValidTransition(currentState, targetState)) {
      return NextResponse.json(
        {
          error: `Transition invalide : ${currentState} → ${targetState}`,
          currentState,
          targetState,
          validTransitions: VALID_TRANSITIONS[currentState],
        },
        { status: 422 }
      );
    }

    // Role-based authorization for specific transitions
    const transitionActorType = actorType || 'system';
    const authorizedTransitions: Record<string, string[]> = {
      'FUNDED': ['buyer', 'system'],
      'DOCS_VALIDATED': ['system', 'admin'],
      'GEOTRUST_VALIDATED': ['geometer', 'system', 'admin'],
      'NOTARY_ASSIGNED': ['admin', 'system'],
      'NOTARY_IN_PROGRESS': ['notary', 'admin', 'system'],
      'DEED_SIGNED': ['notary', 'admin'],
      'ANDF_REGISTERED': ['notary', 'admin', 'system'],
      'RELEASED': ['notary', 'admin', 'system'],
      'DISPUTED': ['buyer', 'seller', 'admin'],
      'REFUNDED': ['admin', 'system'],
      'EXPIRED': ['system', 'admin'],
    };

    const allowedActors = authorizedTransitions[targetState] || ['admin'];
    if (auth.role !== 'admin' && !allowedActors.includes(transitionActorType)) {
      return NextResponse.json(
        { error: 'Rôle non autorisé pour cette transition', requiredRoles: allowedActors },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: targetState,
    };

    // Set timestamp field if applicable
    const timestampField = STATE_TIMESTAMP_FIELD[targetState];
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    // Set dispute reason if transitioning to DISPUTED
    if (targetState === 'DISPUTED' && reason) {
      updateData.disputeReason = reason;
    }

    // If DISPUTED, update escrow account status too
    if (targetState === 'DISPUTED') {
      try {
        await db.escrowAccount.update({
          where: { transactionId: id },
          data: { status: 'DISPUTED' },
        });
      } catch {
        // Escrow account may not exist yet
      }
    }

    // If REFUNDED, update escrow account
    if (targetState === 'REFUNDED') {
      try {
        await db.escrowAccount.update({
          where: { transactionId: id },
          data: { status: 'REFUNDED', refundedAt: new Date() },
        });
      } catch {
        // Escrow account may not exist yet
      }
    }

    // Execute the state transition with timeline event
    const transitionKey = `${currentState}→${targetState}`;
    const description = reason || TRANSITION_DESCRIPTIONS[transitionKey] || `Transition: ${currentState} → ${targetState}`;

    const [updatedTransaction] = await db.$transaction([
      db.transaction.update({
        where: { id },
        data: updateData,
      }),
      db.transactionTimeline.create({
        data: {
          transactionId: id,
          fromStatus: currentState,
          toStatus: targetState,
          actorType: transitionActorType,
          actorId: auth.userId,
          description,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      transition: {
        from: currentState,
        to: targetState,
        description,
      },
    });
  } catch (error) {
    console.error('Escrow PATCH error:', error);
    return NextResponse.json({ error: 'Failed to transition escrow state' }, { status: 500 });
  }
}
