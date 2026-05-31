'use client';

import SubscriptionsModule from '@/components/afribayit/SubscriptionsModule';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';

export default function SubscriptionsPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <SubscriptionsModule onNavigate={onNavigate} />
    </div>
  );
}
