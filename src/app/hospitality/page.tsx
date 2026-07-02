'use client';

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hôtellerie — AfriBayit Hospitality",
  description: "Gérez votre hôtel sur AfriBayit : PMS, OTA channel manager, réservations, pricing dynamique.",
  keywords: ["hôtellerie", "hôtel", "PMS", "channel manager", "réservation"],
  openGraph: {
    title: "Hôtellerie — AfriBayit Hospitality",
    description: "Gérez votre hôtel sur AfriBayit : PMS, OTA channel manager, réservations, pricing dynamique.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hôtellerie — AfriBayit Hospitality",
    description: "Gérez votre hôtel sur AfriBayit : PMS, OTA channel manager, réservations, pricing dynamique.",
  },
};

const HospitalityModule = dynamic(() => import('@/components/afribayit/HospitalityModule'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-100 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function HospitalityPage() {
  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <HospitalityModule />
      </SafeModule>
    </div>
  );
}
