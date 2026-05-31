/**
 * AfriBayit — InMail Credit System
 * Track and manage InMail credits for agents
 */

export { INMAIL_TIERS, getTierCredits, isUnlimited, type InMailTier } from './rules';

import { INMAIL_TIERS, getTierCredits, isUnlimited } from './rules';

export interface InMailAccount {
  userId: string;
  tier: string;
  creditsRemaining: number;
  creditsUsed: number;
  creditsTotal: number;
  rolloverCredits: number;
  periodStart: string;
  periodEnd: string;
  isUnlimited: boolean;
}

export interface InMailMessage {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject: string;
  body: string;
  propertyId?: string;
  sentAt: string;
  readAt?: string;
  repliedAt?: string;
}

// In-memory store for demo
const inmailAccounts = new Map<string, InMailAccount>();
const inmailMessages: InMailMessage[] = [];

/**
 * Get or create InMail account for a user
 */
export function getInMailAccount(userId: string, tier: string = 'starter'): InMailAccount {
  let account = inmailAccounts.get(userId);
  if (!account) {
    const credits = getTierCredits(tier);
    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    account = {
      userId,
      tier,
      creditsRemaining: credits === -1 ? 999 : credits,
      creditsUsed: 0,
      creditsTotal: credits === -1 ? 999 : credits,
      rolloverCredits: 0,
      periodStart: now.toISOString(),
      periodEnd: periodEnd.toISOString(),
      isUnlimited: isUnlimited(tier),
    };
    inmailAccounts.set(userId, account);
  }
  return account;
}

/**
 * Send an InMail (deducts 1 credit)
 */
export function sendInMail(
  fromUserId: string,
  toUserId: string,
  subject: string,
  body: string,
  propertyId?: string
): { success: boolean; message?: InMailMessage; error?: string } {
  const account = inmailAccounts.get(fromUserId);

  if (!account) {
    return { success: false, error: 'Compte InMail non trouvé' };
  }

  if (!account.isUnlimited && account.creditsRemaining <= 0) {
    return { success: false, error: 'Crédits InMail insuffisants' };
  }

  // Deduct credit
  if (!account.isUnlimited) {
    account.creditsRemaining--;
    account.creditsUsed++;
  }

  const message: InMailMessage = {
    id: `inmail-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    fromUserId,
    toUserId,
    subject,
    body,
    propertyId,
    sentAt: new Date().toISOString(),
  };

  inmailMessages.push(message);

  return { success: true, message };
}

/**
 * Get remaining credits for a user
 */
export function getRemainingCredits(userId: string): number {
  const account = inmailAccounts.get(userId);
  if (!account) return 0;
  return account.isUnlimited ? -1 : account.creditsRemaining;
}
