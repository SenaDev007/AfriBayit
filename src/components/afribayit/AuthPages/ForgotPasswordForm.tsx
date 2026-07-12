// P3.7-2 — Forgot password modal (3-step flow).
// Step 1: email → send OTP
// Step 2: OTP code + new password → reset
// Step 3: success message

import { motion } from 'framer-motion';
import { Check, Key, Loader2, Mail } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
import type { ForgotPasswordState } from './types';

interface ForgotPasswordFormProps {
  state: ForgotPasswordState;
  // shared email field (loginEmail) — entered in LoginForm but reused here
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  // forgot/reset handlers
  setForgotError: (v: string) => void;
  setForgotSuccess: (v: boolean) => void;
  setForgotOtpCode: (v: string) => void;
  setForgotNewPassword: (v: string) => void;
  setResetError: (v: string) => void;
  setResetSuccess: (v: boolean) => void;
  onSubmitEmail: () => void;
  onSubmitReset: () => void;
  onClose: () => void;
}

export default function ForgotPasswordForm(props: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const {
    state,
    loginEmail,
    setLoginEmail,
    setForgotError,
    setForgotSuccess,
    setForgotOtpCode,
    setForgotNewPassword,
    setResetError,
    setResetSuccess,
    onSubmitEmail,
    onSubmitReset,
    onClose,
  } = props;

  const close = () => {
    onClose();
    setForgotSuccess(false);
    setForgotError('');
    setResetSuccess(false);
    setResetError('');
    setForgotOtpCode('');
    setForgotNewPassword('');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-bold text-[#0a2a5e]">
          Mot de passe oublié
        </h2>
        <button
          onClick={close}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!state.resetSuccess ? (
        <>
          {!state.forgotSuccess ? (
            <>
              {/* Step 1: Enter email and send OTP */}
              <div className="w-16 h-16 rounded-lg bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-[#003087]" />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Entrez votre email pour recevoir un code de vérification
              </p>

              {state.forgotError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600"
                >
                  {state.forgotError}
                </motion.div>
              )}

              <div>
                <label htmlFor="forgot-email" className="text-xs font-medium text-gray-500 mb-1.5 block">
                  {t('auth.email', 'Email')}
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setForgotError('');
                  }}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
                />
              </div>
              <motion.button
                whileHover={{ scale: state.forgotLoading ? 1 : 1.01 }}
                whileTap={{ scale: state.forgotLoading ? 1 : 0.99 }}
                onClick={onSubmitEmail}
                disabled={state.forgotLoading}
                className="w-full mt-4 py-3.5 bg-[#003087] text-white rounded-lg font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state.forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {state.forgotLoading ? 'Envoi en cours...' : 'Envoyer le code'}
              </motion.button>
            </>
          ) : (
            <>
              {/* Step 2: Enter OTP code and new password */}
              <div className="w-16 h-16 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-2xl bg-green-50 border border-green-200 text-sm text-green-700 text-center"
              >
                Un code de vérification a été envoyé à votre email
              </motion.div>

              {state.resetError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600"
                >
                  {state.resetError}
                </motion.div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Code de vérification
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={state.forgotOtpCode}
                    onChange={(e) => {
                      setForgotOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setResetError('');
                    }}
                    placeholder="000000"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm text-center tracking-[0.5em] font-mono outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={state.forgotNewPassword}
                    onChange={(e) => {
                      setForgotNewPassword(e.target.value);
                      setResetError('');
                    }}
                    placeholder="8 caractères minimum"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
                  />
                  {state.forgotNewPassword && state.forgotNewPassword.length < 8 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Le mot de passe doit contenir au moins 8 caractères
                    </p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: state.resetLoading ? 1 : 1.01 }}
                  whileTap={{ scale: state.resetLoading ? 1 : 0.99 }}
                  onClick={onSubmitReset}
                  disabled={state.resetLoading}
                  className="w-full py-3.5 bg-[#003087] text-white rounded-lg font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {state.resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {state.resetLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                </motion.button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {/* Step 3: Password reset success */}
          <div className="w-16 h-16 rounded-lg bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-2xl bg-green-50 border border-green-200 text-sm text-green-700 text-center"
          >
            Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.
          </motion.div>
          <button
            onClick={close}
            className="w-full py-3.5 bg-[#003087] text-white rounded-lg font-semibold text-sm hover:bg-[#0047b3] transition-colors"
          >
            Se connecter
          </button>
        </>
      )}

      <button
        onClick={close}
        className="w-full mt-2 py-3 text-sm text-gray-500 hover:text-gray-700"
      >
        Retour à la connexion
      </button>
    </div>
  );
}
