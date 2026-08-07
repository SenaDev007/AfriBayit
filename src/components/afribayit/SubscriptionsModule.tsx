'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptions, useCreateSubscription, useCancelSubscription } from '@/hooks/useSubscriptions';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api-client';
import {
  Building2, Check, Crown, Home, Hotel, RefreshCw, Ruler, Scale, Sprout, Wrench,
  Zap, Star, Lightbulb, Bell, BarChart3, Eye, Mail, Award, Shield, Users,
  TrendingUp, Rocket, Gem, Briefcase, ChevronRight, ArrowRight, Sparkles,
  CircleDollarSign, Target, MessageCircle, FileText, BadgeCheck,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

interface ModuleProps {
  onNavigate?: (section: string) => void;
  userId?: string;
}

interface Subscription {
  id: string;
  plan: string;
  category: string;
  price: number;
  nextBilling: string;
  paymentMethod: string;
  status: 'active' | 'cancelled' | 'past_due';
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// ─── 5 Agent Tiers per CDC §5.5b ───
const agentTiers = [
  {
    id: 'starter',
    nameKey: 'subscriptionModule.tier.starter',
    nameFallback: 'Starter',
    name: 'Starter',
    planType: 'agent_starter',
    price: 0,
    priceLabelKey: 'subscriptionModule.priceLabel.free',
    priceLabelFallback: 'Gratuit',
    priceLabel: 'Gratuit',
    descKey: 'subscriptionModule.desc.starter',
    descFallback: 'Pour découvrir la plateforme',
    desc: 'Pour découvrir la plateforme',
    color: '#6b7280',
    boost: 'x1.0',
    boostVal: 1.0,
    features: [
      { key: 'subscriptionModule.features.starter1', fallback: '3 annonces actives', label: '3 annonces actives' },
      { key: 'subscriptionModule.features.starter2', fallback: 'Photos (5 max)', label: 'Photos (5 max)' },
      { key: 'subscriptionModule.features.starter3', fallback: 'Profil basique', label: 'Profil basique' },
      { key: 'subscriptionModule.features.starter4', fallback: 'Recherche standard', label: 'Recherche standard' },
      { key: 'subscriptionModule.features.starter5', fallback: 'Support communautaire', label: 'Support communautaire' },
    ],
    premiumBenefits: {
      inmail: 0, rebecca: 'Basique', alertes: false, rapport: false, whoViewed: false, badge: 'Aucun',
    },
    limits: { annonces: 3, photos: 5, inmail: 0 },
  },
  {
    id: 'pro-essentiel',
    nameKey: 'subscriptionModule.tier.proEssentiel',
    nameFallback: 'Pro Essentiel',
    name: 'Pro Essentiel',
    planType: 'agent_essentiel',
    price: 15000,
    priceLabel: '15 000 FCFA/mois',
    descKey: 'subscriptionModule.desc.proEssentiel',
    descFallback: 'Pour les agents qui démarrent',
    desc: 'Pour les agents qui démarrent',
    color: '#00A651',
    popular: true,
    boost: 'x1.5',
    boostVal: 1.5,
    features: [
      { key: 'subscriptionModule.features.proEssentiel1', fallback: '15 annonces actives', label: '15 annonces actives' },
      { key: 'subscriptionModule.features.proEssentiel2', fallback: 'Photos illimitées', label: 'Photos illimitées' },
      { key: 'subscriptionModule.features.proEssentiel3', fallback: 'Badge Agent Pro', label: 'Badge Agent Pro' },
      { key: 'subscriptionModule.features.proEssentiel4', fallback: 'Statistiques basiques', label: 'Statistiques basiques' },
      { key: 'subscriptionModule.features.proEssentiel5', fallback: 'Rebecca IA basique', label: 'Rebecca IA basique' },
      { key: 'subscriptionModule.features.proEssentiel6', fallback: '5 InMail/mois', label: '5 InMail/mois' },
      { key: 'subscriptionModule.features.proEssentiel7', fallback: 'Support email', label: 'Support email' },
    ],
    premiumBenefits: {
      inmail: 5, rebecca: 'Standard', alertes: true, rapport: false, whoViewed: false, badge: 'Pro',
    },
    limits: { annonces: 15, photos: 999, inmail: 5 },
  },
  {
    id: 'pro-avance',
    nameKey: 'subscriptionModule.tier.proAvance',
    nameFallback: 'Pro Avancé',
    name: 'Pro Avancé',
    planType: 'agent_avance',
    price: 35000,
    priceLabel: '35 000 FCFA/mois',
    descKey: 'subscriptionModule.desc.proAvance',
    descFallback: 'Pour les agents en croissance',
    desc: 'Pour les agents en croissance',
    color: '#009CDE',
    boost: 'x2.5',
    boostVal: 2.5,
    features: [
      { key: 'subscriptionModule.features.proAvance1', fallback: '50 annonces actives', label: '50 annonces actives' },
      { key: 'subscriptionModule.features.proAvance2', fallback: 'Photos + Vidéo', label: 'Photos + Vidéo' },
      { key: 'subscriptionModule.features.proAvance3', fallback: 'Badge Premium Or', label: 'Badge Premium Or' },
      { key: 'subscriptionModule.features.proAvance4', fallback: 'CRM intégré', label: 'CRM intégré' },
      { key: 'subscriptionModule.features.proAvance5', fallback: 'Rebecca IA avancée', label: 'Rebecca IA avancée' },
      { key: 'subscriptionModule.features.proAvance6', fallback: '20 InMail/mois', label: '20 InMail/mois' },
      { key: 'subscriptionModule.features.proAvance7', fallback: 'Alertes prospects', label: 'Alertes prospects' },
      { key: 'subscriptionModule.features.proAvance8', fallback: 'Rapport performance', label: 'Rapport performance' },
      { key: 'subscriptionModule.features.proAvance9', fallback: 'Who\'s Viewed', label: 'Who\'s Viewed' },
      { key: 'subscriptionModule.features.proAvance10', fallback: 'Support prioritaire', label: 'Support prioritaire' },
    ],
    premiumBenefits: {
      inmail: 20, rebecca: 'Avancée', alertes: true, rapport: true, whoViewed: true, badge: 'Premium Or',
    },
    limits: { annonces: 50, photos: 999, inmail: 20 },
  },
  {
    id: 'pro-elite',
    nameKey: 'subscriptionModule.tier.proElite',
    nameFallback: 'Pro Elite',
    name: 'Pro Elite',
    planType: 'agent_elite',
    price: 75000,
    priceLabel: '75 000 FCFA/mois',
    descKey: 'subscriptionModule.desc.proElite',
    descFallback: 'Pour les leaders du marché',
    desc: 'Pour les leaders du marché',
    color: '#D4AF37',
    boost: 'x4.0',
    boostVal: 4.0,
    features: [
      { key: 'subscriptionModule.features.proElite1', fallback: 'Annonces illimitées', label: 'Annonces illimitées' },
      { key: 'subscriptionModule.features.proElite2', fallback: 'Tout Pro Avancé +', label: 'Tout Pro Avancé +' },
      { key: 'subscriptionModule.features.proElite3', fallback: 'Badge Elite Diamant', label: 'Badge Elite Diamant' },
      { key: 'subscriptionModule.features.proElite4', fallback: 'Rebecca IA complète', label: 'Rebecca IA complète' },
      { key: 'subscriptionModule.features.proElite5', fallback: 'InMail illimités', label: 'InMail illimités' },
      { key: 'subscriptionModule.features.proElite6', fallback: 'API Access', label: 'API Access' },
      { key: 'subscriptionModule.features.proElite7', fallback: 'Compte dédié', label: 'Compte dédié' },
      { key: 'subscriptionModule.features.proElite8', fallback: 'Formation mensuelle', label: 'Formation mensuelle' },
      { key: 'subscriptionModule.features.proElite9', fallback: 'Partenariats exclusifs', label: 'Partenariats exclusifs' },
    ],
    premiumBenefits: {
      inmail: -1, rebecca: 'Complète', alertes: true, rapport: true, whoViewed: true, badge: 'Elite Diamant',
    },
    limits: { annonces: -1, photos: 999, inmail: -1 },
  },
  {
    id: 'agence-entreprise',
    nameKey: 'subscriptionModule.tier.agenceEntreprise',
    nameFallback: 'Agence Entreprise',
    name: 'Agence Entreprise',
    planType: 'agent_entreprise',
    price: 0,
    priceLabelKey: 'subscriptionModule.priceLabel.quote',
    priceLabelFallback: 'Sur devis',
    priceLabel: 'Sur devis',
    descKey: 'subscriptionModule.desc.agenceEntreprise',
    descFallback: 'Pour les agences et cabinets',
    desc: 'Pour les agences et cabinets',
    color: '#003087',
    boost: 'x4.0+',
    boostVal: 4.5,
    features: [
      { key: 'subscriptionModule.features.agence1', fallback: 'Tout Pro Elite +', label: 'Tout Pro Elite +' },
      { key: 'subscriptionModule.features.agence2', fallback: 'Multi-agents', label: 'Multi-agents' },
      { key: 'subscriptionModule.features.agence3', fallback: 'Dashboard agence', label: 'Dashboard agence' },
      { key: 'subscriptionModule.features.agence4', fallback: 'White label', label: 'White label' },
      { key: 'subscriptionModule.features.agence5', fallback: 'API intégration', label: 'API intégration' },
      { key: 'subscriptionModule.features.agence6', fallback: 'Support dédié 24/7', label: 'Support dédié 24/7' },
      { key: 'subscriptionModule.features.agence7', fallback: 'Custom branding', label: 'Custom branding' },
      { key: 'subscriptionModule.features.agence8', fallback: 'Formation sur site', label: 'Formation sur site' },
      { key: 'subscriptionModule.features.agence9', fallback: 'SLA garanti', label: 'SLA garanti' },
    ],
    premiumBenefits: {
      inmail: -1, rebecca: 'Complète+', alertes: true, rapport: true, whoViewed: true, badge: 'Entreprise',
    },
    limits: { annonces: -1, photos: 999, inmail: -1 },
  },
];

// ─── Hotel plan definitions ───
const hotelTiers = [
  {
    id: 'pms-starter', nameKey: 'subscriptionModule.tier.pmsStarter', nameFallback: 'STARTER', name: 'STARTER', planType: 'hotel_starter', price: 9900, priceLabel: '9 900 FCFA/mois',
    descKey: 'subscriptionModule.desc.pmsStarter', descFallback: 'Pour les petites guesthouses', desc: 'Pour les petites guesthouses', color: '#00A651',
    features: [
      { key: 'subscriptionModule.features.pmsStarter1', fallback: '5 chambres', label: '5 chambres' },
      { key: 'subscriptionModule.features.pmsStarter2', fallback: 'Calendrier basique', label: 'Calendrier basique' },
      { key: 'subscriptionModule.features.pmsStarter3', fallback: 'Gestion repas', label: 'Gestion repas' },
      { key: 'subscriptionModule.features.pmsStarter4', fallback: 'Profil guesthouse', label: 'Profil guesthouse' },
    ],
  },
  {
    id: 'pms-pro', nameKey: 'subscriptionModule.tier.pmsPro', nameFallback: 'PRO', name: 'PRO', planType: 'hotel_pro', price: 24900, priceLabel: '24 900 FCFA/mois',
    descKey: 'subscriptionModule.desc.pmsPro', descFallback: 'Pour les hôtels professionnels', desc: 'Pour les hôtels professionnels', color: '#009CDE', popular: true,
    features: [
      { key: 'subscriptionModule.features.pmsPro1', fallback: 'Chambres illimitées', label: 'Chambres illimitées' },
      { key: 'subscriptionModule.features.pmsPro2', fallback: 'Calendrier avancé', label: 'Calendrier avancé' },
      { key: 'subscriptionModule.features.pmsPro3', fallback: 'Tarifs saisonniers', label: 'Tarifs saisonniers' },
      { key: 'subscriptionModule.features.pmsPro4', fallback: 'Gestion personnel', label: 'Gestion personnel' },
      { key: 'subscriptionModule.features.pmsPro5', fallback: 'Statistiques', label: 'Statistiques' },
      { key: 'subscriptionModule.features.pmsPro6', fallback: 'Channel manager', label: 'Channel manager' },
      { key: 'subscriptionModule.features.pmsPro7', fallback: 'Certification AfriBayit', label: 'Certification AfriBayit' },
    ],
  },
  {
    id: 'pms-enterprise', nameKey: 'subscriptionModule.tier.pmsEnterprise', nameFallback: 'ENTERPRISE', name: 'ENTERPRISE', planType: 'hotel_enterprise', price: 0, priceLabelKey: 'subscriptionModule.priceLabel.quote', priceLabelFallback: 'Sur devis', priceLabel: 'Sur devis',
    descKey: 'subscriptionModule.desc.pmsEnterprise', descFallback: 'Pour les chaînes hôtelières', desc: 'Pour les chaînes hôtelières', color: '#D4AF37',
    features: [
      { key: 'subscriptionModule.features.pmsEnterprise1', fallback: 'Tout PMS PRO +', label: 'Tout PMS PRO +' },
      { key: 'subscriptionModule.features.pmsEnterprise2', fallback: 'Multi-établissements', label: 'Multi-établissements' },
      { key: 'subscriptionModule.features.pmsEnterprise3', fallback: 'API intégration', label: 'API intégration' },
      { key: 'subscriptionModule.features.pmsEnterprise4', fallback: 'Support dédié 24/7', label: 'Support dédié 24/7' },
      { key: 'subscriptionModule.features.pmsEnterprise5', fallback: 'Custom branding', label: 'Custom branding' },
      { key: 'subscriptionModule.features.pmsEnterprise6', fallback: 'Formation sur site', label: 'Formation sur site' },
    ],
  },
];

// ─── Artisan plan definition ───
const artisanPlan = {
  id: 'artisan-pro', nameKey: 'subscriptionModule.tier.artisanPro', nameFallback: 'Artisan Pro', name: 'Artisan Pro', planType: 'artisan_pro', price: 8900, priceLabel: '8 900 FCFA/mois',
  descKey: 'subscriptionModule.desc.artisanPro', descFallback: 'Pour les artisans certifiés', desc: 'Pour les artisans certifiés', color: '#D4AF37',
  features: [
    { key: 'subscriptionModule.features.artisanPro1', fallback: 'Profil premium artisan', label: 'Profil premium artisan' },
    { key: 'subscriptionModule.features.artisanPro2', fallback: 'Portfolio illimité', label: 'Portfolio illimité' },
    { key: 'subscriptionModule.features.artisanPro3', fallback: 'Badge Artisan Certifié', label: 'Badge Artisan Certifié' },
    { key: 'subscriptionModule.features.artisanPro4', fallback: 'Mise en avant recherche', label: 'Mise en avant recherche' },
    { key: 'subscriptionModule.features.artisanPro5', fallback: 'Demandes urgentes', label: 'Demandes urgentes' },
    { key: 'subscriptionModule.features.artisanPro6', fallback: 'Statistiques', label: 'Statistiques' },
    { key: 'subscriptionModule.features.artisanPro7', fallback: 'Support prioritaire', label: 'Support prioritaire' },
  ],
};

// ─── Premium Benefits Config ───
const PREMIUM_BENEFITS = [
  { key: 'inmail', labelKey: 'subscriptionModule.benefits.inmail', labelFallback: 'InMail crédits', icon: <Mail className="w-4 h-4" /> },
  { key: 'rebecca', labelKey: 'subscriptionModule.benefits.rebecca', labelFallback: 'Rebecca Premium', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'alertes', labelKey: 'subscriptionModule.benefits.alertes', labelFallback: 'Alertes prospects', icon: <Bell className="w-4 h-4" /> },
  { key: 'rapport', labelKey: 'subscriptionModule.benefits.rapport', labelFallback: 'Rapport performance', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'whoViewed', labelKey: 'subscriptionModule.benefits.whoViewed', labelFallback: "Who's Viewed", icon: <Eye className="w-4 h-4" /> },
  { key: 'badge', labelKey: 'subscriptionModule.benefits.badge', labelFallback: 'Badge Premium', icon: <Award className="w-4 h-4" /> },
];

// ─── Comparison features ───
const comparisonFeatures = [
  { nameKey: 'subscriptionModule.comparison.annonces', nameFallback: 'Annonces actives', name: 'Annonces actives', starter: '3', essentiel: '15', avance: '50', elite: '∞' },
  { nameKey: 'subscriptionModule.comparison.boost', nameFallback: 'Boost algorithme', name: 'Boost algorithme', starter: 'x1.0', essentiel: 'x1.5', avance: 'x2.5', elite: 'x4.0' },
  { nameKey: 'subscriptionModule.comparison.inmail', nameFallback: 'InMail/mois', name: 'InMail/mois', starter: '0', essentiel: '5', avance: '20', elite: '∞' },
  { nameKey: 'subscriptionModule.comparison.rebecca', nameFallback: 'Rebecca IA', name: 'Rebecca IA', starter: 'Basique', essentiel: 'Standard', avance: 'Avancée', elite: 'Complète' },
  { nameKey: 'subscriptionModule.comparison.badge', nameFallback: 'Badge', name: 'Badge', starter: 'Aucun', essentiel: 'Pro', avance: 'Premium Or', elite: 'Elite Diamant' },
  { nameKey: 'subscriptionModule.comparison.alertes', nameFallback: 'Alertes prospects', name: 'Alertes prospects', starter: false, essentiel: true, avance: true, elite: true },
  { nameKey: 'subscriptionModule.comparison.rapport', nameFallback: 'Rapport performance', name: 'Rapport performance', starter: false, essentiel: false, avance: true, elite: true },
  { nameKey: 'subscriptionModule.comparison.whoViewed', nameFallback: "Who's Viewed", name: "Who's Viewed", starter: false, essentiel: false, avance: true, elite: true },
  { nameKey: 'subscriptionModule.comparison.crm', nameFallback: 'CRM intégré', name: 'CRM intégré', starter: false, essentiel: false, avance: true, elite: true },
  { nameKey: 'subscriptionModule.comparison.apiAccess', nameFallback: 'API Access', name: 'API Access', starter: false, essentiel: false, avance: false, elite: true },
  { nameKey: 'subscriptionModule.comparison.dedicatedAccount', nameFallback: 'Compte dédié', name: 'Compte dédié', starter: false, essentiel: false, avance: false, elite: true },
  { nameKey: 'subscriptionModule.comparison.support', nameFallback: 'Support', name: 'Support', starter: 'Communauté', essentiel: 'Email', avance: 'Prioritaire', elite: 'Dédié 24/7' },
];

type CategoryKey = 'agent' | 'hotel' | 'artisan';

export default function SubscriptionsModule({ onNavigate, userId }: ModuleProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('agent');
  const [showComparison, setShowComparison] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPlanPrice, setSelectedPlanPrice] = useState<number>(0);

  const { selectedCountry } = useCountry();
  const { data: subscriptionsData, isLoading: subsLoading } = useSubscriptions(userId, selectedCountry);
  const createSubscription = useCreateSubscription();
  const cancelSubscription = useCancelSubscription();

  const subscriptions: Subscription[] = (subscriptionsData?.subscriptions as Subscription[]) || [];
  const currentSubscription = subscriptions[0] || null;

  // Real subscription usage from backend (CDC §3.1.2). Refreshed every 60s.
  // Initialised to zeros — a 404 (no active subscription) leaves the zeros in
  // place so the progress bars render at 0% instead of crashing.
  const [currentUsage, setCurrentUsage] = useState<{ annonces: number; photos: number; inmail: number }>({
    annonces: 0,
    photos: 0,
    inmail: 0,
  });

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const fetchUsage = async () => {
      try {
        const data = await api.get<{ annonces?: number; photos?: number; inmail?: number }>(
          '/users/me/subscription-usage',
        );
        if (cancelled) return;
        if (data && typeof data === 'object') {
          setCurrentUsage({
            annonces: Number(data.annonces) || 0,
            photos: Number(data.photos) || 0,
            inmail: Number(data.inmail) || 0,
          });
        }
      } catch (err) {
        // 404 = no active subscription → keep zeros. Other errors are
        // non-fatal — the UI still renders with the last known usage.
        if (err instanceof ApiError && err.statusCode === 404) return;
        if (!cancelled) {
          console.warn('[SubscriptionsModule] Failed to fetch subscription usage:', err);
        }
      }
    };

    void fetchUsage();
    const interval = setInterval(() => void fetchUsage(), 60_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  const categories: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
    { key: 'agent', label: t('subscriptionModule.categoryAgent', 'Agent'), icon: <Briefcase className="w-4 h-4" /> },
    { key: 'hotel', label: t('subscriptionModule.categoryHotel', 'PMS Hôtelier'), icon: <Hotel className="w-4 h-4" /> },
    { key: 'artisan', label: t('subscriptionModule.categoryArtisan', 'Artisan'), icon: <Wrench className="w-4 h-4" /> },
  ];

  const getTiers = () => {
    if (activeCategory === 'agent') return agentTiers;
    if (activeCategory === 'hotel') return hotelTiers;
    return [artisanPlan];
  };

  const handleChoosePlan = (tierId: string, tierPrice: number) => {
    setSelectedPlan(tierId);
    setSelectedPlanPrice(tierPrice);
    setShowUpgrade(true);
  };

  const handleConfirmUpgrade = () => {
    if (!selectedPlan) return;
    createSubscription.mutate(
      { planType: selectedPlan, priceXof: selectedPlanPrice, currency: 'XOF', autoRenew: true },
      {
        onSuccess: () => { toast.success(t('subscriptionModule.toastActivated', 'Abonnement activé'), { description: t('subscriptionModule.toastActivatedDesc', 'Votre nouveau plan est maintenant actif') }); setShowUpgrade(false); setSelectedPlan(null); },
        onError: (error: Error) => { toast.error(t('subscriptionModule.toastActivationError', 'Erreur lors de l\'activation'), { description: error.message }); },
      }
    );
  };

  const handleCancelSubscription = (subId: string) => {
    cancelSubscription.mutate(
      { id: subId },
      {
        onSuccess: () => { toast.success(t('subscriptionModule.toastCancelled', 'Abonnement annulé'), { description: t('subscriptionModule.toastCancelledDesc', 'Votre abonnement a été annulé. Il restera actif jusqu\'à la fin de la période en cours.') }); },
        onError: (error: Error) => { toast.error(t('subscriptionModule.toastCancelError', 'Erreur lors de l\'annulation'), { description: error.message }); },
      }
    );
  };

  const boostMaxVal = 4.5;

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4"><RefreshCw className="w-4 h-4" /> {t('subscriptionModule.eyebrow', 'Abonnements Premium')}</span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0a2a5e] mb-3">{t('subscriptionModule.title', 'Plans Premium').split(' ')[0]} <span className="text-[#003087]">{t('subscriptionModule.title', 'Plans Premium').split(' ')[1]}</span></h1>
          <p className="text-gray-500 max-w-lg mx-auto">{t('subscriptionModule.subtitle', 'Choisissez le plan adapté à votre activité et débloquez tout le potentiel d\'AfriBayit')}</p>
        </motion.div>

        {/* Current Subscription Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-[#003087] to-[#001a4d] rounded-xl p-5 mb-8 text-white">
          {subsLoading ? (
            <div className="animate-pulse"><div className="h-3 bg-white/20 rounded w-24 mb-2" /><div className="h-6 bg-white/20 rounded w-32 mb-2" /><div className="h-3 bg-white/20 rounded w-48" /></div>
          ) : currentSubscription ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">{t('subscriptionModule.current', 'Abonnement actuel')}</p>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">{currentSubscription.plan}</h3>
                  <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${currentSubscription.status === 'active' ? 'bg-[#00A651]' : 'bg-[#D4AF37]'}`}>{currentSubscription.status === 'active' ? t('subscriptionModule.statusActive', 'Actif') : currentSubscription.status}</span>
                </div>
                <p className="text-sm text-white/70 mt-1">{t('subscriptionModule.nextBilling', 'Prochaine facturation :')} {currentSubscription.nextBilling} · {currentSubscription.paymentMethod}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(currentSubscription.price)} FCFA</p>
                  <p className="text-xs text-white/60">{t('subscriptionModule.perMonth', '/mois')}</p>
                </div>
                {currentSubscription.status === 'active' && (
                  <button onClick={() => handleCancelSubscription(currentSubscription.id)} disabled={cancelSubscription.isPending} className="px-4 py-2 border border-white/30 rounded-lg text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50">{cancelSubscription.isPending ? '...' : t('subscriptionModule.cancel', 'Annuler')}</button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-white/60 mb-1">{t('subscriptionModule.noActive', 'Aucun abonnement actif')}</p><h3 className="font-display text-xl font-bold">{t('subscriptionModule.choosePlan', 'Choisissez un plan')}</h3><p className="text-sm text-white/70 mt-1">{t('subscriptionModule.unlockAll', 'Débloquez toutes les fonctionnalités d\'AfriBayit')}</p></div>
            </div>
          )}
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {categories.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeCategory === cat.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>{cat.icon} {cat.label}</button>
          ))}
        </div>

        {/* Boost Algorithm Visualization (Agent only) */}
        {activeCategory === 'agent' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-6 shadow-sm border mb-8">
            <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-[#D4AF37]" /> {t('subscriptionModule.boostTitle', 'Algorithme de Boost')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('subscriptionModule.boostDesc', 'Plus votre plan est élevé, plus vos annonces sont mises en avant dans les résultats de recherche.')}</p>
            <div className="flex items-end gap-3">
              {agentTiers.map((tier, i) => (
                <div key={tier.id} className="flex-1 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2">{t(tier.nameKey, tier.nameFallback)}</p>
                  <div className="relative h-32 bg-gray-50 rounded-xl overflow-hidden flex items-end justify-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(tier.boostVal / boostMaxVal) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1, ease: easeOut }}
                      className="w-full rounded-t-lg flex items-center justify-center"
                      style={{ backgroundColor: tier.color, minHeight: '20%' }}
                    >
                      <span className="text-white font-mono text-sm font-bold">{tier.boost}</span>
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 justify-center">
              <ArrowRight className="w-4 h-4 text-[#00A651]" />
              <p className="text-xs text-[#00A651] font-medium">{t('subscriptionModule.boostHint', 'Boost progressif : plus de visibilité = plus de contacts = plus de ventes')}</p>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeCategory} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
            {/* Pricing Grid */}
            <div className={`grid gap-5 ${activeCategory === 'artisan' ? 'grid-cols-1 max-w-sm mx-auto' : activeCategory === 'agent' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {getTiers().map((tier, i) => {
                const isAgent = activeCategory === 'agent';
                const agentTier = isAgent ? agentTiers.find(t => t.id === tier.id) : null;
                return (
                  <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: easeOut }} className={`bg-white rounded-xl p-5 shadow-sm border relative flex flex-col ${'popular' in tier && tier.popular ? 'ring-2 ring-[#D4AF37]' : ''}`}>
                    {Boolean('popular' in tier && tier.popular) && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">{t('subscriptionModule.popular', 'Populaire')}</span>)}
                    <div className="text-center mb-3">
                      <h3 className="font-display text-base font-bold text-[#0a2a5e]">{t(tier.nameKey, tier.nameFallback)}</h3>
                      <p className="text-xs text-gray-500 mb-1">{t(tier.descKey, tier.descFallback)}</p>
                      <p className="font-mono text-xl font-bold" style={{ color: tier.color }}>{(() => {
                        const t2 = tier as { priceLabelKey?: string; priceLabelFallback?: string; priceLabel: string };
                        return t2.priceLabelKey ? t(t2.priceLabelKey, t2.priceLabelFallback || '') : t2.priceLabel;
                      })()}</p>
                      {agentTier && (<p className="text-xs font-semibold mt-1" style={{ color: tier.color }}>Boost {agentTier.boost}</p>)}
                    </div>
                    <div className="space-y-1.5 flex-1 mb-4">
                      {tier.features.map(f => (<div key={f.key} className="flex items-center gap-2 text-xs text-gray-600"><span className="text-[#00A651]"><Check className="w-3.5 h-3.5" /></span>{t(f.key, f.fallback)}</div>))}
                    </div>

                    {/* Usage metrics for agent tiers */}
                    {agentTier && agentTier.limits && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{t('subscriptionModule.currentUsage', 'Utilisation actuelle')}</p>
                        {agentTier.limits.annonces > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">{t('subscriptionModule.annonces', 'Annonces')}</span><span className="font-mono font-bold">{currentUsage.annonces}/{agentTier.limits.annonces === -1 ? '∞' : agentTier.limits.annonces}</span></div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-lg bg-[#003087]" style={{ width: `${Math.min((currentUsage.annonces / (agentTier.limits.annonces || 1)) * 100, 100)}%` }} /></div>
                          </div>
                        )}
                        {agentTier.limits.inmail > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">{t('subscriptionModule.inmail', 'InMail')}</span><span className="font-mono font-bold">{currentUsage.inmail}/{agentTier.limits.inmail === -1 ? '∞' : agentTier.limits.inmail}</span></div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-lg bg-[#009CDE]" style={{ width: `${Math.min((currentUsage.inmail / (agentTier.limits.inmail || 1)) * 100, 100)}%` }} /></div>
                          </div>
                        )}
                        {agentTier.limits.annonces === -1 && agentTier.limits.inmail === -1 && (
                          <p className="text-[10px] text-[#00A651] font-medium">{t('subscriptionModule.unlimited', 'Illimité')}</p>
                        )}
                      </div>
                    )}

                    <button onClick={() => handleChoosePlan(tier.planType, tier.price)} disabled={currentSubscription?.plan === t(tier.nameKey, tier.nameFallback)} className={`w-full py-2.5 rounded-lg text-xs font-semibold transition-colors ${currentSubscription?.plan === t(tier.nameKey, tier.nameFallback) ? 'bg-gray-100 text-gray-500 cursor-default' : tier.color === '#D4AF37' ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]' : 'bg-[#003087] text-white hover:bg-[#0047b3]'}`}>
                      {currentSubscription?.plan === t(tier.nameKey, tier.nameFallback) ? t('subscriptionModule.planCurrent', 'Plan actuel') : tier.price === 0 && tier.id === 'starter' ? t('subscriptionModule.planStartFree', 'Commencer gratuitement') : t('subscriptionModule.planChoose', 'Choisir')}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Premium Benefits Detail (Agent only) */}
            {activeCategory === 'agent' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#D4AF37]" /> {t('subscriptionModule.premiumBenefits', 'Avantages Premium détaillés')}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 text-gray-500 font-medium">{t('subscriptionModule.benefit', 'Avantage')}</th>
                        <th className="text-center py-3 px-2 font-bold text-gray-400">{t('subscriptionModule.tier.starter', 'Starter')}</th>
                        <th className="text-center py-3 px-2 font-bold text-[#00A651]">{t('subscriptionModule.tier.essentiel', 'Essentiel')}</th>
                        <th className="text-center py-3 px-2 font-bold text-[#009CDE]">{t('subscriptionModule.tier.avance', 'Avancé')}</th>
                        <th className="text-center py-3 px-2 font-bold text-[#D4AF37]">{t('subscriptionModule.tier.elite', 'Elite')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PREMIUM_BENEFITS.map(benefit => {
                        const vals = agentTiers.map(t => {
                          const b = (t as Record<string, unknown>).premiumBenefits as Record<string, unknown>;
                          return b ? b[benefit.key] : null;
                        });
                        return (
                          <tr key={benefit.key} className="border-b border-gray-50">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                {benefit.icon}
                                {t(benefit.labelKey, benefit.labelFallback)}
                              </div>
                            </td>
                            {vals.map((val, idx) => (
                              <td key={idx} className="text-center py-3 px-2">
                                {typeof val === 'boolean' ? (
                                  val ? <span className="text-[#00A651]"><Check className="w-4 h-4 mx-auto" /></span> : <span className="text-gray-300">—</span>
                                ) : val === -1 ? <span className="font-mono text-xs text-[#00A651]">{t('subscriptionModule.unlimited', 'Illimité')}</span> : <span className="font-mono text-xs">{String(val)}</span>}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Feature Comparison */}
            {activeCategory === 'agent' && (
              <div className="mt-6">
                <button onClick={() => setShowComparison(!showComparison)} className="px-4 py-2 rounded-lg text-sm font-medium bg-white border text-gray-600 hover:bg-gray-50 transition-all">{showComparison ? t('subscriptionModule.hideComparison', 'Masquer la comparaison détaillée') : t('subscriptionModule.showComparison', 'Afficher la comparaison détaillée')}</button>
                <AnimatePresence>
                  {showComparison && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                      <div className="bg-white rounded-xl p-5 shadow-sm border overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 pr-4 text-gray-500 font-medium">{t('subscriptionModule.feature', 'Fonctionnalité')}</th>
                              <th className="text-center py-3 px-2 font-bold text-gray-400">{t('subscriptionModule.tier.starter', 'Starter')}</th>
                              <th className="text-center py-3 px-2 font-bold text-[#00A651]">{t('subscriptionModule.tier.essentiel', 'Essentiel')}</th>
                              <th className="text-center py-3 px-2 font-bold text-[#009CDE]">{t('subscriptionModule.tier.avance', 'Avancé')}</th>
                              <th className="text-center py-3 px-2 font-bold text-[#D4AF37]">{t('subscriptionModule.tier.elite', 'Elite')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonFeatures.map((feat, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-3 pr-4 text-gray-700">{t(feat.nameKey, feat.nameFallback)}</td>
                                {(['starter', 'essentiel', 'avance', 'elite'] as const).map(key => {
                                  const val = feat[key];
                                  return (
                                    <td key={key} className="text-center py-3 px-2">
                                      {typeof val === 'boolean' ? (val ? <span className="text-[#00A651]"><Check className="w-4 h-4 mx-auto" /></span> : <span className="text-gray-300">—</span>) : <span className="font-mono text-xs">{String(val)}</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Additional Tiers Info */}
            {activeCategory === 'agent' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
                  <Ruler className="w-5 h-5 text-[#009CDE]" />
                  <div><p className="text-sm font-semibold text-[#0a2a5e]">{t('subscriptionModule.geometer', 'Géomètre')}</p><p className="text-xs text-gray-500">{t('subscriptionModule.geometerDesc', 'Plans sur mesure — Contactez-nous')}</p></div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
                  <Scale className="w-5 h-5 text-[#D4AF37]" />
                  <div><p className="text-sm font-semibold text-[#0a2a5e]">{t('subscriptionModule.notary', 'Notaire')}</p><p className="text-xs text-gray-500">{t('subscriptionModule.notaryDesc', 'Plans Standard / Premium / Elite')}</p></div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Upgrade/Downgrade Modal */}
        {showUpgrade && selectedPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-xl p-6 max-w-sm w-full">
              <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-2">{t('subscriptionModule.modalConfirmChange', 'Confirmer le changement')}</h3>
              <p className="text-sm text-gray-500 mb-4">{t('subscriptionModule.modalDesc', 'Vous allez changer votre abonnement. Le prorata sera calculé automatiquement.')}</p>
              <div className="p-3 bg-gray-50 rounded-2xl mb-4">
                <p className="text-xs text-gray-500">{t('subscriptionModule.modalNewPlan', 'Nouveau plan')}</p>
                <p className="text-sm font-bold text-[#0a2a5e]">{selectedPlan.replace(/_/g, ' ').toUpperCase()}</p>
                {selectedPlanPrice > 0 && (<p className="font-mono text-lg font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(selectedPlanPrice)} FCFA/mois</p>)}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgrade(false)} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50">{t('subscriptionModule.modalCancel', 'Annuler')}</button>
                <button onClick={handleConfirmUpgrade} disabled={createSubscription.isPending} className="flex-1 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] disabled:opacity-50">{createSubscription.isPending ? t('subscriptionModule.modalProcessing', 'Traitement...') : t('subscriptionModule.modalConfirm', 'Confirmer')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
