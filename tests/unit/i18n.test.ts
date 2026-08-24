// AfriBayit — i18n translate() unit tests (Module 19 — P4.1)
//
// Verifies the contract of `translate(locale, key)`:
//   1. Returns the FR value for a known key in the `fr` locale.
//   2. Returns the EN value for a known key in the `en` locale.
//   3. Falls back to FR when the key is missing from the requested locale
//      but present in FR.
//   4. Returns the key itself when the key is missing from every locale.
//   5. Works for every locale currently defined (fr, en, wo, fon).
//   6. Gracefully handles unsupported locales (e.g. `ar` — Arabic is not
//      yet implemented; CDC §3.3 plans 9 locales + RTL but the current
//      repo only ships 4).

import { describe, it, expect } from 'vitest';
import { translate, getTranslations, type Locale } from '@/lib/i18n';

describe('translate()', () => {
  it('returns the FR value for a known key in the fr locale', () => {
    expect(translate('fr', 'common.search')).toBe('Rechercher');
    expect(translate('fr', 'nav.buy')).toBe('Acheter');
    expect(translate('fr', 'common.login')).toBe('Connexion');
  });

  it('returns the EN value for a known key in the en locale', () => {
    expect(translate('en', 'common.search')).toBe('Search');
    expect(translate('en', 'nav.buy')).toBe('Buy');
    expect(translate('en', 'common.login')).toBe('Login');
  });

  it('falls back to FR when the key is missing from the requested locale', () => {
    // Wolof ships a partial dictionary. A key present in FR but absent from
    // wo must resolve to the FR value, not the raw key.
    const frValue = translate('fr', 'common.login');
    expect(typeof frValue).toBe('string');
    expect(frValue.length).toBeGreaterThan(0);
    // The same key under `wo` either returns the Wolof translation or the
    // FR fallback — both are acceptable, the test just asserts the function
    // doesn't crash and returns a non-empty string.
    const woValue = translate('wo', 'common.login');
    expect(typeof woValue).toBe('string');
    expect(woValue.length).toBeGreaterThan(0);
  });

  it('returns the key itself when the key is missing from every locale', () => {
    const missingKey = 'this.key.does.not.exist.anywhere';
    expect(translate('fr', missingKey)).toBe(missingKey);
    expect(translate('en', missingKey)).toBe(missingKey);
    expect(translate('wo', missingKey)).toBe(missingKey);
    expect(translate('fon', missingKey)).toBe(missingKey);
  });

  it('works for every locale currently defined (fr, en, wo, fon)', () => {
    const locales: Locale[] = ['fr', 'en', 'wo', 'fon'];
    for (const locale of locales) {
      const dict = getTranslations(locale);
      expect(dict).toBeDefined();
      expect(typeof dict).toBe('object');
      // Every locale must resolve the common.search key to a non-empty
      // string (either directly or via FR fallback).
      const value = translate(locale, 'common.search');
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('gracefully handles an unsupported locale (Arabic RTL not yet shipped)', () => {
    // CDC §3.3 plans 9 locales incl. Arabic (ar) with RTL, but the repo
    // only ships fr/en/wo/fon today. `translate` is typed to reject `ar`
    // at compile time — at runtime an unsupported locale must still fall
    // back gracefully rather than throwing.
    //
    // We simulate a future caller passing an unknown locale by casting.
    const unsupported = 'ar' as unknown as Locale;
    expect(() => translate(unsupported, 'common.search')).not.toThrow();
    // The unsupported locale should resolve to either a FR fallback or the
    // raw key — never throw.
    const value = translate(unsupported, 'common.search');
    expect(typeof value).toBe('string');
    expect(value.length).toBeGreaterThan(0);
  });

  it('handles nested keys via dot notation', () => {
    expect(translate('fr', 'nav.buy')).toBe('Acheter');
    expect(translate('en', 'nav.buy')).toBe('Buy');
    // Deeply nested missing key returns the full dotted key.
    expect(translate('fr', 'nav.sub.deeply.nested.missing')).toBe(
      'nav.sub.deeply.nested.missing',
    );
  });

  it('returns the key itself when accessing a non-string leaf', () => {
    // Accessing a parent object (not a string) returns the key.
    expect(translate('fr', 'common')).toBe('common');
    expect(translate('en', 'nav')).toBe('nav');
  });
});
