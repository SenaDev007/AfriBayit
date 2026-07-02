'use client';

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';


const ShortTermRentalModule = dynamic(() => import('@/components/afribayit/ShortTermRentalModule'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50/30 pt-20 pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded mx-auto" />
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

export default function ShortTermRentalPage() {
  return (
    <SafeModule>
      <ShortTermRentalModule />
    </SafeModule>
  );
}
