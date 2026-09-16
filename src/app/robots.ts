// AfriBayit — Dynamic robots.txt (P3.4)
// Generates /robots.txt — replaces the static public/robots.txt
// Reference: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import { MetadataRoute } from 'next';
import { getAppBaseUrl } from '@/lib/app-url';

// Runtime request origin with NEXT_PUBLIC_APP_URL fallback — a stale
// dashboard value pointing at a deleted deployment must not advertise a
// dead sitemap host to crawlers.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const BASE_URL = await getAppBaseUrl();
  return {
    rules: [
      {
        // Allow all crawlers to access public pages
        userAgent: '*',
        allow: [
          '/',
          '/search',
          '/property/',
          '/academy/',
          '/pro/',
          '/artisans',
          '/sejours',
          '/short-term',
          '/hotel-dashboard',
          '/community',
          '/notary',
          '/geotrust',
          '/financing',
          '/our-work',
          '/terms',
          '/privacy',
        ],
        disallow: [
          // Private/authenticated areas
          '/dashboard/',
          '/admin/',
          '/api/',
          '/wallet',
          '/escrow',
          '/settings',
          '/profile',
          '/kyc',
          '/agent-dashboard',
          '/notary-dashboard',
          '/subscriptions',
          '/ambassador',
          '/publish',
          '/booking/',
          '/delete-data',
          '/auth/login',
          '/auth/register',
          '/auth/complete-profile',
        ],
      },
      {
        // Block AI scrapers from API and admin
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
