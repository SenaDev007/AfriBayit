// AfriBayit — Escrow State Machine Engine
// Implements the full transaction lifecycle with SHA-256 hash chaining
// CDC §5.0bis.4 — Escrow sécurisé
//
// State Machine:
// CREATED → FUNDED → NOTARY_ASSIGNED → GEO_VERIFIED → DEED_SIGNED → ANDF_REGISTERED → RELEASED
//                     ↘ DISPUTED → (RESOLVED → RELEASED | CANCELLED | REFUNDED)

import { db } from '@/lib/db';
import type { TransactionState, ReleaseConditions, EscrowTransitionEvent, EscrowEntryType } from './types';

// ============ State Machine Configuration ============

/** Valid forward transitions from each state */
const VALID_TRANSITIONS: Record<TransactionState, TransactionState[]> = {
  CREATED: ['FUNDED', 'DISPUTED', 'CANCELLED'],
  FUNDED: ['NOTARY_ASSIGNED', 'DISPUTED', 'REFUNDED', 'CANCELLED'],
  NOTARY_ASSIGNED: ['GEO_VERIFIED', 'DISPUTED', 'REFUNDED'],
  GEO_VERIFIED: ['DEED_SIGNED', 'DISPUTED', 'REFUNDED'],
  DEED_SIGNED: ['ANDF_REGISTERED', 'DISPUTED', 'REFUNDED'],
  ANDF_REGISTERED: ['RELEASED', 'DISPUTED', 'REFUNDED'],
  RELEASED: [], // Terminal
  DISPUTED: ['FUNDED', 'NOTARY_IN_PROGRESS' as TransactionState, 'REFUNDED', 'CANCELLED'],
  CANCELLED: [], // Terminal
  REFUNDED: [], // Terminal
};

/** Active states from which DISPUTED can be reached */
const ACTIVE_STATES: TransactionState[] = [
  'CREATED', 'FUNDED', 'NOTARY_ASSIGNED', 'GEO_VERIFIED', 'DEED_SIGNED', 'ANDF_REGISTERED',
];

/** Timestamp field to update for each state */
const STATE_TIMESTAMP_FIELD: Partial<Record<TransactionState, string>> = {
  FUNDED: 'escrowFundedAt',
  NOTARY_ASSIGNED: 'notaryAssignedAt',
  DEED_SIGNED: 'deedSignedAt',
  ANDF_REGISTERED: 'andfRegisteredAt',
  RELEASED: 'escrowReleasedAt',
};

/** Human-readable descriptions for state transitions */
const TRANSITION_LABELS: Record<string, string> = {
  'CREATED→FUNDED': 'Fonds déposés en escrow',
  'FUNDED→NOTARY_ASSIGNED': 'Notaire assigné à la transaction',
  'NOTARY_ASSIGNED→GEO_VERIFIED': 'Validation géomatique GeoTrust confirmée',
  'GEO_VERIFIED→DEED_SIGNED': 'Acte de vente signé par les parties',
  'DEED_SIGNED→ANDF_REGISTERED': 'Acte enregistré à l\'ANDF',
  'ANDF_REGISTERED→RELEASED': 'Fonds libérés au vendeur — Transaction terminée',
  'CREATED→DISPUTED': 'Litige signalé',
  'FUNDED→DISPUTED': 'Litige signalé (fonds en escrow)',
  'NOTARY_ASSIGNED→DISPUTED': 'Litige signalé (notaire assigné)',
  'GEO_VERIFIED→DISPUTED': 'Litige signalé (géomatique validée)',
  'DEED_SIGNED→DISPUTED': 'Litige signalé (acte signé)',
  'ANDF_REGISTERED→DISPUTED': 'Litige signalé (ANDF enregistré)',
  'DISPUTED→FUNDED': 'Litige résolu — retour à Financé',
  'DISPUTED→REFUNDED': 'Fonds remboursés suite au litige',
  'DISPUTED→CANCELLED': 'Transaction annulée suite au litige',
  'FUNDED→REFUNDED': 'Fonds remboursés à l\'acheteur',
  'FUNDED→CANCELLED': 'Transaction annulée',
  'CREATED→CANCELLED': 'Transaction annulée avant financement',
};

/** Default release conditions (all must be true for auto-release) */
const DEFAULT_RELEASE_CONDITIONS: ReleaseConditions = {
  docsValidated: true,
  geoTrustValidated: true,
  notaryAssigned: true,
  deedSigned: true,
  andfRegistered: true,
};

// ============ Hash Chaining ============

/**
 * Compute a SHA-256 hash for a ledger entry, chaining to the previous entry's hash.
 * This creates an immutable audit trail.
 */
async function computeLedgerHash(
  entry: {
    escrowAccountId: string;
    entryType: EscrowEntryType;
    amount: number;
    balanceAfter: number;
    currency: string;
    reference: string | null;
    createdAt: Date;
  },
  previousHash: string | null
): Promise<string> {
  const crypto = await import('crypto');
  const data = JSON.stringify({
    ...entry,
    previousHash,
  });
  return crypto.createHash('sha256').update(data).digest('hex');
}

// ============ Core Engine Functions ============

/**
 * Validate whether a state transition is allowed.
 */
export function canTransition(currentState: TransactionState, nextState: TransactionState): boolean {
  // DISPUTED can be reached from any active state
  if (nextState === 'DISPUTED' && ACTIVE_STATES.includes(currentState)) {
    return true;
  }
  return VALID_TRANSITIONS[currentState]?.includes(nextState) ?? false;
}

/**
 * Get the list of valid next states from a given state.
 */
export function getValidTransitions(currentState: TransactionState): TransactionState[] {
  const transitions = [...(VALID_TRANSITIONS[currentState] || [])];
  // Add DISPUTED from any active state
  if (ACTIVE_STATES.includes(currentState) && !transitions.includes('DISPUTED')) {
    transitions.push('DISPUTED');
  }
  return transitions;
}

/**
 * Perform a state transition with full validation, logging, and ledger updates.
 *
 * This is the primary function for moving transactions through the escrow lifecycle.
 * It:
 * 1. Validates the transition is allowed
 * 2. Updates the transaction status
 * 3. Sets the appropriate timestamp
 * 4. Creates a timeline event
 * 5. Creates an escrow ledger entry with hash chaining
 * 6. Emits notification events
 */
export async function transition(
  transactionId: string,
  newState: TransactionState,
  userId: string,
  reason?: string,
  metadata?: Record<string, unknown>
): Promise<EscrowTransitionEvent> {
  // Fetch current transaction
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { escrowAccount: { include: { ledger: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
  });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  const currentState = transaction.status as TransactionState;

  // Check if already in a terminal state
  if (['RELEASED', 'REFUNDED', 'CANCELLED'].includes(currentState)) {
    throw new Error(`Cannot transition from terminal state: ${currentState}`);
  }

  // Validate the transition
  if (!canTransition(currentState, newState)) {
    throw new Error(
      `Invalid transition: ${currentState} → ${newState}. Valid: ${getValidTransitions(currentState).join(', ')}`
    );
  }

  const now = new Date();
  const transitionKey = `${currentState}→${newState}`;
  const description = reason || TRANSITION_LABELS[transitionKey] || `Transition: ${currentState} → ${newState}`;

  // Prepare transaction update data
  const updateData: Record<string, unknown> = {
    status: newState,
  };

  // Set timestamp field
  const timestampField = STATE_TIMESTAMP_FIELD[newState];
  if (timestampField) {
    updateData[timestampField] = now;
  }

  // Set dispute reason
  if (newState === 'DISPUTED' && reason) {
    updateData.disputeReason = reason;
  }

  // Execute all DB operations in a transaction
  const result = await db.$transaction(async (tx) => {
    // 1. Update transaction
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: updateData,
    });

    // 2. Create timeline event
    await tx.transactionTimeline.create({
      data: {
        transactionId,
        fromStatus: currentState,
        toStatus: newState,
        actorType: getActorType(newState),
        actorId: userId,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // 3. Handle escrow account updates
    if (transaction.escrowAccount) {
      const escrowAccount = transaction.escrowAccount;
      const lastLedgerEntry = escrowAccount.ledger[0];
      const previousHash = lastLedgerEntry?.reference || null;

      if (newState === 'FUNDED') {
        // Credit the escrow account
        const newBalance = escrowAccount.balance + transaction.amount;
        const ledgerEntry = {
          escrowAccountId: escrowAccount.id,
          entryType: 'CREDIT' as const,
          amount: transaction.amount,
          balanceAfter: newBalance,
          currency: transaction.currency,
          reference: null,
          createdAt: now,
        };
        const hash = await computeLedgerHash(ledgerEntry, previousHash);

        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: {
            balance: newBalance,
            heldAmount: newBalance,
            status: 'FUNDED',
            fundedAt: now,
          },
        });

        await tx.escrowLedger.create({
          data: {
            ...ledgerEntry,
            reference: hash,
          },
        });
      }

      if (newState === 'RELEASED') {
        // Release funds: debit escrow, account for commission
        const commissionRate = transaction.commissionRate || 0.025;
        const commission = Math.round(transaction.amount * commissionRate);
        const sellerPayout = transaction.amount - commission;
        const currentBalance = escrowAccount.balance;

        // Commission entry
        const commissionEntry = {
          escrowAccountId: escrowAccount.id,
          entryType: 'COMMISSION' as const,
          amount: commission,
          balanceAfter: currentBalance - commission,
          currency: transaction.currency,
          reference: null,
          createdAt: now,
        };
        const commissionHash = await computeLedgerHash(commissionEntry, previousHash);

        await tx.escrowLedger.create({
          data: {
            ...commissionEntry,
            reference: commissionHash,
          },
        });

        // Release entry
        const releaseEntry = {
          escrowAccountId: escrowAccount.id,
          entryType: 'RELEASE' as const,
          amount: sellerPayout,
          balanceAfter: 0,
          currency: transaction.currency,
          reference: null,
          createdAt: now,
        };
        const releaseHash = await computeLedgerHash(releaseEntry, commissionHash);

        await tx.escrowLedger.create({
          data: {
            ...releaseEntry,
            reference: releaseHash,
          },
        });

        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: {
            balance: 0,
            heldAmount: 0,
            releasedAmount: sellerPayout,
            status: 'FULL_RELEASE',
            releasedAt: now,
          },
        });
      }

      if (newState === 'REFUNDED') {
        // Refund: debit escrow back to buyer
        const refundEntry = {
          escrowAccountId: escrowAccount.id,
          entryType: 'REFUND' as const,
          amount: escrowAccount.heldAmount,
          balanceAfter: 0,
          currency: transaction.currency,
          reference: null,
          createdAt: now,
        };
        const refundHash = await computeLedgerHash(refundEntry, previousHash);

        await tx.escrowLedger.create({
          data: {
            ...refundEntry,
            reference: refundHash,
          },
        });

        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: {
            balance: 0,
            heldAmount: 0,
            refundedAmount: escrowAccount.heldAmount,
            status: 'REFUNDED',
            refundedAt: now,
          },
        });
      }

      if (newState === 'DISPUTED') {
        await tx.escrowAccount.update({
          where: { id: escrowAccount.id },
          data: { status: 'DISPUTED' },
        });
      }
    }

    return updated;
  });

  // Emit notification (non-blocking)
  emitTransitionNotification(transactionId, currentState, newState, userId, description).catch(() => {
    // Notification failure should not block the transition
  });

  return {
    transactionId,
    fromState: currentState,
    toState: newState,
    actorType: getActorType(newState),
    actorId: userId,
    reason,
    metadata,
    timestamp: now,
  };
}

/**
 * Check release conditions for a transaction.
 * Evaluates whether all conditions required for fund release are met.
 */
export async function checkReleaseConditions(transactionId: string): Promise<{
  canRelease: boolean;
  conditions: ReleaseConditions;
  missing: string[];
}> {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  // Parse custom conditions or use defaults
  const customConditions = transaction.conditions
    ? JSON.parse(transaction.conditions)
    : null;

  const requiredConditions = customConditions || DEFAULT_RELEASE_CONDITIONS;

  // Evaluate each condition based on transaction state
  const currentState = transaction.status as TransactionState;
  const stateOrder: TransactionState[] = [
    'CREATED', 'FUNDED', 'NOTARY_ASSIGNED', 'GEO_VERIFIED', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED',
  ];
  const currentIndex = stateOrder.indexOf(currentState);

  const conditions: ReleaseConditions = {
    docsValidated: currentIndex >= stateOrder.indexOf('NOTARY_ASSIGNED') || !requiredConditions.docsValidated,
    geoTrustValidated: currentIndex >= stateOrder.indexOf('GEO_VERIFIED') || !requiredConditions.geoTrustValidated,
    notaryAssigned: currentIndex >= stateOrder.indexOf('NOTARY_ASSIGNED') || !requiredConditions.notaryAssigned,
    deedSigned: currentIndex >= stateOrder.indexOf('DEED_SIGNED') || !requiredConditions.deedSigned,
    andfRegistered: currentIndex >= stateOrder.indexOf('ANDF_REGISTERED') || !requiredConditions.andfRegistered,
  };

  const missing: string[] = [];
  if (requiredConditions.docsValidated && !conditions.docsValidated) missing.push('Documents légaux validés');
  if (requiredConditions.geoTrustValidated && !conditions.geoTrustValidated) missing.push('Validation GeoTrust');
  if (requiredConditions.notaryAssigned && !conditions.notaryAssigned) missing.push('Notaire assigné');
  if (requiredConditions.deedSigned && !conditions.deedSigned) missing.push('Acte de vente signé');
  if (requiredConditions.andfRegistered && !conditions.andfRegistered) missing.push('Enregistrement ANDF');

  return {
    canRelease: missing.length === 0 && currentState === 'ANDF_REGISTERED',
    conditions,
    missing,
  };
}

/**
 * Auto-release escrow funds when all release conditions are met.
 * Called after state transitions that might complete all conditions.
 */
export async function autoRelease(transactionId: string, userId: string): Promise<EscrowTransitionEvent | null> {
  const { canRelease } = await checkReleaseConditions(transactionId);

  if (!canRelease) {
    return null;
  }

  return transition(transactionId, 'RELEASED', userId, 'Libération automatique — toutes conditions remplies');
}

/**
 * Initiate a dispute for a transaction.
 * Can be called from any active state.
 */
export async function initDispute(
  transactionId: string,
  reason: string,
  initiatedBy: string
): Promise<EscrowTransitionEvent> {
  return transition(transactionId, 'DISPUTED', initiatedBy, reason, {
    disputeInitiatedAt: new Date().toISOString(),
    disputeReason: reason,
  });
}

/**
 * Resolve a dispute with a specific resolution.
 * Supports: refund (full/partial), release to seller, or return to previous state.
 */
export async function resolveDispute(
  transactionId: string,
  resolution: 'release' | 'refund' | 'return_to_funded',
  amountToBuyer: number,
  amountToSeller: number,
  resolvedBy: string
): Promise<EscrowTransitionEvent> {
  let targetState: TransactionState;

  switch (resolution) {
    case 'release':
      targetState = 'RELEASED';
      break;
    case 'refund':
      targetState = 'REFUNDED';
      break;
    case 'return_to_funded':
      targetState = 'FUNDED';
      break;
    default:
      throw new Error(`Unknown dispute resolution: ${resolution}`);
  }

  return transition(transactionId, targetState, resolvedBy, `Litige résolu: ${resolution}`, {
    disputeResolution: resolution,
    amountToBuyer,
    amountToSeller,
    resolvedAt: new Date().toISOString(),
  });
}

// ============ Helpers ============

function getActorType(targetState: TransactionState): string {
  const actorMap: Record<string, string> = {
    FUNDED: 'buyer',
    NOTARY_ASSIGNED: 'admin',
    GEO_VERIFIED: 'geometer',
    DEED_SIGNED: 'notary',
    ANDF_REGISTERED: 'notary',
    RELEASED: 'system',
    DISPUTED: 'buyer',
    CANCELLED: 'admin',
    REFUNDED: 'admin',
  };
  return actorMap[targetState] || 'system';
}

/**
 * Emit a notification for a state transition.
 * Creates in-app notifications for relevant parties.
 */
async function emitTransitionNotification(
  transactionId: string,
  fromState: TransactionState,
  toState: TransactionState,
  _userId: string,
  description: string
): Promise<void> {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: { buyerId: true, sellerId: true },
    });

    if (!transaction) return;

    const notifications: Promise<unknown>[] = [];

    // Notify buyer
    notifications.push(
      db.notification.create({
        data: {
          userId: transaction.buyerId,
          type: 'transaction',
          category: 'transactions',
          title: `Escrow: ${toState}`,
          message: description,
          actionUrl: `/escrow`,
          channels: JSON.stringify(['push', 'email']),
        },
      })
    );

    // Notify seller (if different from buyer)
    if (transaction.sellerId !== transaction.buyerId) {
      notifications.push(
        db.notification.create({
          data: {
            userId: transaction.sellerId,
            type: 'transaction',
            category: 'transactions',
            title: `Escrow: ${toState}`,
            message: description,
            actionUrl: `/escrow`,
            channels: JSON.stringify(['push', 'email']),
          },
        })
      );
    }

    // Notify admin for disputes
    if (toState === 'DISPUTED') {
      const admins = await db.user.findMany({
        where: { role: 'admin' },
        select: { id: true },
        take: 5,
      });

      for (const admin of admins) {
        notifications.push(
          db.notification.create({
            data: {
              userId: admin.id,
              type: 'alert',
              category: 'transactions',
              title: 'Litige Escrow signalé',
              message: `Un litige a été signalé pour la transaction ${transactionId}`,
              actionUrl: `/admin/escrow`,
              channels: JSON.stringify(['push', 'email', 'sms']),
            },
          })
        );
      }
    }

    await Promise.all(notifications);
  } catch {
    // Non-critical — don't fail the transition
  }
}

/**
 * Get the full escrow dashboard data for a transaction.
 * Includes: transaction details, escrow account, ledger, timeline, release conditions.
 */
export async function getEscrowDashboardData(transactionId: string) {
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
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
      buyer: { select: { id: true, name: true, email: true, phone: true } },
      escrowAccount: {
        include: {
          ledger: { orderBy: { createdAt: 'desc' } },
        },
      },
      timelineEvents: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} not found`);
  }

  const releaseCheck = await checkReleaseConditions(transactionId);

  return {
    transaction,
    releaseConditions: releaseCheck,
  };
}
