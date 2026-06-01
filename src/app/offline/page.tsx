'use client';

import { useState } from 'react';
import { Wifi, RefreshCw, Home, Phone, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * AfriBayit Offline Fallback Page
 * Shown when the user is offline and tries to navigate to a page not in cache.
 * Features AfriBayit branding and helpful actions.
 */
export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
    // Reset after 3 seconds if still on the page
    setTimeout(() => setIsRetrying(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#003087] px-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
            <Home className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-display">
            AfriBayit
          </span>
        </div>
      </div>

      {/* Offline Icon */}
      <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
        <Wifi className="w-12 h-12 text-white/50" />
        <div className="absolute">
          <div className="w-24 h-0.5 bg-white/30 rotate-45 origin-center" />
        </div>
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-white mb-2 font-display">
        Vous êtes hors ligne
      </h1>
      <p className="text-white/70 text-center max-w-md mb-8">
        Vérifiez votre connexion internet et réessayez. 
        Certaines fonctionnalités restent disponibles si vous les avez déjà consultées.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-[#003087] rounded-full font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Reconnexion...' : 'Réessayer'}
        </button>

        <Link
          href="/"
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Accueil
        </Link>
      </div>

      {/* Help info */}
      <div className="mt-12 text-center">
        <p className="text-white/40 text-sm mb-2">
          Besoin d&apos;aide ?
        </p>
        <div className="flex items-center justify-center gap-4 text-white/50 text-xs">
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            +229 90 00 00 00
          </span>
          <span>WhatsApp disponible</span>
        </div>
      </div>
    </div>
  );
}
