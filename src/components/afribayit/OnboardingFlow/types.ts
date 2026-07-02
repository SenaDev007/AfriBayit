import type { ReactNode } from 'react';
import type { Variants } from 'framer-motion';

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

export interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: OnboardingData) => void;
}

export const initialOnboardingData: OnboardingData = {
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

export const easeOut = [0.16, 1, 0.3, 1] as const;

export interface StepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  toggleArrayItem: (field: keyof OnboardingData, value: string) => void;
  direction: number;
  slideVariants: Variants;
  easeOut: readonly [number, number, number, number];
  setIsAnimating: (v: boolean) => void;
}

export interface StepDefinition {
  step: number;
  title: string;
  icon: ReactNode;
}
