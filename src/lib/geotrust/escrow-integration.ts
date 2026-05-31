// AfriBayit — GeoTrust Escrow Integration
// CDC §7C.5 — Automatic GeoTrust condition gating for escrow transactions
//
// Rules:
// - Terrain nu → GEO_INSP mandatory before IN_PROGRESS
// - Transaction > 10M XOF → GEO_SURF mandatory
// - Superficie > 500m² → GEO_TOPO required
// - Premium/Coup de cœur → GEO_CERT mandatory
//
// Integration with escrow-engine:
// - geometer_required, geometer_mission_id, geometer_validation_status fields
// - State transitions based on geometer validation (PENDING/IN_PROGRESS/VALIDATED/ALERT/REJECTED)
// - Automatic DISPUTED state when ALERT detected
// - Automatic REFUNDED when REJECTED detected
// - Notification triggers for all state changes

import { db } from '@/lib/db';
import { transition } from '@/lib/payments/escrow-engine';
import type { TransactionState } from '@/lib/payments/types';

// ============ Types ============

/** GeoTrust service codes matching GeometerMission.serviceCode */
export type GeoTrustServiceCode =
  | 'GEO_GPS'
  | 'GEO_SURF'
  | 'GEO_INSP'
  | 'GEO_BORN'
  | 'GEO_TOPO'
  | 'GEO_DRON'
  | 'GEO_CERT'
  | 'GEO_3D';

/** Geometer validation status for escrow integration */
export type GeometerValidationStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'VALIDATED'
  | 'ALERT'
  | 'REJECTED';

/** Property data for rule evaluation */
export interface PropertyEscrowData {
  id: string;
  type: string;          // villa, appartement, terrain, bureau, commerce, etc.
  price: number;
  surface: number;
  country: string;
  isBareLand?: boolean;  // terrain nu
  isPremium?: boolean;   // premium listing
  isCoupDeCoeur?: boolean; // coup de cœur badge
  geoTrustLevel?: string | null;
}

/** Result of GeoTrust escrow rule evaluation */
export interface GeoTrustRuleEvaluation {
  geometerRequired: boolean;
  requiredServices: GeoTrustServiceCode[];
  rules: {
    rule: string;
    condition: string;
    serviceCode: GeoTrustServiceCode;
    triggered: boolean;
  }[];
  blockingUntilValidated: boolean;
}

/** Escrow-GeoTrust integration fields */
export interface EscrowGeoTrustFields {
  geometer_required: boolean;
  geometer_mission_id: string | null;
  geometer_validation_status: GeometerValidationStatus;
  required_services: GeoTrustServiceCode[];
}

// ============ CDC §7C.5 — Rule Evaluation ============

/**
 * Evaluate GeoTrust conditions for an escrow transaction based on property data.
 * Returns which GeoTrust services are mandatory and whether geometer validation
 * blocks the transaction from progressing.
 */
export function evaluateGeoTrustConditions(property: PropertyEscrowData): GeoTrustRuleEvaluation {
  const rules: GeoTrustRuleEvaluation['rules'] = [];

  // Rule 1: Terrain nu → GEO_INSP mandatory before IN_PROGRESS
  const isTerrainNu = property.type === 'terrain' || property.isBareLand === true;
  rules.push({
    rule: 'Terrain nu — Inspection obligatoire',
    condition: `Type de bien: ${property.type}${property.isBareLand ? ' (terrain nu)' : ''}`,
    serviceCode: 'GEO_INSP',
    triggered: isTerrainNu,
  });

  // Rule 2: Transaction > 10M XOF → GEO_SURF mandatory
  const isHighValue = property.price > 10_000_000;
  rules.push({
    rule: 'Transaction > 10M XOF — Levé de surface obligatoire',
    condition: `Prix: ${new Intl.NumberFormat('fr-FR').format(property.price)} XOF`,
    serviceCode: 'GEO_SURF',
    triggered: isHighValue,
  });

  // Rule 3: Superficie > 500m² → GEO_TOPO required
  const isLargeSurface = property.surface > 500;
  rules.push({
    rule: 'Superficie > 500m² — Levé topographique requis',
    condition: `Surface: ${property.surface}m²`,
    serviceCode: 'GEO_TOPO',
    triggered: isLargeSurface,
  });

  // Rule 4: Premium/Coup de cœur → GEO_CERT mandatory
  const isPremiumOrCoupDeCoeur = property.isPremium === true || property.isCoupDeCoeur === true;
  rules.push({
    rule: 'Premium/Coup de cœur — Certification GeoTrust obligatoire',
    condition: property.isPremium ? 'Annonce Premium' : property.isCoupDeCoeur ? 'Coup de cœur' : 'Standard',
    serviceCode: 'GEO_CERT',
    triggered: isPremiumOrCoupDeCoeur,
  });

  // Collect triggered service codes (deduplicated)
  const requiredServices = [...new Set(
    rules.filter(r => r.triggered).map(r => r.serviceCode)
  )];

  const geometerRequired = requiredServices.length > 0;

  return {
    geometerRequired,
    requiredServices,
    rules,
    blockingUntilValidated: geometerRequired,
  };
}

// ============ Escrow-GeoTrust Integration ============

/**
 * Check if a transaction can transition to IN_PROGRESS based on GeoTrust conditions.
 * If geometer validation is required and not yet VALIDATED, the transition is blocked.
 */
export function canTransitionWithGeoTrust(
  currentStatus: TransactionState,
  targetStatus: TransactionState,
  geoTrustFields: EscrowGeoTrustFields
): { allowed: boolean; reason?: string } {
  // Only check GeoTrust gating for transitions that require geometer validation
  const geoGatedTransitions: TransactionState[] = ['GEO_VERIFIED', 'DEED_SIGNED', 'ANDF_REGISTERED'];

  if (!geoGatedTransitions.includes(targetStatus) && targetStatus !== 'NOTARY_ASSIGNED') {
    return { allowed: true };
  }

  // If no geometer required, allow all transitions
  if (!geoTrustFields.geometer_required) {
    return { allowed: true };
  }

  // For transition to GEO_VERIFIED, the geometer must have VALIDATED
  if (targetStatus === 'GEO_VERIFIED') {
    if (geoTrustFields.geometer_validation_status !== 'VALIDATED') {
      return {
        allowed: false,
        reason: `Validation géomètre requise — statut actuel: ${geoTrustFields.geometer_validation_status}`,
      };
    }
  }

  // For other transitions past GEO_VERIFIED, check that GeoTrust was validated
  if (geoGatedTransitions.includes(targetStatus) && targetStatus !== 'GEO_VERIFIED') {
    if (geoTrustFields.geometer_validation_status !== 'VALIDATED') {
      return {
        allowed: false,
        reason: `GeoTrust non validé — la transaction ne peut pas progresser au-delà de GEO_VERIFIED sans validation géomètre`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Process geometer validation status change and trigger automatic escrow state transitions.
 * - VALIDATED → allows transaction to proceed to GEO_VERIFIED
 * - ALERT → automatic DISPUTED state
 * - REJECTED → automatic REFUNDED state
 */
export async function processGeometerValidationChange(
  transactionId: string,
  missionId: string,
  newStatus: GeometerValidationStatus,
  actorId: string
): Promise<{ transitioned: boolean; newEscrowState?: TransactionState; reason?: string }> {
  // Fetch transaction with escrow account
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: { property: true, escrowAccount: true },
  });

  if (!transaction) {
    throw new Error(`Transaction ${transactionId} introuvable`);
  }

  // Parse current GeoTrust fields from conditions JSON
  const conditions = transaction.conditions
    ? JSON.parse(transaction.conditions)
    : {};

  const currentGeoTrustFields: EscrowGeoTrustFields = {
    geometer_required: conditions.geometer_required ?? false,
    geometer_mission_id: conditions.geometer_mission_id ?? null,
    geometer_validation_status: conditions.geometer_validation_status ?? 'PENDING',
    required_services: conditions.required_services ?? [],
  };

  // Update the GeoTrust fields in the conditions JSON
  const updatedConditions = {
    ...conditions,
    geometer_required: currentGeoTrustFields.geometer_required,
    geometer_mission_id: missionId,
    geometer_validation_status: newStatus,
    required_services: currentGeoTrustFields.required_services,
    geometer_updated_at: new Date().toISOString(),
  };

  await db.transaction.update({
    where: { id: transactionId },
    data: {
      conditions: JSON.stringify(updatedConditions),
      geometerId: missionId,
    },
  });

  // Handle automatic state transitions based on validation status
  switch (newStatus) {
    case 'VALIDATED': {
      // Allow transaction to move to GEO_VERIFIED if currently at NOTARY_ASSIGNED
      const currentState = transaction.status as TransactionState;
      if (currentState === 'NOTARY_ASSIGNED') {
        try {
          const event = await transition(
            transactionId,
            'GEO_VERIFIED',
            actorId,
            'Validation géomètre GeoTrust confirmée — passage automatique à GEO_VERIFIED'
          );
          return { transitioned: true, newEscrowState: 'GEO_VERIFIED', reason: 'Validation géomètre confirmée' };
        } catch {
          return { transitioned: false, reason: 'Transition vers GEO_VERIFIED échouée' };
        }
      }
      return { transitioned: false, reason: 'Transaction non au statut NOTARY_ASSIGNED — validation enregistrée' };
    }

    case 'ALERT': {
      // Automatic DISPUTED state when ALERT detected (CDC §7C.5)
      const currentState = transaction.status as TransactionState;
      if (!['RELEASED', 'REFUNDED', 'CANCELLED'].includes(currentState)) {
        try {
          await transition(
            transactionId,
            'DISPUTED',
            'system',
            'Alerte géomètre détectée — passage automatique en litige (CDC §7C.5)'
          );
          return { transitioned: true, newEscrowState: 'DISPUTED', reason: 'Alerte géomètre — litige automatique' };
        } catch {
          return { transitioned: false, reason: 'Transition vers DISPUTED échouée' };
        }
      }
      return { transitioned: false, reason: 'Transaction déjà terminée' };
    }

    case 'REJECTED': {
      // Automatic REFUNDED when REJECTED detected (CDC §7C.5)
      const currentState = transaction.status as TransactionState;
      if (!['RELEASED', 'REFUNDED', 'CANCELLED'].includes(currentState)) {
        try {
          await transition(
            transactionId,
            'REFUNDED',
            'system',
            'Rejet géomètre — remboursement automatique (CDC §7C.5)'
          );
          return { transitioned: true, newEscrowState: 'REFUNDED', reason: 'Rejet géomètre — remboursement automatique' };
        } catch {
          return { transitioned: false, reason: 'Transition vers REFUNDED échouée' };
        }
      }
      return { transitioned: false, reason: 'Transaction déjà terminée' };
    }

    case 'IN_PROGRESS': {
      // Just record the status change, no automatic transition
      return { transitioned: false, reason: 'Mission géomètre en cours' };
    }

    case 'PENDING':
    default: {
      return { transitioned: false, reason: 'En attente de validation géomètre' };
    }
  }
}

// ============ Mission Creation for Escrow ============

/**
 * Create GeoTrust missions for a transaction based on required services.
 * Called automatically when an escrow transaction is created and GeoTrust
 * conditions are triggered.
 */
export async function createEscrowGeoTrustMissions(
  transactionId: string,
  propertyId: string,
  requiredServices: GeoTrustServiceCode[],
  country?: string
): Promise<string[]> {
  if (requiredServices.length === 0) return [];

  // Find an available geometer for the property location
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { city: true, country: true, lat: true, lng: true },
  });

  if (!property) {
    throw new Error(`Propriété ${propertyId} introuvable`);
  }

  // Find available geometer with matching specialties
  const geometer = await db.geometer.findFirst({
    where: {
      available: true,
      country: country || property.country,
      ...(property.city ? { city: property.city } : {}),
    },
    orderBy: { rating: 'desc' },
  });

  if (!geometer) {
    throw new Error('Aucun géomètre disponible pour cette zone');
  }

  // Service code pricing (XOF)
  const SERVICE_PRICING: Record<GeoTrustServiceCode, number> = {
    GEO_GPS: 25000,
    GEO_SURF: 50000,
    GEO_INSP: 40000,
    GEO_BORN: 60000,
    GEO_TOPO: 75000,
    GEO_DRON: 100000,
    GEO_CERT: 150000,
    GEO_3D: 120000,
  };

  const missionIds: string[] = [];

  for (const serviceCode of requiredServices) {
    const mission = await db.geometerMission.create({
      data: {
        propertyId,
        geometerId: geometer.id,
        serviceCode,
        status: 'requested',
        price: SERVICE_PRICING[serviceCode],
        currency: 'XOF',
      },
    });
    missionIds.push(mission.id);
  }

  // Update transaction conditions with GeoTrust integration fields
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
  });

  if (transaction) {
    const conditions = transaction.conditions
      ? JSON.parse(transaction.conditions)
      : {};

    await db.transaction.update({
      where: { id: transactionId },
      data: {
        conditions: JSON.stringify({
          ...conditions,
          geometer_required: true,
          geometer_mission_id: missionIds[0] || null,
          geometer_validation_status: 'PENDING' as GeometerValidationStatus,
          required_services: requiredServices,
          geometer_missions: missionIds,
          geometer_created_at: new Date().toISOString(),
        }),
        geometerId: geometer.id,
      },
    });
  }

  return missionIds;
}

// ============ Notification Triggers ============

/**
 * Send notifications for GeoTrust escrow state changes.
 * Notifies the buyer, seller, and admin (for alerts/rejections).
 */
export async function notifyGeoTrustStateChange(
  transactionId: string,
  validationStatus: GeometerValidationStatus,
  previousStatus: GeometerValidationStatus
): Promise<void> {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: { buyerId: true, sellerId: true },
    });

    if (!transaction) return;

    const STATUS_MESSAGES: Record<GeometerValidationStatus, { title: string; message: string }> = {
      PENDING: {
        title: 'GeoTrust — En attente',
        message: 'La mission géomètre est en attente d\'assignation.',
      },
      IN_PROGRESS: {
        title: 'GeoTrust — En cours',
        message: 'Le géomètre a commencé sa mission d\'inspection.',
      },
      VALIDATED: {
        title: 'GeoTrust — Validée',
        message: 'La validation géomètre a été confirmée. La transaction peut progresser.',
      },
      ALERT: {
        title: 'GeoTrust — Alerte',
        message: 'Une alerte géomètre a été détectée. La transaction est mise en litige automatiquement.',
      },
      REJECTED: {
        title: 'GeoTrust — Rejetée',
        message: 'La validation géomètre a été rejetée. Un remboursement automatique sera effectué.',
      },
    };

    const { title, message } = STATUS_MESSAGES[validationStatus];
    const channels = ['ALERT', 'REJECTED'].includes(validationStatus)
      ? JSON.stringify(['push', 'email', 'sms'])
      : JSON.stringify(['push', 'email']);

    const notifications: Promise<unknown>[] = [];

    // Notify buyer
    notifications.push(
      db.notification.create({
        data: {
          userId: transaction.buyerId,
          type: 'transaction',
          category: 'transactions',
          title,
          message,
          actionUrl: `/escrow`,
          channels,
          metadata: JSON.stringify({
            transactionId,
            validationStatus,
            previousStatus,
            source: 'geotrust_escrow',
          }),
        },
      })
    );

    // Notify seller
    if (transaction.sellerId !== transaction.buyerId) {
      notifications.push(
        db.notification.create({
          data: {
            userId: transaction.sellerId,
            type: 'transaction',
            category: 'transactions',
            title,
            message,
            actionUrl: `/escrow`,
            channels,
            metadata: JSON.stringify({
              transactionId,
              validationStatus,
              previousStatus,
              source: 'geotrust_escrow',
            }),
          },
        })
      );
    }

    // Notify admin for ALERT and REJECTED statuses
    if (validationStatus === 'ALERT' || validationStatus === 'REJECTED') {
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
              title: `GeoTrust ${validationStatus} — Transaction ${transactionId}`,
              message: `Statut géomètre: ${previousStatus} → ${validationStatus}. Action requise.`,
              actionUrl: `/admin/escrow`,
              channels: JSON.stringify(['push', 'email', 'sms']),
              metadata: JSON.stringify({
                transactionId,
                validationStatus,
                previousStatus,
                source: 'geotrust_escrow_admin',
              }),
            },
          })
        );
      }
    }

    await Promise.all(notifications);
  } catch {
    // Non-critical — don't fail the state change
  }
}

// ============ Full Integration: Evaluate + Create Missions ============

/**
 * Full GeoTrust escrow integration flow.
 * Called when a transaction is created/funded to:
 * 1. Evaluate GeoTrust conditions
 * 2. Create required missions
 * 3. Send notifications
 * 4. Return integration status
 */
export async function integrateGeoTrustWithEscrow(
  transactionId: string,
  property: PropertyEscrowData
): Promise<{
  evaluation: GeoTrustRuleEvaluation;
  missionIds: string[];
  geoTrustFields: EscrowGeoTrustFields;
}> {
  // Step 1: Evaluate conditions
  const evaluation = evaluateGeoTrustConditions(property);

  // Step 2: If geometer required, create missions
  let missionIds: string[] = [];
  if (evaluation.geometerRequired) {
    try {
      missionIds = await createEscrowGeoTrustMissions(
        transactionId,
        property.id,
        evaluation.requiredServices,
        property.country
      );
    } catch (error) {
      console.error('GeoTrust mission creation failed:', error);
      // Still record the requirement even if mission creation fails
    }
  }

  // Step 3: Build GeoTrust fields
  const geoTrustFields: EscrowGeoTrustFields = {
    geometer_required: evaluation.geometerRequired,
    geometer_mission_id: missionIds[0] || null,
    geometer_validation_status: evaluation.geometerRequired ? 'PENDING' : 'VALIDATED',
    required_services: evaluation.requiredServices,
  };

  // Step 4: Send initial notification if geometer required
  if (evaluation.geometerRequired) {
    await notifyGeoTrustStateChange(transactionId, 'PENDING', 'PENDING').catch(() => {});
  }

  return {
    evaluation,
    missionIds,
    geoTrustFields,
  };
}
