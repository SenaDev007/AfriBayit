// Unit tests for src/lib/app-url.ts — canonical app URL resolution.
//
// Context (production incident): NEXT_PUBLIC_APP_URL was set to
// https://afri-bayit.vercel.app/ (a DELETED deployment, with a trailing
// slash) while the live site runs on https://afribayit.vercel.app — every
// sitemap URL and payment webhook callback built from the env var was dead.
// getAppBaseUrl() resolves the REAL request origin at runtime and only
// falls back to configured values outside a request scope.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type AppUrlModule = typeof import('@/lib/app-url');

async function importAppUrl(appUrl: string | undefined, vercelUrl?: string) {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (appUrl !== undefined) vi.stubEnv('NEXT_PUBLIC_APP_URL', appUrl);
  if (vercelUrl !== undefined) vi.stubEnv('VERCEL_URL', vercelUrl);
  return import('@/lib/app-url');
}

// headers() from next/headers throws outside a Next.js request scope —
// exactly what happens in unit tests, so the fallback chain is exercised.
vi.mock('next/headers', () => ({
  headers: async () => {
    throw new Error('headers was called outside a request scope');
  },
}));

describe('normalizeBaseUrl', () => {
  it('strips trailing slashes and trims whitespace', async () => {
    const { normalizeBaseUrl } = await importAppUrl(undefined);
    expect(normalizeBaseUrl('https://afri-bayit.vercel.app/')).toBe(
      'https://afri-bayit.vercel.app',
    );
    expect(normalizeBaseUrl('  https://afribayit.vercel.app///  ')).toBe(
      'https://afribayit.vercel.app',
    );
    expect(normalizeBaseUrl(undefined)).toBe('');
    expect(normalizeBaseUrl(null)).toBe('');
  });
});

describe('getAppBaseUrl (no request scope → fallback chain)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers NEXT_PUBLIC_APP_URL (normalized) when set', async () => {
    const { getAppBaseUrl } = await importAppUrl('https://afri-bayit.vercel.app/');
    expect(await getAppBaseUrl()).toBe('https://afri-bayit.vercel.app');
  });

  it('falls back to VERCEL_URL when NEXT_PUBLIC_APP_URL is unset', async () => {
    const { getAppBaseUrl } = await importAppUrl('', 'afribayit-abc123.vercel.app');
    expect(await getAppBaseUrl()).toBe('https://afribayit-abc123.vercel.app');
  });

  it('defaults to local development origin', async () => {
    const { getAppBaseUrl } = await importAppUrl('');
    expect(await getAppBaseUrl()).toBe('http://localhost:3000');
  });
});
