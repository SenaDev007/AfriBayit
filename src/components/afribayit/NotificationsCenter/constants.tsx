// P3.7-2 — Shared constants for the NotificationsCenter module.
// Filter tabs, type→icon/color maps, preference categories/channels,
// default preferences, and premium notification types.

import {
  BarChart3,
  Bell,
  Bot,
  CheckCircle,
  ClipboardList,
  Coins,
  CreditCard,
  Crown,
  Eye,
  Gift,
  Home,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  Smartphone,
  Star,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
import type {
  CategoryKey,
  ChannelKey,
  FilterTabKey,
  PreferencesMap,
} from './types';

export const easeOut = [0.16, 1, 0.3, 1] as const;

// Top-level filter tabs in the notifications list
export const filterTabs = [
  { key: 'all' as FilterTabKey, label: 'Tout', icon: Bell },
  { key: 'unread' as FilterTabKey, label: 'Non lus', icon: Mail },
  { key: 'transaction' as FilterTabKey, label: 'Transactions', icon: Coins },
  { key: 'announcement' as FilterTabKey, label: 'Annonces', icon: Megaphone },
  { key: 'community' as FilterTabKey, label: 'Communaute', icon: Users },
  { key: 'rebecca' as FilterTabKey, label: 'Rebecca', icon: Bot },
];

// Notification type → icon mapping
export const typeIconMap: Record<string, React.ElementType> = {
  transaction: Coins,
  message: MessageCircle,
  alert: Bell,
  system: ClipboardList,
  promotion: Gift,
  community: Users,
  rebecca: Bot,
  certification: CheckCircle,
  profile: User,
  premium: Crown,
  security: Lock,
  property: Home,
  announcement: Megaphone,
  // Premium-specific notification types
  profile_view: Eye,
  matching_inverse: TrendingUp,
  performance_weekly: BarChart3,
  inmail_credit: CreditCard,
};

// Notification type → accent color mapping
export const typeColors: Record<string, string> = {
  transaction: '#00A651',
  message: '#009CDE',
  alert: '#D4AF37',
  system: '#6b7280',
  promotion: '#D93025',
  community: '#003087',
  rebecca: '#9333ea',
  certification: '#00A651',
  profile: '#009CDE',
  premium: '#D4AF37',
  security: '#D93025',
  property: '#003087',
  announcement: '#D4AF37',
  profile_view: '#9333ea',
  matching_inverse: '#00A651',
  performance_weekly: '#009CDE',
  inmail_credit: '#D4AF37',
};

// Preference categories shown in the preferences tab
export const preferenceCategories = [
  { key: 'property' as CategoryKey, label: 'Immobilier', icon: Home, desc: 'Alertes de biens, prix, disponibilite' },
  { key: 'community' as CategoryKey, label: 'Communaute', icon: Users, desc: 'Posts, reponses, groupes, evenements' },
  { key: 'escrow' as CategoryKey, label: 'Escrow', icon: Lock, desc: 'Transactions, paiements, liberations' },
  { key: 'academy' as CategoryKey, label: 'Academie', icon: Star, desc: 'Cours, certificats, progression' },
  { key: 'marketing' as CategoryKey, label: 'Marketing', icon: Gift, desc: 'Promotions, offres, parrainage' },
];

// Notification channels for the preference matrix
export const preferenceChannels = [
  { key: 'email' as ChannelKey, label: 'Email', icon: Mail },
  { key: 'sms' as ChannelKey, label: 'SMS', icon: MessageCircle },
  { key: 'push' as ChannelKey, label: 'Push', icon: Smartphone },
  { key: 'whatsapp' as ChannelKey, label: 'WhatsApp', icon: Smartphone },
];

// Default preferences (security/escrow are kept on by default)
export const defaultPreferences: PreferencesMap = {
  property: { email: true, sms: false, push: true, whatsapp: false },
  community: { email: false, sms: false, push: true, whatsapp: false },
  escrow: { email: true, sms: true, push: true, whatsapp: false },
  academy: { email: true, sms: false, push: true, whatsapp: false },
  marketing: { email: false, sms: false, push: false, whatsapp: false },
};

// Premium-only notification types
export const premiumNotificationTypes = [
  { key: 'profile_view', label: 'Qui a consulte votre profil', icon: Eye, desc: 'Soyez alerte quand on visite votre profil' },
  { key: 'matching_inverse', label: 'Matching inverse', icon: TrendingUp, desc: 'Biens correspondant a vos criteres inverses' },
  { key: 'performance_weekly', label: 'Performance hebdomadaire', icon: BarChart3, desc: 'Rapport hebdo de vos performances' },
  { key: 'inmail_credit', label: 'Credits InMail', icon: CreditCard, desc: 'Solde et expiration de vos credits' },
];
