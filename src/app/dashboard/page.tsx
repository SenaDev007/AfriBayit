'use client';

import dynamic from 'next/dynamic';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { signOut } from 'next-auth/react';
import SafeModule from '@/components/safe/SafeModule';

const UserDashboard = dynamic(() => import('@/components/afribayit/UserDashboard'), {
  loading: () => (
    <div className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const { onNavigate } = useAfriBayitNav();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen">
      <SafeModule>
        <UserDashboard onNavigate={onNavigate} onLogout={handleLogout} />
      </SafeModule>
    </div>
  );
}
