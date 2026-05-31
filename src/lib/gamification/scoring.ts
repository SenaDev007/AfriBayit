// AfriBayit — Gamification Scoring System
// CDC §5.7 — Système de points, niveaux et réputation
//
// Points attribués par action :
//   TRANSACTION_COMPLETED : +50
//   REVIEW_WRITTEN        : +10
//   CERTIFICATE_EARNED    : +25
//   COMMUNITY_POST        : +5
//   PROPERTY_PUBLISHED    : +20
//   REFERRAL_SIGNUP       : +100
//   QUIZ_PASSED           : +10
//   COURSE_COMPLETED      : +25
//
// Niveaux :
//   Bronze   (0+)
//   Argent   (200+)
//   Or       (500+)
//   Platine  (1500+)
//   Diamant  (5000+)
//
// Réputation (échelle 0-100) :
//   Newbie       (0-24)
//   Acteur       (25-49)
//   Expert       (50-74)
//   Ambassadeur  (75-100)

// ============ TYPES ============

/** Types d'actions de gamification */
export type GamificationAction =
  | 'TRANSACTION_COMPLETED'
  | 'REVIEW_WRITTEN'
  | 'CERTIFICATE_EARNED'
  | 'COMMUNITY_POST'
  | 'PROPERTY_PUBLISHED'
  | 'REFERRAL_SIGNUP'
  | 'QUIZ_PASSED'
  | 'COURSE_COMPLETED';

/** Niveaux de l'utilisateur */
export type UserLevel = 'bronze' | 'argent' | 'or' | 'platine' | 'diamant';

/** Paliers de réputation */
export type ReputationTier = 'newbie' | 'acteur' | 'expert' | 'ambassadeur';

// ============ CONSTANTES DE POINTS ============

/** Points attribués par action — CDC §5.7 */
export const ACTION_POINTS: Record<GamificationAction, number> = {
  TRANSACTION_COMPLETED: 50,
  REVIEW_WRITTEN: 10,
  CERTIFICATE_EARNED: 25,
  COMMUNITY_POST: 5,
  PROPERTY_PUBLISHED: 20,
  REFERRAL_SIGNUP: 100,
  QUIZ_PASSED: 10,
  COURSE_COMPLETED: 25,
};

// ============ SEUILS DE NIVEAU ============

/** Définition des seuils de niveau */
export interface LevelDefinition {
  minPoints: number;
  level: UserLevel;
  labelFr: string;
  color: string;
  icon: string;
}

/** Seuils de niveau — CDC §5.7 */
export const LEVEL_THRESHOLDS: LevelDefinition[] = [
  { minPoints: 0,    level: 'bronze',   labelFr: 'Bronze',   color: '#CD7F32', icon: 'award-bronze' },
  { minPoints: 200,  level: 'argent',   labelFr: 'Argent',   color: '#C0C0C0', icon: 'award-silver' },
  { minPoints: 500,  level: 'or',       labelFr: 'Or',       color: '#D4AF37', icon: 'award-gold' },
  { minPoints: 1500, level: 'platine',  labelFr: 'Platine',  color: '#009CDE', icon: 'gem' },
  { minPoints: 5000, level: 'diamant',  labelFr: 'Diamant',  color: '#9333ea', icon: 'crown' },
];

// ============ SEUILS DE RÉPUTATION ============

/** Définition d'un palier de réputation */
export interface ReputationDefinition {
  min: number;
  max: number;
  tier: ReputationTier;
  labelFr: string;
  color: string;
}

/** Paliers de réputation — CDC §5.7 */
export const REPUTATION_THRESHOLDS: ReputationDefinition[] = [
  { min: 0,  max: 24,  tier: 'newbie',      labelFr: 'Newbie',      color: '#6b7280' },
  { min: 25, max: 49,  tier: 'acteur',      labelFr: 'Acteur',      color: '#009CDE' },
  { min: 50, max: 74,  tier: 'expert',      labelFr: 'Expert',      color: '#D4AF37' },
  { min: 75, max: 100, tier: 'ambassadeur', labelFr: 'Ambassadeur', color: '#00A651' },
];

// ============ FONCTIONS DE CALCUL ============

/**
 * Calcule le niveau d'un utilisateur basé sur ses points totaux.
 *
 * @param totalPoints - Nombre total de points
 * @returns Le niveau correspondant
 *
 * @example
 * getLevel(0)    // 'bronze'
 * getLevel(199)  // 'bronze'
 * getLevel(200)  // 'argent'
 * getLevel(500)  // 'or'
 * getLevel(1500) // 'platine'
 * getLevel(5000) // 'diamant'
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
 * Récupère les détails d'un niveau.
 *
 * @param level - Le niveau à détailler
 * @returns Définition complète du niveau
 */
export function getLevelDetails(level: UserLevel): LevelDefinition {
  return LEVEL_THRESHOLDS.find(t => t.level === level) ?? LEVEL_THRESHOLDS[0];
}

/**
 * Récupère le niveau suivant après le niveau actuel.
 *
 * @param currentLevel - Niveau actuel
 * @returns Le niveau suivant ou null si déjà au maximum
 */
export function getNextLevel(
  currentLevel: UserLevel
): { level: UserLevel; minPoints: number; labelFr: string } | null {
  const currentIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === currentLevel);
  if (currentIndex < LEVEL_THRESHOLDS.length - 1) {
    const next = LEVEL_THRESHOLDS[currentIndex + 1];
    return { level: next.level, minPoints: next.minPoints, labelFr: next.labelFr };
  }
  return null;
}

/**
 * Calcule le pourcentage de progression vers le niveau suivant.
 *
 * @param totalPoints - Points totaux actuels
 * @returns Pourcentage de progression (0-100)
 */
export function getLevelProgress(totalPoints: number): number {
  const currentLevel = getLevel(totalPoints);
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel)!;
  const nextLevel = getNextLevel(currentLevel);

  if (!nextLevel) return 100; // Déjà au niveau maximum

  const rangeStart = currentThreshold.minPoints;
  const rangeEnd = nextLevel.minPoints;
  const progress = (totalPoints - rangeStart) / (rangeEnd - rangeStart);
  return Math.min(Math.round(progress * 100), 100);
}

/**
 * Détermine le palier de réputation basé sur le score de réputation (0-100).
 *
 * @param score - Score de réputation (0-100)
 * @returns Le palier de réputation correspondant
 *
 * @example
 * getReputationTier(0)   // 'newbie'
 * getReputationTier(24)  // 'newbie'
 * getReputationTier(25)  // 'acteur'
 * getReputationTier(50)  // 'expert'
 * getReputationTier(75)  // 'ambassadeur'
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
 * Récupère les détails d'un palier de réputation.
 *
 * @param tier - Le palier à détailler
 * @returns Définition complète du palier
 */
export function getReputationTierDetails(tier: ReputationTier): ReputationDefinition {
  return REPUTATION_THRESHOLDS.find(t => t.tier === tier) ?? REPUTATION_THRESHOLDS[0];
}

// ============ FONCTIONS D'ATTRIBUTION DE POINTS ============

/** Résultat de l'attribution de points */
export interface AwardPointsResult {
  /** Action effectuée */
  action: GamificationAction;
  /** Points attribués */
  pointsAwarded: number;
  /** Nouveau total de points */
  newTotal: number;
  /** Niveau précédent */
  previousLevel: UserLevel;
  /** Nouveau niveau */
  newLevel: UserLevel;
  /** Indique si l'utilisateur a monté de niveau */
  levelUp: boolean;
  /** Palier de réputation précédent */
  previousReputation: ReputationTier;
  /** Nouveau palier de réputation */
  newReputation: ReputationTier;
  /** Indique si la réputation a augmenté */
  reputationUp: boolean;
}

/**
 * Attribue des points pour une action et retourne le résultat
 * avec les changements de niveau et de réputation.
 * Fonction pure — la mise à jour en base de données doit être faite séparément.
 *
 * @param action - L'action de gamification
 * @param currentTotalPoints - Points totaux actuels
 * @param currentReputationScore - Score de réputation actuel (0-100)
 * @param referenceId - Identifiant de référence optionnel (ex: transaction ID)
 * @returns Résultat de l'attribution de points
 *
 * @example
 * const result = awardPoints('TRANSACTION_COMPLETED', 150, 30);
 * // → { pointsAwarded: 50, newTotal: 200, previousLevel: 'bronze', newLevel: 'argent', levelUp: true, ... }
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
  const newReputation = getReputationTier(currentReputationScore); // La réputation change séparément

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
 * Récupère le libellé français d'une action de gamification.
 */
export function getActionLabelFr(action: GamificationAction): string {
  const labels: Record<GamificationAction, string> = {
    TRANSACTION_COMPLETED: 'Transaction complétée',
    REVIEW_WRITTEN: 'Avis rédigé',
    CERTIFICATE_EARNED: 'Certificat obtenu',
    COMMUNITY_POST: 'Publication communautaire',
    PROPERTY_PUBLISHED: 'Bien immobilier publié',
    REFERRAL_SIGNUP: 'Parrainage inscrit',
    QUIZ_PASSED: 'Quiz réussi',
    COURSE_COMPLETED: 'Formation complétée',
  };
  return labels[action] || action;
}

/**
 * Récupère la description complète de l'état de gamification d'un utilisateur.
 */
export interface GamificationState {
  totalPoints: number;
  level: UserLevel;
  levelDetails: LevelDefinition;
  nextLevel: { level: UserLevel; minPoints: number; labelFr: string } | null;
  levelProgress: number;
  reputationScore: number;
  reputationTier: ReputationTier;
  reputationDetails: ReputationDefinition;
}

/**
 * Calcule l'état complet de gamification pour un utilisateur.
 *
 * @param totalPoints - Points totaux
 * @param reputationScore - Score de réputation (0-100)
 * @returns État complet de gamification
 */
export function getGamificationState(
  totalPoints: number,
  reputationScore: number
): GamificationState {
  const level = getLevel(totalPoints);
  const levelDetails = getLevelDetails(level);
  const nextLevel = getNextLevel(level);
  const levelProgress = getLevelProgress(totalPoints);
  const reputationTier = getReputationTier(reputationScore);
  const reputationDetails = getReputationTierDetails(reputationTier);

  return {
    totalPoints,
    level,
    levelDetails,
    nextLevel,
    levelProgress,
    reputationScore,
    reputationTier,
    reputationDetails,
  };
}

/**
 * Calcule le score de réputation (0-100) basé sur les activités de l'utilisateur.
 * Le score de réputation est une métrique normalisée qui prend en compte :
 * - Taux de complétion des transactions (max 30 pts)
 * - Qualité des avis — note moyenne (max 25 pts)
 * - Engagement communautaire (max 15 pts)
 * - Certifications obtenues (max 10 pts)
 * - Vérification d'identité (max 20 pts)
 *
 * @param params - Paramètres de calcul
 * @returns Score de réputation entre 0 et 100
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

  // Taux de complétion des transactions (max 30 points)
  if (params.totalTransactions > 0) {
    const completionRate = params.completedTransactions / params.totalTransactions;
    score += Math.round(completionRate * 30);
  }

  // Note moyenne des avis (max 25 points)
  // 5 étoiles = 25, 4 étoiles = 20, 3 étoiles = 15, etc.
  if (params.reviewCount > 0) {
    score += Math.round((params.averageRating / 5) * 25);
  }

  // Engagement communautaire (max 15 points)
  // 1 publication = 3 pts, plafonné à 15
  score += Math.min(params.communityPosts * 3, 15);

  // Certifications (max 10 points)
  score += Math.min(params.certificatesCount * 3, 10);

  // Vérification d'identité (max 20 points)
  if (params.phoneVerified) score += 5;
  if (params.emailVerified) score += 5;
  if (params.kycLevel >= 1) score += 5;
  if (params.kycLevel >= 2) score += 5;

  // Plafond à 100
  return Math.min(score, 100);
}

/**
 * Calcule les points totaux à partir d'un historique d'actions.
 *
 * @param actions - Liste des actions effectuées
 * @returns Nombre total de points
 */
export function calculateTotalPoints(actions: GamificationAction[]): number {
  return actions.reduce((total, action) => total + (ACTION_POINTS[action] || 0), 0);
}

/**
 * Récupère toutes les actions possibles avec leurs points.
 */
export function getAllActionPoints(): { action: GamificationAction; points: number; labelFr: string }[] {
  return (Object.entries(ACTION_POINTS) as [GamificationAction, number][]).map(
    ([action, points]) => ({
      action,
      points,
      labelFr: getActionLabelFr(action),
    })
  );
}
