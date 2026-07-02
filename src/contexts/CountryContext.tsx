'use client';

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';

type CountryCode = 'BJ' | 'CI' | 'BF' | 'TG' | 'SN';

interface CountryContextValue {
  selectedCountry: CountryCode;
  setSelectedCountry: (country: CountryCode) => void;
}

const CountryContext = createContext<CountryContextValue>({
  selectedCountry: 'BJ',
  setSelectedCountry: () => {},
});

const STORAGE_KEY = 'afribayit_selected_country';
const COOKIE_KEY = 'afribayit_country';

const VALID_COUNTRIES: CountryCode[] = ['BJ', 'CI', 'BF', 'TG'];

// Subdomain-to-country mapping (must match middleware.ts)
const SUBDOMAIN_COUNTRY_MAP: Record<string, CountryCode> = {
  bj: 'BJ', // Bénin
  ci: 'CI', // Côte d'Ivoire
  bf: 'BF', // Burkina Faso
  tg: 'TG', // Togo
  sn: 'SN', // Sénégal (future — not in VALID_COUNTRIES yet)
};

/**
 * Detect country from the subdomain of the current hostname.
 * Priority: subdomain > URL param > cookie > localStorage > default
 */
function detectCountryFromSubdomain(): CountryCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      const subdomain = parts[0].toLowerCase();
      const country = SUBDOMAIN_COUNTRY_MAP[subdomain];
      if (country && VALID_COUNTRIES.includes(country)) {
        return country;
      }
    }
  } catch {
    // hostname not available
  }
  return null;
}

/**
 * Detect country from URL ?country= parameter.
 */
function detectCountryFromURL(): CountryCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const countryParam = params.get('country');
    if (countryParam) {
      const upper = countryParam.toUpperCase();
      if (VALID_COUNTRIES.includes(upper as CountryCode)) {
        return upper as CountryCode;
      }
    }
  } catch {
    // URL not available
  }
  return null;
}

/**
 * Read country from cookie set by middleware.
 */
function readCookieCountry(): CountryCode | null {
  if (typeof document === 'undefined') return null;
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === COOKIE_KEY && value && VALID_COUNTRIES.includes(value as CountryCode)) {
        return value as CountryCode;
      }
    }
  } catch {
    // document not available
  }
  return null;
}

/**
 * Read country from localStorage.
 */
function readStoredCountry(): CountryCode | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_COUNTRIES.includes(stored as CountryCode)) {
      return stored as CountryCode;
    }
  } catch {
    // localStorage may not be available
  }
  return null;
}

/**
 * Detect country with full priority chain:
 * 1. Subdomain (e.g., bj.afri-bayit.vercel.app)
 * 2. URL parameter ?country=BJ
 * 3. Cookie afribayit_country (set by middleware)
 * 4. localStorage afribayit_selected_country
 * 5. Default: BJ (Bénin)
 */
function detectCountry(): CountryCode {
  return (
    detectCountryFromSubdomain() ||
    detectCountryFromURL() ||
    readCookieCountry() ||
    readStoredCountry() ||
    'BJ'
  );
}

/**
 * Set the country cookie so middleware can read it on subsequent requests.
 */
function setCountryCookie(country: CountryCode): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${COOKIE_KEY}=${country};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
  } catch {
    // document not available
  }
}

/**
 * Set the country in localStorage for persistence.
 */
function setCountryStorage(country: CountryCode): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, country);
  } catch {
    // localStorage may not be available
  }
}

// useSyncExternalStore to safely read from localStorage without effect-based setState
function useStoredCountry() {
  const subscribe = useCallback((callback: () => void) => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) callback();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const getSnapshot = useCallback(() => {
    return detectCountry();
  }, []);

  const getServerSnapshot = useCallback(() => 'BJ' as CountryCode, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const storedCountry = useStoredCountry();
  const [selectedCountry, setSelectedCountryState] = useState<CountryCode>('BJ');

  // Sync with detected country after mount to avoid hydration mismatch
  React.useEffect(() => {
    const detected = detectCountry();
    if (detected !== selectedCountry) {
      setSelectedCountryState(detected);
    }
  }, []);

  // Also sync when storedCountry changes (from useSyncExternalStore)
  React.useEffect(() => {
    if (storedCountry !== selectedCountry) {
      setSelectedCountryState(storedCountry);
    }
  }, [storedCountry, selectedCountry]);

  const setSelectedCountry = useCallback((country: CountryCode) => {
    setSelectedCountryState(country);
    // Persist to both cookie (for middleware) and localStorage (for client)
    setCountryCookie(country);
    setCountryStorage(country);
  }, []);

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    // Return safe defaults instead of throwing when used outside provider
    return { selectedCountry: 'BJ' as CountryCode, setSelectedCountry: () => {} };
  }
  return context;
}

export type { CountryCode };
