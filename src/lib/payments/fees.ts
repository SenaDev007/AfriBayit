/**
 * AfriBayit — Frais et commissions canoniques.
 * SOURCE UNIQUE DE VÉRITÉ — Registre des décisions d'arbitrage CDC V4.0
 * (document : AfriBayit_Arbitrage_CDC.pdf, décisions T-1 à T-11).
 *
 * Toute interface (composants publics, routes API, moteur escrow, module
 * ambassadeurs) importe ces valeurs — aucune redéclaration locale.
 */

// ============ T-11 — Phase tarifaire ============

export type TariffPhase = 'phase0' | 'phase1' | 'standard';

/**
 * Phase tarifaire active. 'standard' = grilles canoniques T-1 à T-9.
 * Le passage à 'phase0' / 'phase1' est une décision commerciale conjointe
 * produit-finance (CDC §11.4), journalisée — jamais un changement de grille.
 */
export const TARIFF_PHASE: TariffPhase = 'standard';

// ============ Types partagés (maths pures, sans dépendance DB) ============

export type CommissionTransactionType =
  | 'vente_immobiliere'
  | 'location_courte_duree'
  | 'hotellerie'
  | 'artisan'
  | 'guesthouse';

export type HotelTier = 1 | 2 | 3 | 4 | 5;

// ============ T-1 — Vente immobilière : grille dégressive 5/4/3/2 % ============

export const VENTE_COMMISSION_TIERS: readonly { maxAmount: number; rate: number }[] = [
  { maxAmount: 5_000_000, rate: 0.05 },
  { maxAmount: 20_000_000, rate: 0.04 },
  { maxAmount: 50_000_000, rate: 0.03 },
  { maxAmount: Infinity, rate: 0.02 },
];

export function venteCommissionRate(amount: number): number {
  for (const tier of VENTE_COMMISSION_TIERS) {
    if (amount <= tier.maxAmount) return tier.rate;
  }
  return 0.02;
}

// ============ T-2 — Location longue durée : 1 mois de loyer, 50/50 ============

export const LLD_COMMISSION_MONTHS = 1;
export const LLD_SPLIT = { proprietaire: 0.5, locataire: 0.5 } as const;

// ============ T-3 — Location courte durée ============

/** Commission hôte LCD — confirmée CDC §6.2 / §11.2.1. */
export const LCD_HOST_COMMISSION_RATE = 0.03;

/** Frais de service voyageur LCD — 10 % au lancement, 12 % en maturité (T-3). */
export const LCD_TRAVELER_SERVICE_FEE_RATE = 0.10;

export function lcdTravelerFee(subtotal: number): number {
  return Math.round(subtotal * LCD_TRAVELER_SERVICE_FEE_RATE);
}

// ============ T-4 — Missions artisans & géomètres : 8 % ============

export const ARTISAN_MISSION_COMMISSION_RATE = 0.08;

// ============ T-7 — Notaires (gradient implémenté) ============

export const NOTARY_TIERS = [
  { name: 'standard', price: 0, commission: 0.15 },
  { name: 'premium', price: 25_000, commission: 0.12 },
  { name: 'elite', price: 50_000, commission: 0.10 },
] as const;

/** Fourchette CDC §5.0bis.5 — le palier 75 000 est réservé au futur tier Cabinet. */
export const NOTARY_SUBSCRIPTION_RANGE = { min: 25_000, max: 50_000, futureCabinet: 75_000 };

// ============ T-9 — Hôtellerie ============

export const HOTELLERIE_RATE_BY_TIER: Record<HotelTier, number> = {
  1: 0.12, 2: 0.12, 3: 0.13, 4: 0.14, 5: 0.15,
};

export const OTA_NET_MARGIN = { min: 0.03, max: 0.05 } as const;
export const LAST_MINUTE_COMMISSION_RATE = 0.18;
export const PMS_TIERS = { starter: 9_900, pro: 24_900, enterprise: 'sur devis' } as const;

// ============ Guesthouses (confirmé CDC §5.3.5 / §6.2) ============

export const GUESTHOUSE_VOYAGEUR_RATE_BY_TIER: Record<number, number> = { 1: 0.10, 2: 0.12, 3: 0.13 };
export const GUESTHOUSE_PROPRIETAIRE_RATE = 0.03;

// ============ Commission nette par type (maths partagées du moteur escrow) ============

export interface CommissionNetteResult {
  rate: number;
  commission: number;
}

export function commissionNetteParType(
  type: CommissionTransactionType,
  amount: number,
  options?: { hotelTier?: HotelTier; guesthouseTier?: 1 | 2 | 3 }
): CommissionNetteResult {
  switch (type) {
    case 'vente_immobiliere': {
      const rate = venteCommissionRate(amount);
      return { rate, commission: Math.round(amount * rate) };
    }
    case 'location_courte_duree': {
      const rate = LCD_HOST_COMMISSION_RATE;
      return { rate, commission: Math.round(amount * rate) };
    }
    case 'hotellerie': {
      const tier = options?.hotelTier ?? 3;
      const rate = HOTELLERIE_RATE_BY_TIER[tier];
      return { rate, commission: Math.round(amount * rate) };
    }
    case 'artisan': {
      const rate = ARTISAN_MISSION_COMMISSION_RATE;
      return { rate, commission: Math.round(amount * rate) };
    }
    case 'guesthouse': {
      const tier = options?.guesthouseTier ?? 2;
      const voyageurRate = GUESTHOUSE_VOYAGEUR_RATE_BY_TIER[tier] ?? 0.12;
      const rate = voyageurRate + GUESTHOUSE_PROPRIETAIRE_RATE;
      return { rate, commission: Math.round(amount * rate) };
    }
  }
}

// ============ T-10 — Ambassadeurs : base = commission nette AfriBayit ============

/**
 * Calcule le reversement d'ambassadeur sur la COMMISSION NETTE de la
 * plateforme (partage de revenu), jamais sur le montant brut de la
 * transaction. `platformCommission` (ex. Transaction.commission) est
 * utilisé tel quel lorsqu'il est fourni ; sinon la commission nette est
 * dérivée de la grille de vente (type dominant, lecture conservatrice).
 */
export function computeAmbassadorCommission(
  transactionAmount: number,
  ambassadorRate: number,
  platformCommission?: number,
  transactionType?: CommissionTransactionType
): { base: number; amount: number; derived: boolean } {
  let base: number;
  let derived = false;
  if (platformCommission != null && platformCommission > 0) {
    base = platformCommission;
  } else {
    base = commissionNetteParType(transactionType ?? 'vente_immobiliere', transactionAmount).commission;
    derived = true;
  }
  return { base, amount: Math.round(base * ambassadorRate), derived };
}

/** Garde-fou T-10 : les reversements d'ambassadeurs ≤ 10 % du revenu net. */
export const AMBASSADOR_PAYOUT_REVENUE_CAP = 0.10;

export const AMBASSADOR_TIERS_RATES = { bronze: 0.02, silver: 0.03, gold: 0.04 } as const;
export const AMBASSADOR_GOLD_MONTHLY_EUR = { min: 100, max: 300 } as const;
