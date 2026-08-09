'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[AfriBayit] Client-side error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('errorPage.title', 'Une erreur est survenue')}
        </h1>

        <p className="text-gray-500 mb-2">
          {t('errorPage.description', 'Nous rencontrons un problème temporaire. Veuillez réessayer.')}
        </p>

        {error?.message && (
          <p className="text-sm text-gray-400 mb-6 break-words">
            {t('errorPage.detail', 'Détail :')} {error.message}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#002266] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('errorPage.btnRetry', 'Réessayer')}
          </button>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#003087] border border-[#003087]/20 rounded-lg text-sm font-semibold hover:bg-[#003087]/5 transition-colors"
          >
            <Home className="w-4 h-4" />
            {t('errorPage.btnHome', "Retour à l'accueil")}
          </a>
        </div>
      </div>
    </div>
  );
}
