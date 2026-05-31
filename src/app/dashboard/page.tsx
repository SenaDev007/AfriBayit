'use client';

import UserDashboard from '@/components/afribayit/UserDashboard';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { onNavigate } = useAfriBayitNav();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen">
      <UserDashboard onNavigate={onNavigate} onLogout={handleLogout} />
    </div>
  );
}
