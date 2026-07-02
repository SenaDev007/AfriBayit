'use client';

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';


const GeoTrustModule = dynamic(() => import('@/components/afribayit/GeoTrustModule'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded mx-auto" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function GeoTrustPage() {
  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <GeoTrustModule />
      </SafeModule>
    </div>
  );
}
