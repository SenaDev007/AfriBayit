/**
 * AfriBayit — Environmental Data Aggregator
 * Combines weather, climate, and environmental data
 */

export { getWeatherData, getAvailableCities, type WeatherData } from './weather';

import { getWeatherData, type WeatherData } from './weather';

export interface EnvironmentalData {
  weather: WeatherData | null;
  floodRisk: 'low' | 'moderate' | 'high';
  erosionRisk: 'low' | 'moderate' | 'high';
  environmentalNotes: string[];
}

/**
 * Get complete environmental data for a location
 */
export function getEnvironmentalData(city: string): EnvironmentalData {
  const weather = getWeatherData(city);

  const floodRisk: EnvironmentalData['floodRisk'] =
    weather && weather.avgRainfallMm > 1500 ? 'high' :
    weather && weather.avgRainfallMm > 1000 ? 'moderate' : 'low';

  const erosionRisk: EnvironmentalData['erosionRisk'] =
    weather && weather.humidityPct > 80 ? 'moderate' : 'low';

  const notes: string[] = [];
  if (floodRisk === 'high') notes.push('Zone à risque d\'inondation — vérifiez les assurances.');
  if (floodRisk === 'moderate') notes.push('Risque modéré d\'inondation en saison des pluies.');
  if (erosionRisk === 'moderate') notes.push('Risque d\'érosion côtière possible.');
  if (weather && weather.airQualityIndex > 100) notes.push('Qualité de l\'air dégradée — convient aux personnes sensibles.');
  if (weather && weather.uvIndex >= 10) notes.push('Indice UV très élevé — protection solaire indispensable.');

  return { weather, floodRisk, erosionRisk, environmentalNotes: notes };
}
