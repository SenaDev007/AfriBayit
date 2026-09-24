// P3.7-2 — Login form + 2FA verification form.
// Receives all state and handlers from the AuthPages orchestrator.
// Design : login backoffice Win-Agro (carte sombre, inputs glass avec
// icônes, labels uppercase bleus, bouton pill) — palette AfriBayit.

import React, { useState } from 'react';
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
  onApple: () => void;
  // navigation
  onSwitch: (mode: 'login' | 'register') => void;
}

export default function LoginForm(props: LoginFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
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
    onApple,
    onSwitch,
  } = props;

  if (twoFA.show2FA) {
    return (
      <>
        <div className="w-16 h-16 rounded-2xl bg-primary-green/10 border border-primary-green/20 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8 text-primary-green" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-white mb-1 text-center tracking-wide">
          Vérification 2FA
        </h2>
        <p className="text-xs text-gray-400 mb-6 text-center">
          Entrez le code de votre application d&apos;authentification
        </p>

        <form onSubmit={on2FAVerify} className="space-y-4">
          {twoFA.twoFAError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/30 text-xs text-red-400 text-center">
              {twoFA.twoFAError}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-primary-green uppercase tracking-wider mb-1.5 block text-center">
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
              className="w-full px-4 py-3 rounded-xl border border-primary-green/20 bg-black/40 text-white text-sm text-center tracking-[0.5em] font-mono outline-none focus:outline-none focus:ring-2 focus:ring-primary-green/50 transition-all placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={twoFA.twoFALoading}
            className="w-full py-3.5 rounded-full bg-primary-green hover:bg-[#33afea] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {twoFA.twoFALoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {twoFA.twoFALoading ? 'Vérification...' : 'Vérifier'}
          </button>

          <button
            type="button"
            onClick={reset2FA}
            className="w-full py-3 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Retour
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <h2 className="font-serif text-2xl font-bold text-white mb-1 tracking-wide">
        {t('auth.loginForm.title', 'Bon retour !')}
      </h2>
      <p className="text-xs text-gray-400 mb-6">
        {t('auth.loginForm.subtitle', 'Connectez-vous à votre compte AfriBayit')}
      </p>

      <form onSubmit={onLoginSubmit} className="space-y-4">
        {/* Honeypot field — invisible to humans, bots fill it in (CDC §10.2.2). */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
          <label>Ne pas remplir ce champ</label>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            name="website"
            value=""
            onChange={() => {}}
          />
        </div>

        {loginError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/30 text-xs text-red-400 text-center">
            {loginError}
          </div>
        )}

        <div>
          <label htmlFor="login-email" className="text-xs font-bold text-primary-green uppercase tracking-wider mb-1.5 block">
            {t('auth.email', 'Adresse e-mail')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500 pointer-events-none" />
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
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-primary-green/20 bg-black/40 text-white text-sm outline-none focus:outline-none focus:ring-2 focus:ring-primary-green/50 transition-all font-sans placeholder:text-gray-600"
            />
          </div>
        </div>
        <div>
          <label htmlFor="login-password" className="text-xs font-bold text-primary-green uppercase tracking-wider mb-1.5 block">
            {t('auth.password', 'Mot de passe')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-gray-500 pointer-events-none" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                setLoginError('');
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full pl-11 pr-11 py-3 rounded-xl border border-primary-green/20 bg-black/40 text-white text-sm outline-none focus:outline-none focus:ring-2 focus:ring-primary-green/50 transition-all font-sans placeholder:text-gray-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onForgotPassword}
          className="text-xs text-primary-green font-bold hover:text-white transition-colors"
        >
          {t('auth.forgotPassword', 'Mot de passe oublié ?')}
        </button>

        <button
          type="submit"
          disabled={loginLoading}
          className="w-full py-3.5 rounded-full bg-primary-green hover:bg-[#33afea] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loginLoading
            ? t('auth.loginForm.submitting', 'Connexion...')
            : t('auth.loginForm.submit', 'Se connecter')}
        </button>
      </form>

      {/* Social Login — shown below login form */}
      <OAuthButtons
        availableProviders={availableProviders}
        oauthLoading={oauthLoading}
        onGoogle={onGoogle}
        onFacebook={onFacebook}
        onApple={onApple}
      />

      <p className="text-center text-xs text-gray-400 mt-6 pb-6">
        Pas encore de compte ?{' '}
        <button
          onClick={() => onSwitch('register')}
          className="text-primary-green font-bold hover:text-white transition-colors"
        >
          Créer un compte
        </button>
      </p>
    </>
  );
}
