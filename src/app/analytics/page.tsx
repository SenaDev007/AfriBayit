'use client';

import dynamic from 'next/dynamic';
import SafeModule from '@/components/safe/SafeModule';


const AnalyticsDashboard = dynamic(() => import('@/components/afribayit/AnalyticsDashboard'), {
  loading: () => (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-primary-pale/60 rounded-full" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-primary-pale/40 rounded-3xl" />
            ))}
          </div>
          <div className="h-64 bg-primary-pale/40 rounded-3xl" />
        </div>
      </div>
    </div>
  ),
});

export default function AnalyticsPage() {
  return (
    <div className="pt-20 min-h-screen bg-cream">
      <SafeModule>
        <AnalyticsDashboard />
      </SafeModule>
    </div>
  );
}
