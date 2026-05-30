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
  { value: 'acheteur', label: 'Acheteur', icon: '🏠', desc: 'Je cherche à acheter un bien immobilier' },
  { value: 'vendeur', label: 'Vendeur', icon: '🏷️', desc: 'Je souhaite vendre ou louer un bien' },
  { value: 'investisseur', label: 'Investisseur', icon: '📈', desc: 'Je cherche des opportunités d\'investissement' },
  { value: 'touriste', label: 'Touriste', icon: '✈️', desc: 'Je cherche un hébergement temporaire' },
  { value: 'artisan', label: 'Artisan', icon: '🔨', desc: 'Je suis artisan et propose mes services' },
];

// Countries
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
  ],
  CI: [
    { value: 'abidjan', label: 'Abidjan' },
    { value: 'yamoussoukro', label: 'Yamoussoukro' },
    { value: 'bouake', label: 'Bouaké' },
    { value: 'san-pedro', label: 'San Pedro' },
  ],
  BF: [
    { value: 'ouagadougou', label: 'Ouagadougou' },
    { value: 'bobo-dioulasso', label: 'Bobo-Dioulasso' },
    { value: 'koudougou', label: 'Koudougou' },
  ],
  TG: [
    { value: 'lome', label: 'Lomé' },
    { value: 'sokode', label: 'Sokodé' },
    { value: 'kara', label: 'Kara' },
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

// Alert frequencies
const alertFrequencies = [
  { value: 'instant', label: 'Instantanée', desc: 'Dès qu\'un bien correspond' },
  { value: 'daily', label: 'Quotidienne', desc: 'Résumé journalier' },
  { value: 'weekly', label: 'Hebdomadaire', desc: 'Résumé hebdomadaire' },
];

// Notification channels
const notificationChannels = [
  { value: 'push', label: 'Notifications push', icon: '📱' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '💬' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📲' },
];

// Interface tour items
const tourItems = [
  { icon: '🔍', title: 'Recherche intelligente', desc: 'Trouvez des biens filtrés par pays, ville, budget et plus' },
  { icon: '🔒', title: 'Escrow sécurisé', desc: 'Vos fonds sont protégés pendant toute la transaction' },
  { icon: '🌍', title: 'GeoTrust', desc: 'Validation géomatique et vérification des limites de propriété' },
  { icon: '🔨', title: 'Marché artisans', desc: 'Trouvez des artisans certifiés pour vos travaux' },
  { icon: '📚', title: 'Académie', desc: 'Formations en droit foncier, investissement et construction' },
  { icon: '🤖', title: 'Rebecca IA', desc: 'Votre assistante IA disponible 24/7' },
];

export default function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [direction, setDirection] = useState(1);

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

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 50 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: -dir * 50 }),
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-white overflow-y-auto"
    >
      <div className="min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={currentStep === 1 ? onClose : () => goToStep(currentStep - 1)}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={currentStep === 1 ? 'Fermer' : 'Retour'}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={currentStep === 1 ? "M6 18L18 6M6 6l12 12" : "M15 19l-7-7 7-7"} />
                </svg>
              </button>
              <span className="text-sm font-semibold text-[#003087]">Étape {currentStep}/7</span>
              <div className="w-8" /> {/* Spacer */}
            </div>
            <div className="flex gap-1">
              {onboardingSteps.map((s) => (
                <div
                  key={s.step}
                  className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                    currentStep >= s.step ? 'bg-[#003087]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-start justify-center px-4 py-8">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 1: Welcome */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-[#003087] to-[#009CDE] flex items-center justify-center mx-auto mb-6"
                  >
                    <span className="text-4xl">🏠</span>
                  </motion.div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2C2E2F] mb-3">
                    Bienvenue sur <span className="text-[#003087]">AfriBayit</span>
                  </h1>
                  <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-8">
                    La première plateforme immobilière sécurisée d&apos;Afrique de l&apos;Ouest.
                    Escrow, GeoTrust, notaires certifiés — tout pour une transaction en toute confiance.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-md mx-auto">
                    {['🔒 Escrow', '🌍 GeoTrust', '⚖️ Notaires', '🔨 Artisans', '📚 Académie', '🤖 Rebecca IA'].map((feature) => (
                      <div key={feature} className="p-3 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 text-center">
                        {feature}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Profile Type */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="text-center mb-6">
                    <span className="text-3xl mb-3 block">👤</span>
                    <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Quel est votre profil ?</h2>
                    <p className="text-sm text-gray-500">Cela nous aide à personnaliser votre expérience</p>
                  </div>
                  <div className="space-y-3">
                    {profileTypes.map((pt) => (
                      <motion.button
                        key={pt.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateData({ profileType: pt.value })}
                        className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                          data.profileType === pt.value
                            ? 'border-[#003087] bg-[#003087]/5'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <span className="text-3xl">{pt.icon}</span>
                        <div>
                          <p className="font-semibold text-[#2C2E2F]">{pt.label}</p>
                          <p className="text-xs text-gray-500">{pt.desc}</p>
                        </div>
                        {data.profileType === pt.value && (
                          <svg className="w-5 h-5 text-[#003087] ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Geographic Preferences */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="text-center mb-6">
                    <span className="text-3xl mb-3 block">🌍</span>
                    <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Vos préférences géographiques</h2>
                    <p className="text-sm text-gray-500">Dans quels pays et villes recherchez-vous ?</p>
                  </div>

                  {/* Country Selection */}
                  <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-2 block font-semibold">Pays d&apos;intérêt</label>
                    <div className="grid grid-cols-2 gap-3">
                      {countries.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => toggleArrayItem('countries', c.code)}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${
                            data.countries.includes(c.code)
                              ? 'border-[#003087] bg-[#003087]/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{c.flag}</span>
                          <p className="text-sm font-semibold text-[#2C2E2F]">{c.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* City Selection */}
                  {data.countries.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                    >
                      <label className="text-xs text-gray-500 mb-2 block font-semibold">Villes d&apos;intérêt</label>
                      <div className="flex flex-wrap gap-2">
                        {data.countries.flatMap(countryCode =>
                          (citiesByCountry[countryCode] || []).map(city => (
                            <button
                              key={city.value}
                              onClick={() => toggleArrayItem('cities', city.value)}
                              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                                data.cities.includes(city.value)
                                  ? 'bg-[#003087] text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {city.label}
                            </button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Budget & Goals */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="text-center mb-6">
                    <span className="text-3xl mb-3 block">💰</span>
                    <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Votre budget et objectifs</h2>
                    <p className="text-sm text-gray-500">Aidez-nous à vous proposer les meilleures opportunités</p>
                  </div>

                  {/* Budget Range */}
                  <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-2 block font-semibold">Fourchette de budget (FCFA)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="number"
                          placeholder="Minimum"
                          value={data.budgetMin || ''}
                          onChange={(e) => updateData({ budgetMin: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:outline-none focus:border-[#003087]"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Maximum"
                          value={data.budgetMax || ''}
                          onChange={(e) => updateData({ budgetMax: Number(e.target.value) })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-mono font-bold focus:outline-none focus:border-[#003087]"
                        />
                      </div>
                    </div>
                    {/* Budget presets */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        { label: '< 10M', min: 0, max: 10000000 },
                        { label: '10M - 50M', min: 10000000, max: 50000000 },
                        { label: '50M - 100M', min: 50000000, max: 100000000 },
                        { label: '> 100M', min: 100000000, max: 500000000 },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          onClick={() => updateData({ budgetMin: preset.min, budgetMax: preset.max })}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            data.budgetMin === preset.min && data.budgetMax === preset.max
                              ? 'bg-[#003087] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {preset.label} FCFA
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goals */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block font-semibold">Vos objectifs</label>
                    <div className="grid grid-cols-2 gap-2">
                      {goalOptions.map((goal) => (
                        <button
                          key={goal.value}
                          onClick={() => toggleArrayItem('goals', goal.value)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                            data.goals.includes(goal.value)
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-lg">{goal.icon}</span>
                          <span className="text-xs font-medium text-[#2C2E2F]">{goal.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Alerts & Notifications */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="text-center mb-6">
                    <span className="text-3xl mb-3 block">🔔</span>
                    <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Alertes & Notifications</h2>
                    <p className="text-sm text-gray-500">Configurez comment vous souhaitez être informé</p>
                  </div>

                  {/* Alert Frequency */}
                  <div className="mb-6">
                    <label className="text-xs text-gray-500 mb-2 block font-semibold">Fréquence des alertes</label>
                    <div className="space-y-2">
                      {alertFrequencies.map((freq) => (
                        <button
                          key={freq.value}
                          onClick={() => updateData({ alertFrequency: freq.value })}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                            data.alertFrequency === freq.value
                              ? 'border-[#003087] bg-[#003087]/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#2C2E2F]">{freq.label}</p>
                            <p className="text-xs text-gray-500">{freq.desc}</p>
                          </div>
                          {data.alertFrequency === freq.value && (
                            <svg className="w-5 h-5 text-[#003087] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notification Channels */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block font-semibold">Canaux de notification</label>
                    <div className="grid grid-cols-2 gap-2">
                      {notificationChannels.map((ch) => (
                        <button
                          key={ch.value}
                          onClick={() => {
                            const channels = data.notificationChannels.includes(ch.value)
                              ? data.notificationChannels.filter(c => c !== ch.value)
                              : [...data.notificationChannels, ch.value];
                            updateData({ notificationChannels: channels });
                          }}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            data.notificationChannels.includes(ch.value)
                              ? 'border-[#003087] bg-[#003087]/5'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <span className="text-lg block mb-1">{ch.icon}</span>
                          <span className="text-xs font-medium text-[#2C2E2F]">{ch.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 6: Interactive Tour */}
              {currentStep === 6 && (
                <motion.div
                  key="step6"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                >
                  <div className="text-center mb-6">
                    <span className="text-3xl mb-3 block">🗺️</span>
                    <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Découvrez la plateforme</h2>
                    <p className="text-sm text-gray-500">Voici un aperçu des fonctionnalités clés d&apos;AfriBayit</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tourItems.map((item, i) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-gray-50 rounded-2xl flex items-start gap-3"
                      >
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#2C2E2F]">{item.title}</p>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 7: Rebecca AI Activation */}
              {currentStep === 7 && (
                <motion.div
                  key="step7"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: easeOut }}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center mx-auto mb-6"
                  >
                    <span className="text-4xl font-bold text-white">R</span>
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-3">
                    Activez Rebecca, votre assistante IA
                  </h2>
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
                    Rebecca est votre assistante IA personnelle. Elle peut rechercher des biens, suivre vos transactions,
                    contacter des agents, et bien plus — disponible 24/7.
                  </p>

                  {/* Rebecca capabilities */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-md mx-auto mb-8">
                    {[
                      { icon: '🔍', label: 'Recherche de biens' },
                      { icon: '🔒', label: 'Suivi escrow' },
                      { icon: '👤', label: 'Contacter agents' },
                      { icon: '🔨', label: 'Devis artisans' },
                      { icon: '📊', label: 'Prix du marché' },
                      { icon: '🌍', label: 'GeoTrust' },
                    ].map((cap) => (
                      <div key={cap.label} className="p-3 bg-gray-50 rounded-xl text-center">
                        <span className="text-lg block mb-1">{cap.icon}</span>
                        <span className="text-[10px] font-medium text-gray-600">{cap.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Activation Toggle */}
                  <div className="p-4 bg-[#003087]/5 rounded-2xl max-w-sm mx-auto">
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-sm font-semibold text-[#2C2E2F]">Activer Rebecca IA</p>
                        <p className="text-[10px] text-gray-500">Rebecca sera accessible depuis le chat en bas à droite</p>
                      </div>
                      <button
                        onClick={() => updateData({ rebeccaEnabled: !data.rebeccaEnabled })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          data.rebeccaEnabled ? 'bg-[#00A651]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          data.rebeccaEnabled ? 'left-6' : 'left-0.5'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-2xl max-w-sm mx-auto text-left">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Récapitulatif</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Profil</span>
                        <span className="font-semibold text-[#2C2E2F]">{profileTypes.find(p => p.value === data.profileType)?.label || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Zone</span>
                        <span className="font-semibold text-[#2C2E2F]">{data.countries.map(c => countries.find(co => co.code === c)?.name).join(', ') || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget max</span>
                        <span className="font-semibold text-[#2C2E2F]">{data.budgetMax ? new Intl.NumberFormat('fr-FR').format(data.budgetMax) + ' FCFA' : '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rebecca IA</span>
                        <span className={`font-semibold ${data.rebeccaEnabled ? 'text-[#00A651]' : 'text-gray-400'}`}>
                          {data.rebeccaEnabled ? '✓ Activée' : 'Désactivée'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="sticky bottom-0 bg-white border-t px-4 py-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => goToStep(currentStep - 1)}
                className="px-6 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (currentStep < 7) goToStep(currentStep + 1);
                else handleComplete();
              }}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 7 ? '🚀 Commencer !' : 'Continuer'}
            </motion.button>
          </div>
          {/* Step dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {onboardingSteps.map((s) => (
              <div
                key={s.step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentStep >= s.step ? 'bg-[#003087]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
