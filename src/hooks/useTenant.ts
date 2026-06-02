'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  getTenantConfig,
  getActiveTenants,
  getSupportedCountryCodes,
  formatPrice as _formatPrice,
  formatDate as _formatDate,
  type TenantConfig,
  type SupportedCountry,
} from '@/lib/tenant/config';

// ─── Constants ─────────────────────────────────────────────────────────────────────

const COOKIE_NAME = 'afribayit_country';
const LOCAL_STORAGE_KEY = 'afribayit_selected_country';

// ─── Types ─────────────────────────────────────────────────────────────────────────

export interface UseTenantReturn {
  /** Current country code (e.g., "BJ") */
  countryCode: SupportedCountry;
  /** Current tenant configuration */
  config: TenantConfig;
  /** Set the current tenant/country */
  setCountry: (code: SupportedCountry) => void;
  /** Format a price in the tenant's currency */
  formatPrice: (amount: number) => string;
  /** Format a date in the tenant's locale and timezone */
  formatDate: (date: Date | string) => string;
  /** Get the currency symbol */
  currencySymbol: string;
  /** Get the default city */
  defaultCity: string;
  /** Get the list of cities for the current tenant */
  cities: string[];
  /** Get the tenant's flag emoji */
  flag: string;
  /** Get the tenant's language */
  language: string;
  /** Get the tenant's name in French */
  countryName: string;
  /** Get the subdomain for the current tenant */
  subdomain: string;
  /** All active tenant configurations */
  allTenants: TenantConfig[];
  /** All supported country codes */
  supportedCountries: SupportedCountry[];
  /** Whether a given country code is valid */
  isValidCountry: (code: string) => boolean;
  /** Get the tenant URL for a country code (e.g., https://bj.afribayit.com) */
  getTenantUrl: (code: SupportedCountry) => string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────────

function readCountryFromCookie(): SupportedCountry | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([A-Z]{2})`));
  if (match && isValidSupportedCountry(match[1])) {
    return match[1] as SupportedCountry;
  }
  return null;
}

function readCountryFromStorage(): SupportedCountry | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored && isValidSupportedCountry(stored)) {
      return stored as SupportedCountry;
    }
  } catch {
    // localStorage may not be available
  }
  return null;
}

function isValidSupportedCountry(code: string): boolean {
  return getSupportedCountryCodes().includes(code as SupportedCountry);
}

function setCountryCookie(code: SupportedCountry): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${
    process.env.NODE_ENV === 'production' ? '; secure' : ''
  }`;
}

function setCountryStorage(code: SupportedCountry): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, code);
  } catch {
    // localStorage may not be available
  }
}

function detectCountryFromHostname(): SupportedCountry | null {
  if (typeof window === 'undefined') return null;
  const hostname = window.location.hostname;

  // Check subdomain pattern
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    const configs = getActiveTenants();
    const match = configs.find((c) => c.subdomain === subdomain);
    if (match) return match.code;
  }

  // Check localhost subdomain (e.g., bj.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    const subdomain = parts[0].toLowerCase();
    const configs = getActiveTenants();
    const match = configs.find((c) => c.subdomain === subdomain);
    if (match) return match.code;
  }

  return null;
}

function detectCountryFromQuery(): SupportedCountry | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const country = params.get('country');
  if (country && isValidSupportedCountry(country.toUpperCase())) {
    return country.toUpperCase() as SupportedCountry;
  }
  return null;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────────

/**
 * React hook for tenant/country context.
 *
 * Reads the current tenant from:
 * 1. URL query param (?country=BJ) — for testing
 * 2. Subdomain (bj.afribayit.com) — for production
 * 3. Cookie (afribayit_country) — set by middleware
 * 4. localStorage (afribayit_selected_country) — legacy fallback
 * 5. Defaults to "BJ"
 *
 * Provides country-specific formatting and configuration.
 *
 * @example
 * function MyComponent() {
 *   const { countryCode, formatPrice, flag, countryName, cities } = useTenant();
 *   return (
 *     <div>
 *       <h1>{flag} {countryName}</h1>
 *       <p>Price: {formatPrice(5000000)}</p>
 *       <select>
 *         {cities.map(city => <option key={city}>{city}</option>)}
 *       </select>
 *     </div>
 *   );
 * }
 */
function detectInitialCountry(): SupportedCountry {
  if (typeof window === 'undefined') return 'BJ';
  return (
    detectCountryFromQuery() ||
    detectCountryFromHostname() ||
    readCountryFromCookie() ||
    readCountryFromStorage() ||
    'BJ'
  );
}

export function useTenant(): UseTenantReturn {
  const [countryCode, setCountryCodeState] = useState<SupportedCountry>(detectInitialCountry);

  // Set country and persist
  const setCountry = useCallback((code: SupportedCountry) => {
    setCountryCodeState(code);
    setCountryCookie(code);
    setCountryStorage(code);
  }, []);

  // Get tenant config
  const config = useMemo(() => {
    return getTenantConfig(countryCode) ?? getTenantConfig('BJ')!;
  }, [countryCode]);

  // Format price in tenant's currency
  const formatPrice = useCallback(
    (amount: number) => _formatPrice(amount, countryCode),
    [countryCode]
  );

  // Format date in tenant's locale
  const formatDate = useCallback(
    (date: Date | string) => _formatDate(date, countryCode),
    [countryCode]
  );

  // All active tenants
  const allTenants = useMemo(() => getActiveTenants(), []);

  // All supported country codes
  const supportedCountries = useMemo(() => getSupportedCountryCodes(), []);

  // Validate country code
  const isValidCountry = useCallback((code: string) => isValidSupportedCountry(code), []);

  // Get tenant URL for a country code
  const getTenantUrl = useCallback((code: SupportedCountry): string => {
    if (typeof window === 'undefined') return '';

    const targetConfig = getTenantConfig(code);
    if (!targetConfig) return window.location.origin;

    const hostname = window.location.hostname;

    // Localhost: use bj.localhost:3000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const port = window.location.port;
      return `http://${targetConfig.subdomain}.localhost${port ? `:${port}` : ''}`;
    }

    // Production: use bj.afribayit.com
    const rootDomain = hostname.replace(/^[^.]+\./, '');
    return `https://${targetConfig.subdomain}.${rootDomain}`;
  }, []);

  return {
    countryCode,
    config,
    setCountry,
    formatPrice,
    formatDate,
    currencySymbol: config.currencySymbol,
    defaultCity: config.defaultCity,
    cities: config.cities,
    flag: config.flag,
    language: config.language,
    countryName: config.name,
    subdomain: config.subdomain,
    allTenants,
    supportedCountries,
    isValidCountry,
    getTenantUrl,
  };
}
