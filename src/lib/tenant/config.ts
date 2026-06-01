// AfriBayit — Tenant Configuration
// CDC §8 — Country-specific configuration for sub-domain routing
//
// Contains all per-country configuration including:
// - Country codes, names, currencies, languages
// - Default cities per country
// - Required documents per country for legal validation
// - Payment provider configurations per country

// ─── Types ────────────────────────────────────────────────────────────────────────

export type SupportedCountry = 'BJ' | 'CI' | 'BF' | 'TG' | 'SN';

export interface TenantConfig {
  /** ISO 3166-1 alpha-2 country code */
  code: SupportedCountry;
  /** French name of the country */
  name: string;
  /** English name of the country */
  nameEn: string;
  /** Subdomain prefix (e.g., "bj" for bj.afribayit.com) */
  subdomain: string;
  /** ISO 4217 currency code */
  currency: string;
  /** Currency symbol */
  currencySymbol: string;
  /** Currency name in French */
  currencyName: string;
  /** Decimal places for currency formatting */
  currencyDecimals: number;
  /** Primary language code */
  language: string;
  /** Supported language codes */
  languages: string[];
  /** Default city for this country */
  defaultCity: string;
  /** Major cities for this country */
  cities: string[];
  /** Phone country code */
  phoneCode: string;
  /** Flag emoji */
  flag: string;
  /** Timezone */
  timezone: string;
  /** Required legal documents per property type */
  requiredDocuments: Record<string, string[][]>;
  /** Payment provider configurations */
  paymentProviders: PaymentProviderConfig[];
  /** Tax configuration */
  taxConfig: TaxConfig;
  /** Whether the country is active on the platform */
  active: boolean;
}

export interface PaymentProviderConfig {
  /** Provider name (e.g., "fedapay", "stripe", "mtn_momo", "moov_money") */
  provider: string;
  /** Whether this provider is active for this country */
  active: boolean;
  /** Supported payment methods */
  methods: string[];
  /** Provider-specific configuration */
  config: Record<string, string | boolean>;
}

export interface TaxConfig {
  /** Default VAT rate (%) */
  vatRate: number;
  /** Registration tax rate (%) */
  registrationTaxRate: number;
  /** Notary fee rate (%) */
  notaryFeeRate: number;
  /** Commission rate (%) */
  commissionRate: number;
  /** Whether withholding tax applies */
  withholdingTax: boolean;
  /** Withholding tax rate (%) */
  withholdingTaxRate: number;
}

// ─── Tenant Configurations ────────────────────────────────────────────────────────

const TENANT_CONFIGS: Record<SupportedCountry, TenantConfig> = {
  BJ: {
    code: 'BJ',
    name: 'Bénin',
    nameEn: 'Benin',
    subdomain: 'bj',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    currencyName: 'Franc CFA (BCEAO)',
    currencyDecimals: 0,
    language: 'fr',
    languages: ['fr', 'fon', 'yo'],
    defaultCity: 'Cotonou',
    cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon', 'Kandi', 'Lokossa', 'Ouidah'],
    phoneCode: '+229',
    flag: '🇧🇯',
    timezone: 'Africa/Porto-Novo',
    requiredDocuments: {
      terrain: [['titre_foncier', 'acd']],
      villa: [['titre_foncier', 'acd']],
      appartement: [['titre_foncier', 'permis_construire', 'autorisation_lotissement']],
    },
    paymentProviders: [
      {
        provider: 'fedapay',
        active: true,
        methods: ['mobile_money', 'credit_card', 'bank_transfer'],
        config: { currency: 'XOF', country: 'BJ' },
      },
      {
        provider: 'mtn_momo',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'BJ' },
      },
      {
        provider: 'moov_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'BJ' },
      },
    ],
    taxConfig: {
      vatRate: 18,
      registrationTaxRate: 5,
      notaryFeeRate: 2.5,
      commissionRate: 3,
      withholdingTax: true,
      withholdingTaxRate: 5,
    },
    active: true,
  },

  CI: {
    code: 'CI',
    name: "Côte d'Ivoire",
    nameEn: "Cote d'Ivoire",
    subdomain: 'ci',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    currencyName: 'Franc CFA (BCEAO)',
    currencyDecimals: 0,
    language: 'fr',
    languages: ['fr', 'dioula'],
    defaultCity: 'Abidjan',
    cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa'],
    phoneCode: '+225',
    flag: '🇨🇮',
    timezone: 'Africa/Abidjan',
    requiredDocuments: {
      terrain: [['lettre_attribution'], ['acd', 'arrete_concession']],
      bien_bati: [['titre_foncier', 'certificat_propriete']],
    },
    paymentProviders: [
      {
        provider: 'fedapay',
        active: true,
        methods: ['mobile_money', 'credit_card', 'bank_transfer'],
        config: { currency: 'XOF', country: 'CI' },
      },
      {
        provider: 'orange_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'CI' },
      },
      {
        provider: 'mtn_momo',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'CI' },
      },
      {
        provider: 'moov_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'CI' },
      },
      {
        provider: 'wave',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'CI' },
      },
    ],
    taxConfig: {
      vatRate: 18,
      registrationTaxRate: 4,
      notaryFeeRate: 2.5,
      commissionRate: 3,
      withholdingTax: true,
      withholdingTaxRate: 5,
    },
    active: true,
  },

  BF: {
    code: 'BF',
    name: 'Burkina Faso',
    nameEn: 'Burkina Faso',
    subdomain: 'bf',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    currencyName: 'Franc CFA (BCEAO)',
    currencyDecimals: 0,
    language: 'fr',
    languages: ['fr', 'moore', 'dioula'],
    defaultCity: 'Ouagadougou',
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Kaya', 'Tenkodogo', 'Fada N\'gourma'],
    phoneCode: '+226',
    flag: '🇧🇫',
    timezone: 'Africa/Ouagadougou',
    requiredDocuments: {
      terrain: [['puh', 'titre_foncier']],
    },
    paymentProviders: [
      {
        provider: 'fedapay',
        active: true,
        methods: ['mobile_money', 'credit_card'],
        config: { currency: 'XOF', country: 'BF' },
      },
      {
        provider: 'orange_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'BF' },
      },
    ],
    taxConfig: {
      vatRate: 18,
      registrationTaxRate: 5,
      notaryFeeRate: 2,
      commissionRate: 3,
      withholdingTax: true,
      withholdingTaxRate: 5,
    },
    active: true,
  },

  TG: {
    code: 'TG',
    name: 'Togo',
    nameEn: 'Togo',
    subdomain: 'tg',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    currencyName: 'Franc CFA (BCEAO)',
    currencyDecimals: 0,
    language: 'fr',
    languages: ['fr', 'ewe', 'kabye'],
    defaultCity: 'Lomé',
    cities: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Dapaong', 'Tsévié', 'Aného', 'Notsé'],
    phoneCode: '+228',
    flag: '🇹🇬',
    timezone: 'Africa/Lome',
    requiredDocuments: {
      tout_bien: [['titre_foncier'], ['acte_cession', 'certificat_andf']],
    },
    paymentProviders: [
      {
        provider: 'fedapay',
        active: true,
        methods: ['mobile_money', 'credit_card'],
        config: { currency: 'XOF', country: 'TG' },
      },
      {
        provider: 'moov_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'TG' },
      },
    ],
    taxConfig: {
      vatRate: 18,
      registrationTaxRate: 5,
      notaryFeeRate: 2,
      commissionRate: 3,
      withholdingTax: false,
      withholdingTaxRate: 0,
    },
    active: true,
  },

  SN: {
    code: 'SN',
    name: 'Sénégal',
    nameEn: 'Senegal',
    subdomain: 'sn',
    currency: 'XOF',
    currencySymbol: 'FCFA',
    currencyName: 'Franc CFA (BCEAO)',
    currencyDecimals: 0,
    language: 'fr',
    languages: ['fr', 'wo', 'pulaar'],
    defaultCity: 'Dakar',
    cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Ziguinchor', 'Kaolack', 'Tambacounda', 'Rufisque', 'Louga'],
    phoneCode: '+221',
    flag: '🇸🇳',
    timezone: 'Africa/Dakar',
    requiredDocuments: {
      terrain: [['titre_foncier'], ['concession', 'lettre_attribution']],
      bien_bati: [['titre_foncier', 'permis_construire']],
    },
    paymentProviders: [
      {
        provider: 'fedapay',
        active: true,
        methods: ['mobile_money', 'credit_card', 'bank_transfer'],
        config: { currency: 'XOF', country: 'SN' },
      },
      {
        provider: 'orange_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'SN' },
      },
      {
        provider: 'wave',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'SN' },
      },
      {
        provider: 'free_money',
        active: true,
        methods: ['mobile_money'],
        config: { currency: 'XOF', country: 'SN' },
      },
    ],
    taxConfig: {
      vatRate: 18,
      registrationTaxRate: 5,
      notaryFeeRate: 2.5,
      commissionRate: 3,
      withholdingTax: true,
      withholdingTaxRate: 5,
    },
    active: true,
  },
};

// ─── Public API ────────────────────────────────────────────────────────────────────

/**
 * Get the full tenant configuration for a country code.
 * Returns undefined for unsupported countries.
 */
export function getTenantConfig(countryCode: string): TenantConfig | undefined {
  return TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
}

/**
 * Get all active tenant configurations.
 */
export function getActiveTenants(): TenantConfig[] {
  return Object.values(TENANT_CONFIGS).filter((t) => t.active);
}

/**
 * Get all supported country codes.
 */
export function getSupportedCountryCodes(): SupportedCountry[] {
  return Object.keys(TENANT_CONFIGS) as SupportedCountry[];
}

/**
 * Map subdomain prefix to country code.
 * e.g., "bj" → "BJ", "ci" → "CI"
 */
export function subdomainToCountry(subdomain: string): SupportedCountry | null {
  const lower = subdomain.toLowerCase();
  for (const config of Object.values(TENANT_CONFIGS)) {
    if (config.subdomain === lower) {
      return config.code;
    }
  }
  return null;
}

/**
 * Map country code to subdomain prefix.
 * e.g., "BJ" → "bj"
 */
export function countryToSubdomain(countryCode: string): string | null {
  const config = TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
  return config?.subdomain ?? null;
}

/**
 * Get the default city for a country.
 */
export function getDefaultCity(countryCode: string): string {
  return TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry]?.defaultCity ?? 'Cotonou';
}

/**
 * Get the currency symbol for a country.
 */
export function getCurrencySymbol(countryCode: string): string {
  return TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry]?.currencySymbol ?? 'FCFA';
}

/**
 * Get active payment providers for a country.
 */
export function getActivePaymentProviders(countryCode: string): PaymentProviderConfig[] {
  const config = TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
  if (!config) return [];
  return config.paymentProviders.filter((p) => p.active);
}

/**
 * Validate that a country code is supported and active.
 */
export function isValidTenant(countryCode: string): boolean {
  const config = TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
  return config?.active ?? false;
}

/**
 * Format a price in the country's currency.
 */
export function formatPrice(amount: number, countryCode: string): string {
  const config = TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
  if (!config) return `${amount} FCFA`;

  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: config.currencyDecimals,
    maximumFractionDigits: config.currencyDecimals,
  });

  return `${formatted} ${config.currencySymbol}`;
}

/**
 * Format a date in the country's locale and timezone.
 */
export function formatDate(date: Date | string, countryCode: string): string {
  const config = TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleDateString('fr-FR', {
    timeZone: config?.timezone ?? 'UTC',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Get required legal documents for a property type in a country.
 */
export function getRequiredDocs(
  countryCode: string,
  propertyType: string
): string[][] {
  const config = TENANT_CONFIGS[countryCode.toUpperCase() as SupportedCountry];
  if (!config) return [['titre_foncier']];

  return config.requiredDocuments[propertyType] ?? config.requiredDocuments['terrain'] ?? [['titre_foncier']];
}

// Re-export for convenience
export { TENANT_CONFIGS };
