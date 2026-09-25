'use client';

/**
 * /academy — AfriBayit Academy, l'école virtuelle de l'immobilier.
 *
 * Refonte 2026-09 : la page EST le campus (bandeau école + navigation
 * structurée : tableau de bord, filières, facultés, catalogue,
 * certifications) — plus de hero marketing générique.
 */

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';

const AcademyModule = dynamic(() => import('@/components/afribayit/AcademyModule'), {
  loading: () => (
    <div className="pt-16 sm:pt-[72px] flex items-center justify-center min-h-screen bg-cream">
      <div className="animate-spin w-8 h-8 border-4 border-primary-deep border-t-transparent rounded-full" />
    </div>
  ),
});

export default function AcademyPage() {
  return (
    <main className="pt-16 sm:pt-[72px]">
      <SafeModule>
        <AcademyModule />
      </SafeModule>
    </main>
  );
}
