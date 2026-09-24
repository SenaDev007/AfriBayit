'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import SafeModule from '@/components/safe/SafeModule';


const SubscriptionsModule = dynamic(() => import('@/components/afribayit/SubscriptionsModule'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-primary-pale/60 rounded-full mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-80 bg-primary-pale/40 rounded-3xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function SubscriptionsPage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen bg-cream">
      <SafeModule>
        <SubscriptionsModule onNavigate={onNavigate} />
      </SafeModule>
    </div>
  );
}
