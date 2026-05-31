// AfriBayit — Dynamic Pricing Algorithm
// Algorithme de tarification dynamique basé sur la demande, saisonnalité et compétition

export interface DynamicPricingParams {
  /** Taux d'occupation actuel (0-1) */
  occupancyRate: number;
  /** Saison haute ? */
  isPeakSeason: boolean;
  /** Saison basse ? */
  isLowSeason: boolean;
  /** Jours avant le check-in */
  daysUntilCheckIn: number;
  /** Durée du séjour en nuits */
  lengthOfStay: number;
  /** Prix moyen des concurrents (optionnel) */
  competitorAvgPrice?: number;
  /** Jour de la semaine (0=dim, 6=sam) */
  dayOfWeek?: number;
  /** Événement local en cours ? */
  hasLocalEvent?: boolean;
}

/**
 * Calculer le prix dynamique basé sur les paramètres
 *
 * Modificateurs appliqués (multiplicatifs):
 * - Demande forte (>90% occupation): +20%
 * - Demande modérée (>70%): +10%
 * - Faible demande (<30%): -10%
 * - Saison haute: +30%
 * - Saison basse: -15%
 * - Dernière minute (≤1j): -20%
 * - Dernière minute (≤3j): -10%
 * - Long séjour (≥7 nuits): -10%
 * - Très long séjour (≥30 nuits): -20%
 * - Week-end (ven/sam): +15%
 * - Événement local: +25%
 * - Compétition: ajustement ±5%
 */
export function calculateDynamicPrice(
  basePrice: number,
  params: DynamicPricingParams
): number {
  let modifier = 1.0;

  // Facteur demande: occupation élevée → prix plus élevé
  if (params.occupancyRate > 0.9) modifier *= 1.2;
  else if (params.occupancyRate > 0.7) modifier *= 1.1;
  else if (params.occupancyRate < 0.3) modifier *= 0.9;

  // Saisonnalité
  if (params.isPeakSeason) modifier *= 1.3;
  else if (params.isLowSeason) modifier *= 0.85;

  // Jours avant check-in: réductions dernière minute
  if (params.daysUntilCheckIn <= 1) modifier *= 0.8; // Dernière minute -20%
  else if (params.daysUntilCheckIn <= 3) modifier *= 0.9;

  // Remise durée du séjour
  if (params.lengthOfStay >= 30) modifier *= 0.8; // Mensuel -20%
  else if (params.lengthOfStay >= 7) modifier *= 0.9; // Hebdomadaire -10%

  // Supplément week-end
  if (params.dayOfWeek !== undefined && (params.dayOfWeek === 5 || params.dayOfWeek === 6)) {
    modifier *= 1.15;
  }

  // Supplément événement local
  if (params.hasLocalEvent) {
    modifier *= 1.25;
  }

  // Ajustement compétitif
  if (params.competitorAvgPrice && params.competitorAvgPrice > 0) {
    const compRatio = basePrice / params.competitorAvgPrice;
    if (compRatio > 1.1) modifier *= 0.95; // Légèrement sous les concurrents
    else if (compRatio < 0.9) modifier *= 1.05; // Marge pour augmenter
  }

  // Plancher: ne jamais descendre sous 60% du prix de base
  const finalPrice = Math.round(basePrice * modifier);
  const minPrice = Math.round(basePrice * 0.6);
  return Math.max(finalPrice, minPrice);
}

/**
 * Obtenir le détail des modificateurs appliqués (pour transparence)
 */
export function getPricingBreakdown(
  basePrice: number,
  params: DynamicPricingParams
): {
  basePrice: number;
  modifiers: { name: string; factor: number; description: string }[];
  finalPrice: number;
} {
  const modifiers: { name: string; factor: number; description: string }[] = [];

  // Facteur demande
  if (params.occupancyRate > 0.9) {
    modifiers.push({ name: 'Demande forte', factor: 1.2, description: `Occupation ${Math.round(params.occupancyRate * 100)}%` });
  } else if (params.occupancyRate > 0.7) {
    modifiers.push({ name: 'Demande modérée', factor: 1.1, description: `Occupation ${Math.round(params.occupancyRate * 100)}%` });
  } else if (params.occupancyRate < 0.3) {
    modifiers.push({ name: 'Faible demande', factor: 0.9, description: `Occupation ${Math.round(params.occupancyRate * 100)}%` });
  }

  // Saisonnalité
  if (params.isPeakSeason) {
    modifiers.push({ name: 'Saison haute', factor: 1.3, description: 'Période de pointe' });
  } else if (params.isLowSeason) {
    modifiers.push({ name: 'Saison basse', factor: 0.85, description: 'Période creuse' });
  }

  // Dernière minute
  if (params.daysUntilCheckIn <= 1) {
    modifiers.push({ name: 'Dernière minute', factor: 0.8, description: 'Réduction 20%' });
  } else if (params.daysUntilCheckIn <= 3) {
    modifiers.push({ name: 'Arrivée proche', factor: 0.9, description: 'Réduction 10%' });
  }

  // Durée
  if (params.lengthOfStay >= 30) {
    modifiers.push({ name: 'Séjour mensuel', factor: 0.8, description: 'Réduction 20%' });
  } else if (params.lengthOfStay >= 7) {
    modifiers.push({ name: 'Séjour hebdomadaire', factor: 0.9, description: 'Réduction 10%' });
  }

  // Week-end
  if (params.dayOfWeek !== undefined && (params.dayOfWeek === 5 || params.dayOfWeek === 6)) {
    modifiers.push({ name: 'Supplément week-end', factor: 1.15, description: '+15%' });
  }

  // Événement
  if (params.hasLocalEvent) {
    modifiers.push({ name: 'Événement local', factor: 1.25, description: '+25%' });
  }

  const finalPrice = calculateDynamicPrice(basePrice, params);

  return { basePrice, modifiers, finalPrice };
}
