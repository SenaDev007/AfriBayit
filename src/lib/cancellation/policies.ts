// AfriBayit — Cancellation Policy Definitions
// Trois niveaux de politique d'annulation: Flexible, Modérée, Stricte

export type CancellationPolicyType = 'flexible' | 'moderate' | 'strict';

export interface CancellationPolicy {
  type: CancellationPolicyType;
  name: string;
  description: string;
  /** Remboursement complet si annulé X jours avant le check-in */
  fullRefundDaysBefore: number;
  /** Remboursement partiel (50%) si annulé X jours avant le check-in */
  partialRefundDaysBefore: number;
  /** Pourcentage du remboursement partiel */
  partialRefundPct: number;
  /** Pas de remboursement si moins de X jours avant le check-in */
  noRefundDaysBefore: number;
}

/** Politique Flexible — Remboursement complet 24h avant */
export const FLEXIBLE_POLICY: CancellationPolicy = {
  type: 'flexible',
  name: 'Flexible',
  description: 'Annulation gratuite 24h avant l\'arrivée. 50% remboursé après.',
  fullRefundDaysBefore: 1,
  partialRefundDaysBefore: 0,
  partialRefundPct: 50,
  noRefundDaysBefore: 0,
};

/** Politique Modérée — Remboursement complet 5 jours avant */
export const MODERATE_POLICY: CancellationPolicy = {
  type: 'moderate',
  name: 'Modérée',
  description: 'Annulation gratuite 5 jours avant. 50% remboursé 2 jours avant. Pas de remboursement moins de 2 jours avant.',
  fullRefundDaysBefore: 5,
  partialRefundDaysBefore: 2,
  partialRefundPct: 50,
  noRefundDaysBefore: 2,
};

/** Politique Stricte — Remboursement complet 14 jours avant */
export const STRICT_POLICY: CancellationPolicy = {
  type: 'strict',
  name: 'Stricte',
  description: 'Annulation gratuite 14 jours avant. 50% remboursé 7 jours avant. Pas de remboursement moins de 7 jours avant.',
  fullRefundDaysBefore: 14,
  partialRefundDaysBefore: 7,
  partialRefundPct: 50,
  noRefundDaysBefore: 7,
};

/** Carte des politiques */
export const CANCELLATION_POLICIES: Record<CancellationPolicyType, CancellationPolicy> = {
  flexible: FLEXIBLE_POLICY,
  moderate: MODERATE_POLICY,
  strict: STRICT_POLICY,
};

/**
 * Calculer le montant du remboursement selon la politique
 *
 * @param policyType Type de politique (flexible, moderate, strict)
 * @param totalPrice Prix total de la réservation
 * @param checkInDate Date de check-in
 * @param cancellationDate Date d'annulation
 * @returns Montant du remboursement et détails
 */
export function calculateRefund(
  policyType: CancellationPolicyType,
  totalPrice: number,
  checkInDate: Date,
  cancellationDate: Date
): {
  refundAmount: number;
  refundPct: number;
  policy: CancellationPolicy;
  reason: string;
} {
  const policy = CANCELLATION_POLICIES[policyType];

  // Calculer les jours avant le check-in
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysBefore = Math.floor(
    (checkInDate.getTime() - cancellationDate.getTime()) / msPerDay
  );

  // Remboursement complet
  if (daysBefore >= policy.fullRefundDaysBefore) {
    return {
      refundAmount: totalPrice,
      refundPct: 100,
      policy,
      reason: `Annulation ${daysBefore} jour(s) avant le check-in. Remboursement complet selon la politique ${policy.name}.`,
    };
  }

  // Remboursement partiel
  if (daysBefore >= policy.partialRefundDaysBefore && policy.partialRefundDaysBefore > 0) {
    const refundAmount = Math.round(totalPrice * (policy.partialRefundPct / 100));
    return {
      refundAmount,
      refundPct: policy.partialRefundPct,
      policy,
      reason: `Annulation ${daysBefore} jour(s) avant le check-in. Remboursement partiel (${policy.partialRefundPct}%) selon la politique ${policy.name}.`,
    };
  }

  // Pas de remboursement si annulation trop tardive
  // Sauf politique flexible où on rembourse 50% même le jour même
  if (policyType === 'flexible' && daysBefore < policy.fullRefundDaysBefore) {
    const refundAmount = Math.round(totalPrice * (policy.partialRefundPct / 100));
    return {
      refundAmount,
      refundPct: policy.partialRefundPct,
      policy,
      reason: `Annulation le jour même. Remboursement partiel (${policy.partialRefundPct}%) selon la politique Flexible.`,
    };
  }

  // Aucun remboursement
  return {
    refundAmount: 0,
    refundPct: 0,
    policy,
    reason: `Annulation ${daysBefore} jour(s) avant le check-in. Aucun remboursement selon la politique ${policy.name} (minimum ${policy.noRefundDaysBefore} jours).`,
  };
}

/**
 * Obtenir la politique d'annulation par défaut pour un type d'établissement
 */
export function getDefaultPolicy(hotelConnectionLevel: number): CancellationPolicyType {
  // Niveau 1 (OTA) → Modérée
  // Niveau 2 (Hors-réseau PMS) → Modérée
  // Niveau 3 (Guesthouse) → Flexible
  if (hotelConnectionLevel === 3) return 'flexible';
  if (hotelConnectionLevel === 1) return 'moderate';
  return 'moderate';
}
