// AfriBayit — Dynamic Sitemap (P3.4)
// Generates /sitemap.xml listing all public property/agent/academy pages
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://afribayit.com';

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

  // 2. Dynamic property pages
  try {
    const properties = await db.property.findMany({
      where: { status: 'published' },
      select: { id: true, updatedAt: true },
      take: 5000, // sitemap.xml limit safety
    });
    for (const p of properties) {
      entries.push({
        url: `${BASE_URL}/property/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  } catch {
    // DB not available — skip dynamic entries
  }

  // 3. Academy courses
  try {
    const courses = await db.course.findMany({
      where: { status: 'published' },
      select: { id: true, updatedAt: true },
      take: 500,
    });
    for (const c of courses) {
      entries.push({
        url: `${BASE_URL}/academy/${c.id}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch {
    // DB not available
  }

  // 4. Professional profiles
  try {
    const profiles = await db.professionalProfile.findMany({
      where: { isPublic: true },
      select: { slug: true, updatedAt: true },
      take: 1000,
    });
    for (const p of profiles) {
      entries.push({
        url: `${BASE_URL}/pro/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  } catch {
    // DB not available
  }

  return entries;
}
