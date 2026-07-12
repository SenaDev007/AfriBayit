'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';
import { apiFetch } from '@/lib/api-client';

const CommunityModule = dynamic(() => import('@/components/afribayit/CommunityModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#00A651] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function CommunityPage() {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => apiFetch<any>(`/api/stats`),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'AfriBayit Connect',
        title: 'Le réseau social de l\'immobilier ouest-africain',
        subtitle: 'Forums par pays, groupes d\'investisseurs, événements de networking, marketplace de services. Connectez-vous avec des investisseurs, propriétaires et professionnels certifiés.',
        backgroundImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&h=900&fit=crop',
        stats: [
          { value: stats?.users ?? 0, suffix: '+', label: 'Membres' },
          { value: stats?.countries ?? 4, suffix: '', label: 'Pays' },
          { value: stats?.communityPosts ?? 0, suffix: '+', label: 'Discussions' },
          { value: 4, suffix: 'x', label: 'Plus de transactions' },
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
