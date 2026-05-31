'use client';

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';

type CountryCode = 'BJ' | 'CI' | 'BF' | 'TG';

interface CountryContextValue {
  selectedCountry: CountryCode;
  setSelectedCountry: (country: CountryCode) => void;
}

const CountryContext = createContext<CountryContextValue>({
  selectedCountry: 'BJ',
  setSelectedCountry: () => {},
});

const STORAGE_KEY = 'afribayit_selected_country';

const VALID_COUNTRIES: CountryCode[] = ['BJ', 'CI', 'BF', 'TG'];

function readStoredCountry(): CountryCode {
  if (typeof window === 'undefined') return 'BJ';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && VALID_COUNTRIES.includes(stored as CountryCode)) {
      return stored as CountryCode;
    }
  } catch {
    // localStorage may not be available
  }
  return 'BJ';
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
    return readStoredCountry();
  }, []);

  const getServerSnapshot = useCallback(() => 'BJ' as CountryCode, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const storedCountry = useStoredCountry();
  const [selectedCountry, setSelectedCountryState] = useState<CountryCode>(storedCountry);

  // Sync with localStorage changes on mount
  const [mounted, setMounted] = useState(false);
  // Using useSyncExternalStore already handles this, we just need a mount flag for hydration
  React.useEffect(() => {
    setMounted(true);
    const stored = readStoredCountry();
    if (stored !== selectedCountry) {
      setSelectedCountryState(stored);
    }
  }, []);

  const setSelectedCountry = useCallback((country: CountryCode) => {
    setSelectedCountryState(country);
    try {
      localStorage.setItem(STORAGE_KEY, country);
    } catch {
      // localStorage may not be available
    }
  }, []);

  // Avoid hydration mismatch by not rendering children until mounted
  if (!mounted) {
    return null;
  }

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}

export type { CountryCode };
