'use client';

import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const AcademyModule = dynamic(() => import('@/components/afribayit/AcademyModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function AcademyPage() {
  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'Académie',
        title: 'Formation immobilière certifiante en Afrique',
        subtitle: 'Cours en ligne sur l\'immobilier, le droit foncier, l\'investissement et la construction. Formations certifiantes avec certificats reconnus.',
        backgroundImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Cours' },
          { value: 0, suffix: '', label: 'Pays' },
          { value: 0, suffix: '+', label: 'Étudiants' },
          { value: 0, suffix: '%', label: 'Satisfaction' },
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
