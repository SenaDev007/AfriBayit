'use client';

import AuthPages from '@/components/afribayit/AuthPages';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    // The AuthPages component handles the form internally
    // After successful login, redirect to dashboard
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
        <AuthPages
          mode="login"
          onClose={handleClose}
          onSwitch={handleSwitch}
          onLogin={handleLogin}
        />
      </div>
    </div>
  );
}
