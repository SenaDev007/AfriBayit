'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

<<<<<<< HEAD
// Dynamic import to avoid SSR issues with useSession
const RoleManager = dynamic(
  () => import('@/components/afribayit/RoleManager'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-[#003087]" />
    </div>
  )},
);
=======
const RoleManager = dynamic(() => import('@/components/afribayit/RoleManager'), {
  ssr: false,
  loading: () => (<div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#003087]" /></div>),
});
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

export default function RolesSettingsPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
<<<<<<< HEAD
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#003087]" />
      </div>
    );
  }

=======
    return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></div>);
  }
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
  if (status === 'unauthenticated') {
    router.push('/auth/login?callbackUrl=/settings/roles');
    return null;
  }
<<<<<<< HEAD

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb + header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/settings')}
            className="text-sm text-gray-500 hover:text-[#003087] mb-3 inline-flex items-center gap-1"
          >
            ← Paramètres
          </button>
          <h1 className="font-display text-3xl font-bold text-[#0a2a5e] mb-2">
            Gestion des rôles
          </h1>
          <p className="text-gray-600">
            Ajoutez ou retirez des rôles à votre compte. Un même utilisateur peut être
            à la fois acheteur, investisseur, vendeur et touriste.
          </p>
        </div>

=======
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <button onClick={() => router.push('/settings')} className="text-sm text-gray-500 hover:text-[#003087] mb-3 inline-flex items-center gap-1">← Paramètres</button>
          <h1 className="font-display text-3xl font-bold text-[#0a2a5e] mb-2">Gestion des rôles</h1>
          <p className="text-gray-600">Ajoutez ou retirez des rôles à votre compte. Un même utilisateur peut être à la fois acheteur, investisseur, vendeur et touriste.</p>
        </div>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
        <RoleManager />
      </div>
    </div>
  );
}
