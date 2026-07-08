'use client';

/**
 * Page /short-term — Location courte durée (modèle Airbnb adapté Afrique)
 * Compact hero + existing ShortTermRentalModule
 */

import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';

const ShortTermRentalModule = dynamic(() => import('@/components/afribayit/ShortTermRentalModule'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function ShortTermPage() {
  return (
    <TransactionPageShell
      activeTab="sejour"
      hero={{
        badge: 'Location courte durée',
        title: 'Des séjours premium en Afrique de l\'Ouest',
        subtitle: 'Appartements, villas et guesthouses pour vos séjours courts. Réservation instantanée, check-in numérique QR code et paiement Mobile Money.',
        backgroundImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Séjours disponibles' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Hôtes vérifiés' },
          { value: 0, suffix: '+', label: 'Réservations' },
        ],
        ctaLabel: 'Voir les séjours',
        ctaHref: '#properties',
      }}
    >
      {/* Existing ShortTermRentalModule (calendar, booking, etc.) */}
      <div id="properties">
        <ShortTermRentalModule />
      </div>
    </TransactionPageShell>
  );
}
