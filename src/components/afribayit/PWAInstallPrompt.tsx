'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

/**
 * PWA Install Prompt Component
 * Shows a banner when the app is installable as a PWA.
 * Dismissal is persisted in localStorage.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('afribayit-pwa-dismissed');
    if (dismissed) return;

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a short delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await (deferredPrompt as BeforeInstallPromptEvent & { prompt: () => Promise<void> }).prompt();
      const choiceResult = await (deferredPrompt as BeforeInstallPromptEvent & { userChoice: Promise<{ outcome: string }> }).userChoice;

      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
    } catch (error) {
      console.error('PWA install prompt error:', error);
    } finally {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('afribayit-pwa-dismissed', 'true');
  };

  // Don't render if not applicable
  if (!showPrompt || isInstalled || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#003087] flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-gray-900">
              Installer AfriBayit
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Accédez rapidement à AfriBayit depuis votre écran d&apos;accueil, même hors ligne.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003087] text-white text-sm font-medium rounded-full hover:bg-[#002266] transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Type definition for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
