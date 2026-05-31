'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import SafeModule from '@/components/safe/SafeModule';

const ProfessionalProfileModule = dynamic(() => import('@/components/afribayit/ProfessionalProfileModule'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-b-3xl" />
          <div className="h-32 bg-gray-100 rounded-3xl mt-4" />
          <div className="h-64 bg-gray-100 rounded-3xl mt-4" />
        </div>
      </div>
    </div>
  ),
});

export default function ProfilePage() {
  const { onNavigate } = useAfriBayitNav();

  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <ProfessionalProfileModule onNavigate={onNavigate} />
      </SafeModule>
    </div>
  );
}
