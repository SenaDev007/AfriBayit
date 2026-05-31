'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import SafeModule from '@/components/safe/SafeModule';

const AuthPages = dynamic(() => import('@/components/afribayit/AuthPages'), {
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-[#003087] via-[#001f5c] to-[#003087] flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-80 h-96 bg-white/10 rounded-3xl" />
      </div>
    </div>
  ),
});

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard');
  };

  const handleClose = () => {
    router.push('/');
  };

  const handleSwitch = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      router.push('/auth/register');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003087] via-[#001f5c] to-[#003087] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="font-display text-2xl font-bold text-white">
              Afri<span className="text-[#D4AF37]">Bayit</span>
            </span>
          </div>
        </div>
        <SafeModule>
          <AuthPages
            mode="login"
            onClose={handleClose}
            onSwitch={handleSwitch}
            onSuccess={handleSuccess}
          />
        </SafeModule>
      </div>
    </div>
  );
}
