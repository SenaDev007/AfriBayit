'use client';

/**
 * Page /hospitality — AfriBayit Hospitality (hôtels)
 * Compact hero + HospitalityModule
 */

import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const HospitalityModule = dynamic(() => import('@/components/afribayit/HospitalityModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function HospitalityPage() {
  return (
    <TransactionPageShell
      activeTab="sejour"
      hero={{
        badge: 'Hôtellerie',
        title: 'Réservez des hôtels vérifiés en Afrique de l\'Ouest',
        subtitle: 'Hôtels connectés aux plateformes de voyage internationales et hôtels locaux hors-réseau digitalisés via notre PMS. Réservation instantanée, paiement Mobile Money.',
        backgroundImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Hôtels' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Chambres' },
          { value: 0, suffix: '+', label: 'Réservations' },
        ],
        ctaLabel: 'Voir les hôtels',
        ctaHref: '#properties',
      }}
    >
      <div id="properties">
        <SafeModule>
          <HospitalityModule />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
