'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { Check, Drama, Key, Loader2, Mail, User } from 'lucide-react';

interface AuthPagesProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'register') => void;
  onSuccess: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const registerSteps = [
  { key: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
  { key: 'profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
  { key: 'role', label: 'Rôle', icon: <Drama className="w-4 h-4" /> },
];

const COUNTRIES = [
  { value: 'BJ', label: 'Bénin' },
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'TG', label: 'Togo' },
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  BJ: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi', 'Bohicon'],
  CI: ['Abidjan', 'Bouaké', 'Daloa', 'San-Pédro', 'Yamoussoukro'],
  BF: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
  TG: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Dapaong'],
};

const ROLES = [
  { value: 'buyer', label: 'Acheteur', desc: 'Je cherche un bien immobilier' },
  { value: 'seller', label: 'Vendeur', desc: 'Je veux vendre mon bien' },
  { value: 'agent', label: 'Agent', desc: 'Je suis agent immobilier' },
  { value: 'investor', label: 'Investisseur', desc: 'Je souhaite investir' },
  { value: 'tourist', label: 'Touriste', desc: 'Je cherche un hébergement' },
  { value: 'artisan', label: 'Artisan', desc: 'Je suis artisan du bâtiment' },
];

export default function AuthPages({ mode, onClose, onSwitch, onSuccess }: AuthPagesProps) {
  //  Login state 
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Check for OAuth errors in URL params (e.g. ?error=OAuthAccountNotLinked)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const error = params.get('error');
      if (error) {
        const errorMessages: Record<string, string> = {
          OAuthAccountNotLinked: 'Cet email est déjà associé à un compte avec un autre mode de connexion. Veuillez utiliser la même méthode que lors de votre inscription.',
          OAuthSignin: 'Erreur lors de la connexion via le fournisseur. Veuillez réessayer.',
          OAuthCallback: 'Erreur lors du traitement de la réponse du fournisseur. Veuillez réessayer.',
          OAuthCreateAccount: 'Impossible de créer votre compte. Veuillez réessayer.',
          Callback: 'Erreur de connexion. Veuillez réessayer.',
          Default: 'Une erreur est survenue lors de la connexion.',
        };
        setLoginError(errorMessages[error] || errorMessages.Default || 'Erreur de connexion.');
        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  //  Register state 
  const [registerStep, setRegisterStep] = useState(0);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [formData, setFormData] = useState({
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
    // Reset city when country changes
    if (field === 'country') {
      const cities = CITIES_BY_COUNTRY[value] || [];
      setFormData((prev) => ({ ...prev, city: cities[0] || '' }));
    }
  };

  //  Login handler 
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
        setLoginError('Email ou mot de passe incorrect');
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

  //  Social login handlers 
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleFacebookLogin = () => {
    signIn('facebook', { callbackUrl: '/dashboard' });
  };

  //  Register step validation 
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

  //  Register final submit 
  const handleRegisterSubmit = async () => {
    setRegisterError('');

    if (!canGoNext()) {
      setRegisterError('Veuillez remplir tous les champs');
      return;
    }

    setRegisterLoading(true);
    try {
      // Call the register API
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

      // Auto sign-in after successful registration
      const result = await signIn('credentials', {
        email: formData.email.trim(),
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        onSuccess();
      } else {
        // Registration succeeded but auto-login failed — redirect to login
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

  //  Forgot password handler 
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

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
          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-[#2C2E2F]">
                  Mot de passe oublié
                </h2>
                <button
                  onClick={() => setShowForgotPassword(false)}
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
              <div className="w-16 h-16 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl"><Key className="w-4 h-4" /></span>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
                />
              </div>
              <button
                onClick={() => {
                  alert(
                    `Un email de réinitialisation sera envoyé à ${loginEmail || 'votre adresse'}. (Fonctionnalité en cours de développement)`
                  );
                  setShowForgotPassword(false);
                }}
                className="w-full mt-4 py-3.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors"
              >
                Envoyer le lien
              </button>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full mt-2 py-3 text-sm text-gray-500 hover:text-gray-700"
              >
                Retour à la connexion
              </button>
            </div>
          )}

          {/* Main Auth Content */}
          {!showForgotPassword && (
            <div className="p-6 pb-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <img src="/logo.svg" alt="AfriBayit" className="h-9 w-auto" />
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
                <>
                  {/*  LOGIN FORM  */}
                  <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-1">
                    Bon retour !
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Connectez-vous à votre compte AfriBayit
                  </p>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Error message */}
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
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                        Email
                      </label>
                      <input
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
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                        Mot de passe
                      </label>
                      <input
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
                      onClick={handleForgotPassword}
                      className="text-xs text-[#003087] font-medium hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>

                    <motion.button
                      whileHover={{ scale: loginLoading ? 1 : 1.01 }}
                      whileTap={{ scale: loginLoading ? 1 : 0.99 }}
                      type="submit"
                      disabled={loginLoading}
                      className="w-full py-3.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loginLoading ? 'Connexion...' : 'Se connecter'}
                    </motion.button>

                    {/* Social Login */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 text-gray-400">ou continuer avec</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="py-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
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
                        Google
                      </button>
                      <button
                        type="button"
                        onClick={handleFacebookLogin}
                        className="py-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Facebook
                      </button>
                    </div>
                  </form>

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
              ) : (
                <>
                  {/*  REGISTER FORM  */}
                  {/* Stepper */}
                  <div className="flex items-center gap-1 mb-6">
                    {registerSteps.map((step, i) => (
                      <div key={step.key} className="flex items-center flex-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                            i <= registerStep
                              ? 'bg-[#003087] text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {i < registerStep ? <Check className="w-4 h-4" /> : step.icon}
                        </div>
                        {i < registerSteps.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 rounded transition-colors ${
                              i < registerStep ? 'bg-[#003087]' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-1">
                    {registerSteps[registerStep].label}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Étape {registerStep + 1} sur {registerSteps.length}
                  </p>

                  {/* Error message */}
                  {registerError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-600"
                    >
                      {registerError}
                    </motion.div>
                  )}

                  <div className="space-y-4">
                    {/* Step 0: Email & Password */}
                    {registerStep === 0 && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateFormField('email', e.target.value)}
                            placeholder="votre@email.com"
                            autoComplete="email"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Téléphone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => updateFormField('phone', e.target.value)}
                            placeholder="+229 97 00 00 00"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Mot de passe
                          </label>
                          <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => updateFormField('password', e.target.value)}
                            placeholder="8 caractères minimum"
                            autoComplete="new-password"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                          />
                          {formData.password && formData.password.length < 8 && (
                            <p className="text-xs text-amber-600 mt-1">
                              Le mot de passe doit contenir au moins 8 caractères
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Confirmer le mot de passe
                          </label>
                          <input
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => updateFormField('confirmPassword', e.target.value)}
                            placeholder="Confirmez votre mot de passe"
                            autoComplete="new-password"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                          />
                          {formData.confirmPassword &&
                            formData.password !== formData.confirmPassword && (
                              <p className="text-xs text-red-500 mt-1">
                                Les mots de passe ne correspondent pas
                              </p>
                            )}
                        </div>
                      </>
                    )}

                    {/* Step 1: Profile */}
                    {registerStep === 1 && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Nom complet
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => updateFormField('name', e.target.value)}
                            placeholder="Kouamé Jean-Marc"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Pays
                          </label>
                          <select
                            value={formData.country}
                            onChange={(e) => updateFormField('country', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] bg-white"
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            Ville
                          </label>
                          <select
                            value={formData.city}
                            onChange={(e) => updateFormField('city', e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] bg-white"
                          >
                            {(CITIES_BY_COUNTRY[formData.country] || []).map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Step 2: Role */}
                    {registerStep === 2 && (
                      <div className="space-y-2">
                        {ROLES.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => updateFormField('role', r.value)}
                            className={`w-full py-3 px-4 rounded-2xl border text-sm text-left transition-colors flex items-center gap-3 ${
                              formData.role === r.value
                                ? 'border-[#003087] bg-[#003087]/5 ring-1 ring-[#003087]/20'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                formData.role === r.value
                                  ? 'border-[#003087]'
                                  : 'border-gray-300'
                              }`}
                            >
                              {formData.role === r.value && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#003087]" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">{r.label}</p>
                              <p className="text-xs text-gray-400">{r.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="flex gap-3 pt-2">
                      {registerStep > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setRegisterError('');
                            setRegisterStep(registerStep - 1);
                          }}
                          className="flex-1 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          Retour
                        </button>
                      )}
                      <motion.button
                        whileHover={{ scale: registerLoading ? 1 : 1.01 }}
                        whileTap={{ scale: registerLoading ? 1 : 0.99 }}
                        type="button"
                        onClick={handleRegisterNext}
                        disabled={registerLoading}
                        className="flex-1 py-3 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {registerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {registerLoading
                          ? 'Création...'
                          : registerStep === registerSteps.length - 1
                          ? 'Créer mon compte'
                          : 'Continuer'}
                      </motion.button>
                    </div>
                  </div>

                  <p className="text-center text-sm text-gray-500 mt-4 pb-6">
                    Déjà inscrit ?{' '}
                    <button
                      onClick={() => onSwitch('login')}
                      className="text-[#003087] font-semibold hover:underline"
                    >
                      Se connecter
                    </button>
                  </p>
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
