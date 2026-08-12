// AfriBayit Points Ledger — Registre des transactions de points

import { db } from '@/lib/db';

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend';
  action: string;
  points: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Récupère l'historique des transactions de points d'un utilisateur
 */
export async function getPointsHistory(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<PointTransaction[]> {
  const { limit = 50, offset = 0 } = options || {};

  const transactions = await db.afriPointTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return transactions.map((t) => ({
    id: t.id,
    userId: t.userId,
    type: t.type as 'earn' | 'spend',
    action: t.action,
    points: t.points,
    balanceAfter: t.balanceAfter,
    metadata: t.metadata ? JSON.parse(t.metadata) : undefined,
    createdAt: t.createdAt,
  }));
}

/**
 * Récupère le solde actuel de points d'un utilisateur
 */
export async function getPointsBalance(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { afriPoints: true },
  });
  return user?.afriPoints || 0;
}

/**
 * Récupère le classement des meilleurs points
 */
export async function getPointsLeaderboard(
  options?: { country?: string; limit?: number }
): Promise<Array<{ userId: string; name: string; avatar: string | null; points: number; country: string | null }>> {
  const { country, limit = 20 } = options || {};

  const users = await db.user.findMany({
    where: country ? { country } : undefined,
    orderBy: { afriPoints: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      avatar: true,
      afriPoints: true,
      country: true,
    },
  });

  return users.map((u) => ({
    userId: u.id,
    name: u.name,
    avatar: u.avatar,
    points: u.afriPoints,
    country: u.country,
  }));
}
