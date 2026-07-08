// P3.7-2 — Shared types for the AuthPages module.
// The orchestrator (`index.tsx`) owns all auth state and delegates
// rendering to LoginForm / RegisterForm / ForgotPasswordForm / OAuthButtons.

export interface AuthPagesProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSwitch: (mode: 'login' | 'register') => void;
  onSuccess: () => void;
}

export type AuthMode = 'login' | 'register';

export interface RegisterFormData {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  name: string;
  country: string;
  city: string;
  role: string;
}

export type ProviderAvailability = { google: boolean; facebook: boolean };
export type OauthLoadingState = 'google' | 'facebook' | null;
export type QuickAction = 'reply' | 'view' | 'validate' | 'dismiss';

export interface ForgotPasswordState {
  showForgotPassword: boolean;
  forgotLoading: boolean;
  forgotSuccess: boolean;
  forgotError: string;
  forgotOtpCode: string;
  forgotNewPassword: string;
  resetLoading: boolean;
  resetError: string;
  resetSuccess: boolean;
}

export interface TwoFAState {
  show2FA: boolean;
  twoFACode: string;
  twoFALoading: boolean;
  twoFAError: string;
  twoFAUserId: string;
}
