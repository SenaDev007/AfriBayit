'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { apiFetch } from '@/lib/api-client';
import TransactionPageShell, { type ShellStat } from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const NotaryModule = dynamic(() => import('@/components/afribayit/NotaryModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary-deep border-t-transparent rounded-full" />
    </div>
  ),
});

export default function NotaryPage() {
  const { onNavigate } = useAfriBayitNav();

  // Stats réelles de l'annuaire notarial (P1 audit) — total, pays, actes
  // signés (missions) et satisfaction moyenne viennent de la DB, jamais
  // de compteurs "0" ni de métriques marketing inventées.
  const { data, isPending } = useQuery<{
    notaries: Record<string, unknown>[];
    pagination: { total: number };
  }>({
    queryKey: ['notaries-stats'],
    queryFn: () => apiFetch('/api/notaries?limit=100'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(4000 * 2 ** attemptIndex, 12000),
  });

  const notaries = data?.notaries ?? [];
  const total = data?.pagination?.total ?? notaries.length;
  const countries = new Set(notaries.map((n) => n.country).filter(Boolean)).size;
  const acts = notaries.reduce((sum, n) => sum + Number(n.missions ?? 0), 0);
  const avgRating = notaries.length
    ? notaries.reduce((sum, n) => sum + Number(n.rating ?? 0), 0) / notaries.length
    : 0;

  const customStats: ShellStat[] = [
    { value: total, suffix: '+', label: 'Notaires' },
    { value: countries || 4, suffix: '', label: 'Pays couverts' },
    { value: acts, suffix: '+', label: 'Actes signés' },
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
        badge: 'Espace Notarial',
        title: 'Notaires certifiés pour vos transactions immobilières',
        subtitle: 'Assistance notariale pour transactions sécurisées. Génération d\'actes, signatures électroniques et conformité juridique dans 4 pays.',
        backgroundImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Notaires' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Actes signés' },
          { value: 0, suffix: '', label: 'Satisfaction' },
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
