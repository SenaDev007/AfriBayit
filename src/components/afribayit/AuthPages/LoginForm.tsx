// P3.7-2 — Login form + 2FA verification form.
// Receives all state and handlers from the AuthPages orchestrator.

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
import OAuthButtons from './OAuthButtons';
import type { OauthLoadingState, ProviderAvailability, TwoFAState } from './types';

interface LoginFormProps {
  // login state
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  loginError: string;
  setLoginError: (v: string) => void;
  loginLoading: boolean;
  onLoginSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  // 2FA state
  twoFA: TwoFAState;
  setTwoFACode: (v: string) => void;
  setTwoFAError: (v: string) => void;
  reset2FA: () => void;
  on2FAVerify: (e: React.FormEvent) => void;
  // OAuth
  availableProviders: ProviderAvailability;
  oauthLoading: OauthLoadingState;
  onGoogle: () => void;
  onFacebook: () => void;
  // navigation
  onSwitch: (mode: 'login' | 'register') => void;
}

export default function LoginForm(props: LoginFormProps) {
  const { t } = useTranslation();
  const {
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    loginLoading,
    onLoginSubmit,
    onForgotPassword,
    twoFA,
    setTwoFACode,
    setTwoFAError,
    reset2FA,
    on2FAVerify,
    availableProviders,
    oauthLoading,
    onGoogle,
    onFacebook,
    onSwitch,
  } = props;

  if (twoFA.show2FA) {
    return (
      <>
        <div className="w-16 h-16 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-[#003087]" />
        </div>
        <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-1 text-center">
          Vérification 2FA
        </h2>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Entrez le code de votre application d&apos;authentification
        </p>

        <form onSubmit={on2FAVerify} className="space-y-4">
          {twoFA.twoFAError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600"
            >
              {twoFA.twoFAError}
            </motion.div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block text-center">
              Code à 6 chiffres
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFA.twoFACode}
              onChange={(e) => {
                setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6));
                setTwoFAError('');
              }}
              placeholder="000000"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-center tracking-[0.5em] font-mono outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
            />
          </div>

          <motion.button
            whileHover={{ scale: twoFA.twoFALoading ? 1 : 1.01 }}
            whileTap={{ scale: twoFA.twoFALoading ? 1 : 0.99 }}
            type="submit"
            disabled={twoFA.twoFALoading}
            className="w-full py-3.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {twoFA.twoFALoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {twoFA.twoFALoading ? 'Vérification...' : 'Vérifier'}
          </motion.button>

          <button
            type="button"
            onClick={reset2FA}
            className="w-full py-3 text-sm text-gray-500 hover:text-gray-700"
          >
            Retour
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-1">
        {t('auth.loginForm.title', 'Bon retour !')}
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        {t('auth.loginForm.subtitle', 'Connectez-vous à votre compte AfriBayit')}
      </p>

      <form onSubmit={onLoginSubmit} className="space-y-4">
        {loginError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600"
          >
            {loginError}
          </motion.div>
        )}

        <div>
          <label htmlFor="login-email" className="text-xs font-medium text-gray-500 mb-1.5 block">
            {t('auth.email', 'Email')}
          </label>
          <input
            id="login-email"
            type="email"
            value={loginEmail}
            onChange={(e) => {
              setLoginEmail(e.target.value);
              setLoginError('');
            }}
            placeholder="votre@email.com"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="text-xs font-medium text-gray-500 mb-1.5 block">
            {t('auth.password', 'Mot de passe')}
          </label>
          <input
            id="login-password"
            type="password"
            value={loginPassword}
            onChange={(e) => {
              setLoginPassword(e.target.value);
              setLoginError('');
            }}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
          />
        </div>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs text-[#003087] font-medium hover:underline"
        >
          {t('auth.forgotPassword', 'Mot de passe oublié ?')}
        </button>

        <motion.button
          whileHover={{ scale: loginLoading ? 1 : 1.01 }}
          whileTap={{ scale: loginLoading ? 1 : 0.99 }}
          type="submit"
          disabled={loginLoading}
          className="w-full py-3.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loginLoading
            ? t('auth.loginForm.submitting', 'Connexion...')
            : t('auth.loginForm.submit', 'Se connecter')}
        </motion.button>
      </form>

      {/* Social Login — shown below login form */}
      <OAuthButtons
        availableProviders={availableProviders}
        oauthLoading={oauthLoading}
        onGoogle={onGoogle}
        onFacebook={onFacebook}
      />

      <p className="text-center text-sm text-gray-500 mt-6 pb-6">
        Pas encore de compte ?{' '}
        <button
          onClick={() => onSwitch('register')}
          className="text-[#003087] font-semibold hover:underline"
        >
          Créer un compte
        </button>
      </p>
    </>
  );
}
