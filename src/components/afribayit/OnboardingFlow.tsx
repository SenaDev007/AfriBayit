'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

export interface OnboardingData {
  profileType: string;
  countries: string[];
  cities: string[];
  budgetMin: number;
  budgetMax: number;
  goals: string[];
  alertFrequency: string;
  notificationChannels: string[];
  rebeccaEnabled: boolean;
}

const initialOnboardingData: OnboardingData = {
  profileType: '',
  countries: [],
  cities: [],
  budgetMin: 0,
  budgetMax: 0,
  goals: [],
  alertFrequency: 'instant',
  notificationChannels: ['push', 'email'],
  rebeccaEnabled: true,
};

// CDC §2 — Easing curve
const easeOut = [0.16, 1, 0.3, 1] as const;

const onboardingSteps = [
  { step: 1, title: 'Bienvenue', icon: '👋' },
  { step: 2, title: 'Profil', icon: '👤' },
  { step: 3, title: 'Localisation', icon: '🌍' },
  { step: 4, title: 'Budget', icon: '💰' },
  { step: 5, title: 'Alertes', icon: '🔔' },
  { step: 6, title: 'Découverte', icon: '🗺️' },
  { step: 7, title: 'Rebecca IA', icon: '🤖' },
];

// Profile types — CDC §4.2
const profileTypes = [
  { value: 'acheteur', label: 'Acheteur', icon: '🏠', desc: 'Je cherche à acheter un bien immobilier', color: '#003087' },
  { value: 'vendeur', label: 'Vendeur', icon: '🏷️', desc: 'Je souhaite vendre ou louer un bien', color: '#D4AF37' },
  { value: 'investisseur', label: 'Investisseur', icon: '📈', desc: 'Je cherche des opportunités d\'investissement', color: '#009CDE' },
  { value: 'touriste', label: 'Touriste', icon: '✈️', desc: 'Je cherche un hébergement temporaire', color: '#00A651' },
  { value: 'artisan', label: 'Artisan', icon: '🔨', desc: 'Je suis artisan et propose mes services', color: '#2C2E2F' },
];

// Countries — AfriBayit pilot zone
const countries = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

// Cities by country
const citiesByCountry: Record<string, { value: string; label: string }[]> = {
  BJ: [
    { value: 'cotonou', label: 'Cotonou' },
    { value: 'porto-novo', label: 'Porto-Novo' },
    { value: 'parakou', label: 'Parakou' },
    { value: 'abomey-calavi', label: 'Abomey-Calavi' },
    { value: 'ouidah', label: 'Ouidah' },
  ],
  CI: [
    { value: 'abidjan', label: 'Abidjan' },
    { value: 'yamoussoukro', label: 'Yamoussoukro' },
    { value: 'bouake', label: 'Bouaké' },
    { value: 'san-pedro', label: 'San Pedro' },
    { value: 'korhogo', label: 'Korhogo' },
  ],
  BF: [
    { value: 'ouagadougou', label: 'Ouagadougou' },
    { value: 'bobo-dioulasso', label: 'Bobo-Dioulasso' },
    { value: 'koudougou', label: 'Koudougou' },
    { value: 'banfora', label: 'Banfora' },
  ],
  TG: [
    { value: 'lome', label: 'Lomé' },
    { value: 'sokode', label: 'Sokodé' },
    { value: 'kara', label: 'Kara' },
    { value: 'kpalime', label: 'Kpalimé' },
  ],
};

// Goals
const goalOptions = [
  { value: 'residence', label: 'Résidence principale', icon: '🏠' },
  { value: 'investissement', label: 'Investissement locatif', icon: '📈' },
  { value: 'vacances', label: 'Résidence secondaire / vacances', icon: '🏖️' },
  { value: 'commercial', label: 'Local commercial', icon: '🏪' },
  { value: 'terrain', label: 'Terrain constructible', icon: '🗺️' },
  { value: 'neuf', label: 'Programme neuf', icon: '🏗️' },
];

// Budget presets (FCFA)
const budgetPresets = [
  { label: '< 10M', min: 0, max: 10_000_000 },
  { label: '10M – 50M', min: 10_000_000, max: 50_000_000 },
  { label: '50M – 100M', min: 50_000_000, max: 100_000_000 },
  { label: '> 100M', min: 100_000_000, max: 500_000_000 },
];

// Alert frequencies
const alertFrequencies = [
  { value: 'instant', label: 'Instantanée', desc: 'Dès qu\'un bien correspond' },
  { value: 'daily', label: 'Quotidienne', desc: 'Résumé journalier' },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Résumé hebdomadaire' },
];

// Notification channels — CDC §4.2
const notificationChannels = [
  { value: 'email', label: 'Email', icon: '📧', desc: 'Recevez les alertes par courriel' },
  { value: 'sms', label: 'SMS', icon: '💬', desc: 'Notifications par texto' },
  { value: 'push', label: 'Notifications push', icon: '📱', desc: 'Alertes sur votre appareil' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📲', desc: 'Messages via WhatsApp' },
];

// Interactive tour items — CDC §4.2
const tourItems = [
  { icon: '🔍', title: 'Recherche intelligente', desc: 'Trouvez des biens filtrés par pays, ville, budget et plus', color: '#003087' },
  { icon: '🔒', title: 'Escrow sécurisé', desc: 'Vos fonds sont protégés pendant toute la transaction', color: '#00A651' },
  { icon: '🌍', title: 'GeoTrust', desc: 'Validation géomatique et vérification des limites de propriété', color: '#009CDE' },
  { icon: '🔨', title: 'Marché artisans', desc: 'Trouvez des artisans certifiés pour vos travaux', color: '#D4AF37' },
  { icon: '📚', title: 'Académie', desc: 'Formations en droit foncier, investissement et construction', color: '#2C2E2F' },
  { icon: '🤖', title: 'Rebecca IA', desc: 'Votre assistante IA disponible 24/7 pour vous guider', color: '#9333ea' },
];

// Rebecca capabilities
const rebeccaCapabilities = [
  { icon: '🔍', label: 'Recherche de biens' },
  { icon: '🔒', label: 'Suivi escrow' },
  { icon: '👤', label: 'Contacter agents' },
  { icon: '🔨', label: 'Devis artisans' },
  { icon: '📊', label: 'Prix du marché' },
  { icon: '🌍', label: 'GeoTrust' },
];

export default function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleArrayItem = useCallback((field: keyof OnboardingData, value: string) => {
    setData(prev => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      };
    });
  }, []);

  const goToStep = (step: number) => {
    if (isAnimating) return;
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return true;
      case 2: return !!data.profileType;
      case 3: return data.countries.length > 0;
      case 4: return data.budgetMax > 0;
      case 5: return data.notificationChannels.length > 0;
      case 6: return true;
      case 7: return true;
      default: return false;
    }
  };

  const handleComplete = () => {
    onComplete(data);
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  const slideVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir * 60,
      scale: 0.96,
    }),
    center: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: -dir * 60,
      scale: 0.96,
    }),
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] overflow-y-auto"
    >
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#003087] via-[#001f5c] to-[#003087]" />
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-full blur-[120px] animate-float-1" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#009CDE] rounded-full blur-[150px] animate-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A651] rounded-full blur-[100px] animate-float-3" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="sticky top-0 z-10 glass-navy border-b border-white/10 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={currentStep === 1 ? onClose : () => goToStep(currentStep - 1)}
                className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label={currentStep === 1 ? 'Fermer' : 'Retour'}
              >
                <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={currentStep === 1 ? "M6 18L18 6M6 6l12 12" : "M15 19l-7-7 7-7"} />
                </svg>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/90 font-body">Étape {currentStep}/7</span>
                <span className="text-xs text-[#D4AF37] font-mono-data">{Math.round((currentStep / 7) * 100)}%</span>
              </div>
              {currentStep < 7 ? (
                <button
                  onClick={handleSkip}
                  className="text-xs text-white/50 hover:text-white/80 transition-colors font-medium"
                >
                  Passer
                </button>
              ) : <div className="w-12" />}
            </div>
            <div className="flex gap-1">
              {onboardingSteps.map((s) => (
                <motion.div
                  key={s.step}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                    currentStep >= s.step
                      ? s.step === currentStep
                        ? 'bg-[#D4AF37]'
                        : 'bg-white/80'
                      : 'bg-white/20'
                  }`}
                  layout
                />
              ))}
            </div>
            {/* Step labels */}
            <div className="flex justify-between mt-2">
              {onboardingSteps.map((s) => (
                <span
                  key={s.step}
                  className={`text-[9px] font-medium transition-colors ${
                    currentStep === s.step ? 'text-[#D4AF37]' : currentStep > s.step ? 'text-white/60' : 'text-white/30'
                  }`}
                >
                  {s.title}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction} onExitComplete={() => setIsAnimating(false)}>
              {/* ====== STEP 1: Welcome & Platform Discovery ====== */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#D4AF37] flex items-center justify-center mx-auto mb-8 gold-glow"
                  >
                    <span className="text-5xl">🏠</span>
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-display text-4xl sm:text-5xl font-bold text-white mb-4"
                  >
                    Bienvenue sur{' '}
                    <span className="bg-gradient-to-r from-[#D4AF37] to-[#FFD700] bg-clip-text text-transparent">
                      AfriBayit
                    </span>
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/70 text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed"
                  >
                    La première plateforme immobilière sécurisée d&apos;Afrique de l&apos;Ouest.
                    Escrow, GeoTrust, notaires certifiés — tout pour une transaction en toute confiance.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto mb-10"
                  >
                    {[
                      { icon: '🔒', label: 'Escrow', desc: 'Paiement sécurisé' },
                      { icon: '🌍', label: 'GeoTrust', desc: 'Vérification foncière' },
                      { icon: '⚖️', label: 'Notaires', desc: 'Actes certifiés' },
                      { icon: '🔨', label: 'Artisans', desc: 'BTP certifiés' },
                      { icon: '📚', label: 'Académie', desc: 'Formations' },
                      { icon: '🤖', label: 'Rebecca IA', desc: 'Assistante 24/7' },
                    ].map((feature, i) => (
                      <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all cursor-default"
                      >
                        <span className="text-2xl block mb-2">{feature.icon}</span>
                        <p className="text-sm font-semibold text-white">{feature.label}</p>
                        <p className="text-[10px] text-white/50">{feature.desc}</p>
                      </motion.div>
                    ))}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => goToStep(2)}
                      className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#003087] rounded-full font-bold text-base hover:shadow-lg gold-glow transition-shadow"
                    >
                      Commencer la configuration 🚀
                    </motion.button>
                    <button
                      onClick={handleSkip}
                      className="px-6 py-4 text-white/60 hover:text-white/90 transition-colors text-sm font-medium"
                    >
                      Explorer d&apos;abord la plateforme
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {/* ====== STEP 2: Profile Type Selection ====== */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                >
                  <div className="text-center mb-8">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl mb-3 block"
                    >
                      👤
                    </motion.span>
                    <h2 className="font-display text-3xl font-bold text-white mb-2">
                      Quel est votre profil ?
                    </h2>
                    <p className="text-sm text-white/60">Cela nous aide à personnaliser votre expérience</p>
                  </div>

                  <div className="space-y-3">
                    {profileTypes.map((pt, i) => (
                      <motion.button
                        key={pt.value}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateData({ profileType: pt.value })}
                        className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center gap-4 ${
                          data.profileType === pt.value
                            ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                            : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${pt.color}20` }}
                        >
                          <span className="text-2xl">{pt.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white text-base">{pt.label}</p>
                          <p className="text-xs text-white/50">{pt.desc}</p>
                        </div>
                        {data.profileType === pt.value && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="w-7 h-7 rounded-full bg-[#D4AF37] flex items-center justify-center shrink-0"
                          >
                            <svg className="w-4 h-4 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ====== STEP 3: Geographic Preferences ====== */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                >
                  <div className="text-center mb-8">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl mb-3 block"
                    >
                      🌍
                    </motion.span>
                    <h2 className="font-display text-3xl font-bold text-white mb-2">
                      Vos préférences géographiques
                    </h2>
                    <p className="text-sm text-white/60">Dans quels pays et villes recherchez-vous ?</p>
                  </div>

                  {/* Country Selection */}
                  <div className="mb-8">
                    <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
                      Pays d&apos;intérêt
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {countries.map((c, i) => (
                        <motion.button
                          key={c.code}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleArrayItem('countries', c.code)}
                          className={`p-5 rounded-3xl border-2 text-center transition-all ${
                            data.countries.includes(c.code)
                              ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                          }`}
                        >
                          <span className="text-3xl block mb-2">{c.flag}</span>
                          <p className="text-sm font-semibold text-white">{c.name}</p>
                          {data.countries.includes(c.code) && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center mx-auto mt-2"
                            >
                              <svg className="w-3 h-3 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* City Selection */}
                  {data.countries.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
                        Villes d&apos;intérêt
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {data.countries.flatMap(countryCode =>
                          (citiesByCountry[countryCode] || []).map((city, i) => (
                            <motion.button
                              key={city.value}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => toggleArrayItem('cities', city.value)}
                              className={`px-4 py-2.5 rounded-full text-xs font-medium transition-all ${
                                data.cities.includes(city.value)
                                  ? 'bg-[#D4AF37] text-[#003087]'
                                  : 'bg-white/10 text-white/70 hover:bg-white/15'
                              }`}
                            >
                              {data.cities.includes(city.value) && '✓ '}
                              {city.label}
                            </motion.button>
                          ))
                        )}
                      </div>
                      {data.cities.length === 0 && (
                        <p className="text-xs text-white/40 mt-2 italic">Sélectionnez au moins une ville</p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ====== STEP 4: Budget & Goals ====== */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                >
                  <div className="text-center mb-8">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl mb-3 block"
                    >
                      💰
                    </motion.span>
                    <h2 className="font-display text-3xl font-bold text-white mb-2">
                      Votre budget et objectifs
                    </h2>
                    <p className="text-sm text-white/60">Aidez-nous à vous proposer les meilleures opportunités</p>
                  </div>

                  {/* Budget Presets */}
                  <div className="mb-8">
                    <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
                      Fourchette de budget (FCFA)
                    </label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {budgetPresets.map((preset, i) => (
                        <motion.button
                          key={preset.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => updateData({ budgetMin: preset.min, budgetMax: preset.max })}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${
                            data.budgetMin === preset.min && data.budgetMax === preset.max
                              ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                          }`}
                        >
                          <p className="text-sm font-bold text-white font-mono-data">{preset.label}</p>
                          <p className="text-[10px] text-white/40">FCFA</p>
                        </motion.button>
                      ))}
                    </div>

                    {/* Custom budget range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-white/40 mb-1 block">Minimum</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={data.budgetMin || ''}
                          onChange={(e) => updateData({ budgetMin: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-data font-bold placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/40 mb-1 block">Maximum</label>
                        <input
                          type="number"
                          placeholder="Ex: 50 000 000"
                          value={data.budgetMax || ''}
                          onChange={(e) => updateData({ budgetMax: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono-data font-bold placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
                      Vos objectifs
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {goalOptions.map((goal, i) => (
                        <motion.button
                          key={goal.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          onClick={() => toggleArrayItem('goals', goal.value)}
                          className={`p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                            data.goals.includes(goal.value)
                              ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50'
                              : 'bg-white/5 border-white/10 hover:bg-white/8'
                          }`}
                        >
                          <span className="text-xl">{goal.icon}</span>
                          <span className="text-xs font-medium text-white/80">{goal.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ====== STEP 5: Alert & Notification Preferences ====== */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                >
                  <div className="text-center mb-8">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl mb-3 block"
                    >
                      🔔
                    </motion.span>
                    <h2 className="font-display text-3xl font-bold text-white mb-2">
                      Alertes & Notifications
                    </h2>
                    <p className="text-sm text-white/60">Configurez comment vous souhaitez être informé</p>
                  </div>

                  {/* Alert Frequency */}
                  <div className="mb-8">
                    <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
                      Fréquence des alertes
                    </label>
                    <div className="space-y-3">
                      {alertFrequencies.map((freq, i) => (
                        <motion.button
                          key={freq.value}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => updateData({ alertFrequency: freq.value })}
                          className={`w-full p-5 rounded-3xl border-2 text-left transition-all flex items-center justify-between ${
                            data.alertFrequency === freq.value
                              ? 'bg-white/10 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                              : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-white">{freq.label}</p>
                            <p className="text-xs text-white/50">{freq.desc}</p>
                          </div>
                          {data.alertFrequency === freq.value && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-6 h-6 rounded-full bg-[#D4AF37] flex items-center justify-center shrink-0"
                            >
                              <svg className="w-3.5 h-3.5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div>
                    <label className="text-xs text-white/50 mb-3 block font-semibold uppercase tracking-wider">
                      Canaux de notification
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {notificationChannels.map((ch, i) => (
                        <motion.button
                          key={ch.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => {
                            const channels = data.notificationChannels.includes(ch.value)
                              ? data.notificationChannels.filter(c => c !== ch.value)
                              : [...data.notificationChannels, ch.value];
                            updateData({ notificationChannels: channels });
                          }}
                          className={`p-5 rounded-2xl border-2 text-center transition-all ${
                            data.notificationChannels.includes(ch.value)
                              ? 'bg-white/10 border-[#D4AF37]'
                              : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                          }`}
                        >
                          <span className="text-2xl block mb-2">{ch.icon}</span>
                          <p className="text-sm font-semibold text-white">{ch.label}</p>
                          <p className="text-[10px] text-white/40 mt-1">{ch.desc}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ====== STEP 6: Interactive Tour ====== */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                >
                  <div className="text-center mb-8">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-4xl mb-3 block"
                    >
                      🗺️
                    </motion.span>
                    <h2 className="font-display text-3xl font-bold text-white mb-2">
                      Découvrez la plateforme
                    </h2>
                    <p className="text-sm text-white/60">Voici un aperçu des fonctionnalités clés d&apos;AfriBayit</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tourItems.map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.12, duration: 0.4, ease: easeOut }}
                        whileHover={{ scale: 1.03, y: -2 }}
                        className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-default"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          <span className="text-xl">{item.icon}</span>
                        </div>
                        <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                        <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-6 p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20"
                  >
                    <p className="text-xs text-[#D4AF37] text-center">
                      💡 Astuce : Vous pouvez accéder à toutes ces fonctionnalités depuis le menu principal à tout moment.
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* ====== STEP 7: AI Activation ====== */}
              {currentStep === 7 && (
                <motion.div
                  key="step7"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeOut }}
                  onAnimationStart={() => setIsAnimating(true)}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 150, delay: 0.1 }}
                    className="w-28 h-28 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#009CDE]/30"
                  >
                    <span className="text-5xl font-bold text-white font-display">R</span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-display text-3xl font-bold text-white mb-3"
                  >
                    Activez Rebecca, votre assistante IA
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-white/60 max-w-md mx-auto mb-8 leading-relaxed"
                  >
                    Rebecca est votre assistante IA personnelle. Elle peut rechercher des biens, suivre vos transactions,
                    contacter des agents, et bien plus — disponible 24/7.
                  </motion.p>

                  {/* Rebecca capabilities */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto mb-8"
                  >
                    {rebeccaCapabilities.map((cap, i) => (
                      <motion.div
                        key={cap.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.06 }}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center"
                      >
                        <span className="text-lg block mb-1">{cap.icon}</span>
                        <span className="text-[10px] font-medium text-white/60">{cap.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Activation Toggle */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="p-5 rounded-3xl bg-white/5 border border-white/10 max-w-sm mx-auto mb-8"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-semibold text-white">Activer Rebecca IA</p>
                        <p className="text-[10px] text-white/40">Rebecca sera accessible depuis le chat en bas à droite</p>
                      </div>
                      <button
                        onClick={() => updateData({ rebeccaEnabled: !data.rebeccaEnabled })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          data.rebeccaEnabled ? 'bg-[#00A651]' : 'bg-white/20'
                        }`}
                      >
                        <motion.div
                          layout
                          className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg"
                          style={{ left: data.rebeccaEnabled ? '1.75rem' : '0.125rem' }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  </motion.div>

                  {/* Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="p-5 rounded-3xl bg-white/5 border border-white/10 max-w-sm mx-auto text-left"
                  >
                    <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-4">Récapitulatif de votre configuration</p>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Profil</span>
                        <span className="font-semibold text-white">
                          {profileTypes.find(p => p.value === data.profileType)?.label || '—'}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Zone</span>
                        <span className="font-semibold text-white">
                          {data.countries.map(c => countries.find(co => co.code === c)?.name).join(', ') || '—'}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Villes</span>
                        <span className="font-semibold text-white">
                          {data.cities.length > 0 ? `${data.cities.length} ville${data.cities.length > 1 ? 's' : ''}` : '—'}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Budget max</span>
                        <span className="font-semibold text-white font-mono-data">
                          {data.budgetMax ? new Intl.NumberFormat('fr-FR').format(data.budgetMax) + ' FCFA' : '—'}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Objectifs</span>
                        <span className="font-semibold text-white">
                          {data.goals.length > 0
                            ? data.goals.map(g => goalOptions.find(o => o.value === g)?.label).join(', ')
                            : '—'}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Alertes</span>
                        <span className="font-semibold text-white">
                          {alertFrequencies.find(f => f.value === data.alertFrequency)?.label || '—'}
                        </span>
                      </div>
                      <div className="h-px bg-white/10" />
                      <div className="flex justify-between items-center">
                        <span className="text-white/50">Rebecca IA</span>
                        <span className={`font-semibold ${data.rebeccaEnabled ? 'text-[#00A651]' : 'text-white/30'}`}>
                          {data.rebeccaEnabled ? '✓ Activée' : 'Désactivée'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 glass-navy border-t border-white/10 px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {currentStep > 1 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => goToStep(currentStep - 1)}
                className="px-6 py-3.5 border border-white/20 rounded-full text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors"
              >
                Retour
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (currentStep < 7) goToStep(currentStep + 1);
                else handleComplete();
              }}
              disabled={!canProceed()}
              className="flex-1 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#003087] rounded-full font-bold text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {currentStep === 7 ? '🚀 Commencer !' : 'Continuer'}
            </motion.button>
          </div>
          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-3">
            {onboardingSteps.map((s) => (
              <button
                key={s.step}
                onClick={() => {
                  if (s.step < currentStep) goToStep(s.step);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentStep === s.step
                    ? 'bg-[#D4AF37] w-6'
                    : currentStep > s.step
                      ? 'bg-white/60 cursor-pointer'
                      : 'bg-white/20'
                }`}
                aria-label={`Aller à l'étape ${s.step}`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
