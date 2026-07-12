'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /short-term — Redirige vers /sejours (page unifiée des séjours)
 *
 * La page /short-term a été fusionnée avec /sejours qui contient maintenant
 * 3 types de séjours : Hôtels, Guesthouses et Locations courte durée.
 * Cette page redirige automatiquement vers /sejours.
 */
export default function ShortTermRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/sejours');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">Redirection vers la page Séjours...</p>
      </div>
    </div>
  );
}
