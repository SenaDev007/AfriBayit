// AfriBayit — Seasonal Rules Engine
// Règles saisonnières par pays d'Afrique de l'Ouest

export interface SeasonalPeriod {
  name: string;
  type: 'peak' | 'high' | 'shoulder' | 'low';
  startMonth: number; // 1-12
  startDay: number;
  endMonth: number;
  endDay: number;
  multiplier: number;
  description: string;
}

export interface CountrySeasons {
  country: string;
  countryCode: string;
  peakSeasons: SeasonalPeriod[];
  lowSeasons: SeasonalPeriod[];
  allPeriods: SeasonalPeriod[];
}

/** Saisons pour le Bénin */
const beninSeasons: CountrySeasons = {
  country: 'Bénin',
  countryCode: 'BJ',
  peakSeasons: [
    {
      name: 'Saison sèche / Festival Vodoun',
      type: 'peak',
      startMonth: 12, startDay: 1,
      endMonth: 2, endDay: 28,
      multiplier: 1.3,
      description: 'Saison sèche + Festival Vodoun (Jan) + Fêtes de fin d\'année',
    },
  ],
  lowSeasons: [
    {
      name: 'Saison des pluies',
      type: 'low',
      startMonth: 6, startDay: 1,
      endMonth: 9, endDay: 30,
      multiplier: 0.85,
      description: 'Grande saison des pluies — faible affluence touristique',
    },
  ],
  allPeriods: [],
};
beninSeasons.allPeriods = [...beninSeasons.peakSeasons, ...beninSeasons.lowSeasons];

/** Saisons pour la Côte d'Ivoire */
const coteIvoireSeasons: CountrySeasons = {
  country: 'Côte d\'Ivoire',
  countryCode: 'CI',
  peakSeasons: [
    {
      name: 'Saison sèche / Fêtes',
      type: 'peak',
      startMonth: 12, startDay: 1,
      endMonth: 3, endDay: 31,
      multiplier: 1.3,
      description: 'Saison sèche + Fêtes de fin d\'année + Carnaval de Bouaké (Mar)',
    },
  ],
  lowSeasons: [
    {
      name: 'Saison des pluies',
      type: 'low',
      startMonth: 5, startDay: 1,
      endMonth: 7, endDay: 31,
      multiplier: 0.85,
      description: 'Grande saison des pluies — faible demande',
    },
  ],
  allPeriods: [],
};
coteIvoireSeasons.allPeriods = [...coteIvoireSeasons.peakSeasons, ...coteIvoireSeasons.lowSeasons];

/** Saisons pour le Burkina Faso */
const burkinaSeasons: CountrySeasons = {
  country: 'Burkina Faso',
  countryCode: 'BF',
  peakSeasons: [
    {
      name: 'Saison fraîche',
      type: 'peak',
      startMonth: 11, startDay: 1,
      endMonth: 2, endDay: 28,
      multiplier: 1.3,
      description: 'Saison fraîche + FESPACO (Fév/Mars, années impaires)',
    },
  ],
  lowSeasons: [
    {
      name: 'Saison des pluies',
      type: 'low',
      startMonth: 7, startDay: 1,
      endMonth: 9, endDay: 30,
      multiplier: 0.85,
      description: 'Saison des pluies — faible affluence',
    },
  ],
  allPeriods: [],
};
burkinaSeasons.allPeriods = [...burkinaSeasons.peakSeasons, ...burkinaSeasons.lowSeasons];

/** Saisons pour le Togo */
const togoSeasons: CountrySeasons = {
  country: 'Togo',
  countryCode: 'TG',
  peakSeasons: [
    {
      name: 'Saison sèche',
      type: 'peak',
      startMonth: 12, startDay: 1,
      endMonth: 2, endDay: 28,
      multiplier: 1.3,
      description: 'Saison sèche + Fêtes de fin d\'année',
    },
  ],
  lowSeasons: [
    {
      name: 'Saison des pluies',
      type: 'low',
      startMonth: 6, startDay: 1,
      endMonth: 9, endDay: 30,
      multiplier: 0.85,
      description: 'Grande saison des pluies',
    },
  ],
  allPeriods: [],
};
togoSeasons.allPeriods = [...togoSeasons.peakSeasons, ...togoSeasons.lowSeasons];

// Carte complète des saisons par pays
const COUNTRY_SEASONS: Record<string, CountrySeasons> = {
  BJ: beninSeasons,
  CI: coteIvoireSeasons,
  BF: burkinaSeasons,
  TG: togoSeasons,
};

/** Obtenir les saisons pour un pays */
export function getCountrySeasons(countryCode: string): CountrySeasons | null {
  return COUNTRY_SEASONS[countryCode] || null;
}

/** Déterminer si une date est en saison haute */
export function isPeakSeason(date: Date, countryCode: string): boolean {
  const seasons = COUNTRY_SEASONS[countryCode];
  if (!seasons) return false;
  return isDateInPeriods(date, seasons.peakSeasons);
}

/** Déterminer si une date est en saison basse */
export function isLowSeason(date: Date, countryCode: string): boolean {
  const seasons = COUNTRY_SEASONS[countryCode];
  if (!seasons) return false;
  return isDateInPeriods(date, seasons.lowSeasons);
}

/** Obtenir le multiplicateur saisonnier pour une date */
export function getSeasonalMultiplier(date: Date, countryCode: string): number {
  const seasons = COUNTRY_SEASONS[countryCode];
  if (!seasons) return 1.0;

  // Vérifier d'abord la saison haute (priorité)
  for (const period of seasons.peakSeasons) {
    if (isDateInPeriod(date, period)) {
      return period.multiplier;
    }
  }

  // Puis la saison basse
  for (const period of seasons.lowSeasons) {
    if (isDateInPeriod(date, period)) {
      return period.multiplier;
    }
  }

  // Saison intermédiaire
  return 1.0;
}

/** Obtenir le nom de la saison pour une date */
export function getSeasonName(date: Date, countryCode: string): string {
  const seasons = COUNTRY_SEASONS[countryCode];
  if (!seasons) return 'Standard';

  for (const period of seasons.allPeriods) {
    if (isDateInPeriod(date, period)) {
      return period.name;
    }
  }

  return 'Saison intermédiaire';
}

/** Obtenir toutes les saisons disponibles */
export function getAllCountrySeasons(): CountrySeasons[] {
  return Object.values(COUNTRY_SEASONS);
}

// ── Helpers ─────────────────────────────────────────────

function isDateInPeriod(date: Date, period: SeasonalPeriod): boolean {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  if (period.startMonth <= period.endMonth) {
    // Période dans la même année
    if (month > period.startMonth && month < period.endMonth) return true;
    if (month === period.startMonth && day >= period.startDay) return true;
    if (month === period.endMonth && day <= period.endDay) return true;
    return false;
  } else {
    // Période chevauchant deux années (ex: Déc-Fév)
    if (month >= period.startMonth || month <= period.endMonth) {
      if (month === period.startMonth && day < period.startDay) return false;
      if (month === period.endMonth && day > period.endDay) return false;
      return true;
    }
    return false;
  }
}

function isDateInPeriods(date: Date, periods: SeasonalPeriod[]): boolean {
  return periods.some((p) => isDateInPeriod(date, p));
}
