'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { signOut } from 'next-auth/react';
import SafeModule from '@/components/safe/SafeModule';
import { Loader2 } from 'lucide-react';


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
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { onNavigate } = useAfriBayitNav();

  // Redirect OAuth users without a country to the complete-profile page
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const country = (session.user as Record<string, unknown>).country as string | null;
      const needsCompletion = (session.user as Record<string, unknown>).needsProfileCompletion as boolean;

      if (!country || needsCompletion) {
        router.push('/auth/complete-profile');
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, session, router]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Show loading while checking session or redirecting
  if (status === 'loading' || (status === 'authenticated' && !(session?.user as Record<string, unknown>)?.country)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-[#003087]" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen">
      <SafeModule>
        <UserDashboard onNavigate={onNavigate} onLogout={handleLogout} />
      </SafeModule>
    </div>
  );
}
