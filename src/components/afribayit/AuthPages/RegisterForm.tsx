// P3.7-2 — 3-step register form (email → profile → role).
// Stepper + per-step inputs + navigation buttons + OAuth fallback.

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
import OAuthButtons from './OAuthButtons';
import { CITIES_BY_COUNTRY, COUNTRIES, ROLES, registerSteps } from './constants';
import type { OauthLoadingState, ProviderAvailability, RegisterFormData } from './types';

interface RegisterFormProps {
  formData: RegisterFormData;
  updateFormField: (field: string, value: string) => void;
  registerStep: number;
  setRegisterStep: (v: number) => void;
  setRegisterError: (v: string) => void;
  registerError: string;
  registerLoading: boolean;
  onRegisterNext: () => void;
  // OAuth
  availableProviders: ProviderAvailability;
  oauthLoading: OauthLoadingState;
  onGoogle: () => void;
  onFacebook: () => void;
  // navigation
  onSwitch: (mode: 'login' | 'register') => void;
}

export default function RegisterForm(props: RegisterFormProps) {
  const { t } = useTranslation();
  const {
    formData,
    updateFormField,
    registerStep,
    setRegisterStep,
    setRegisterError,
    registerError,
    registerLoading,
    onRegisterNext,
    availableProviders,
    oauthLoading,
    onGoogle,
    onFacebook,
    onSwitch,
  } = props;

  return (
    <>
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6">
        {registerSteps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                i <= registerStep ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-400'
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

      <h2 className="font-display text-xl font-bold text-[#0a2a5e] mb-1">
        {registerSteps[registerStep].label}
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Étape {registerStep + 1} sur {registerSteps.length}
      </p>

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
              <label htmlFor="reg-email" className="text-xs font-medium text-gray-500 mb-1.5 block">
                {t('auth.email', 'Email')}
              </label>
              <input
                id="reg-email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormField('email', e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
              />
            </div>
            <div>
              <label htmlFor="reg-phone" className="text-xs font-medium text-gray-500 mb-1.5 block">
                {t('auth.registerForm.phone', 'Téléphone')}
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormField('phone', e.target.value)}
                placeholder="+229 97 00 00 00"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="text-xs font-medium text-gray-500 mb-1.5 block">
                {t('auth.password', 'Mot de passe')}
              </label>
              <input
                id="reg-password"
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
              <label htmlFor="reg-confirm-password" className="text-xs font-medium text-gray-500 mb-1.5 block">
                {t('auth.registerForm.confirm', 'Confirmer le mot de passe')}
              </label>
              <input
                id="reg-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormField('confirmPassword', e.target.value)}
                placeholder="Confirmez votre mot de passe"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
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
              <label htmlFor="reg-name" className="text-xs font-medium text-gray-500 mb-1.5 block">
                {t('auth.registerForm.name', 'Nom complet')}
              </label>
              <input
                id="reg-name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormField('name', e.target.value)}
                placeholder="Kouamé Jean-Marc"
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
              />
            </div>
            <div>
              <label htmlFor="reg-country" className="text-xs font-medium text-gray-500 mb-1.5 block">
                Pays
              </label>
              <select
                id="reg-country"
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
              <label htmlFor="reg-city" className="text-xs font-medium text-gray-500 mb-1.5 block">
                Ville
              </label>
              <select
                id="reg-city"
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
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                    formData.role === r.value ? 'border-[#003087]' : 'border-gray-300'
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
              className="flex-1 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Retour
            </button>
          )}
          <motion.button
            whileHover={{ scale: registerLoading ? 1 : 1.01 }}
            whileTap={{ scale: registerLoading ? 1 : 0.99 }}
            type="button"
            onClick={onRegisterNext}
            disabled={registerLoading}
            className="flex-1 py-3 bg-[#003087] text-white rounded-lg font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {registerLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {registerLoading
              ? t('auth.registerForm.submitting', 'Création...')
              : registerStep === registerSteps.length - 1
                ? t('auth.registerForm.submit', 'Créer mon compte')
                : 'Continuer'}
          </motion.button>
        </div>
      </div>

      {/* Social Login — register form */}
      <OAuthButtons
        availableProviders={availableProviders}
        oauthLoading={oauthLoading}
        onGoogle={onGoogle}
        onFacebook={onFacebook}
      />

      <p className="text-center text-sm text-gray-500 mt-4 pb-6">
        {t('auth.registerForm.hasAccount', 'Déjà inscrit ?')}{' '}
        <button
          onClick={() => onSwitch('login')}
          className="text-[#003087] font-semibold hover:underline"
        >
          {t('auth.registerForm.login', 'Se connecter')}
        </button>
      </p>
    </>
  );
}
