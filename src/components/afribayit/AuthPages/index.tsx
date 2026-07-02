// P3.7-2 — AuthPages orchestrator (login / register modal).
// Owns all auth state (login, 2FA, register, forgot-password, OAuth) and
// delegates rendering to LoginForm, RegisterForm, ForgotPasswordForm,
// and OAuthButtons. Preserves the public `AuthPages` default export.

'use client';

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { CITIES_BY_COUNTRY, OAUTH_ERROR_MESSAGES, easeOut, registerSteps } from './constants';
import ForgotPasswordForm from './ForgotPasswordForm';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import type {
  AuthPagesProps,
  ForgotPasswordState,
  OauthLoadingState,
  ProviderAvailability,
  RegisterFormData,
  TwoFAState,
} from './types';

export default function AuthPages({ mode, onClose, onSwitch, onSuccess }: AuthPagesProps) {
  // ─── Login state ───
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OauthLoadingState>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // ─── 2FA login state ───
  const [twoFA, setTwoFA] = useState<TwoFAState>({
    show2FA: false,
    twoFACode: '',
    twoFALoading: false,
    twoFAError: '',
    twoFAUserId: '',
  });

  const setTwoFACode = (v: string) => setTwoFA((p) => ({ ...p, twoFACode: v }));
  const setTwoFAError = (v: string) => setTwoFA((p) => ({ ...p, twoFAError: v }));
  const reset2FA = () =>
    setTwoFA({ show2FA: false, twoFACode: '', twoFALoading: false, twoFAError: '', twoFAUserId: '' });

  // ─── Forgot password state ───
  const [forgot, setForgot] = useState<ForgotPasswordState>({
    showForgotPassword: false,
    forgotLoading: false,
    forgotSuccess: false,
    forgotError: '',
    forgotOtpCode: '',
    forgotNewPassword: '',
    resetLoading: false,
    resetError: '',
    resetSuccess: false,
  });

  const setForgotError = (v: string) => setForgot((p) => ({ ...p, forgotError: v }));
  const setForgotSuccess = (v: boolean) => setForgot((p) => ({ ...p, forgotSuccess: v }));
  const setForgotOtpCode = (v: string) => setForgot((p) => ({ ...p, forgotOtpCode: v }));
  const setForgotNewPassword = (v: string) => setForgot((p) => ({ ...p, forgotNewPassword: v }));
  const setResetError = (v: string) => setForgot((p) => ({ ...p, resetError: v }));
  const setResetSuccess = (v: boolean) => setForgot((p) => ({ ...p, resetSuccess: v }));

  // ─── Register state ───
  const [registerStep, setRegisterStep] = useState(0);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    name: '',
    country: 'BJ',
    city: 'Cotonou',
    role: 'buyer',
  });

  const updateFormField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'country') {
      const cities = CITIES_BY_COUNTRY[value] || [];
      setFormData((prev) => ({ ...prev, city: cities[0] || '' }));
    }
  };

  // ─── OAuth provider availability + error detection ───
  const [availableProviders, setAvailableProviders] = useState<ProviderAvailability>({
    google: false,
    facebook: false,
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        setLoginError(OAUTH_ERROR_MESSAGES[error] || OAUTH_ERROR_MESSAGES.Default);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((res) => res.json())
      .then((providers) => {
        setAvailableProviders({
          google: !!providers.google,
          facebook: !!providers.facebook,
        });
      })
      .catch(() => {});
  }, []);

  // ─── Login handler ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Email et mot de passe requis');
      return;
    }

    setLoginLoading(true);
    try {
      const result = await signIn('credentials', {
        email: loginEmail.trim(),
        password: loginPassword,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('2FA_REQUIRED')) {
          const userId = result.error.includes(':')
            ? result.error.split(':').slice(1).join(':')
            : '';
          setTwoFA((p) => ({ ...p, show2FA: true, twoFAUserId: userId }));
          setLoginError('');
        } else if (result.error.includes('2FA_INVALID')) {
          setTwoFAError('Code de vérification invalide');
        } else {
          setLoginError('Email ou mot de passe incorrect');
        }
      } else if (result?.ok) {
        onSuccess();
      } else {
        setLoginError('Une erreur est survenue');
      }
    } catch {
      setLoginError('Erreur de connexion au serveur');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── 2FA verification handler ───
  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFAError('');

    if (!twoFA.twoFACode || twoFA.twoFACode.length !== 6) {
      setTwoFAError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setTwoFA((p) => ({ ...p, twoFALoading: true }));
    try {
      const verifyRes = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: twoFA.twoFAUserId, token: twoFA.twoFACode }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setTwoFAError(verifyData.error || 'Code de vérification invalide');
        setTwoFA((p) => ({ ...p, twoFALoading: false }));
        return;
      }

      const result = await signIn('credentials', {
        email: loginEmail.trim(),
        password: loginPassword,
        totpCode: twoFA.twoFACode,
        redirect: false,
      });

      if (result?.ok) {
        onSuccess();
      } else if (result?.error) {
        setTwoFAError('Erreur lors de la connexion. Veuillez réessayer.');
      } else {
        setTwoFAError('Erreur lors de la connexion');
      }
    } catch {
      setTwoFAError('Erreur de connexion au serveur');
    } finally {
      setTwoFA((p) => ({ ...p, twoFALoading: false }));
    }
  };

  // ─── Forgot password handlers ───
  const handleForgotPasswordSubmit = async () => {
    setForgotError('');
    setForgotSuccess(false);

    if (!loginEmail.trim()) {
      setForgotError('Veuillez entrer votre email');
      return;
    }

    setForgot((p) => ({ ...p, forgotLoading: true }));
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setForgotSuccess(true);
      } else {
        setForgotError(data.error || "Erreur lors de l'envoi de l'email");
      }
    } catch {
      setForgotError('Erreur de connexion au serveur');
    } finally {
      setForgot((p) => ({ ...p, forgotLoading: false }));
    }
  };

  const handleResetPassword = async () => {
    setResetError('');

    if (!forgot.forgotOtpCode || forgot.forgotOtpCode.length !== 6) {
      setResetError('Veuillez entrer le code de vérification à 6 chiffres');
      return;
    }
    if (!forgot.forgotNewPassword || forgot.forgotNewPassword.length < 8) {
      setResetError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setForgot((p) => ({ ...p, resetLoading: true }));
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          code: forgot.forgotOtpCode,
          newPassword: forgot.forgotNewPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setResetSuccess(true);
      } else {
        setResetError(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch {
      setResetError('Erreur de connexion au serveur');
    } finally {
      setForgot((p) => ({ ...p, resetLoading: false }));
    }
  };

  // ─── Social login handlers ───
  // CRITICAL: OAuth providers (Google/Facebook) MUST use redirect: true.
  const handleGoogleLogin = async () => {
    setLoginError('');
    setOauthLoading('google');
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      setLoginError('Erreur de connexion au serveur.');
      setOauthLoading(null);
    }
  };

  const handleFacebookLogin = async () => {
    setLoginError('');
    setOauthLoading('facebook');
    try {
      await signIn('facebook', { callbackUrl: '/' });
    } catch {
      setLoginError('Erreur de connexion au serveur.');
      setOauthLoading(null);
    }
  };

  // ─── Register handlers ───
  const canGoNext = (): boolean => {
    if (registerStep === 0) {
      return (
        formData.email.trim() !== '' &&
        formData.password.length >= 8 &&
        formData.password === formData.confirmPassword
      );
    }
    if (registerStep === 1) {
      return formData.name.trim() !== '' && formData.city.trim() !== '';
    }
    return true;
  };

  const handleRegisterSubmit = async () => {
    setRegisterError('');

    if (!canGoNext()) {
      setRegisterError('Veuillez remplir tous les champs');
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          country: formData.country,
          city: formData.city,
          role: formData.role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRegisterError(data.error || 'Erreur lors de la création du compte');
        setRegisterLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        onSuccess();
      } else {
        onSwitch('login');
      }
    } catch {
      setRegisterError('Erreur de connexion au serveur');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegisterNext = () => {
    if (registerStep < registerSteps.length - 1) {
      if (!canGoNext()) {
        setRegisterError('Veuillez remplir tous les champs correctement');
        return;
      }
      setRegisterError('');
      setRegisterStep(registerStep + 1);
    } else {
      handleRegisterSubmit();
    }
  };

  const handleForgotPassword = () => setShowForgotPassword(true);
  const closeForgot = () => setShowForgotPassword(false);

  // ─── Render ───
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {showForgotPassword ? (
            <ForgotPasswordForm
              state={forgot}
              loginEmail={loginEmail}
              setLoginEmail={setLoginEmail}
              setForgotError={setForgotError}
              setForgotSuccess={setForgotSuccess}
              setForgotOtpCode={setForgotOtpCode}
              setForgotNewPassword={setForgotNewPassword}
              setResetError={setResetError}
              setResetSuccess={setResetSuccess}
              onSubmitEmail={handleForgotPasswordSubmit}
              onSubmitReset={handleResetPassword}
              onClose={closeForgot}
            />
          ) : (
            <div className="p-6 pb-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Image
                    src="/logo.svg"
                    alt="AfriBayit"
                    width={160}
                    height={36}
                    className="h-9 w-auto"
                    priority
                  />
                  <span className="font-display text-lg font-bold text-[#003087]">
                    Afri<span className="text-[#D4AF37]">Bayit</span>
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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

              {mode === 'login' ? (
                <LoginForm
                  loginEmail={loginEmail}
                  setLoginEmail={setLoginEmail}
                  loginPassword={loginPassword}
                  setLoginPassword={setLoginPassword}
                  loginError={loginError}
                  setLoginError={setLoginError}
                  loginLoading={loginLoading}
                  onLoginSubmit={handleLogin}
                  onForgotPassword={handleForgotPassword}
                  twoFA={twoFA}
                  setTwoFACode={setTwoFACode}
                  setTwoFAError={setTwoFAError}
                  reset2FA={reset2FA}
                  on2FAVerify={handle2FAVerify}
                  availableProviders={availableProviders}
                  oauthLoading={oauthLoading}
                  onGoogle={handleGoogleLogin}
                  onFacebook={handleFacebookLogin}
                  onSwitch={onSwitch}
                />
              ) : (
                <RegisterForm
                  formData={formData}
                  updateFormField={updateFormField}
                  registerStep={registerStep}
                  setRegisterStep={setRegisterStep}
                  setRegisterError={setRegisterError}
                  registerError={registerError}
                  registerLoading={registerLoading}
                  onRegisterNext={handleRegisterNext}
                  availableProviders={availableProviders}
                  oauthLoading={oauthLoading}
                  onGoogle={handleGoogleLogin}
                  onFacebook={handleFacebookLogin}
                  onSwitch={onSwitch}
                />
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
