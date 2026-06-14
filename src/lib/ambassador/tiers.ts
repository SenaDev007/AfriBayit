// AfriBayit Ambassador Tiers — Définitions des paliers ambassadeur

export interface AmbassadorTier {
  name: string;
  nameFr: string;
  commissionRate: number;
  benefits: string[];
  requirements: string[];
  color: string;
  icon: string;
}

export const AMBASSADOR_TIERS: Record<string, AmbassadorTier> = {
  bronze: {
    name: 'Bronze Ambassador',
    nameFr: 'Ambassadeur Bronze',
    commissionRate: 0.02,
    benefits: [
      'Lien de parrainage personnalisé',
      'Commission de 2% sur chaque filleul actif',
      'Accès au tableau de bord ambassadeur',
      'Support par email',
    ],
    requirements: [
      'Avoir un profil complété',
      'Avoir publié au moins 1 annonce',
      'Être vérifié (KYC niveau 1)',
    ],
    color: '#CD7F32',
    icon: '🥉',
  },
  silver: {
    name: 'Silver Ambassador',
    nameFr: 'Ambassadeur Argent',
    commissionRate: 0.03,
    benefits: [
      'Tous les avantages Bronze',
      'Commission de 3% sur chaque filleul actif',
      'Page d\'atterrissage personnalisée',
      'Support prioritaire',
      'Accès aux événements exclusifs',
      'Badge Ambassadeur Argent sur le profil',
    ],
    requirements: [
      'Avoir parrainé au moins 5 utilisateurs',
      'Avoir généré au moins 3 transactions',
      'Être vérifié (KYC niveau 2)',
      'Avoir un score de réputation ≥ 300',
    ],
    color: '#C0C0C0',
    icon: '🥈',
  },
  gold: {
    name: 'Gold Ambassador',
    nameFr: 'Ambassadeur Or',
    commissionRate: 0.04,
    benefits: [
      'Tous les avantages Argent',
      'Commission de 4% sur chaque filleul actif',
      'Événements co-brandés',
      'Accès VIP aux formations',
      'Mise en avant sur la plateforme',
      'Rapports analytiques avancés',
      'Badge Ambassadeur Or sur le profil',
    ],
    requirements: [
      'Avoir parrainé au moins 20 utilisateurs',
      'Avoir généré au moins 10 transactions',
      'Être vérifié (KYC niveau 3)',
      'Avoir un score de réputation ≥ 600',
    ],
    color: '#FFD700',
    icon: '🥇',
  },
};

/**
 * Retourne le palier ambassadeur pour un taux de commission donné
 */
export function getTierByCommissionRate(rate: number): AmbassadorTier | null {
  for (const tier of Object.values(AMBASSADOR_TIERS)) {
    if (tier.commissionRate === rate) {
      return tier;
    }
  }
  return null;
}

/**
 * Retourne le prochain palier ambassadeur
 */
export function getNextTier(currentTier: string): AmbassadorTier | null {
  const tierOrder = ['bronze', 'silver', 'gold'];
  const currentIndex = tierOrder.indexOf(currentTier);
  if (currentIndex < 0 || currentIndex >= tierOrder.length - 1) {
    return null;
  }
  return AMBASSADOR_TIERS[tierOrder[currentIndex + 1]];
}

/**
 * Génère un code de parrainage unique
 */
export function generateReferralCode(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}-${random}`;
}
