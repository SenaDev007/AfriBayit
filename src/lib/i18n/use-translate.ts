'use client';

/**
 * AfriBayit — Simple i18n hook for Client Components
 *
 * Usage:
 *   const { t, locale } = useTranslation();
 *   <h1>{t('hero.title', 'Où l\'Afrique trouve sa maison')}</h1>
 *
 * The fallback string is returned if the key is missing — keeping the
 * original French copy visible even when a locale is not yet translated.
 *
 * For Server Components, do NOT use this hook (it relies on React context).
 * Keep hardcoded strings and document them in the worklog.
 *
 * Module 3: expanded to all 9 locales (fr, en, ar, sw, ha, wo, am, ln, fon).
 */
import { useLocale } from '@/lib/i18n/context';
import { fr } from '@/lib/i18n/locales/fr';
import { en } from '@/lib/i18n/locales/en';
import { ar } from '@/lib/i18n/locales/ar';
import { sw } from '@/lib/i18n/locales/sw';
import { ha } from '@/lib/i18n/locales/ha';
import { wo } from '@/lib/i18n/locales/wo';
import { am } from '@/lib/i18n/locales/am';
import { ln } from '@/lib/i18n/locales/ln';
import { fon } from '@/lib/i18n/locales/fon';

const translations: Record<string, Record<string, any>> = {
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

export function useTranslation() {
  const { locale } = useLocale();
  const dict = translations[locale] || translations.fr;

  const t = (path: string, fallback?: string): string => {
    const keys = path.split('.');
    let value: any = dict;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) break;
    }
    if (typeof value === 'string') return value;
    // Try French fallback if current locale is missing the key
    if (locale !== 'fr') {
      let frValue: any = translations.fr;
      for (const key of keys) {
        frValue = frValue?.[key];
        if (frValue === undefined) break;
      }
      if (typeof frValue === 'string') return frValue;
    }
    return fallback ?? path;
  };

  return { t, locale };
}
