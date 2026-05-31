'use client';

import PropertyDetail from '@/components/afribayit/PropertyDetail';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useParams } from 'next/navigation';

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
