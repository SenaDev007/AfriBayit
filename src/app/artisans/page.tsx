'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { apiFetch } from '@/lib/api-client';
import TransactionPageShell, { type ShellStat } from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const ArtisansMarketplace = dynamic(() => import('@/components/afribayit/ArtisansMarketplace'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-deep border-t-transparent rounded-full" />
    </div>
  ),
});

export default function ArtisansPage() {
  const { onNavigate } = useAfriBayitNav();

  // Stats réelles de l'annuaire (P1 audit) — plus de compteurs "0" codés en dur :
  // total, pays couverts, missions réalisées et note moyenne viennent de la DB.
  const { data, isPending } = useQuery<{
    artisans: Record<string, unknown>[];
    pagination: { total: number };
  }>({
    queryKey: ['artisans-stats'],
    queryFn: () => apiFetch('/api/artisans?limit=100'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(4000 * 2 ** attemptIndex, 12000),
  });

  const artisans = data?.artisans ?? [];
  const total = data?.pagination?.total ?? artisans.length;
  const countries = new Set(artisans.map((a) => a.country).filter(Boolean)).size;
  const missions = artisans.reduce((sum, a) => sum + Number(a.completedMissions ?? 0), 0);
  const avgRating = artisans.length
    ? artisans.reduce((sum, a) => sum + Number(a.rating ?? 0), 0) / artisans.length
    : 0;

  const customStats: ShellStat[] = [
    { value: total, suffix: '+', label: 'Artisans' },
    { value: countries || 4, suffix: '', label: 'Pays couverts' },
    { value: missions, suffix: '+', label: 'Missions' },
    {
      value: avgRating ? Math.round(avgRating * 10) / 10 : '—',
      suffix: avgRating ? '/5' : undefined,
      label: 'Satisfaction',
    },
  ];

  return (
    <TransactionPageShell
      activeTab="acheter"
      customStats={customStats}
      customStatsPending={isPending}
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
          <ArtisansMarketplace onNavigate={onNavigate} />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
