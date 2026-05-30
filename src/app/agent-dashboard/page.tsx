'use client';

import AgentDashboard from '@/components/afribayit/AgentDashboard';
import { signOut } from 'next-auth/react';

export default function AgentDashboardPage() {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="pt-20 min-h-screen">
      <AgentDashboard onLogout={handleLogout} />
    </div>
  );
}
