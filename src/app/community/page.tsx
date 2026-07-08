'use client';

import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const CommunityModule = dynamic(() => import('@/components/afribayit/CommunityModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function CommunityPage() {
  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Communauté',
        title: 'La communauté immobilière d\'Afrique de l\'Ouest',
        subtitle: 'Discussions, questions, témoignages, analyses de marché et événements. Échangez avec des investisseurs, propriétaires et professionnels.',
        backgroundImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Membres' },
          { value: 0, suffix: '', label: 'Pays' },
          { value: 0, suffix: '+', label: 'Discussions' },
          { value: 0, suffix: '+', label: 'Événements' },
        ],
        ctaLabel: 'Rejoindre la communauté',
        ctaHref: '#community',
      }}
    >
      <div id="community">
        <SafeModule>
          <CommunityModule />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
