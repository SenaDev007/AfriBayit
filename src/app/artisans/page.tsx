'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const ArtisansMarketplace = dynamic(() => import('@/components/afribayit/ArtisansMarketplace'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function ArtisansPage() {
  const { onSelectProperty } = useAfriBayitNav();

  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Artisans BTP',
        title: 'Trouvez des artisans certifiés en Afrique de l\'Ouest',
        subtitle: 'Maçons, électriciens, plombiers, peintres et plus. Marketplace d\'artisans BTP vérifiés avec mise en relation automatique et escrow sécurisé.',
        backgroundImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Artisans' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Missions' },
          { value: 0, suffix: '%', label: 'Satisfaction' },
        ],
        ctaLabel: 'Voir les artisans',
        ctaHref: '#artisans',
      }}
    >
      <div id="artisans">
        <SafeModule>
          <ArtisansMarketplace onSelectProperty={onSelectProperty} />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
