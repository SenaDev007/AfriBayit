// AfriBayit — Gamification & Reputation Engine
// CDC §5.7 — Système de gamification et réputation
//
// Point system:
// +50 per completed transaction
// +10 per review
// +25 per certificate earned
// +5 per community post
// +20 per property published
// +100 per referral signup
//
// Levels:
// Bronze (0+), Argent (200+), Or (500+), Platine (1500+), Diamant (5000+)
//
// Reputation tiers (0-100 scale):
// Newbie (0-24), Acteur (25-49), Expert (50-74), Ambassadeur (75-100)

/** Gamification action types */
export type GamificationAction =
  | 'transaction_completed'
  | 'review_posted'
  | 'certificate_earned'
  | 'community_post'
  | 'property_published'
  | 'referral_signup';

/** Level types */
export type UserLevel = 'bronze' | 'argent' | 'or' | 'platine' | 'diamant';

/** Reputation tier types */
export type ReputationTier = 'newbie' | 'acteur' | 'expert' | 'ambassadeur';

/** Points awarded per action — CDC §5.7 */
export const ACTION_POINTS: Record<GamificationAction, number> = {
  transaction_completed: 50,
  review_posted: 10,
  certificate_earned: 25,
  community_post: 5,
  property_published: 20,
  referral_signup: 100,
};

/** Level thresholds — CDC §5.7 */
export const LEVEL_THRESHOLDS: { minPoints: number; level: UserLevel; labelFr: string; color: string; icon: string }[] = [
  { minPoints: 0, level: 'bronze', labelFr: 'Bronze', color: '#CD7F32', icon: 'award-bronze' },
  { minPoints: 200, level: 'argent', labelFr: 'Argent', color: '#C0C0C0', icon: 'award-silver' },
  { minPoints: 500, level: 'or', labelFr: 'Or', color: '#D4AF37', icon: 'award-gold' },
  { minPoints: 1500, level: 'platine', labelFr: 'Platine', color: '#009CDE', icon: 'gem' },
  { minPoints: 5000, level: 'diamant', labelFr: 'Diamant', color: '#9333ea', icon: 'crown' },
];

/** Reputation tier thresholds — CDC §5.7 */
export const REPUTATION_THRESHOLDS: { min: number; max: number; tier: ReputationTier; labelFr: string; color: string }[] = [
  { min: 0, max: 24, tier: 'newbie', labelFr: 'Newbie', color: '#6b7280' },
  { min: 25, max: 49, tier: 'acteur', labelFr: 'Acteur', color: '#009CDE' },
  { min: 50, max: 74, tier: 'expert', labelFr: 'Expert', color: '#D4AF37' },
  { min: 75, max: 100, tier: 'ambassadeur', labelFr: 'Ambassadeur', color: '#00A651' },
];

/** User gamification state */
export interface UserGamificationState {
  userId: string;
  totalPoints: number;
  level: UserLevel;
  reputationScore: number;
  reputationTier: ReputationTier;
  actions: GamificationActionLog[];
}

/** Log entry for a gamification action */
export interface GamificationActionLog {
  action: GamificationAction;
  points: number;
  timestamp: Date;
  referenceId?: string; // e.g., transaction ID, review ID
}

/** Result of awarding points */
export interface AwardPointsResult {
  action: GamificationAction;
  pointsAwarded: number;
  newTotal: number;
  previousLevel: UserLevel;
  newLevel: UserLevel;
  levelUp: boolean;
  previousReputation: ReputationTier;
  newReputation: ReputationTier;
  reputationUp: boolean;
}

/**
 * Get the user's level based on total points.
 */
export function getLevel(totalPoints: number): UserLevel {
  let level: UserLevel = 'bronze';
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalPoints >= threshold.minPoints) {
      level = threshold.level;
    }
  }
  return level;
}

/**
 * Get level details (label, color, icon) for a given level.
 */
export function getLevelDetails(level: UserLevel) {
  return LEVEL_THRESHOLDS.find(t => t.level === level) || LEVEL_THRESHOLDS[0];
}

/**
 * Get the next level after the current one.
 */
export function getNextLevel(currentLevel: UserLevel): { level: UserLevel; minPoints: number; labelFr: string } | null {
  const currentIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === currentLevel);
  if (currentIndex < LEVEL_THRESHOLDS.length - 1) {
    const next = LEVEL_THRESHOLDS[currentIndex + 1];
    return { level: next.level, minPoints: next.minPoints, labelFr: next.labelFr };
  }
  return null; // Already at max level
}

/**
 * Calculate reputation score (0–100) based on user activities.
 * The reputation score is a normalized metric that considers:
 * - Transaction completion rate
 * - Review quality (average rating)
 * - Community engagement
 * - Verification status
 */
export function calculateReputationScore(params: {
  completedTransactions: number;
  totalTransactions: number;
  averageRating: number;
  reviewCount: number;
  communityPosts: number;
  certificatesCount: number;
  phoneVerified: boolean;
  emailVerified: boolean;
  kycLevel: number;
}): number {
  let score = 0;

  // Transaction completion rate (max 30 points)
  if (params.totalTransactions > 0) {
    const completionRate = params.completedTransactions / params.totalTransactions;
    score += Math.round(completionRate * 30);
  }

  // Average rating (max 25 points)
  // 5 stars = 25, 4 stars = 20, 3 stars = 15, etc.
  if (params.reviewCount > 0) {
    score += Math.round((params.averageRating / 5) * 25);
  }

  // Community engagement (max 15 points)
  // 1 post = 3pts, capped at 15
  score += Math.min(params.communityPosts * 3, 15);

  // Certifications (max 10 points)
  score += Math.min(params.certificatesCount * 3, 10);

  // Verification (max 20 points)
  if (params.phoneVerified) score += 5;
  if (params.emailVerified) score += 5;
  if (params.kycLevel >= 1) score += 5;
  if (params.kycLevel >= 2) score += 5;

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Get reputation tier based on reputation score.
 */
export function getReputationTier(score: number): ReputationTier {
  for (const threshold of REPUTATION_THRESHOLDS) {
    if (score >= threshold.min && score <= threshold.max) {
      return threshold.tier;
    }
  }
  return 'newbie';
}

/**
 * Get reputation tier details.
 */
export function getReputationTierDetails(tier: ReputationTier) {
  return REPUTATION_THRESHOLDS.find(t => t.tier === tier) || REPUTATION_THRESHOLDS[0];
}

/**
 * Award points for an action and return the result with level/tier changes.
 * This is a pure calculation function — the actual DB update should be done separately.
 */
export function awardPoints(
  action: GamificationAction,
  currentTotalPoints: number,
  currentReputationScore: number,
  referenceId?: string
): AwardPointsResult {
  const pointsAwarded = ACTION_POINTS[action];
  const newTotal = currentTotalPoints + pointsAwarded;

  const previousLevel = getLevel(currentTotalPoints);
  const newLevel = getLevel(newTotal);
  const previousReputation = getReputationTier(currentReputationScore);
  const newReputation = getReputationTier(currentReputationScore); // Reputation changes separately

  return {
    action,
    pointsAwarded,
    newTotal,
    previousLevel,
    newLevel,
    levelUp: newLevel !== previousLevel,
    previousReputation,
    newReputation,
    reputationUp: newReputation !== previousReputation,
  };
}

/**
 * Get a full gamification state snapshot for a user.
 */
export function getGamificationState(
  totalPoints: number,
  reputationScore: number
): Omit<UserGamificationState, 'userId' | 'actions'> {
  return {
    totalPoints,
    level: getLevel(totalPoints),
    reputationScore,
    reputationTier: getReputationTier(reputationScore),
  };
}

/**
 * Get the progress percentage toward the next level.
 */
export function getLevelProgress(totalPoints: number): number {
  const currentLevel = getLevel(totalPoints);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)!;
  const nextLevel = getNextLevel(currentLevel);

  if (!nextLevel) return 100; // Already max level

  const rangeStart = currentThreshold.minPoints;
  const rangeEnd = nextLevel.minPoints;
  const progress = (totalPoints - rangeStart) / (rangeEnd - rangeStart);
  return Math.min(Math.round(progress * 100), 100);
}

/**
 * Get French label for a gamification action.
 */
export function getActionLabelFr(action: GamificationAction): string {
  const labels: Record<GamificationAction, string> = {
    transaction_completed: 'Transaction complétée',
    review_posted: 'Avis publié',
    certificate_earned: 'Certificat obtenu',
    community_post: 'Publication communautaire',
    property_published: 'Bien publié',
    referral_signup: 'Parrainage inscrit',
  };
  return labels[action] || action;
}
