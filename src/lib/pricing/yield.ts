// AfriBayit — Yield Management
// Gestion du rendement: RevPAR, ADR, recommandations IA

export interface YieldMetrics {
  /** Revenue Per Available Room */
  revPAR: number;
  /** Average Daily Rate */
  adr: number;
  /** Taux d'occupation */
  occupancyRate: number;
  /** Revenu total */
  totalRevenue: number;
  /** Nombre de chambres vendues */
  roomsSold: number;
  /** Nombre de chambres disponibles */
  availableRooms: number;
  /** Nombre de jours analysés */
  days: number;
}

export interface YieldRecommendation {
  type: 'increase_rate' | 'decrease_rate' | 'maintain' | 'promo' | 'last_minute';
  confidence: number; // 0-100
  description: string;
  suggestedRateModifier: number;
  reason: string;
}

export interface HistoricalData {
  date: string;
  occupancyRate: number;
  adr: number;
  revPAR: number;
  bookings: number;
}

/**
 * Calculer le RevPAR (Revenue Per Available Room)
 * RevPAR = Revenu total / (Chambres disponibles × Jours)
 */
export function calculateRevPAR(
  revenue: number,
  availableRooms: number,
  days: number
): number {
  if (availableRooms <= 0 || days <= 0) return 0;
  return revenue / (availableRooms * days);
}

/**
 * Calculer l'ADR (Average Daily Rate)
 * ADR = Revenu total / Chambres vendues
 */
export function calculateADR(
  totalRevenue: number,
  roomsSold: number
): number {
  if (roomsSold <= 0) return 0;
  return totalRevenue / roomsSold;
}

/**
 * Calculer les métriques de rendement complètes
 */
export function calculateYieldMetrics(
  totalRevenue: number,
  roomsSold: number,
  availableRooms: number,
  days: number
): YieldMetrics {
  const adr = calculateADR(totalRevenue, roomsSold);
  const revPAR = calculateRevPAR(totalRevenue, availableRooms, days);
  const occupancyRate = availableRooms > 0 && days > 0
    ? roomsSold / (availableRooms * days)
    : 0;

  return {
    revPAR: Math.round(revPAR),
    adr: Math.round(adr),
    occupancyRate: Math.min(1, Math.max(0, occupancyRate)),
    totalRevenue,
    roomsSold,
    availableRooms,
    days,
  };
}

/**
 * Suggérer une stratégie de yield management basée sur les métriques actuelles
 * et les données historiques
 */
export function suggestYieldStrategy(
  currentMetrics: YieldMetrics,
  historicalData: HistoricalData[]
): YieldRecommendation[] {
  const recommendations: YieldRecommendation[] = [];

  // 1. Analyse du taux d'occupation
  if (currentMetrics.occupancyRate > 0.9) {
    recommendations.push({
      type: 'increase_rate',
      confidence: 85,
      description: 'Augmenter les tarifs',
      suggestedRateModifier: 1.15,
      reason: `Taux d'occupation très élevé (${Math.round(currentMetrics.occupancyRate * 100)}%). La demande justifie une hausse de 10-20%.`,
    });
  } else if (currentMetrics.occupancyRate > 0.75) {
    recommendations.push({
      type: 'increase_rate',
      confidence: 65,
      description: 'Augmentation modérée des tarifs',
      suggestedRateModifier: 1.08,
      reason: `Bon taux d'occupation (${Math.round(currentMetrics.occupancyRate * 100)}%). Marge pour une hausse modérée.`,
    });
  } else if (currentMetrics.occupancyRate < 0.3) {
    recommendations.push({
      type: 'decrease_rate',
      confidence: 80,
      description: 'Réduire les tarifs',
      suggestedRateModifier: 0.85,
      reason: `Faible occupation (${Math.round(currentMetrics.occupancyRate * 100)}%). Réduction nécessaire pour stimuler la demande.`,
    });
  } else if (currentMetrics.occupancyRate < 0.5) {
    recommendations.push({
      type: 'promo',
      confidence: 70,
      description: 'Lancer une promotion',
      suggestedRateModifier: 0.9,
      reason: `Occupation modérée (${Math.round(currentMetrics.occupancyRate * 100)}%). Offres promotionnelles recommandées.`,
    });
  }

  // 2. Analyse tendance (comparer avec données historiques)
  if (historicalData.length >= 7) {
    const recentDays = historicalData.slice(-7);
    const avgRecentOccupancy = recentDays.reduce((s, d) => s + d.occupancyRate, 0) / recentDays.length;
    const avgRecentADR = recentDays.reduce((s, d) => s + d.adr, 0) / recentDays.length;

    // Tendance baissière de l'occupation
    if (avgRecentOccupancy < currentMetrics.occupancyRate * 0.8) {
      recommendations.push({
        type: 'last_minute',
        confidence: 60,
        description: 'Offre dernière minute',
        suggestedRateModifier: 0.8,
        reason: 'Baisse de tendance détectée sur les 7 derniers jours. Offre dernière minute recommandée.',
      });
    }

    // ADR en hausse mais occupation en baisse = prix trop élevés
    if (avgRecentADR > currentMetrics.adr * 1.1 && avgRecentOccupancy < currentMetrics.occupancyRate * 0.9) {
      recommendations.push({
        type: 'decrease_rate',
        confidence: 55,
        description: 'Ajustement tarifaire à la baisse',
        suggestedRateModifier: 0.92,
        reason: 'L\'ADR augmente mais l\'occupation baisse. Les prix sont potentiellement trop élevés.',
      });
    }
  }

  // 3. Si aucune recommandation, maintenir
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'maintain',
      confidence: 70,
      description: 'Maintenir les tarifs actuels',
      suggestedRateModifier: 1.0,
      reason: `Performance équilibrée. Occupation: ${Math.round(currentMetrics.occupancyRate * 100)}%, ADR: ${currentMetrics.adr} FCFA.`,
    });
  }

  // Trier par confiance décroissante
  return recommendations.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Comparer les performances avec la période précédente
 */
export function compareToPreviousPeriod(
  current: YieldMetrics,
  previous: YieldMetrics
): {
  revPARChange: number;
  adrChange: number;
  occupancyChange: number;
  revenueChange: number;
} {
  return {
    revPARChange: previous.revPAR > 0 ? ((current.revPAR - previous.revPAR) / previous.revPAR) * 100 : 0,
    adrChange: previous.adr > 0 ? ((current.adr - previous.adr) / previous.adr) * 100 : 0,
    occupancyChange: previous.occupancyRate > 0
      ? ((current.occupancyRate - previous.occupancyRate) / previous.occupancyRate) * 100
      : 0,
    revenueChange: previous.totalRevenue > 0
      ? ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100
      : 0,
  };
}
