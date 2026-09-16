// AfriBayit — Server-side canonical app URL resolution.
//
// Production incident class: stale Vercel dashboard env vars. Examples seen
// live: NEXT_PUBLIC_APP_URL pointing at a DELETED deployment
// (https://afri-bayit.vercel.app/ while the site lives on
// https://afribayit.vercel.app), and NEXT_PUBLIC_API_URL pointing at the
// removed Railway backend. Any URL built from a stale var is dead on arrival
// — payment webhooks never arrive (escrow never funded), sitemap entries
// 404, OAuth redirects break.
//
// This helper resolves the REAL request origin at runtime instead:
//   1. x-forwarded-host / x-forwarded-proto (accurate on Vercel, behind any
//      proxy, and respects custom domains) — available in every request
//      scope (route handlers, server components, metadata routes).
//   2. NEXT_PUBLIC_APP_URL (normalized: no trailing slash) — fallback when
//      no request scope exists (e.g. build-time evaluation).
//   3. VERCEL_URL — Vercel deployment origin.
//   4. http://localhost:3000 — local development.

import { headers } from 'next/headers';

/** Trim + strip trailing slashes from a base URL. */
export function normalizeBaseUrl(raw: string | undefined | null): string {
  return (raw || '').trim().replace(/\/+$/, '');
}

/**
 * Canonical app base URL (no trailing slash) for building absolute URLs
 * server-side: webhook callbacks, redirect URLs, sitemap entries, robots.
 */
export async function getAppBaseUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') || h.get('host');
    if (host) {
      const proto =
        h.get('x-forwarded-proto') ||
        (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  } catch {
    // No request scope (build-time / standalone script) — fall through to
    // the configured values.
  }
  const configured = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}
