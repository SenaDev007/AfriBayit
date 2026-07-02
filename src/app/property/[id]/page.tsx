'use client';

import PropertyDetail from '@/components/afribayit/PropertyDetail';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useParams } from 'next/navigation';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Détail propriété — AfriBayit",
  description: "Découvrez cette propriété sur AfriBayit. Photos, caractéristiques, localisation, documents légaux, visite virtuelle.",
  keywords: ["propriété", "détail bien", "immobilier"],
  openGraph: {
    title: "Détail propriété — AfriBayit",
    description: "Découvrez cette propriété sur AfriBayit. Photos, caractéristiques, localisation, documents légaux, visite virtuelle.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Détail propriété — AfriBayit",
    description: "Découvrez cette propriété sur AfriBayit. Photos, caractéristiques, localisation, documents légaux, visite virtuelle.",
  },
};

export default function PropertyDetailPage() {
  const { onNavigate, onBack } = useAfriBayitNav();
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="min-h-screen">
      <PropertyDetail
        propertyId={id}
        onBack={onBack}
        onNavigate={onNavigate}
      />
    </div>
  );
}
