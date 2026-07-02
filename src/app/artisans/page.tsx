'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import SafeModule from '@/components/safe/SafeModule';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Artisans BTP — AfriBayit ProMatch",
  description: "Trouvez des artisans certifiés BTP en Afrique de l'Ouest. Maçons, électriciens, plombiers, peintres.",
  keywords: ["artisan BTP", "ProMatch", "maçon", "électricien", "plombier"],
  openGraph: {
    title: "Artisans BTP — AfriBayit ProMatch",
    description: "Trouvez des artisans certifiés BTP en Afrique de l'Ouest. Maçons, électriciens, plombiers, peintres.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Artisans BTP — AfriBayit ProMatch",
    description: "Trouvez des artisans certifiés BTP en Afrique de l'Ouest. Maçons, électriciens, plombiers, peintres.",
  },
};

const ArtisansMarketplace = dynamic(() => import('@/components/afribayit/ArtisansMarketplace'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function ArtisansPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <ArtisansMarketplace onNavigate={onNavigate} />
      </SafeModule>
    </div>
  );
}
