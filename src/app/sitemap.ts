// AfriBayit — Dynamic Sitemap (P3.4)
// Generates /sitemap.xml — fetches dynamic URLs from backend API

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://afribayit.com';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

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
    { path: 'hospitality', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: 'guesthouse', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: 'short-term', priority: 0.6, changeFrequency: 'daily' as const },
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

  // 2. Dynamic property pages — fetch from backend API
  try {
    const res = await fetch(`${API_URL}/properties?limit=5000`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      const properties = data.properties || data || [];
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
  } catch {
    // API not available — skip dynamic entries
  }

  // 3. Academy courses — fetch from backend API
  try {
    const res = await fetch(`${API_URL}/academy/courses?limit=500`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const courses = await res.json();
      for (const c of courses) {
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
  } catch {
    // API not available
  }

  return entries;
}
