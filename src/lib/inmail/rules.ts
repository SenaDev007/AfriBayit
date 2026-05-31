/**
 * AfriBayit — InMail Credit Rules
 * Credit allocation per subscription tier
 */

export interface InMailTier {
  id: string;
  name: string;
  monthlyCredits: number;
  rollover: boolean;
  maxRollover: number;
  costPerExtra: number;
  currency: string;
}

export const INMAIL_TIERS: Record<string, InMailTier> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyCredits: 5,
    rollover: false,
    maxRollover: 0,
    costPerExtra: 500,
    currency: 'XOF',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyCredits: 15,
    rollover: true,
    maxRollover: 5,
    costPerExtra: 400,
    currency: 'XOF',
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    monthlyCredits: 50,
    rollover: true,
    maxRollover: 15,
    costPerExtra: 300,
    currency: 'XOF',
  },
  agence: {
    id: 'agence',
    name: 'Agence',
    monthlyCredits: -1, // unlimited
    rollover: false,
    maxRollover: 0,
    costPerExtra: 0,
    currency: 'XOF',
  },
};

export function getTierCredits(tier: string): number {
  return INMAIL_TIERS[tier]?.monthlyCredits ?? 0;
}

export function isUnlimited(tier: string): boolean {
  return INMAIL_TIERS[tier]?.monthlyCredits === -1;
}
