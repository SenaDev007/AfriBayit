'use client';

import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';
import { apiFetch } from '@/lib/api-client';

const AcademyModule = dynamic(() => import('@/components/afribayit/AcademyModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function AcademyPage() {
  // Fetch real academy stats for the hero
  const { data: stats } = useQuery({
    queryKey: ['academy-stats'],
    queryFn: () => apiFetch<{ courseCount: number; enrollmentCount: number; certificateCount: number; satisfactionRate: number }>(`/api/academy/stats`),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Académie AfriBayit',
        title: 'Formation immobilière certifiante en Afrique',
        subtitle: 'Cours en ligne sur l\'immobilier, le droit foncier OHADA, l\'investissement et la construction. Certificats professionnels reconnus, paiement sécurisé via escrow.',
        backgroundImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=900&fit=crop',
        stats: [
          { value: stats?.courseCount ?? 0, suffix: '+', label: 'Cours' },
          { value: 4, suffix: '', label: 'Pays' },
          { value: stats?.enrollmentCount ?? 0, suffix: '+', label: 'Apprenants' },
          { value: stats?.satisfactionRate ?? 95, suffix: '%', label: 'Satisfaction' },
        ],
        ctaLabel: 'Voir les formations',
        ctaHref: '#academy',
      }}
    >
      <div id="academy">
        <SafeModule>
          <AcademyModule />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
