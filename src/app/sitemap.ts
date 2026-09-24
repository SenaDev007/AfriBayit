// AfriBayit — Dynamic Sitemap (P3.4)
// Generates /sitemap.xml — fetches dynamic URLs from backend API

import { MetadataRoute } from 'next';
import { getAppBaseUrl } from '@/lib/app-url';

// Normalize API URL — ensure protocol, no trailing slash. Empty when the
// legacy NEXT_PUBLIC_API_URL split-backend variable is unset (monolith).
function normalizeApiUrl(raw: string | undefined): string {
  const url = (raw || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`.replace(/\/+$/, '');
  }
  return url.replace(/\/+$/, '');
}
const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

/**
 * Fetch JSON from the backend with same-origin fallback (ADR 0001 monolith).
 * Candidates, in order:
 * 1. Legacy split backend (NEXT_PUBLIC_API_URL) — serves routes WITHOUT the
 *    /api prefix (old Railway convention). A stale value pointing at a
 *    removed host simply fails and we move on.
 * 2. Same-origin monolith — routes under /api/* (base via getAppBaseUrl()).
 * Returns null when every candidate fails — sitemap degrades to static
 * entries only, exactly like the previous try/catch behavior.
 */
async function fetchApiJson(path: string, revalidate = 3600): Promise<unknown> {
  const candidates: string[] = [];
  if (API_URL) {
    candidates.push(`${API_URL}${path}`);
  }
  candidates.push(`${await getAppBaseUrl()}/api${path}`);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { next: { revalidate } });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Candidate failed — try the next one.
    }
  }
  return null;
}

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const BASE_URL = await getAppBaseUrl();

  // 1. Static pages
  const staticPages = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: 'search', priority: 0.9, changeFrequency: 'hourly' as const },
    { path: 'auth/login', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'auth/register', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: 'publish', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: 'dashboard', priority: 0.6, changeFrequency: 'daily' as const },
    { path: 'wallet', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: 'escrow', priority: 0.5, changeFrequency: 'weekly' as const },
    { path: 'notary', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: 'geotrust', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: 'academy', priority: 0.7, changeFrequency: 'daily' as const },
    { path: 'artisans', priority: 0.7, changeFrequency: 'daily' as const },
    { path: 'community', priority: 0.6, changeFrequency: 'hourly' as const },
    // Audit Manus (P0): /hospitality, /guesthouse and /short-term are
    // server-side redirects to the canonical /sejours page — redirecting
    // URLs are excluded from the sitemap (no duplicate content, every
    // sitemap entry now resolves to a real page).
    { path: 'sejours', priority: 0.7, changeFrequency: 'daily' as const },
    { path: 'financing', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: 'ambassador', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: 'subscriptions', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: 'our-work', priority: 0.4, changeFrequency: 'monthly' as const },
    { path: 'terms', priority: 0.3, changeFrequency: 'yearly' as const },
    { path: 'privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}/${page.path}`.replace(/\/$/, ''),
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // 2. Dynamic property pages — fetch from backend API (with same-origin
  //    fallback so a stale NEXT_PUBLIC_API_URL cannot silently empty the
  //    sitemap in production).
  const propertiesData = (await fetchApiJson('/properties?limit=5000')) as
    | { properties?: Array<{ id: string; updatedAt?: string }> }
    | Array<{ id: string; updatedAt?: string }>
    | null;
  if (propertiesData) {
    const properties = Array.isArray(propertiesData)
      ? propertiesData
      : (propertiesData.properties || []);
    for (const p of properties) {
      if (p.id) {
        entries.push({
          url: `${BASE_URL}/property/${p.id}`,
          lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  }

  // 3. Academy courses — fetch from backend API (same-origin fallback)
  const coursesData = (await fetchApiJson('/academy/courses?limit=500')) as
    | Array<{ id: string; updatedAt?: string }>
    | null;
  if (coursesData) {
    for (const c of coursesData) {
      if (c.id) {
        entries.push({
          url: `${BASE_URL}/academy/${c.id}`,
          lastModified: c.updatedAt ? new Date(c.updatedAt) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }
    }
  }

  return entries;
}
