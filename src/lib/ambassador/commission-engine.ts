// AfriBayit Ambassador — Commission Engine
// CDC §5.7.5 — Ambassador Commission System
//
// Tiers:
// - Bronze: 2% commission per filleul transaction
// - Silver: 3% + VIP event access + communication kit
// - Gold: 4% + fixed monthly remuneration 100-300€ + co-branding
//
// Features:
// - Commission calculation and tracking
// - Tier upgrade automation based on score/transactions/tenure
// - Monthly reporting for ambassadors
// - Commission payout scheduling

import { db } from '@/lib/db';

// ============ Types ============

/** Ambassador commission tiers per CDC §5.7.5 */
export interface CommissionTierConfig {
  tier: 'bronze' | 'silver' | 'gold';
  commissionRate: number;        // percentage
  monthlyRemuneration?: {       // Gold tier only
    min: number;                 // minimum EUR
    max: number;                 // maximum EUR
  };
  benefits: string[];
  upgradeRequirements: {
    minReferrals: number;
    minTransactions: number;
    minTenureMonths: number;
    minScore: number;
  };
  color: string;                 // CDC design color
}

/** Commission calculation result */
export interface CommissionCalculation {
  ambassadorId: string;
  tier: 'bronze' | 'silver' | 'gold';
  commissionRate: number;
  transactionAmount: number;
  commissionAmount: number;
  currency: string;
  filleulUserId: string;
  transactionId: string;
  breakdown: {
    label: string;
    rate: number;
    amount: number;
  }[];
}

/** Tier upgrade evaluation result */
export interface TierUpgradeEvaluation {
  currentTier: 'bronze' | 'silver' | 'gold';
  recommendedTier: 'bronze' | 'silver' | 'gold';
  canUpgrade: boolean;
  metrics: {
    totalReferrals: number;
    totalTransactions: number;
    tenureMonths: number;
    score: number;
  };
  missingRequirements: string[];
}

/** Monthly commission report */
export interface MonthlyCommissionReport {
  ambassadorId: string;
  ambassadorName: string;
  tier: 'bronze' | 'silver' | 'gold';
  period: {
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalTransactions: number;
    totalVolume: number;
    totalCommission: number;
    monthlyRemuneration: number;
    totalEarnings: number;
    currency: string;
  };
  transactions: {
    transactionId: string;
    filleulName: string;
    amount: number;
    commissionRate: number;
    commissionAmount: number;
    date: Date;
  }[];
}

/** Commission payout schedule entry */
export interface CommissionPayout {
  id: string;
  ambassadorId: string;
  amount: number;
  currency: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  scheduledDate: Date;
  processedDate: Date | null;
  method: string;
  reference: string | null;
}

// ============ CDC §5.7.5 — Tier Configuration ============

export const COMMISSION_TIERS: Record<'bronze' | 'silver' | 'gold', CommissionTierConfig> = {
  bronze: {
    tier: 'bronze',
    commissionRate: 0.02, // 2%
    benefits: [
      'Commission de 2% sur chaque transaction filleul',
      'Lien de parrainage personnalisé',
      'Tableau de bord ambassadeur',
      'Support par email',
    ],
    upgradeRequirements: {
      minReferrals: 0,
      minTransactions: 0,
      minTenureMonths: 0,
      minScore: 0,
    },
    color: '#CD7F32',
  },
  silver: {
    tier: 'silver',
    commissionRate: 0.03, // 3%
    benefits: [
      'Commission de 3% sur chaque transaction filleuls',
      'Accès VIP aux événements AfriBayit',
      'Kit de communication personnalisé',
      'Support prioritaire',
      'Badge Ambassadeur Argent',
    ],
    upgradeRequirements: {
      minReferrals: 5,
      minTransactions: 3,
      minTenureMonths: 3,
      minScore: 300,
    },
    color: '#C0C0C0',
  },
  gold: {
    tier: 'gold',
    commissionRate: 0.04, // 4%
    monthlyRemuneration: {
      min: 100, // EUR
      max: 300, // EUR
    },
    benefits: [
      'Commission de 4% sur chaque transaction filleul',
      'Rémunération mensuelle fixe (100-300 EUR)',
      'Co-branding AfriBayit',
      'Accès VIP aux événements + formations',
      'Mise en avant plateforme',
      'Badge Ambassadeur Or',
      'Rapports analytiques avancés',
    ],
    upgradeRequirements: {
      minReferrals: 20,
      minTransactions: 10,
      minTenureMonths: 6,
      minScore: 600,
    },
    color: '#D4AF37',
  },
};

// ============ Commission Calculation ============

/**
 * Calculate commission for a referral transaction.
 * This is the primary function used when a filleul makes a transaction.
 *
 * @param ambassadorId - The ambassador who referred the user
 * @param filleulUserId - The referred user who made the transaction
 * @param transactionId - The transaction ID
 * @param transactionAmount - The transaction amount in XOF
 * @param currency - The currency (default: XOF)
 */
export async function calculateCommission(
  ambassadorId: string,
  filleulUserId: string,
  transactionId: string,
  transactionAmount: number,
  currency: string = 'XOF'
): Promise<CommissionCalculation> {
  // Fetch ambassador to get current tier
  const ambassador = await db.ambassador.findUnique({
    where: { id: ambassadorId },
  });

  if (!ambassador) {
    throw new Error(`Ambassadeur ${ambassadorId} introuvable`);
  }

  const tier = ambassador.tier as 'bronze' | 'silver' | 'gold';
  const tierConfig = COMMISSION_TIERS[tier] || COMMISSION_TIERS.bronze;
  const commissionRate = tierConfig.commissionRate;
  const commissionAmount = Math.round(transactionAmount * commissionRate);

  const breakdown = [
    {
      label: `Commission ${tierConfig.tier} (${(commissionRate * 100).toFixed(0)}%)`,
      rate: commissionRate,
      amount: commissionAmount,
    },
  ];

  // Gold tier: add monthly remuneration info
  if (tier === 'gold' && tierConfig.monthlyRemuneration) {
    breakdown.push({
      label: `Rémunération mensuelle (${tierConfig.monthlyRemuneration.min}-${tierConfig.monthlyRemuneration.max} EUR/mois)`,
      rate: 0,
      amount: 0, // Tracked separately in monthly reports
    });
  }

  return {
    ambassadorId,
    tier,
    commissionRate,
    transactionAmount,
    commissionAmount,
    currency,
    filleulUserId,
    transactionId,
    breakdown,
  };
}

/**
 * Record a commission for an ambassador after a referral transaction.
 * Updates both the commission record and the ambassador's totals.
 */
export async function recordReferralCommission(
  ambassadorId: string,
  filleulUserId: string,
  transactionId: string,
  transactionAmount: number,
  currency: string = 'XOF'
): Promise<CommissionCalculation> {
  const calculation = await calculateCommission(
    ambassadorId,
    filleulUserId,
    transactionId,
    transactionAmount,
    currency
  );

  // Create commission record
  await db.ambassadorCommission.create({
    data: {
      ambassadorId,
      referredUserId: filleulUserId,
      transactionId,
      amount: calculation.commissionAmount,
      commissionRate: calculation.commissionRate,
      status: 'pending',
    },
  });

  // Update ambassador totals
  await db.ambassador.update({
    where: { id: ambassadorId },
    data: {
      totalEarnings: { increment: calculation.commissionAmount },
      totalReferrals: { increment: 1 },
    },
  });

  return calculation;
}

// ============ Tier Upgrade Automation ============

/**
 * Evaluate whether an ambassador qualifies for a tier upgrade.
 * Based on: score, total transactions, tenure, and referral count.
 */
export async function evaluateTierUpgrade(
  ambassadorId: string
): Promise<TierUpgradeEvaluation> {
  const ambassador = await db.ambassador.findUnique({
    where: { id: ambassadorId },
    include: {
      commissions: true,
      user: {
        select: {
          score: true,
          createdAt: true,
          name: true,
        },
      },
    },
  });

  if (!ambassador) {
    throw new Error(`Ambassadeur ${ambassadorId} introuvable`);
  }

  const currentTier = ambassador.tier as 'bronze' | 'silver' | 'gold';
  const totalReferrals = ambassador.totalReferrals;
  const totalTransactions = ambassador.commissions.length;

  // Calculate tenure in months
  const approvedAt = ambassador.approvedAt || ambassador.createdAt;
  const tenureMs = Date.now() - approvedAt.getTime();
  const tenureMonths = Math.floor(tenureMs / (30 * 24 * 60 * 60 * 1000));

  const score = ambassador.user?.score || 0;

  const metrics = {
    totalReferrals,
    totalTransactions,
    tenureMonths,
    score,
  };

  // Determine recommended tier
  const tierOrder: Array<'bronze' | 'silver' | 'gold'> = ['bronze', 'silver', 'gold'];
  const currentIndex = tierOrder.indexOf(currentTier);
  let recommendedTier: 'bronze' | 'silver' | 'gold' = currentTier;

  // Check from highest tier down
  for (let i = tierOrder.length - 1; i > currentIndex; i--) {
    const targetTier = tierOrder[i];
    const requirements = COMMISSION_TIERS[targetTier].upgradeRequirements;

    if (
      totalReferrals >= requirements.minReferrals &&
      totalTransactions >= requirements.minTransactions &&
      tenureMonths >= requirements.minTenureMonths &&
      score >= requirements.minScore
    ) {
      recommendedTier = targetTier;
      break;
    }
  }

  // Calculate missing requirements for next tier
  const missingRequirements: string[] = [];
  const nextTierIndex = currentIndex + 1;

  if (nextTierIndex < tierOrder.length) {
    const nextTier = tierOrder[nextTierIndex];
    const reqs = COMMISSION_TIERS[nextTier].upgradeRequirements;

    if (totalReferrals < reqs.minReferrals) {
      missingRequirements.push(
        `Parrainages: ${totalReferrals}/${reqs.minReferrals} requis (il manque ${reqs.minReferrals - totalReferrals})`
      );
    }
    if (totalTransactions < reqs.minTransactions) {
      missingRequirements.push(
        `Transactions: ${totalTransactions}/${reqs.minTransactions} requises (il manque ${reqs.minTransactions - totalTransactions})`
      );
    }
    if (tenureMonths < reqs.minTenureMonths) {
      missingRequirements.push(
        `Ancienneté: ${tenureMonths}/${reqs.minTenureMonths} mois requis (il manque ${reqs.minTenureMonths - tenureMonths} mois)`
      );
    }
    if (score < reqs.minScore) {
      missingRequirements.push(
        `Score: ${score}/${reqs.minScore} requis (il manque ${reqs.minScore - score} points)`
      );
    }
  }

  const canUpgrade = recommendedTier !== currentTier;

  return {
    currentTier,
    recommendedTier,
    canUpgrade,
    metrics,
    missingRequirements,
  };
}

/**
 * Automatically upgrade an ambassador's tier if they qualify.
 * Called periodically or after key events (new referral, transaction, etc.).
 */
export async function autoUpgradeAmbassadorTier(
  ambassadorId: string
): Promise<{ upgraded: boolean; fromTier: string; toTier: string }> {
  const evaluation = await evaluateTierUpgrade(ambassadorId);

  if (!evaluation.canUpgrade) {
    return {
      upgraded: false,
      fromTier: evaluation.currentTier,
      toTier: evaluation.currentTier,
    };
  }

  const newTier = evaluation.recommendedTier;
  const newRate = COMMISSION_TIERS[newTier].commissionRate;

  // Update ambassador tier and commission rate
  await db.ambassador.update({
    where: { id: ambassadorId },
    data: {
      tier: newTier,
      commissionRate: newRate,
    },
  });

  // Notify the ambassador about the upgrade
  const ambassador = await db.ambassador.findUnique({
    where: { id: ambassadorId },
    select: { userId: true },
  });

  if (ambassador) {
    await db.notification.create({
      data: {
        userId: ambassador.userId,
        type: 'promotion',
        category: 'profile',
        title: `Félicitations — Passage au palier ${COMMISSION_TIERS[newTier].tier}`,
        message: `Vous êtes maintenant Ambassadeur ${COMMISSION_TIERS[newTier].tier} ! Votre taux de commission passe à ${(newRate * 100).toFixed(0)}%. ${COMMISSION_TIERS[newTier].benefits.join(', ')}`,
        actionUrl: `/dashboard`,
        channels: JSON.stringify(['push', 'email', 'whatsapp']),
        metadata: JSON.stringify({
          previousTier: evaluation.currentTier,
          newTier,
          newCommissionRate: newRate,
          upgradedAt: new Date().toISOString(),
        }),
      },
    }).catch(() => {});
  }

  return {
    upgraded: true,
    fromTier: evaluation.currentTier,
    toTier: newTier,
  };
}

// ============ Monthly Reporting ============

/**
 * Generate a monthly commission report for an ambassador.
 */
export async function generateMonthlyReport(
  ambassadorId: string,
  month: number,
  year: number
): Promise<MonthlyCommissionReport> {
  const ambassador = await db.ambassador.findUnique({
    where: { id: ambassadorId },
    include: {
      commissions: {
        where: {
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      user: {
        select: { name: true, score: true },
      },
    },
  });

  if (!ambassador) {
    throw new Error(`Ambassadeur ${ambassadorId} introuvable`);
  }

  const tier = ambassador.tier as 'bronze' | 'silver' | 'gold';
  const tierConfig = COMMISSION_TIERS[tier];

  // Calculate monthly totals
  const totalTransactions = ambassador.commissions.length;
  const totalVolume = ambassador.commissions.reduce(
    (sum, c) => sum + Math.round(c.amount / c.commissionRate),
    0
  );
  const totalCommission = ambassador.commissions.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  // Gold tier monthly remuneration calculation
  let monthlyRemuneration = 0;
  if (tier === 'gold' && tierConfig.monthlyRemuneration) {
    // Scale remuneration based on performance (transactions * referrals factor)
    const performanceFactor = Math.min(
      totalTransactions / 10, // Normalize: 10 transactions = full base
      1.0
    );
    const { min, max } = tierConfig.monthlyRemuneration;
    monthlyRemuneration = Math.round(
      (min + (max - min) * performanceFactor) * 655.957 // EUR to XOF conversion rate
    );
  }

  const totalEarnings = totalCommission + monthlyRemuneration;

  // Build transaction details
  const transactions = ambassador.commissions.map((c) => ({
    transactionId: c.transactionId || c.id,
    filleulName: c.referredUserId, // Would join with User for name
    amount: Math.round(c.amount / c.commissionRate),
    commissionRate: c.commissionRate,
    commissionAmount: c.amount,
    date: c.createdAt,
  }));

  return {
    ambassadorId,
    ambassadorName: ambassador.user?.name || 'Ambassadeur',
    tier,
    period: {
      month,
      year,
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0),
    },
    summary: {
      totalTransactions,
      totalVolume,
      totalCommission,
      monthlyRemuneration,
      totalEarnings,
      currency: 'XOF',
    },
    transactions,
  };
}

// ============ Commission Payout Scheduling ============

/**
 * Schedule commission payouts for all ambassadors for a given period.
 * Called by a cron job at the beginning of each month.
 */
export async function scheduleCommissionPayouts(
  month: number,
  year: number
): Promise<CommissionPayout[]> {
  // Get all active ambassadors with pending commissions
  const ambassadors = await db.ambassador.findMany({
    where: {
      status: 'active',
      commissions: {
        some: {
          status: 'pending',
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      },
    },
    include: {
      commissions: {
        where: {
          status: 'pending',
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
          },
        },
      },
    },
  });

  const payouts: CommissionPayout[] = [];
  const payoutDate = new Date(year, month, 5); // 5th of the following month

  for (const ambassador of ambassadors) {
    const totalPending = ambassador.commissions.reduce((sum, c) => sum + c.amount, 0);

    if (totalPending <= 0) continue;

    // Add Gold tier monthly remuneration
    let remuneration = 0;
    const tier = ambassador.tier as 'bronze' | 'silver' | 'gold';
    if (tier === 'gold') {
      const tierConfig = COMMISSION_TIERS.gold;
      if (tierConfig.monthlyRemuneration) {
        const performanceFactor = Math.min(
          ambassador.commissions.length / 10,
          1.0
        );
        remuneration = Math.round(
          (tierConfig.monthlyRemuneration.min +
            (tierConfig.monthlyRemuneration.max - tierConfig.monthlyRemuneration.min) * performanceFactor
          ) * 655.957 // EUR to XOF
        );
      }
    }

    const totalPayout = totalPending + remuneration;

    const payout: CommissionPayout = {
      id: `PAY-${year}${month.toString().padStart(2, '0')}-${ambassador.id.substring(0, 8)}`,
      ambassadorId: ambassador.id,
      amount: totalPayout,
      currency: 'XOF',
      status: 'scheduled',
      scheduledDate: payoutDate,
      processedDate: null,
      method: 'mobile_money',
      reference: null,
    };

    payouts.push(payout);

    // Mark commissions as paid
    await db.ambassadorCommission.updateMany({
      where: {
        ambassadorId: ambassador.id,
        status: 'pending',
        createdAt: {
          gte: new Date(year, month - 1, 1),
          lt: new Date(year, month, 1),
        },
      },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    // Notify ambassador about upcoming payout
    await db.notification.create({
      data: {
        userId: ambassador.userId,
        type: 'system',
        category: 'transactions',
        title: 'Versement commission programmé',
        message: `Votre versement de ${new Intl.NumberFormat('fr-FR').format(totalPayout)} XOF est programmé pour le ${payoutDate.toLocaleDateString('fr-FR')}.${remuneration > 0 ? ` Inclut rémunération mensuelle: ${new Intl.NumberFormat('fr-FR').format(remuneration)} XOF.` : ''}`,
        actionUrl: `/wallet`,
        channels: JSON.stringify(['push', 'email']),
        metadata: JSON.stringify({
          payoutId: payout.id,
          amount: totalPayout,
          commissionAmount: totalPending,
          remunerationAmount: remuneration,
          scheduledDate: payoutDate.toISOString(),
          period: `${month}/${year}`,
        }),
      },
    }).catch(() => {});
  }

  return payouts;
}

/**
 * Process a scheduled commission payout.
 * Creates a wallet transaction for the ambassador.
 */
export async function processCommissionPayout(
  payout: CommissionPayout
): Promise<{ success: boolean; reference: string | null }> {
  try {
    const ambassador = await db.ambassador.findUnique({
      where: { id: payout.ambassadorId },
      select: { userId: true },
    });

    if (!ambassador) {
      return { success: false, reference: null };
    }

    // Create wallet transaction for payout
    const walletTxn = await db.walletTransaction.create({
      data: {
        userId: ambassador.userId,
        type: 'commission',
        amount: payout.amount,
        balanceAfter: 0, // Would need to calculate actual balance
        currency: payout.currency,
        status: 'completed',
        reference: payout.id,
        metadata: JSON.stringify({
          payoutId: payout.id,
          type: 'ambassador_commission_payout',
          period: payout.scheduledDate.toISOString(),
        }),
      },
    });

    // Update user wallet balance
    await db.user.update({
      where: { id: ambassador.userId },
      data: {
        walletBalance: { increment: payout.amount },
      },
    });

    return {
      success: true,
      reference: walletTxn.reference,
    };
  } catch {
    return { success: false, reference: null };
  }
}
