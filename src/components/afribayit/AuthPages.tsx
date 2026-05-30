'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AuthPagesProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'register') => void;
  onLogin: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const registerSteps = [
  { key: 'email', label: 'Email', icon: '📧' },
  { key: 'otp', label: 'Vérification', icon: '🔐' },
  { key: 'profile', label: 'Profil', icon: '👤' },
  { key: 'kyc', label: 'KYC', icon: '📋' },
  { key: '2fa', label: 'Sécurité', icon: '🛡️' },
];

export default function AuthPages({ mode, onClose, onSwitch, onLogin }: AuthPagesProps) {
  const [registerStep, setRegisterStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '', phone: '', password: '', name: '', otp: '',
    country: 'Bénin', city: 'Cotonou',
  });

  const handleLogin = () => {
    onLogin();
    onClose();
  };

  const handleRegisterNext = () => {
    if (registerStep < registerSteps.length - 1) {
      setRegisterStep(registerStep + 1);
    } else {
      onLogin();
      onClose();
    }
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
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#003087] flex items-center justify-center">
                  <span className="text-white font-bold text-lg font-display">A</span>
                </div>
                <span className="font-display text-lg font-bold text-[#003087]">
                  Afri<span className="text-[#D4AF37]">Bayit</span>
                </span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {mode === 'login' ? (
              <>
                <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-1">Bon retour !</h2>
                <p className="text-sm text-gray-500 mb-6">Connectez-vous à votre compte AfriBayit</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email ou téléphone</label>
                    <input
                      type="text"
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">Mot de passe</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10 transition-all"
                    />
                  </div>

                  <button className="text-xs text-[#003087] font-medium hover:underline">Mot de passe oublié ?</button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleLogin}
                    className="w-full py-3.5 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors"
                  >
                    Se connecter
                  </motion.button>

                  {/* Social Login */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400">ou continuer avec</span></div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { name: 'Google', color: '#4285F4' },
                      { name: 'Facebook', color: '#1877F2' },
                      { name: 'Apple', color: '#000000' },
                    ].map((provider) => (
                      <button
                        key={provider.name}
                        onClick={handleLogin}
                        className="py-3 rounded-2xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {provider.name}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6 pb-6">
                  Pas encore de compte ?{' '}
                  <button onClick={() => onSwitch('register')} className="text-[#003087] font-semibold hover:underline">
                    Créer un compte
                  </button>
                </p>
              </>
            ) : (
              <>
                {/* Register Stepper */}
                <div className="flex items-center gap-1 mb-6">
                  {registerSteps.map((step, i) => (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        i <= registerStep ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {i < registerStep ? '✓' : step.icon}
                      </div>
                      {i < registerSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${
                          i < registerStep ? 'bg-[#003087]' : 'bg-gray-200'
                        }`} />
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

                <div className="space-y-4">
                  {registerStep === 0 && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
                        <input
                          type="email"
                          placeholder="votre@email.com"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Téléphone</label>
                        <input
                          type="tel"
                          placeholder="+229 97 00 00 00"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Mot de passe</label>
                        <input
                          type="password"
                          placeholder="8 caractères minimum"
                          className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                        />
                      </div>
                    </>
                  )}

                  {registerStep === 1 && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📧</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Un code de vérification a été envoyé à votre email</p>
                      <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <input
                            key={i}
                            type="text"
                            maxLength={1}
                            className="w-12 h-14 rounded-2xl border border-gray-200 text-center text-xl font-bold outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {registerStep === 2 && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nom complet</label>
                        <input type="text" placeholder="Kouamé Jean-Marc" className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Pays</label>
                        <select className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087]">
                          <option>Bénin</option>
                          <option>Côte d'Ivoire</option>
                          <option>Burkina Faso</option>
                          <option>Togo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ville</label>
                        <input type="text" placeholder="Cotonou" className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/10" />
                      </div>
                    </>
                  )}

                  {registerStep === 3 && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📋</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Pour débloquer toutes les fonctionnalités, vérifiez votre identité</p>
                      <div className="space-y-2">
                        <button className="w-full py-3 px-4 rounded-2xl border border-gray-200 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <span className="text-xl">🆔</span>
                          <div>
                            <p className="font-medium text-gray-700">Pièce d&apos;identité</p>
                            <p className="text-xs text-gray-400">CNI, passeport ou carte consulaire</p>
                          </div>
                        </button>
                        <button className="w-full py-3 px-4 rounded-2xl border border-gray-200 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <span className="text-xl">📍</span>
                          <div>
                            <p className="font-medium text-gray-700">Justificatif de domicile</p>
                            <p className="text-xs text-gray-400">Facture, bail ou attestation</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {registerStep === 4 && (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-full bg-[#00A651]/10 flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🛡️</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">Sécurisez votre compte avec l&apos;authentification à deux facteurs</p>
                      <div className="space-y-2">
                        <button className="w-full py-3 px-4 rounded-2xl border border-gray-200 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <span className="text-xl">📱</span>
                          <div>
                            <p className="font-medium text-gray-700">SMS</p>
                            <p className="text-xs text-gray-400">Code par SMS à chaque connexion</p>
                          </div>
                        </button>
                        <button className="w-full py-3 px-4 rounded-2xl border border-gray-200 text-sm text-left hover:bg-gray-50 transition-colors flex items-center gap-3">
                          <span className="text-xl">🔑</span>
                          <div>
                            <p className="font-medium text-gray-700">Application Authenticator</p>
                            <p className="text-xs text-gray-400">Google Authenticator, Authy...</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    {registerStep > 0 && (
                      <button
                        onClick={() => setRegisterStep(registerStep - 1)}
                        className="flex-1 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Retour
                      </button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleRegisterNext}
                      className="flex-1 py-3 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors"
                    >
                      {registerStep === registerSteps.length - 1 ? 'Créer mon compte' : 'Continuer'}
                    </motion.button>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500 mt-4 pb-6">
                  Déjà inscrit ?{' '}
                  <button onClick={() => onSwitch('login')} className="text-[#003087] font-semibold hover:underline">
                    Se connecter
                  </button>
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
