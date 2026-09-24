'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import SafeModule from '@/components/safe/SafeModule';

const AuthPages = dynamic(() => import('@/components/afribayit/AuthPages'), {
  loading: () => (
    <div className="min-h-screen bg-admin-bg flex items-center justify-center font-sans">
      <div className="animate-pulse">
        <div className="w-80 h-96 bg-admin-panel/60 rounded-3xl border border-primary-green/20" />
      </div>
    </div>
  ),
});

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect to landing page after successful login
    // (not /dashboard — users should land on the main page)
    router.push('/');
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
    <div className="admin-dark min-h-screen bg-admin-bg flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Halo radial central — design login Win-Agro */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary-green/10 blur-[120px] pointer-events-none" />
      {/* Faisceau décoratif or */}
      <div className="absolute -top-24 -right-24 w-[320px] h-[320px] rounded-full bg-accent-yellow/5 blur-[100px] pointer-events-none" />
      {/* Faisceau décoratif navy */}
      <div className="absolute -bottom-32 -left-32 w-[380px] h-[380px] rounded-full bg-primary-deep/10 blur-[110px] pointer-events-none" />

      {/* Bouton retour — pattern Win-Agro */}
      <a
        href="/"
        className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au site
      </a>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-6">
          {/* Logo — tuile blanche (le logo doit rester sur fond blanc) */}
          <div className="logo-tile inline-flex w-16 h-16 rounded-2xl p-2 mb-4 shadow-lg items-center justify-center border border-primary-green/20">
            <Image src="/logo.png" alt="AfriBayit" width={64} height={64} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            Connexion
          </h1>
          <p className="text-xs text-gray-400 mt-1.5 font-sans">
            Espace sécurisé AfriBayit — accès plateforme &amp; backoffice
          </p>
        </div>
        <SafeModule>
          <AuthPages
            mode="login"
            onClose={handleClose}
            onSwitch={handleSwitch}
            onSuccess={handleSuccess}
          />
        </SafeModule>

        {/* Signature bas de page — pattern Win-Agro */}
        <div className="mt-6 flex items-center justify-center gap-2 opacity-80">
          <div className="logo-tile w-8 h-8 rounded-lg p-1 flex items-center justify-center">
            <Image src="/logo.png" alt="AfriBayit" width={32} height={32} className="w-full h-full object-contain" />
          </div>
          <p className="text-[10px] text-gray-500">
            L&apos;équipe AfriBayit — votre plateforme immobilière en Afrique de l&apos;Ouest
          </p>
        </div>
      </div>
    </div>
  );
}
