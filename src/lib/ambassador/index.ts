// AfriBayit Ambassador Orchestrator — Orchestrateur du programme ambassadeur

import { db } from '@/lib/db';
import { AMBASSADOR_TIERS, generateReferralCode } from './tiers';

// Re-export commission engine (CDC §5.7.5)
export {
  calculateCommission,
  recordReferralCommission,
  evaluateTierUpgrade,
  autoUpgradeAmbassadorTier,
  generateMonthlyReport,
  scheduleCommissionPayouts,
  processCommissionPayout,
  COMMISSION_TIERS,
} from './commission-engine';
export type {
  CommissionTierConfig,
  CommissionCalculation,
  TierUpgradeEvaluation,
  MonthlyCommissionReport,
  CommissionPayout,
} from './commission-engine';

export interface AmbassadorStatus {
  isAmbassador: boolean;
  tier: string;
  tierInfo: (typeof AMBASSADOR_TIERS)[string];
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  totalEarnings: number;
  commissions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}

/**
 * Récupère le statut ambassadeur d'un utilisateur
 */
export async function getAmbassadorStatus(userId: string): Promise<AmbassadorStatus | null> {
  const ambassador = await db.ambassador.findUnique({
    where: { userId },
    include: {
      commissions: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });

  if (!ambassador) {
    return null;
  }

  const tierInfo = AMBASSADOR_TIERS[ambassador.tier] || AMBASSADOR_TIERS.bronze;

  return {
    isAmbassador: ambassador.status === 'active',
    tier: ambassador.tier,
    tierInfo,
    referralCode: ambassador.referralCode,
    referralLink: ambassador.referralLink || `https://afribayit.com/ref/${ambassador.referralCode}`,
    totalReferrals: ambassador.totalReferrals,
    totalEarnings: ambassador.totalEarnings,
    commissions: ambassador.commissions.map((c) => ({
      id: c.id,
      amount: c.amount,
      status: c.status,
      createdAt: c.createdAt,
    })),
  };
}

/**
 * Inscrit un utilisateur au programme ambassadeur
 */
export async function applyAsAmbassador(userId: string): Promise<AmbassadorStatus> {
  // Vérifier si déjà ambassadeur
  const existing = await db.ambassador.findUnique({ where: { userId } });
  if (existing) {
    throw new Error('Vous êtes déjà inscrit au programme ambassadeur.');
  }

  // Récupérer le nom de l'utilisateur pour le code
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Utilisateur introuvable.');
  }

  const referralCode = generateReferralCode(user.name);
  const referralLink = `https://afribayit.com/ref/${referralCode}`;

  // Créer le profil ambassadeur
  const ambassador = await db.ambassador.create({
    data: {
      userId,
      tier: 'bronze',
      referralCode,
      referralLink,
      commissionRate: 0.05,
      status: 'active',
      approvedAt: new Date(),
    },
  });

  const tierInfo = AMBASSADOR_TIERS.bronze;

  return {
    isAmbassador: true,
    tier: 'bronze',
    tierInfo,
    referralCode: ambassador.referralCode,
    referralLink: ambassador.referralLink || referralLink,
    totalReferrals: 0,
    totalEarnings: 0,
    commissions: [],
  };
}

/**
 * Enregistre une commission pour un ambassadeur
 */
export async function recordCommission(
  ambassadorId: string,
  referredUserId: string,
  amount: number,
  transactionId?: string
): Promise<void> {
  const ambassador = await db.ambassador.findUnique({
    where: { id: ambassadorId },
  });

  if (!ambassador) return;

  const commissionAmount = amount * ambassador.commissionRate;

  await db.ambassadorCommission.create({
    data: {
      ambassadorId,
      referredUserId,
      transactionId,
      amount: commissionAmount,
      commissionRate: ambassador.commissionRate,
    },
  });

  // Mettre à jour les totaux de l'ambassadeur
  await db.ambassador.update({
    where: { id: ambassadorId },
    data: {
      totalEarnings: { increment: commissionAmount },
      totalReferrals: { increment: 1 },
    },
  });
}

/**
 * Récupère l'historique des commissions d'un ambassadeur
 */
export async function getCommissionHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  const { limit = 50, offset = 0 } = options || {};

  const ambassador = await db.ambassador.findUnique({ where: { userId } });
  if (!ambassador) {
    return [];
  }

  const commissions = await db.ambassadorCommission.findMany({
    where: { ambassadorId: ambassador.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return commissions;
}
