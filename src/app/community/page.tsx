'use client';

/**
 * /community — AfriBayit Connect, l'espace communautaire « Discord-like ».
 *
 * Refonte 2026-09 : la page EST l'application (rail espaces + canaux +
 * messages + membres) — plus de hero marketing, la fenêtre occupe tout
 * le viewport sous la navbar fixe, comme un vrai client de messagerie.
 */

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';

// -mt-16 : l'app glisse sous le header, transparent au sommet de la
// page (voir HERO_OVERLAY_ROUTES dans header-3.tsx).
const CommunityModule = dynamic(() => import('@/components/afribayit/CommunityModule'), {
  loading: () => (
    <div className="-mt-16 pt-16 sm:pt-[72px] h-screen flex items-center justify-center bg-[#060D1A]">
      <div className="animate-spin w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full" />
    </div>
  ),
});

export default function CommunityPage() {
  return (
    <main className="-mt-16 pt-16 sm:pt-[72px] bg-[#060D1A]">
      <SafeModule>
        <CommunityModule />
      </SafeModule>
    </main>
  );
}
