// AfriBayit — KYC Payout Limits
// CDC §7B — Limites de retrait par niveau KYC
//
// Level 1 (basic KYC): 500,000 XOF/month max payout
// Level 2 (intermediate KYC): 5,000,000 XOF/month max payout
// Level 3 (full KYC): unlimited
//
// Anti-fraud: 24h hold on first 3 payouts

/** KYC level definitions */
export type KycLevel = 1 | 2 | 3;

/** Payout limit configuration per KYC level */
export interface PayoutLimitConfig {
  kycLevel: KycLevel;
  labelFr: string;
  monthlyLimit: number | null; // null = unlimited
  singlePayoutLimit: number | null; // null = no single-payout limit
  description: string;
}

/** Payout check result */
export interface PayoutCheckResult {
  allowed: boolean;
  reason?: string;
  remainingMonthlyLimit?: number;
  holdRequired: boolean;
  holdDurationHours: number;
}

/** User payout context for checking limits */
export interface UserPayoutContext {
  userId: string;
  kycLevel: number;
  currentMonthPayoutTotal: number; // total payouts this month in XOF
  payoutCount: number; // total number of payouts ever made
  requestedAmount: number; // amount to withdraw in XOF
}

/** KYC level payout limits — CDC §7B */
export const KYC_PAYOUT_LIMITS: PayoutLimitConfig[] = [
  {
    kycLevel: 1,
    labelFr: 'Vérification de base',
    monthlyLimit: 500_000,
    singlePayoutLimit: 200_000,
    description: 'Vérification d\'identité de base (pièce d\'identité + selfie)',
  },
  {
    kycLevel: 2,
    labelFr: 'Vérification intermédiaire',
    monthlyLimit: 5_000_000,
    singlePayoutLimit: 2_000_000,
    description: 'Vérification intermédiaire (preuve de domicile + vérification avancée)',
  },
  {
    kycLevel: 3,
    labelFr: 'Vérification complète',
    monthlyLimit: null, // unlimited
    singlePayoutLimit: null,
    description: 'Vérification complète KYC (identité + domicile + revenus)',
  },
];

/** Anti-fraud configuration */
export const ANTI_FRAUD_CONFIG = {
  /** Number of first payouts subject to 24h hold */
  holdThreshold: 3,
  /** Hold duration in hours */
  holdDurationHours: 24,
  /** Maximum payout amount for first 3 payouts */
  firstPayoutsMaxAmount: 200_000,
};

/**
 * Get the payout limit configuration for a given KYC level.
 */
export function getPayoutLimitConfig(kycLevel: number): PayoutLimitConfig {
  const level = Math.min(Math.max(kycLevel, 1), 3) as KycLevel;
  return KYC_PAYOUT_LIMITS.find(c => c.kycLevel === level) || KYC_PAYOUT_LIMITS[0];
}

/**
 * Check if a payout is allowed based on KYC level, monthly limits, and anti-fraud rules.
 * CDC §7B — KYC Payout Limits
 *
 * @param context - User payout context with KYC level, current month total, and requested amount
 * @returns PayoutCheckResult with allowed status, reason, and hold information
 */
export function checkPayoutAllowed(context: UserPayoutContext): PayoutCheckResult {
  const { kycLevel, currentMonthPayoutTotal, payoutCount, requestedAmount } = context;

  // Require at least KYC level 1
  if (kycLevel < 1) {
    return {
      allowed: false,
      reason: 'Vérification KYC requise. Veuillez compléter la vérification d\'identité pour effectuer un retrait.',
      holdRequired: false,
      holdDurationHours: 0,
    };
  }

  const config = getPayoutLimitConfig(kycLevel);

  // Check monthly limit
  if (config.monthlyLimit !== null) {
    const remainingMonthly = config.monthlyLimit - currentMonthPayoutTotal;
    if (remainingMonthly <= 0) {
      return {
        allowed: false,
        reason: `Limite mensuelle atteinte (${formatXof(config.monthlyLimit)}). Passez au niveau KYC supérieur pour augmenter votre limite.`,
        remainingMonthlyLimit: 0,
        holdRequired: false,
        holdDurationHours: 0,
      };
    }
    if (requestedAmount > remainingMonthly) {
      return {
        allowed: false,
        reason: `Montant demandé (${formatXof(requestedAmount)}) dépasse le reste de votre limite mensuelle (${formatXof(remainingMonthly)}).`,
        remainingMonthlyLimit: remainingMonthly,
        holdRequired: false,
        holdDurationHours: 0,
      };
    }
  }

  // Check single payout limit
  if (config.singlePayoutLimit !== null && requestedAmount > config.singlePayoutLimit) {
    return {
      allowed: false,
      reason: `Montant demandé (${formatXof(requestedAmount)}) dépasse la limite par retrait (${formatXof(config.singlePayoutLimit)}) pour votre niveau KYC. Passez au niveau supérieur.`,
      remainingMonthlyLimit: config.monthlyLimit !== null
        ? config.monthlyLimit - currentMonthPayoutTotal
        : undefined,
      holdRequired: false,
      holdDurationHours: 0,
    };
  }

  // Anti-fraud: 24h hold on first 3 payouts
  const isFirstPayouts = payoutCount < ANTI_FRAUD_CONFIG.holdThreshold;
  const holdRequired = isFirstPayouts;

  // Anti-fraud: limit amount for first payouts
  if (isFirstPayouts && requestedAmount > ANTI_FRAUD_CONFIG.firstPayoutsMaxAmount) {
    return {
      allowed: false,
      reason: `Les ${ANTI_FRAUD_CONFIG.holdThreshold} premiers retraits sont limités à ${formatXof(ANTI_FRAUD_CONFIG.firstPayoutsMaxAmount)} par opération pour des raisons de sécurité.`,
      remainingMonthlyLimit: config.monthlyLimit !== null
        ? config.monthlyLimit - currentMonthPayoutTotal
        : undefined,
      holdRequired: true,
      holdDurationHours: ANTI_FRAUD_CONFIG.holdDurationHours,
    };
  }

  const remainingMonthly = config.monthlyLimit !== null
    ? config.monthlyLimit - currentMonthPayoutTotal - requestedAmount
    : undefined;

  return {
    allowed: true,
    remainingMonthlyLimit: remainingMonthly,
    holdRequired,
    holdDurationHours: holdRequired ? ANTI_FRAUD_CONFIG.holdDurationHours : 0,
  };
}

/**
 * Get the hold release date for a payout.
 * Returns the date when the hold will be lifted.
 */
export function getHoldReleaseDate(payoutCreatedAt: Date, holdDurationHours: number): Date {
  const releaseDate = new Date(payoutCreatedAt);
  releaseDate.setHours(releaseDate.getHours() + holdDurationHours);
  return releaseDate;
}

/**
 * Check if a held payout is ready to be released.
 */
export function isHoldExpired(payoutCreatedAt: Date, holdDurationHours: number): boolean {
  const releaseDate = getHoldReleaseDate(payoutCreatedAt, holdDurationHours);
  return new Date() >= releaseDate;
}

/**
 * Get a summary of payout limits for a user based on their KYC level.
 */
export function getPayoutLimitSummary(kycLevel: number, currentMonthPayoutTotal: number = 0): {
  config: PayoutLimitConfig;
  remaining: number | null;
  used: number;
  percentage: number;
} {
  const config = getPayoutLimitConfig(kycLevel);

  if (config.monthlyLimit === null) {
    return {
      config,
      remaining: null,
      used: currentMonthPayoutTotal,
      percentage: 0,
    };
  }

  const remaining = Math.max(config.monthlyLimit - currentMonthPayoutTotal, 0);
  const percentage = Math.round((currentMonthPayoutTotal / config.monthlyLimit) * 100);

  return {
    config,
    remaining,
    used: currentMonthPayoutTotal,
    percentage,
  };
}

/**
 * Format amount in XOF with French locale.
 */
function formatXof(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
}
