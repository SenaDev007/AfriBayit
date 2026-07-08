'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const NotaryModule = dynamic(() => import('@/components/afribayit/NotaryModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function NotaryPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Espace Notarial',
        title: 'Notaires certifiés pour vos transactions immobilières',
        subtitle: 'Assistance notariale pour transactions sécurisées. Génération d\'actes, signatures électroniques et conformité juridique dans 4 pays.',
        backgroundImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Notaires' },
          { value: 0, suffix: '', label: 'Pays' },
          { value: 0, suffix: '+', label: 'Actes' },
          { value: 0, suffix: '%', label: 'Conformité' },
        ],
        ctaLabel: 'Voir les notaires',
        ctaHref: '#notary',
      }}
    >
      <div id="notary">
        <SafeModule>
          <NotaryModule onNavigate={onNavigate} />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
