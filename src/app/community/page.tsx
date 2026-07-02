'use client';

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';


const CommunityModule = dynamic(() => import('@/components/afribayit/CommunityModule'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function CommunityPage() {
  return (
    <div className="pt-20 min-h-screen">
      <SafeModule>
        <CommunityModule />
      </SafeModule>
    </div>
  );
}
