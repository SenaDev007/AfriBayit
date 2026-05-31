'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Locale } from './index';
import { getTranslations } from './index';
import type { Translations } from './locales/fr';

// ============ Context ============

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
  translate: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'fr',
  setLocale: () => {},
  t: getTranslations('fr'),
  translate: (key: string) => key,
});

const LOCALE_STORAGE_KEY = 'afribayit_locale';
const VALID_LOCALES: Locale[] = ['fr', 'en'];

// ============ Provider ============

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Initialize with French, will sync from storage in effect
  const [locale, setLocaleState] = useState<Locale>('fr');

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage not available
    }
  }, []);

  // Read from localStorage on mount using a callback-based approach
  // This avoids accessing refs during render
  const [mounted, setMounted] = useState(false);

  // Use lazy initializer to read locale from localStorage
  // This avoids the need for effects/refs during render
  const [initLocale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'fr';
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && VALID_LOCALES.includes(stored as Locale)) {
        return stored as Locale;
      }
    } catch {
      // localStorage may not be available
    }
    return 'fr';
  });

  // Use initLocale once mounted
  const effectiveLocale = mounted ? locale : initLocale;

  const t = getTranslations(effectiveLocale);

  const translate = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: unknown = t;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof result === 'string' ? result : key;
  }, [t]);

  // Mount effect - only runs once, uses callback pattern
  React.useEffect(() => {
    const stored = readStoredLocale();
    if (stored !== 'fr') {
      setLocaleState(stored);
    }
    setMounted(true);
  }, []);

  return (
    <LocaleContext.Provider value={{ locale: effectiveLocale, setLocale, t, translate }}>
      {children}
    </LocaleContext.Provider>
  );
}

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && VALID_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // localStorage may not be available
  }
  return 'fr';
}

// ============ Hook ============

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

export { LocaleContext };
