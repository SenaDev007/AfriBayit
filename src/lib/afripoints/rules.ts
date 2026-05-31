// AfriBayit Points — Règles de gain et de dépense

export const EARNING_RULES: Record<string, number> = {
  // Actions communautaires
  post_created: 5,
  post_reply: 2,
  review_written: 10,
  helpful_review: 3,
  event_attended: 15,

  // Engagement plateforme
  profile_completed: 50,
  property_published: 20,
  booking_completed: 30,
  referral_signup: 100,

  // Apprentissage
  course_completed: 25,
  quiz_passed: 10,
  certificate_earned: 15,

  // Bonus premium (multiplicateur 2x)
  premium_multiplier: 2,
};

export const SPENDING_RULES: Record<string, number> = {
  boost_listing_7d: 200,   // 200 points = boost 7 jours
  boost_listing_30d: 500,  // 500 points = boost 30 jours
  premium_feature: 100,
  course_discount_10: 150,  // 10% réduction cours
  course_discount_25: 300,  // 25% réduction cours
};

export type EarningAction = keyof typeof EARNING_RULES;
export type SpendingItem = keyof typeof SPENDING_RULES;

/**
 * Retourne le nombre de points pour une action donnée
 */
export function getPointsForAction(action: EarningAction, isPremium = false): number {
  const basePoints = EARNING_RULES[action] || 0;
  if (isPremium && action !== 'premium_multiplier') {
    return basePoints * EARNING_RULES.premium_multiplier;
  }
  return basePoints;
}

/**
 * Retourne le coût en points pour un article
 */
export function getCostForItem(item: SpendingItem): number {
  return SPENDING_RULES[item] || 0;
}

/**
 * Niveaux de gamification basés sur les AfriPoints
 */
export const LEVELS = [
  { name: 'Bronze', minPoints: 0, icon: 'award-bronze', color: '#CD7F32' },
  { name: 'Argent', minPoints: 200, icon: 'award-silver', color: '#C0C0C0' },
  { name: 'Or', minPoints: 500, icon: 'award-gold', color: '#FFD700' },
  { name: 'Platine', minPoints: 1500, icon: 'gem', color: '#E5E4E2' },
  { name: 'Diamant', minPoints: 5000, icon: 'diamond', color: '#B9F2FF' },
] as const;

export type LevelName = (typeof LEVELS)[number]['name'];

/**
 * Retourne le niveau correspondant à un solde de points
 */
export function getLevelForPoints(points: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) {
      level = l;
    }
  }
  return level;
}

/**
 * Retourne le prochain niveau et les points restants
 */
export function getNextLevel(points: number) {
  for (const level of LEVELS) {
    if (points < level.minPoints) {
      return {
        level,
        pointsNeeded: level.minPoints - points,
      };
    }
  }
  return null; // Déjà au niveau maximum
}
