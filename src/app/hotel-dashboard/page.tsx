'use client';

/**
 * Page /hotel-dashboard — PMS public pour hôteliers (CDC §7D.3)
 *
 * Accessible aux hôteliers pour gérer leur établissement:
 * - Gestion des chambres
 * - Calendrier de disponibilité
 * - Réservations
 * - Tarifs
 * - Dashboard analytique
 *
 * Uses the existing HotelPMS component (was admin-only, now public for hôteliers).
 */

import dynamic from 'next/dynamic';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import SafeModule from '@/components/safe/SafeModule';

const HotelPMS = dynamic(() => import('@/components/afribayit/HotelPMS'), {
  loading: () => (
    <div className="py-24 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
    </div>
  ),
});

export default function HotelDashboardPage() {
  return (
    <TransactionPageShell
      activeTab="sejour"
      hero={{
        badge: 'PMS Hôtelier',
        title: 'Gérez votre hôtel en toute simplicité',
        subtitle: 'Property Management System AfriBayit — gestion des chambres, réservations, tarifs et statistiques. Mobile-first, pensé pour la réalité africaine.',
        backgroundImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Hôtels gérés' },
          { value: 0, suffix: '', label: 'Pays' },
          { value: 0, suffix: '+', label: 'Chambres' },
          { value: 0, suffix: '+', label: 'Réservations/mois' },
        ],
        ctaLabel: 'Accéder au PMS',
        ctaHref: '#pms',
      }}
    >
      <div id="pms">
        <SafeModule>
          <HotelPMS />
        </SafeModule>
      </div>
    </TransactionPageShell>
  );
}
