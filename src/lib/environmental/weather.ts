/**
 * AfriBayit — Weather/Climate Data per City
 * Provides environmental data for West African cities
 */

export interface WeatherData {
  city: string;
  country: string;
  avgTempC: number;
  avgTempMinC: number;
  avgTempMaxC: number;
  avgRainfallMm: number;
  humidityPct: number;
  airQualityIndex: number;
  airQualityLevel: string;
  uvIndex: number;
  climate: string;
  rainySeason: string;
  drySeason: string;
}

const CITY_WEATHER: Record<string, WeatherData> = {
  Cotonou: {
    city: 'Cotonou', country: 'BJ',
    avgTempC: 27, avgTempMinC: 24, avgTempMaxC: 31,
    avgRainfallMm: 1300, humidityPct: 78,
    airQualityIndex: 85, airQualityLevel: 'Modéré',
    uvIndex: 9, climate: 'Tropical humide',
    rainySeason: 'Avril - Juillet, Septembre - Octobre',
    drySeason: 'Novembre - Mars',
  },
  'Porto-Novo': {
    city: 'Porto-Novo', country: 'BJ',
    avgTempC: 27, avgTempMinC: 23, avgTempMaxC: 32,
    avgRainfallMm: 1200, humidityPct: 75,
    airQualityIndex: 72, airQualityLevel: 'Modéré',
    uvIndex: 8, climate: 'Tropical humide',
    rainySeason: 'Avril - Juillet',
    drySeason: 'Novembre - Mars',
  },
  Abidjan: {
    city: 'Abidjan', country: 'CI',
    avgTempC: 27, avgTempMinC: 24, avgTempMaxC: 31,
    avgRainfallMm: 1800, humidityPct: 82,
    airQualityIndex: 95, airQualityLevel: 'Modéré',
    uvIndex: 9, climate: 'Tropical humide',
    rainySeason: 'Mai - Juillet, Octobre - Novembre',
    drySeason: 'Décembre - Avril',
  },
  Ouagadougou: {
    city: 'Ouagadougou', country: 'BF',
    avgTempC: 29, avgTempMinC: 22, avgTempMaxC: 37,
    avgRainfallMm: 800, humidityPct: 45,
    airQualityIndex: 110, airQualityLevel: 'Mauvais pour sensibles',
    uvIndex: 11, climate: 'Tropical semi-aride',
    rainySeason: 'Juin - Septembre',
    drySeason: 'Octobre - Mai',
  },
  Lomé: {
    city: 'Lomé', country: 'TG',
    avgTempC: 27, avgTempMinC: 24, avgTempMaxC: 31,
    avgRainfallMm: 1100, humidityPct: 76,
    airQualityIndex: 78, airQualityLevel: 'Modéré',
    uvIndex: 9, climate: 'Tropical humide',
    rainySeason: 'Avril - Juillet, Septembre - Octobre',
    drySeason: 'Novembre - Mars',
  },
};

/**
 * Get weather/climate data for a city
 */
export function getWeatherData(city: string): WeatherData | null {
  return CITY_WEATHER[city] || null;
}

/**
 * Get all available cities with weather data
 */
export function getAvailableCities(): string[] {
  return Object.keys(CITY_WEATHER);
}
