// AfriBayit Credibility Score Calculator

import { db } from '@/lib/db';
import {
  CREDIBILITY_FACTORS,
  calculateProfileCompleteness,
  calculateVerificationScore,
  calculateActivityScore,
  calculateEndorsementScore,
  calculateTransactionScore,
} from './factors';

export interface CredibilityBreakdown {
  total: number;
  factors: Array<{
    key: string;
    name: string;
    weight: number;
    score: number;
    weightedScore: number;
  }>;
}

/**
 * Calcule le score de crédibilité complet d'un utilisateur (0-100)
 */
export async function calculateCredibilityScore(userId: string): Promise<CredibilityBreakdown> {
  // Récupérer toutes les données nécessaires
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      professionalProfile: { include: { endorsements: true } },
      posts: { select: { id: true } },
      reviews: { select: { id: true } },
      transactions: {
        where: { status: 'RELEASED' },
        select: { amount: true },
      },
    },
  });

  if (!user) {
    return { total: 0, factors: [] };
  }

  // 1. Complétude du profil (20%)
  const profileScore = calculateProfileCompleteness({
    hasAvatar: !!user.avatar,
    hasBio: !!user.bio,
    hasHeadline: !!user.professionalProfile?.headline,
    hasExperience: !!user.professionalProfile?.experience,
    hasEducation: !!user.professionalProfile?.education,
    hasSpecialties: !!user.specialties,
    hasPhone: !!user.phone,
    hasCity: !!user.city,
  });

  // 2. Vérification (25%)
  const verificationScore = calculateVerificationScore({
    emailVerified: user.verified,
    phoneVerified: !!user.phone && user.kycLevel >= 1,
    kycLevel: user.kycLevel,
  });

  // 3. Activité (20%)
  const activityScore = calculateActivityScore({
    postsCount: user.posts.length,
    reviewsCount: user.reviews.length,
    responseRate: 80, // Valeur par défaut, à calculer dynamiquement
    avgResponseTimeHours: 6, // Valeur par défaut
  });

  // 4. Recommandations (15%)
  const endorsementCount = user.professionalProfile?.endorsements.length || 0;
  const endorsementScore = calculateEndorsementScore(endorsementCount);

  // 5. Historique des transactions (20%)
  const completedTransactions = user.transactions.length;
  const escrowVolume = user.transactions.reduce((sum, t) => sum + t.amount, 0);
  const disputeRate = 0; // Simplifié pour le moment

  const transactionScore = calculateTransactionScore({
    completedTransactions,
    escrowVolume,
    disputeRate,
  });

  // Calculer les scores pondérés
  const scores = [
    { key: 'profile_completeness', score: profileScore },
    { key: 'verification_status', score: verificationScore },
    { key: 'activity_score', score: activityScore },
    { key: 'endorsements', score: endorsementScore },
    { key: 'transaction_history', score: transactionScore },
  ];

  const factors = CREDIBILITY_FACTORS.map((factor) => {
    const scoreData = scores.find((s) => s.key === factor.key);
    const score = scoreData?.score || 0;
    const weightedScore = (score * factor.weight) / 100;

    return {
      key: factor.key,
      name: factor.name,
      weight: factor.weight,
      score,
      weightedScore: Math.round(weightedScore * 100) / 100,
    };
  });

  const total = Math.round(
    factors.reduce((sum, f) => sum + f.weightedScore, 0)
  );

  return { total: Math.min(total, 100), factors };
}

/**
 * Met à jour le score de crédibilité d'un utilisateur en base
 */
export async function updateCredibilityScore(userId: string): Promise<number> {
  const { total } = await calculateCredibilityScore(userId);

  await db.user.update({
    where: { id: userId },
    data: { credibilityScore: total },
  });

  if (total > 0) {
    await db.professionalProfile.upsert({
      where: { userId },
      update: { credibilityScore: total },
      create: { userId, credibilityScore: total },
    });
  }

  return total;
}
