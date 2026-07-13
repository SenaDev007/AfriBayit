'use client';

import dynamic from 'next/dynamic';
import { signOut } from 'next-auth/react';
import SafeModule from '@/components/safe/SafeModule';
import RoleContextBanner from '@/components/afribayit/RoleContextBanner';


const AgentDashboard = dynamic(() => import('@/components/afribayit/AgentDashboard'), {
  loading: () => (
    <div className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function AgentDashboardPage() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen">
      <div className="pt-20 pb-4 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <RoleContextBanner />
      </div>
      <SafeModule>
        <AgentDashboard onLogout={handleLogout} />
      </SafeModule>
    </div>
  );
}
