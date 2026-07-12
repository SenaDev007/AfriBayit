'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OnboardingFlowProps } from './types';
import { initialOnboardingData, easeOut } from './types';
import { onboardingSteps } from './constants';
import WelcomeStep from './WelcomeStep';
import ProfileStep from './ProfileStep';
import LocationStep from './LocationStep';
import BudgetStep from './BudgetStep';
import AlertsStep from './AlertsStep';
import TourStep from './TourStep';
import RebeccaStep from './RebeccaStep';

export default function OnboardingFlow({ isOpen, onClose, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState(initialOnboardingData);
  const [direction, setDirection] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const updateData = useCallback((updates: Partial<typeof data>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleArrayItem = useCallback((field: keyof typeof data, value: string) => {
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

  const stepProps = {
    data,
    updateData,
    toggleArrayItem,
    direction,
    slideVariants,
    easeOut,
    setIsAnimating,
  };

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
        <div className="absolute top-20 left-20 w-72 h-72 bg-[#D4AF37] rounded-lg blur-[120px] animate-float-1" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#009CDE] rounded-lg blur-[150px] animate-float-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A651] rounded-lg blur-[100px] animate-float-3" />
      </div>

      <div className="relative min-h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="sticky top-0 z-10 glass-navy border-b border-white/10 px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={currentStep === 1 ? onClose : () => goToStep(currentStep - 1)}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
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
                  className={`h-1.5 flex-1 rounded-lg transition-colors duration-500 ${
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
              {currentStep === 1 && (
                <WelcomeStep
                  {...stepProps}
                  onNext={() => goToStep(2)}
                  onSkip={handleSkip}
                />
              )}
              {currentStep === 2 && <ProfileStep {...stepProps} />}
              {currentStep === 3 && <LocationStep {...stepProps} />}
              {currentStep === 4 && <BudgetStep {...stepProps} />}
              {currentStep === 5 && <AlertsStep {...stepProps} />}
              {currentStep === 6 && <TourStep {...stepProps} />}
              {currentStep === 7 && <RebeccaStep {...stepProps} />}
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
                className="px-6 py-3.5 border border-white/20 rounded-lg text-sm font-semibold text-white/70 hover:bg-white/5 transition-colors"
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
              className="flex-1 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-[#003087] rounded-lg font-bold text-sm hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {currentStep === 7 ? ' Commencer !' : 'Continuer'}
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
