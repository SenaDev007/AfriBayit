// P3.7-2 — AuthPages orchestrator (login / register modal).
// Owns all auth state (login, 2FA, register, forgot-password, OAuth) and
// delegates rendering to LoginForm, RegisterForm, ForgotPasswordForm,
// and OAuthButtons. Preserves the public `AuthPages` default export.
//
// P0-1 fix: registration now calls the backend `/auth/register` endpoint
// directly via `authApi.register` (bypassing NextAuth for registration),
// then signs in via NextAuth credentials so both the NextAuth session AND
// the localStorage JWT are set. The 2FA verification no longer hits a
// nonexistent `/api/auth/2fa/verify` route — it calls `signIn` with the
// userId + totpCode, which the NextAuth CredentialsProvider forwards to
// the backend's `/auth/login/2fa` endpoint. Forgot/reset password are
// wired to the backend `/auth/otp/send` and `/auth/otp/verify` endpoints.

'use client';

import Image from 'next/image';
import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { CITIES_BY_COUNTRY, OAUTH_ERROR_MESSAGES, easeOut, registerSteps } from './constants';
import { authApi, setAccessToken, apiFetch } from '@/lib/api-client';
import { useAuthStore } from '@/stores/authStore';
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
  const { setUser } = useAuthStore();

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
    apple: false,
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
    // Detect available OAuth providers via NextAuth's /api/auth/providers
    // endpoint. This is a NextAuth built-in route that returns the JSON list
    // of configured providers, so we know which buttons to render.
    let cancelled = false;
    fetch('/api/auth/providers')
      .then((res) => (res.ok ? res.json() : {}))
      .then((providers: Record<string, { id: string } | undefined>) => {
        if (cancelled) return;
        const ids = new Set(Object.values(providers).map((p) => p?.id).filter(Boolean) as string[]);
        setAvailableProviders({
          google: ids.has('google'),
          facebook: ids.has('facebook'),
          apple: ids.has('apple'),
        });
      })
      .catch(() => {
        // Network error or NextAuth misconfigured — leave all providers hidden.
        if (!cancelled) {
          setAvailableProviders({ google: false, facebook: false, apple: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Client-side rate limiting (CDC §10.2.1 — 5 req/min on auth) ───
  // The backend should also enforce this server-side. This is a first line
  // of defense that prevents obvious brute-force attempts from even hitting
  // the network.
  const loginAttemptsRef = useRef<number[]>([]);
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    // Keep only attempts from the last 60 seconds.
    loginAttemptsRef.current = loginAttemptsRef.current.filter(t => now - t < 60_000);
    if (loginAttemptsRef.current.length >= 5) {
      setLoginError('Trop de tentatives. Veuillez patienter 1 minute avant de réessayer.');
      return false;
    }
    loginAttemptsRef.current.push(now);
    return true;
  };

  // ─── Login handler ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Email et mot de passe requis');
      return;
    }

    // Honeypot check — if the hidden "website" field was filled, silently
    // reject (bot detected). The form element is the EventTarget.
    const form = e.target as HTMLFormElement;
    const honeypot = form.querySelector('input[name="website"]') as HTMLInputElement | null;
    if (honeypot && honeypot.value) {
      // Bot detected — pretend success but don't actually submit.
      return;
    }

    if (!checkRateLimit()) return;

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
      // P0-1 fix: previously this hit a nonexistent `/api/auth/2fa/verify`
      // route. We now call `signIn('credentials', ...)` with the userId +
      // totpCode. The NextAuth CredentialsProvider detects these and
      // forwards to the backend's `/auth/login/2fa` endpoint.
      const result = await signIn('credentials', {
        email: loginEmail.trim(),
        password: loginPassword,
        userId: twoFA.twoFAUserId,
        totpCode: twoFA.twoFACode,
        redirect: false,
      });

      if (result?.ok) {
        onSuccess();
      } else if (result?.error?.includes('2FA_INVALID')) {
        setTwoFAError('Code de vérification invalide');
      } else {
        setTwoFAError('Erreur lors de la connexion. Veuillez réessayer.');
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
      // P0-1 fix: wire to the backend `/auth/otp/send` endpoint (the
      // previous `/api/auth/forgot-password` route was never implemented).
      const data = await authApi.sendOTP(loginEmail.trim()) as Record<string, unknown>;
      if (data?.success) {
        setForgotSuccess(true);
      } else {
        setForgotError((data?.error as string) || "Erreur lors de l'envoi de l'email");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion au serveur';
      setForgotError(message);
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
      // Wire to the backend `/auth/reset-password` endpoint (no fake OTP-only
      // verification). The backend accepts { email, otpCode, newPassword }.
      // A 404 means the endpoint doesn't exist on the backend yet — surface
      // that honestly to the user instead of pretending success.
      const data = await authApi.resetPassword(
        loginEmail.trim(),
        forgot.forgotOtpCode,
        forgot.forgotNewPassword,
      ) as Record<string, unknown>;
      if (data?.success || data?.ok) {
        setResetSuccess(true);
      } else {
        setResetError((data?.error as string) || "Erreur lors de la réinitialisation");
      }
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number; status?: number })?.statusCode || (err as { statusCode?: number; status?: number })?.status;
      if (statusCode === 404) {
        setResetError(
          "Le service de réinitialisation n'est pas disponible. Contactez le support.",
        );
      } else {
        const message = err instanceof Error ? err.message : 'Erreur de connexion au serveur';
        setResetError(message);
      }
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

  const handleAppleLogin = async () => {
    setLoginError('');
    setOauthLoading('apple');
    try {
      await signIn('apple', { callbackUrl: '/' });
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
      // P0-1 fix: call the backend `/auth/register` endpoint directly
      // via `authApi.register` (bypassing NextAuth for registration).
      // The backend returns `{ success, user, accessToken }` on success.
      const data = await authApi.register({
        email: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        country: formData.country,
      }) as Record<string, unknown>;

      const user = (data?.user ?? null) as { id?: string; email?: string; name?: string; role?: string; country?: string; kycLevel?: number } | null;

      if (!data?.success) {
        setRegisterError((data?.error as string) || 'Erreur lors de la création du compte');
        setRegisterLoading(false);
        return;
      }

      // Persist the JWT to localStorage immediately so any subsequent
      // API calls (e.g. profile completion) carry the Authorization
      // header even before NextAuth session is established.
      if (data.accessToken) {
        setAccessToken(data.accessToken as string);
      }
      if (user) {
        setUser({
          id: user.id || '',
          email: user.email || '',
          name: user.name || '',
          role: user.role || 'buyer',
          country: user.country || null,
          kycLevel: user.kycLevel || 0,
          avatar: null,
        });
      }

      // Establish a NextAuth session so `useSession()`-based UI gating
      // works. We pass email + password so the CredentialsProvider can
      // hit `/auth/login` and re-fetch a fresh token (the registration
      // token would also work, but this keeps the session lifecycle
      // consistent with regular logins).
      const result = await signIn('credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        onSuccess();
      } else {
        // Registration succeeded but session establishment failed —
        // still log the user in via the localStorage token by calling
        // onSuccess(). The AppShell session→localStorage sync won't run
        // (no session), but `getAccessToken()` already returns the JWT.
        onSuccess();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur de connexion au serveur';
      setRegisterError(message);
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto custom-scrollbar"
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
                    src="/logo.png"
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
                  onApple={handleAppleLogin}
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
                  onApple={handleAppleLogin}
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
