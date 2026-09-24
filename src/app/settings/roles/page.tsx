'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const RoleManager = dynamic(() => import('@/components/afribayit/RoleManager'), {
  ssr: false,
  loading: () => (<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-green" /></div>),
});

export default function RolesSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (<div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-green" /></div>);
  }
  if (status === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/settings/roles');
    return null;
  }
  return (
    <div className="min-h-screen bg-cream py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <button onClick={() => router.push('/settings')} className="text-sm text-gray-text hover:text-primary-deep mb-3 inline-flex items-center gap-1">← Paramètres</button>
          <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
            Multi-rôles
          </div>
          <h1 className="font-serif text-3xl font-extrabold text-primary-deep mb-2">Gestion des rôles</h1>
          <div className="h-1 w-16 bg-accent-yellow rounded-full mb-4" />
          <p className="text-gray-text">Ajoutez ou retirez des rôles à votre compte. Un même utilisateur peut être à la fois acheteur, investisseur, vendeur et touriste.</p>
        </div>
        <RoleManager />
      </div>
    </div>
  );
}
