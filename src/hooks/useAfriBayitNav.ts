'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Hook that converts Next.js router navigation into the onNavigate callback
 * format used by AfriBayit components.
 */
export function useAfriBayitNav() {
  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = useCallback((section: string) => {
    const routeMap: Record<string, string> = {
      'home': '/',
      'search': '/search',
      'search-rent': '/search?tab=location',
      'search-invest': '/search?tab=investissement',
      'property': '/search',
      'dashboard': '/dashboard',
      'agent-dashboard': '/agent-dashboard',
      'artisans': '/artisans',
      'geotrust': '/geotrust',
      'escrow': '/escrow',
      'hospitality': '/sejours',
      'academy': '/academy',
      'community': '/community',
      'analytics': '/analytics',
      'notary': '/notary',
      'guesthouse': '/sejours',
      'wallet': '/wallet',
      'profile': '/profile',
      'subscriptions': '/subscriptions',
      'publish': '/publish',
      'booking': '/sejours',
    };

    const path = routeMap[section] || '/';
    router.push(path);
  }, [router]);

  const onSelectProperty = useCallback((id: string) => {
    router.push(`/property/${id}`);
  }, [router]);

  const onBack = useCallback(() => {
    router.back();
  }, [router]);

  // Map pathname to activeSection for Navbar
  const getActiveSection = useCallback((): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/search')) return 'search';
    if (pathname.startsWith('/property/')) return 'property';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/agent-dashboard')) return 'agent-dashboard';
    if (pathname.startsWith('/artisans')) return 'artisans';
    if (pathname.startsWith('/geotrust')) return 'geotrust';
    if (pathname.startsWith('/escrow')) return 'escrow';
    if (pathname.startsWith('/hospitality') || pathname.startsWith('/sejours')) return 'sejours';
    if (pathname.startsWith('/academy')) return 'academy';
    if (pathname.startsWith('/community')) return 'community';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/notary')) return 'notary';
    if (pathname.startsWith('/booking') || pathname.startsWith('/sejours')) return 'sejours';
    if (pathname.startsWith('/guesthouse') || pathname.startsWith('/sejours')) return 'sejours';
    if (pathname.startsWith('/wallet')) return 'wallet';
    if (pathname.startsWith('/profile')) return 'profile';
    if (pathname.startsWith('/subscriptions')) return 'subscriptions';
    if (pathname.startsWith('/publish')) return 'publish';
    return 'home';
  }, [pathname]);

  return { onNavigate, onSelectProperty, onBack, getActiveSection, pathname };
}
