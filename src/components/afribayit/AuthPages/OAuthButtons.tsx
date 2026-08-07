// P3.7-2 — Google/Facebook/Apple OAuth buttons shared by LoginForm and RegisterForm.
// CRITICAL: OAuth providers MUST use redirect: true (the default). Using
// redirect: false forces a popup/iframe flow which fails because Google blocks
// third-party cookies in iframes and Facebook sends X-Frame-Options: DENY.
//
// Apple provider is added per CDC §4.1 — only rendered if the NextAuth
// `providers` config exposes it (i.e. APPLE_CLIENT_ID + APPLE_CLIENT_SECRET set).

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
import type { OauthLoadingState, ProviderAvailability } from './types';

interface OAuthButtonsProps {
  availableProviders: ProviderAvailability;
  oauthLoading: OauthLoadingState;
  onGoogle: () => void;
  onFacebook: () => void;
  onApple: () => void;
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 12.04c-.03-2.93 2.39-4.34 2.5-4.41-1.36-1.99-3.48-2.26-4.24-2.29-1.81-.18-3.53 1.06-4.45 1.06-.92 0-2.33-1.04-3.83-1.01-1.98.03-3.81 1.15-4.83 2.92-2.06 3.57-.52 8.85 1.48 11.75.98 1.42 2.15 3.01 3.68 2.95 1.48-.06 2.04-.96 3.83-.96 1.79 0 2.29.96 3.85.93 1.59-.03 2.6-1.45 3.57-2.88 1.13-1.65 1.6-3.25 1.62-3.33-.04-.02-3.11-1.19-3.14-4.73M14.13 4.15c.82-.99 1.37-2.37 1.22-3.74-1.18.05-2.6.79-3.45 1.78-.76.87-1.42 2.27-1.24 3.62 1.31.1 2.65-.67 3.47-1.66" />
    </svg>
  );
}

export default function OAuthButtons({
  availableProviders,
  oauthLoading,
  onGoogle,
  onFacebook,
  onApple,
}: OAuthButtonsProps) {
  const { t } = useTranslation();

  const activeCount = [
    availableProviders.google,
    availableProviders.facebook,
    availableProviders.apple,
  ].filter(Boolean).length;

  if (activeCount === 0) return null;

  const gridClass =
    activeCount === 3 ? 'grid-cols-3' : activeCount === 2 ? 'grid-cols-2' : 'grid-cols-1';

  return (
    <motion.div layout>
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">
            {t('auth.orContinueWith', 'ou continuer avec')}
          </span>
        </div>
      </div>

      <div className={`grid ${gridClass} gap-3`}>
        {availableProviders.google && (
          <button
            type="button"
            onClick={onGoogle}
            disabled={!!oauthLoading}
            className="py-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {oauthLoading === 'google' ? 'Connexion...' : 'Google'}
          </button>
        )}
        {availableProviders.facebook && (
          <button
            type="button"
            onClick={onFacebook}
            disabled={!!oauthLoading}
            className="py-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === 'facebook' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FacebookIcon />
            )}
            {oauthLoading === 'facebook' ? 'Connexion...' : 'Facebook'}
          </button>
        )}
        {availableProviders.apple && (
          <button
            type="button"
            onClick={onApple}
            disabled={!!oauthLoading}
            className="py-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {oauthLoading === 'apple' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AppleIcon />
            )}
            {oauthLoading === 'apple' ? 'Connexion...' : 'Apple'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
