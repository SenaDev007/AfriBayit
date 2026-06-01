// AfriBayit Points Orchestrator — Orchestrateur de points AfriPoints

import { db } from '@/lib/db';
import { getPointsForAction, getCostForItem, type EarningAction, type SpendingItem } from './rules';
import { getPointsBalance, getPointsHistory, getPointsLeaderboard } from './ledger';
import { getLevelForPoints, getNextLevel } from './rules';

export { getPointsBalance, getPointsHistory, getPointsLeaderboard };
export { getLevelForPoints, getNextLevel };

/**
 * Attribue des points à un utilisateur pour une action donnée
 */
export async function earnPoints(
  userId: string,
  action: EarningAction | string,
  metadata?: Record<string, unknown>
): Promise<{ points: number; newBalance: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { afriPoints: true, premiumTier: true },
  });

  if (!user) {
    throw new Error('Utilisateur introuvable.');
  }

  const isPremium = !!user.premiumTier;
  const points = getPointsForAction(action as EarningAction, isPremium);
  const newBalance = user.afriPoints + points;

  // Créer la transaction
  await db.afriPointTransaction.create({
    data: {
      userId,
      type: 'earn',
      action,
      points,
      balanceAfter: newBalance,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  // Mettre à jour le solde de l'utilisateur
  await db.user.update({
    where: { id: userId },
    data: { afriPoints: newBalance },
  });

  return { points, newBalance };
}

/**
 * Dépense des points pour un article
 */
export async function spendPoints(
  userId: string,
  item: SpendingItem | string,
  quantity: number = 1
): Promise<{ points: number; newBalance: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { afriPoints: true },
  });

  if (!user) {
    throw new Error('Utilisateur introuvable.');
  }

  const cost = getCostForItem(item as SpendingItem) * quantity;

  if (user.afriPoints < cost) {
    throw new Error(`Solde insuffisant. Vous avez ${user.afriPoints} points, mais ${cost} sont nécessaires.`);
  }

  const newBalance = user.afriPoints - cost;

  // Créer la transaction
  await db.afriPointTransaction.create({
    data: {
      userId,
      type: 'spend',
      action: item,
      points: -cost,
      balanceAfter: newBalance,
      metadata: JSON.stringify({ item, quantity }),
    },
  });

  // Mettre à jour le solde
  await db.user.update({
    where: { id: userId },
    data: { afriPoints: newBalance },
  });

  return { points: cost, newBalance };
}
