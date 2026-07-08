'use client';

import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const GeoTrustModule = dynamic(() => import('@/components/afribayit/GeoTrustModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function GeoTrustPage() {
  return (
    <TransactionPageShell
      activeTab="acheter"
      hero={{
        badge: 'GeoTrust',
        title: 'Certification foncière et géomètres certifiés',
        subtitle: 'Vérification et bornage de terrain par géomètres agréés. GeoTrust garantit la conformité foncière de chaque bien immobilier en Afrique de l\'Ouest.',
        backgroundImage: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Inspections' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Géomètres' },
          { value: 0, suffix: '%', label: 'Fiabilité' },
        ],
        ctaLabel: 'Voir les inspections',
        ctaHref: '#geotrust',
      }}
    >
      <div id="geotrust">
        <SafeModule>
          <GeoTrustModule />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
