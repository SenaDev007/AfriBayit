'use client';

import ArtisansMarketplace from '@/components/afribayit/ArtisansMarketplace';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function ArtisansPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <ArtisansMarketplace onNavigate={onNavigate} />
    </div>
  );
}
