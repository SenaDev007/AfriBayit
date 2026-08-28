/**
 * AfriBayit — i18n Utility
 * Internationalization utility with dot-notation access
 *
 * Module 3: expanded to 9 locales — French, English, Arabic (RTL), Swahili,
 * Hausa, Wolof, Amharic, Lingala, Fon. Each locale is loaded eagerly so
 * language switching is instant (no async loading flicker).
 */

import { fr } from './locales/fr';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { sw } from './locales/sw';
import { ha } from './locales/ha';
import { wo } from './locales/wo';
import { am } from './locales/am';
import { ln } from './locales/ln';
import { fon } from './locales/fon';

export type Locale = 'fr' | 'en' | 'ar' | 'sw' | 'ha' | 'wo' | 'am' | 'ln' | 'fon';

export interface LocaleMeta {
  label: string;
  flag: string;
  /** RTL languages set `document.documentElement.dir = 'rtl'`. */
  rtl?: boolean;
}

export const LOCALES: Record<Locale, LocaleMeta> = {
  fr: { label: 'Français', flag: '🇫🇷' },
  en: { label: 'English', flag: '🇬🇧' },
  ar: { label: 'العربية (alpha)', flag: '🇸🇦', rtl: true },
  sw: { label: 'Kiswahili (alpha)', flag: '🇰🇪' },
  ha: { label: 'Hausa (alpha)', flag: '🇳🇬' },
  wo: { label: 'Wolof', flag: '🇸🇳' },
  am: { label: 'አማርኛ (alpha)', flag: '🇪🇹' },
  ln: { label: 'Lingala (alpha)', flag: '🇨🇩' },
  fon: { label: 'Fon', flag: '🇧🇯' },
};

// Primary translations use the full FR type; local languages may have fewer keys
export const translations: Record<string, Record<string, any>> = {
  fr,
  en,
  ar,
  sw,
  ha,
  wo,
  am,
  ln,
  fon,
};

/**
 * Get translations for a specific locale.
 * Falls back to French if the locale is not found.
 */
export function getTranslations(locale: Locale): Record<string, any> {
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

export { fr } from './locales/fr';
export { en } from './locales/en';
export { ar } from './locales/ar';
export { sw } from './locales/sw';
export { ha } from './locales/ha';
export { wo } from './locales/wo';
export { am } from './locales/am';
export { ln } from './locales/ln';
export { fon } from './locales/fon';
export { local } from './locales/local';
