'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const EscrowFlow = dynamic(() => import('@/components/afribayit/EscrowFlow'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function EscrowPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Escrow Sécurisé',
        title: 'Transactions immobilières 100% sécurisées',
        subtitle: 'Fonds protégés sur compte séquestre jusqu\'à signature notariale. Zéro risque de fraude, libération conditionnelle, traçabilité complète.',
        backgroundImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Transactions' },
          { value: 0, suffix: '%', label: 'Sécurité' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Libérations' },
        ],
        ctaLabel: 'Voir les transactions',
        ctaHref: '#escrow',
      }}
    >
      <div id="escrow">
        <SafeModule>
          <EscrowFlow onNavigate={onNavigate} />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
