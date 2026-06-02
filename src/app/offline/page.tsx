'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home, Search, MessageCircle, CheckCircle } from 'lucide-react';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [cachedItems, setCachedItems] = useState<string[]>([]);

  useEffect(() => {
    // Check online status
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Auto-redirect when connection returns
    window.addEventListener('online', () => {
      setIsOnline(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    // Check for cached content
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        const items: string[] = [];
        if (cacheNames.some(n => n.includes('static'))) items.push('Pages principales');
        if (cacheNames.some(n => n.includes('listings'))) items.push('Annonces immobilières');
        if (cacheNames.some(n => n.includes('api'))) items.push('Données de recherche');
        setCachedItems(items);
      });
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#003087] to-[#001d54] p-4">
      <div className="text-center text-white max-w-md w-full">
        {/* Logo */}
        <img
          src="/logo.png"
          alt="AfriBayit"
          className="h-16 mx-auto mb-8 brightness-0 invert"
        />

        {/* Offline Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          {isOnline ? (
            <CheckCircle className="w-10 h-10 text-green-400" />
          ) : (
            <WifiOff className="w-10 h-10 text-white/70" />
          )}
        </div>

        {/* Status Message */}
        {isOnline ? (
          <>
            <h1 className="text-2xl font-bold mb-2 text-green-400">Connexion rétablie !</h1>
            <p className="text-white/70 mb-6">
              Redirection en cours...
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-2">Vous êtes hors ligne</h1>
            <p className="text-white/70 mb-6">
              Vérifiez votre connexion internet et réessayez. Certaines fonctionnalités restent disponibles.
            </p>
          </>
        )}

        {/* Cached Content */}
        {cachedItems.length > 0 && !isOnline && (
          <div className="bg-white/10 rounded-xl p-4 mb-6 text-left">
            <h2 className="text-sm font-semibold text-white/90 mb-3">
              Contenu disponible hors ligne :
            </h2>
            <ul className="space-y-2">
              {cachedItems.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-white/70 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quick Actions */}
        {!isOnline && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <a
              href="/"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Home className="w-5 h-5 text-white/80" />
              <span className="text-xs text-white/70">Accueil</span>
            </a>
            <a
              href="/search"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Search className="w-5 h-5 text-white/80" />
              <span className="text-xs text-white/70">Recherche</span>
            </a>
            <a
              href="/?action=rebecca"
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-white/80" />
              <span className="text-xs text-white/70">Rebecca</span>
            </a>
          </div>
        )}

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#003087] rounded-full font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Reconnexion...' : 'Réessayer'}
        </button>

        {/* Help Text */}
        <p className="mt-6 text-white/40 text-xs">
          AfriBayit fonctionne partiellement hors ligne grâce au cache de votre navigateur.
        </p>
      </div>
    </div>
  );
}
