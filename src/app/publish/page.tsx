'use client';

import PropertyPublishModule from '@/components/afribayit/PropertyPublishModule';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function PublishPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <PropertyPublishModule onNavigate={onNavigate} />
    </div>
  );
}
