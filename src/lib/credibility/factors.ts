// AfriBayit Credibility Score — Facteurs de scoring

export interface CredibilityFactor {
  key: string;
  name: string;
  weight: number; // Pourcentage du score total (somme = 100)
  maxScore: number; // Score max pour ce facteur
  description: string;
}

/**
 * Facteurs de crédibilité pondérés (total = 100%)
 */
export const CREDIBILITY_FACTORS: CredibilityFactor[] = [
  {
    key: 'profile_completeness',
    name: 'Complétude du profil',
    weight: 20,
    maxScore: 100,
    description: 'Photo, bio, titre, expérience, formation',
  },
  {
    key: 'verification_status',
    name: 'Statut de vérification',
    weight: 25,
    maxScore: 100,
    description: 'Email vérifié, téléphone vérifié, niveau KYC',
  },
  {
    key: 'activity_score',
    name: 'Score d\'activité',
    weight: 20,
    maxScore: 100,
    description: 'Publications, avis, taux de réponse, temps de réponse moyen',
  },
  {
    key: 'endorsements',
    name: 'Recommandations',
    weight: 15,
    maxScore: 100,
    description: 'Compétences approuvées par des pairs',
  },
  {
    key: 'transaction_history',
    name: 'Historique des transactions',
    weight: 20,
    maxScore: 100,
    description: 'Transactions complétées, volume escrow, taux de litige',
  },
];

/**
 * Calcule le score de complétude du profil (0-100)
 */
export function calculateProfileCompleteness(data: {
  hasAvatar: boolean;
  hasBio: boolean;
  hasHeadline: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasSpecialties: boolean;
  hasPhone: boolean;
  hasCity: boolean;
}): number {
  const fields = [
    data.hasAvatar,
    data.hasBio,
    data.hasHeadline,
    data.hasExperience,
    data.hasEducation,
    data.hasSpecialties,
    data.hasPhone,
    data.hasCity,
  ];

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Calcule le score de vérification (0-100)
 */
export function calculateVerificationScore(data: {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycLevel: number;
}): number {
  let score = 0;

  if (data.emailVerified) score += 25;
  if (data.phoneVerified) score += 25;

  // KYC levels: 0=0pts, 1=15pts, 2=25pts, 3=50pts
  const kycScores = [0, 15, 25, 50];
  score += kycScores[Math.min(data.kycLevel, 3)];

  return Math.min(score, 100);
}

/**
 * Calcule le score d'activité (0-100)
 */
export function calculateActivityScore(data: {
  postsCount: number;
  reviewsCount: number;
  responseRate: number; // 0-100
  avgResponseTimeHours: number | null;
}): number {
  let score = 0;

  // Publications (max 25 points)
  score += Math.min(data.postsCount * 2, 25);

  // Avis (max 25 points)
  score += Math.min(data.reviewsCount * 5, 25);

  // Taux de réponse (max 30 points)
  score += (data.responseRate / 100) * 30;

  // Temps de réponse (max 20 points)
  if (data.avgResponseTimeHours !== null) {
    if (data.avgResponseTimeHours <= 1) score += 20;
    else if (data.avgResponseTimeHours <= 6) score += 15;
    else if (data.avgResponseTimeHours <= 24) score += 10;
    else if (data.avgResponseTimeHours <= 72) score += 5;
  }

  return Math.min(Math.round(score), 100);
}

/**
 * Calcule le score de recommandations (0-100)
 */
export function calculateEndorsementScore(endorsementCount: number): number {
  // Chaque endorsement vaut 5 points, max 100
  return Math.min(endorsementCount * 5, 100);
}

/**
 * Calcule le score d'historique des transactions (0-100)
 */
export function calculateTransactionScore(data: {
  completedTransactions: number;
  escrowVolume: number;
  disputeRate: number; // 0-1
}): number {
  let score = 0;

  // Transactions complétées (max 40 points)
  score += Math.min(data.completedTransactions * 4, 40);

  // Volume escrow (max 30 points)
  if (data.escrowVolume > 10000000) score += 30;
  else if (data.escrowVolume > 5000000) score += 25;
  else if (data.escrowVolume > 1000000) score += 20;
  else if (data.escrowVolume > 500000) score += 15;
  else if (data.escrowVolume > 0) score += 10;

  // Taux de litige (max 30 points, pénalisé si élevé)
  if (data.disputeRate <= 0.02) score += 30;
  else if (data.disputeRate <= 0.05) score += 20;
  else if (data.disputeRate <= 0.1) score += 10;
  else score += 0;

  return Math.min(Math.round(score), 100);
}
