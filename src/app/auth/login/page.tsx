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

  /**
   * Redirection après connexion réussie.
   *
   * Contexte (retour client du 02/10) : « après le login on retombe toujours
   * sur le landing page » alors qu'on vient se connecter au back-office.
   *
   * Logique (la session est TOUJOURS consultée — le cookie est déjà posé
   * par signIn(redirect:false), le fetch est immédiat) :
   *   1. Utilisateur admin (admin/SUPER_ADMIN/COUNTRY_ADMIN) :
   *      - callbackUrl de type /admin… → on l'honore (retour exact où il
   *        allait, ex. /admin/users) ;
   *      - sinon → directement /admin (le propriétaire DOIT arriver sur
   *        son back-office, pas sur le landing page).
   *   2. Utilisateur non-admin :
   *      - callbackUrl de type /admin ou /api/admin → IGNORE (sinon boucle
   *        login↔admin : le middleware le renverrait ici) → landing page ;
   *      - autre callbackUrl relatif sûr (posé par le middleware pour les
   *        routes protégées non-admin : /profile, /wallet…) → honoré ;
   *      - sinon → landing page (comportement historique, CDC).
   *
   * Anti open-redirect : un callbackUrl n'est accepté que s'il commence
   * par « / » sans « // » (protocole relatif) et n'est pas lui-même une
   * page d'authentification.
   */
  const handleSuccess = async () => {
    let target = '/';
    let role: string | undefined;

    try {
      // Session fraîche → rôle (immédiat : cookie déjà posé par signIn)
      const res = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.ok) {
        const session = await res.json();
        role = (session?.user as { role?: string } | undefined)?.role;
      }
    } catch {
      // Session illisible → comportement historique : landing page
    }

    const isAdmin =
      role === 'admin' || role === 'SUPER_ADMIN' || role === 'COUNTRY_ADMIN';

    try {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get('callbackUrl') || params.get('redirect') || '';
      const isSafeRelative =
        callbackUrl.startsWith('/') &&
        !callbackUrl.startsWith('//') &&
        !callbackUrl.startsWith('/auth/');
      const isAdminPath =
        callbackUrl.startsWith('/admin') || callbackUrl.startsWith('/api/admin');

      if (isSafeRelative && isAdminPath && isAdmin) {
        // Admin revenant d'une route admin → retour exact
        target = callbackUrl;
      } else if (isSafeRelative && !isAdminPath) {
        // Route protégée classique (accessible à tout utilisateur connecté)
        target = callbackUrl;
      } else if (isAdmin) {
        // Admin sans callbackUrl → son back-office
        target = '/admin';
      }
    } catch {
      // Dégradation silencieuse → défaut '/' (ou '/admin' si admin)
      if (isAdmin) target = '/admin';
    }

    router.push(target);
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
