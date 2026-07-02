'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptions, useCreateSubscription, useCancelSubscription } from '@/hooks/useSubscriptions';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';
import {
  Building2, Check, Crown, Home, Hotel, RefreshCw, Ruler, Scale, Sprout, Wrench,
  Zap, Star, Lightbulb, Bell, BarChart3, Eye, Mail, Award, Shield, Users,
  TrendingUp, Rocket, Gem, Briefcase, ChevronRight, ArrowRight, Sparkles,
  CircleDollarSign, Target, MessageCircle, FileText, BadgeCheck,
} from 'lucide-react';

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
    name: 'Starter',
    planType: 'agent_starter',
    price: 0,
    priceLabel: 'Gratuit',
    desc: 'Pour découvrir la plateforme',
    color: '#6b7280',
    boost: 'x1.0',
    boostVal: 1.0,
    features: [
      '3 annonces actives',
      'Photos (5 max)',
      'Profil basique',
      'Recherche standard',
      'Support communautaire',
    ],
    premiumBenefits: {
      inmail: 0, rebecca: 'Basique', alertes: false, rapport: false, whoViewed: false, badge: 'Aucun',
    },
    limits: { annonces: 3, photos: 5, inmail: 0 },
  },
  {
    id: 'pro-essentiel',
    name: 'Pro Essentiel',
    planType: 'agent_essentiel',
    price: 15000,
    priceLabel: '15 000 FCFA/mois',
    desc: 'Pour les agents qui démarrent',
    color: '#00A651',
    popular: true,
    boost: 'x1.5',
    boostVal: 1.5,
    features: [
      '15 annonces actives',
      'Photos illimitées',
      'Badge Agent Pro',
      'Statistiques basiques',
      'Rebecca IA basique',
      '5 InMail/mois',
      'Support email',
    ],
    premiumBenefits: {
      inmail: 5, rebecca: 'Standard', alertes: true, rapport: false, whoViewed: false, badge: 'Pro',
    },
    limits: { annonces: 15, photos: 999, inmail: 5 },
  },
  {
    id: 'pro-avance',
    name: 'Pro Avancé',
    planType: 'agent_avance',
    price: 35000,
    priceLabel: '35 000 FCFA/mois',
    desc: 'Pour les agents en croissance',
    color: '#009CDE',
    boost: 'x2.5',
    boostVal: 2.5,
    features: [
      '50 annonces actives',
      'Photos + Vidéo',
      'Badge Premium Or',
      'CRM intégré',
      'Rebecca IA avancée',
      '20 InMail/mois',
      'Alertes prospects',
      'Rapport performance',
      'Who\'s Viewed',
      'Support prioritaire',
    ],
    premiumBenefits: {
      inmail: 20, rebecca: 'Avancée', alertes: true, rapport: true, whoViewed: true, badge: 'Premium Or',
    },
    limits: { annonces: 50, photos: 999, inmail: 20 },
  },
  {
    id: 'pro-elite',
    name: 'Pro Elite',
    planType: 'agent_elite',
    price: 75000,
    priceLabel: '75 000 FCFA/mois',
    desc: 'Pour les leaders du marché',
    color: '#D4AF37',
    boost: 'x4.0',
    boostVal: 4.0,
    features: [
      'Annonces illimitées',
      'Tout Pro Avancé +',
      'Badge Elite Diamant',
      'Rebecca IA complète',
      'InMail illimités',
      'API Access',
      'Compte dédié',
      'Formation mensuelle',
      'Partenariats exclusifs',
    ],
    premiumBenefits: {
      inmail: -1, rebecca: 'Complète', alertes: true, rapport: true, whoViewed: true, badge: 'Elite Diamant',
    },
    limits: { annonces: -1, photos: 999, inmail: -1 },
  },
  {
    id: 'agence-entreprise',
    name: 'Agence Entreprise',
    planType: 'agent_entreprise',
    price: 0,
    priceLabel: 'Sur devis',
    desc: 'Pour les agences et cabinets',
    color: '#003087',
    boost: 'x4.0+',
    boostVal: 4.5,
    features: [
      'Tout Pro Elite +',
      'Multi-agents',
      'Dashboard agence',
      'White label',
      'API intégration',
      'Support dédié 24/7',
      'Custom branding',
      'Formation sur site',
      'SLA garanti',
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
    id: 'pms-starter', name: 'STARTER', planType: 'hotel_starter', price: 9900, priceLabel: '9 900 FCFA/mois',
    desc: 'Pour les petites guesthouses', color: '#00A651',
    features: ['5 chambres', 'Calendrier basique', 'Gestion repas', 'Profil guesthouse'],
  },
  {
    id: 'pms-pro', name: 'PRO', planType: 'hotel_pro', price: 24900, priceLabel: '24 900 FCFA/mois',
    desc: 'Pour les hôtels professionnels', color: '#009CDE', popular: true,
    features: ['Chambres illimitées', 'Calendrier avancé', 'Tarifs saisonniers', 'Gestion personnel', 'Statistiques', 'Channel manager', 'Certification AfriBayit'],
  },
  {
    id: 'pms-enterprise', name: 'ENTERPRISE', planType: 'hotel_enterprise', price: 0, priceLabel: 'Sur devis',
    desc: 'Pour les chaînes hôtelières', color: '#D4AF37',
    features: ['Tout PMS PRO +', 'Multi-établissements', 'API intégration', 'Support dédié 24/7', 'Custom branding', 'Formation sur site'],
  },
];

// ─── Artisan plan definition ───
const artisanPlan = {
  id: 'artisan-pro', name: 'Artisan Pro', planType: 'artisan_pro', price: 8900, priceLabel: '8 900 FCFA/mois',
  desc: 'Pour les artisans certifiés', color: '#D4AF37',
  features: ['Profil premium artisan', 'Portfolio illimité', 'Badge Artisan Certifié', 'Mise en avant recherche', 'Demandes urgentes', 'Statistiques', 'Support prioritaire'],
};

// ─── Premium Benefits Config ───
const PREMIUM_BENEFITS = [
  { key: 'inmail', label: 'InMail crédits', icon: <Mail className="w-4 h-4" /> },
  { key: 'rebecca', label: 'Rebecca Premium', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'alertes', label: 'Alertes prospects', icon: <Bell className="w-4 h-4" /> },
  { key: 'rapport', label: 'Rapport performance', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'whoViewed', label: "Who's Viewed", icon: <Eye className="w-4 h-4" /> },
  { key: 'badge', label: 'Badge Premium', icon: <Award className="w-4 h-4" /> },
];

// ─── Comparison features ───
const comparisonFeatures = [
  { name: 'Annonces actives', starter: '3', essentiel: '15', avance: '50', elite: '∞' },
  { name: 'Boost algorithme', starter: 'x1.0', essentiel: 'x1.5', avance: 'x2.5', elite: 'x4.0' },
  { name: 'InMail/mois', starter: '0', essentiel: '5', avance: '20', elite: '∞' },
  { name: 'Rebecca IA', starter: 'Basique', essentiel: 'Standard', avance: 'Avancée', elite: 'Complète' },
  { name: 'Badge', starter: 'Aucun', essentiel: 'Pro', avance: 'Premium Or', elite: 'Elite Diamant' },
  { name: 'Alertes prospects', starter: false, essentiel: true, avance: true, elite: true },
  { name: 'Rapport performance', starter: false, essentiel: false, avance: true, elite: true },
  { name: "Who's Viewed", starter: false, essentiel: false, avance: true, elite: true },
  { name: 'CRM intégré', starter: false, essentiel: false, avance: true, elite: true },
  { name: 'API Access', starter: false, essentiel: false, avance: false, elite: true },
  { name: 'Compte dédié', starter: false, essentiel: false, avance: false, elite: true },
  { name: 'Support', starter: 'Communauté', essentiel: 'Email', avance: 'Prioritaire', elite: 'Dédié 24/7' },
];

type CategoryKey = 'agent' | 'hotel' | 'artisan';

export default function SubscriptionsModule({ onNavigate, userId }: ModuleProps) {
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

  // Simulated current usage
  const currentUsage = { annonces: 8, photos: 42, inmail: 3 };

  const categories: { key: CategoryKey; label: string; icon: React.ReactNode }[] = [
    { key: 'agent', label: 'Agent', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'hotel', label: 'PMS Hôtelier', icon: <Hotel className="w-4 h-4" /> },
    { key: 'artisan', label: 'Artisan', icon: <Wrench className="w-4 h-4" /> },
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
        onSuccess: () => { toast.success('Abonnement activé', { description: 'Votre nouveau plan est maintenant actif' }); setShowUpgrade(false); setSelectedPlan(null); },
        onError: (error: Error) => { toast.error('Erreur lors de l\'activation', { description: error.message }); },
      }
    );
  };

  const handleCancelSubscription = (subId: string) => {
    cancelSubscription.mutate(
      { id: subId },
      {
        onSuccess: () => { toast.success('Abonnement annulé', { description: 'Votre abonnement a été annulé. Il restera actif jusqu\'à la fin de la période en cours.' }); },
        onError: (error: Error) => { toast.error('Erreur lors de l\'annulation', { description: error.message }); },
      }
    );
  };

  const boostMaxVal = 4.5;

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4"><RefreshCw className="w-4 h-4" /> Abonnements Premium</span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">Plans <span className="text-[#003087]">Premium</span></h1>
          <p className="text-gray-500 max-w-lg mx-auto">Choisissez le plan adapté à votre activité et débloquez tout le potentiel d&apos;AfriBayit</p>
        </motion.div>

        {/* Current Subscription Banner */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-[#003087] to-[#001a4d] rounded-3xl p-5 mb-8 text-white">
          {subsLoading ? (
            <div className="animate-pulse"><div className="h-3 bg-white/20 rounded w-24 mb-2" /><div className="h-6 bg-white/20 rounded w-32 mb-2" /><div className="h-3 bg-white/20 rounded w-48" /></div>
          ) : currentSubscription ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Abonnement actuel</p>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">{currentSubscription.plan}</h3>
                  <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${currentSubscription.status === 'active' ? 'bg-[#00A651]' : 'bg-[#D4AF37]'}`}>{currentSubscription.status === 'active' ? 'Actif' : currentSubscription.status}</span>
                </div>
                <p className="text-sm text-white/70 mt-1">Prochaine facturation : {currentSubscription.nextBilling} · {currentSubscription.paymentMethod}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(currentSubscription.price)} FCFA</p>
                  <p className="text-xs text-white/60">/mois</p>
                </div>
                {currentSubscription.status === 'active' && (
                  <button onClick={() => handleCancelSubscription(currentSubscription.id)} disabled={cancelSubscription.isPending} className="px-4 py-2 border border-white/30 rounded-full text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50">{cancelSubscription.isPending ? '...' : 'Annuler'}</button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div><p className="text-xs text-white/60 mb-1">Aucun abonnement actif</p><h3 className="font-display text-xl font-bold">Choisissez un plan</h3><p className="text-sm text-white/70 mt-1">Débloquez toutes les fonctionnalités d&apos;AfriBayit</p></div>
            </div>
          )}
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {categories.map(cat => (
            <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${activeCategory === cat.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>{cat.icon} {cat.label}</button>
          ))}
        </div>

        {/* Boost Algorithm Visualization (Agent only) */}
        {activeCategory === 'agent' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border mb-8">
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-[#D4AF37]" /> Algorithme de Boost</h3>
            <p className="text-sm text-gray-500 mb-4">Plus votre plan est élevé, plus vos annonces sont mises en avant dans les résultats de recherche.</p>
            <div className="flex items-end gap-3">
              {agentTiers.map((tier, i) => (
                <div key={tier.id} className="flex-1 text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2">{tier.name}</p>
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
              <p className="text-xs text-[#00A651] font-medium">Boost progressif : plus de visibilité = plus de contacts = plus de ventes</p>
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
                  <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: easeOut }} className={`bg-white rounded-3xl p-5 shadow-sm border relative flex flex-col ${'popular' in tier && tier.popular ? 'ring-2 ring-[#D4AF37]' : ''}`}>
                    {Boolean('popular' in tier && tier.popular) && (<span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">Populaire</span>)}
                    <div className="text-center mb-3">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F]">{tier.name}</h3>
                      <p className="text-xs text-gray-500 mb-1">{tier.desc}</p>
                      <p className="font-mono text-xl font-bold" style={{ color: tier.color }}>{tier.priceLabel}</p>
                      {agentTier && (<p className="text-xs font-semibold mt-1" style={{ color: tier.color }}>Boost {agentTier.boost}</p>)}
                    </div>
                    <div className="space-y-1.5 flex-1 mb-4">
                      {tier.features.map(f => (<div key={f} className="flex items-center gap-2 text-xs text-gray-600"><span className="text-[#00A651]"><Check className="w-3.5 h-3.5" /></span>{f}</div>))}
                    </div>

                    {/* Usage metrics for agent tiers */}
                    {agentTier && agentTier.limits && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl space-y-2">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Utilisation actuelle</p>
                        {agentTier.limits.annonces > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">Annonces</span><span className="font-mono font-bold">{currentUsage.annonces}/{agentTier.limits.annonces === -1 ? '∞' : agentTier.limits.annonces}</span></div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#003087]" style={{ width: `${Math.min((currentUsage.annonces / (agentTier.limits.annonces || 1)) * 100, 100)}%` }} /></div>
                          </div>
                        )}
                        {agentTier.limits.inmail > 0 && (
                          <div>
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-gray-500">InMail</span><span className="font-mono font-bold">{currentUsage.inmail}/{agentTier.limits.inmail === -1 ? '∞' : agentTier.limits.inmail}</span></div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#009CDE]" style={{ width: `${Math.min((currentUsage.inmail / (agentTier.limits.inmail || 1)) * 100, 100)}%` }} /></div>
                          </div>
                        )}
                        {agentTier.limits.annonces === -1 && agentTier.limits.inmail === -1 && (
                          <p className="text-[10px] text-[#00A651] font-medium">Illimité</p>
                        )}
                      </div>
                    )}

                    <button onClick={() => handleChoosePlan(tier.planType, tier.price)} disabled={currentSubscription?.plan === tier.name} className={`w-full py-2.5 rounded-full text-xs font-semibold transition-colors ${currentSubscription?.plan === tier.name ? 'bg-gray-100 text-gray-500 cursor-default' : tier.color === '#D4AF37' ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]' : 'bg-[#003087] text-white hover:bg-[#0047b3]'}`}>
                      {currentSubscription?.plan === tier.name ? 'Plan actuel' : tier.price === 0 && tier.id === 'starter' ? 'Commencer gratuitement' : 'Choisir'}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Premium Benefits Detail (Agent only) */}
            {activeCategory === 'agent' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-[#D4AF37]" /> Avantages Premium détaillés</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 pr-4 text-gray-500 font-medium">Avantage</th>
                        <th className="text-center py-3 px-2 font-bold text-gray-400">Starter</th>
                        <th className="text-center py-3 px-2 font-bold text-[#00A651]">Essentiel</th>
                        <th className="text-center py-3 px-2 font-bold text-[#009CDE]">Avancé</th>
                        <th className="text-center py-3 px-2 font-bold text-[#D4AF37]">Elite</th>
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
                                {benefit.label}
                              </div>
                            </td>
                            {vals.map((val, idx) => (
                              <td key={idx} className="text-center py-3 px-2">
                                {typeof val === 'boolean' ? (
                                  val ? <span className="text-[#00A651]"><Check className="w-4 h-4 mx-auto" /></span> : <span className="text-gray-300">—</span>
                                ) : val === -1 ? <span className="font-mono text-xs text-[#00A651]">Illimité</span> : <span className="font-mono text-xs">{String(val)}</span>}
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
                <button onClick={() => setShowComparison(!showComparison)} className="px-4 py-2 rounded-full text-sm font-medium bg-white border text-gray-600 hover:bg-gray-50 transition-all">{showComparison ? 'Masquer' : 'Afficher'} la comparaison détaillée</button>
                <AnimatePresence>
                  {showComparison && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 overflow-hidden">
                      <div className="bg-white rounded-3xl p-5 shadow-sm border overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 pr-4 text-gray-500 font-medium">Fonctionnalité</th>
                              <th className="text-center py-3 px-2 font-bold text-gray-400">Starter</th>
                              <th className="text-center py-3 px-2 font-bold text-[#00A651]">Essentiel</th>
                              <th className="text-center py-3 px-2 font-bold text-[#009CDE]">Avancé</th>
                              <th className="text-center py-3 px-2 font-bold text-[#D4AF37]">Elite</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonFeatures.map((feat, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-3 pr-4 text-gray-700">{feat.name}</td>
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
                  <div><p className="text-sm font-semibold text-[#2C2E2F]">Géomètre</p><p className="text-xs text-gray-500">Plans sur mesure — Contactez-nous</p></div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
                  <Scale className="w-5 h-5 text-[#D4AF37]" />
                  <div><p className="text-sm font-semibold text-[#2C2E2F]">Notaire</p><p className="text-xs text-gray-500">Plans Standard / Premium / Elite</p></div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Upgrade/Downgrade Modal */}
        {showUpgrade && selectedPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 max-w-sm w-full">
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Confirmer le changement</h3>
              <p className="text-sm text-gray-500 mb-4">Vous allez changer votre abonnement. Le prorata sera calculé automatiquement.</p>
              <div className="p-3 bg-gray-50 rounded-2xl mb-4">
                <p className="text-xs text-gray-500">Nouveau plan</p>
                <p className="text-sm font-bold text-[#2C2E2F]">{selectedPlan.replace(/_/g, ' ').toUpperCase()}</p>
                {selectedPlanPrice > 0 && (<p className="font-mono text-lg font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(selectedPlanPrice)} FCFA/mois</p>)}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowUpgrade(false)} className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50">Annuler</button>
                <button onClick={handleConfirmUpgrade} disabled={createSubscription.isPending} className="flex-1 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] disabled:opacity-50">{createSubscription.isPending ? 'Traitement...' : 'Confirmer'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
