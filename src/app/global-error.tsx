'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AfriBayit] Global unhandled error:', error);
  }, [error]);

  // global-error must include its own <html> and <body> tags
  // since it replaces the root layout when triggered
  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Erreur inattendue
            </h1>

            <p className="text-gray-500 mb-6">
              L&apos;application a rencontr&eacute; une erreur critique. Veuillez rafra&icirc;chir la page.
            </p>

            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#002266] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Rafra&icirc;chir
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
