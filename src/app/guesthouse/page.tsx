'use client';

/**
 * Page /guesthouse — Guesthouses AfriBayit
 * Compact hero + GuesthouseModule
 */

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const GuesthouseModule = dynamic(() => import('@/components/afribayit/GuesthouseModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function GuesthousePage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <TransactionPageShell
      activeTab="sejour"
      hero={{
        badge: 'Guesthouses',
        title: 'Des guesthouses certifiées en Afrique de l\'Ouest',
        subtitle: 'Mini-établissements gérés par des propriétaires particuliers. Réservation à la chambre, petit-déjeuner optionnel, certification AfriBayit.',
        backgroundImage: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Guesthouses' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Chambres' },
          { value: 0, suffix: '+', label: 'Voyageurs' },
        ],
        ctaLabel: 'Voir les guesthouses',
        ctaHref: '#properties',
      }}
    >
      <div id="properties">
        <SafeModule>
          <GuesthouseModule onNavigate={onNavigate} />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
