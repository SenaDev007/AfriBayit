/**
 * AfriBayit — i18n Utility
 * Internationalization utility with dot-notation access
 */

import { fr } from './locales/fr';
import { en } from './locales/en';
import { wo } from './locales/wo';
import { fon } from './locales/fon';

export type Locale = 'fr' | 'en' | 'wo' | 'fon';

export const LOCALES: Record<Locale, { label: string; flag: string }> = {
  fr: { label: 'Français', flag: '🇫🇷' },
  en: { label: 'English', flag: '🇬🇧' },
  wo: { label: 'Wolof', flag: '🇸🇳' },
  fon: { label: 'Fon', flag: '🇧🇯' },
};

// Primary translations use the full FR type; local languages may have fewer keys
export const translations: Record<string, Record<string, any>> = { fr, en, wo, fon };

/**
 * Get translations for a specific locale.
 * Falls back to French if the locale is not found.
 */
export function getTranslations(locale: Locale): typeof fr {
  return translations[locale] || translations.fr;
}

/**
 * Access a nested translation value using dot notation.
 * Example: t('nav.buy') => 'Acheter' (in French)
 * Falls back to the key itself if not found.
 */
export function translate(locale: Locale, key: string): string {
  const dict = getTranslations(locale);
  const keys = key.split('.');
  let result: unknown = dict;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      // Fallback: try French
      if (locale !== 'fr') {
        return translate('fr', key);
      }
      return key; // Fallback to key
    }
  }

  return typeof result === 'string' ? result : key;
}

export { fr, en } from './locales/fr';
export { wo } from './locales/wo';
export { fon } from './locales/fon';
export { local } from './locales/local';
export type { Translations } from './locales/fr';
