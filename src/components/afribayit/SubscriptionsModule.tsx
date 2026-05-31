'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscriptions, useCreateSubscription, useCancelSubscription } from '@/hooks/useSubscriptions';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';
import { Building2, Check, Crown, Home, Hotel, RefreshCw, Ruler, Scale, Sprout, Wrench } from 'lucide-react';

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

// Static config — agent plan definitions (not DB data)
const agentTiers = [
  {
    id: 'helm-seed',
    name: 'HELM SEED',
    planType: 'agent_seed',
    price: 15000,
    priceLabel: '15 000 FCFA/mois',
    desc: 'Pour les agents qui démarrent',
    icon: '<Sprout className="w-4 h-4" />',
    color: '#00A651',
    features: [
      '15 annonces actives',
      'Photos illimitées',
      'Badge Agent Pro',
      'Statistiques basiques',
      'Support email',
      'Rebecca IA basique',
    ],
  },
  {
    id: 'helm-grow',
    name: 'HELM GROW',
    planType: 'agent_grow',
    price: 35000,
    priceLabel: '35 000 FCFA/mois',
    desc: 'Pour les agents en croissance',
    icon: '',
    color: '#009CDE',
    popular: true,
    features: [
      '50 annonces actives',
      'Photos + Vidéo',
      'Badge Premium Or',
      'CRM intégré',
      'Rebecca IA avancée',
      'Mise en avant recherche',
      'Rapports hebdomadaires',
      'Support prioritaire',
    ],
  },
  {
    id: 'helm-lead',
    name: 'HELM LEAD',
    planType: 'agent_lead',
    price: 75000,
    priceLabel: '75 000 FCFA/mois',
    desc: 'Pour les leaders du marché',
    icon: '<Crown className="w-4 h-4" />',
    color: '#D4AF37',
    features: [
      'Annonces illimitées',
      'Tout HELM GROW +',
      'Badge Elite Diamant',
      'Rebecca IA complète',
      'API Access',
      'Compte dédié',
      'Formation mensuelle',
      'Partenariats exclusifs',
    ],
  },
];

// Static config — hotel plan definitions
const hotelTiers = [
  {
    id: 'pms-starter',
    name: 'STARTER',
    planType: 'hotel_starter',
    price: 9900,
    priceLabel: '9 900 FCFA/mois',
    desc: 'Pour les petites guesthouses',
    icon: '<Home className="w-4 h-4" />',
    color: '#00A651',
    features: [
      '5 chambres',
      'Calendrier basique',
      'Gestion repas',
      'Profil guesthouse',
    ],
  },
  {
    id: 'pms-pro',
    name: 'PRO',
    planType: 'hotel_pro',
    price: 24900,
    priceLabel: '24 900 FCFA/mois',
    desc: 'Pour les hôtels professionnels',
    icon: '<Hotel className="w-4 h-4" />',
    color: '#009CDE',
    popular: true,
    features: [
      'Chambres illimitées',
      'Calendrier avancé',
      'Tarifs saisonniers',
      'Gestion personnel',
      'Statistiques',
      'Channel manager',
      'Certification AfriBayit',
    ],
  },
  {
    id: 'pms-enterprise',
    name: 'ENTERPRISE',
    planType: 'hotel_enterprise',
    price: 0,
    priceLabel: 'Sur devis',
    desc: 'Pour les chaînes hôtelières',
    icon: '<Building2 className="w-4 h-4" />',
    color: '#D4AF37',
    features: [
      'Tout PMS PRO +',
      'Multi-établissements',
      'API intégration',
      'Support dédié 24/7',
      'Custom branding',
      'Formation sur site',
    ],
  },
];

// Static config — artisan plan definition
const artisanPlan = {
  id: 'artisan-pro',
  name: 'Artisan Pro',
  planType: 'artisan_pro',
  price: 8900,
  priceLabel: '8 900 FCFA/mois',
  desc: 'Pour les artisans certifiés',
  icon: '<Wrench className="w-4 h-4" />',
  color: '#D4AF37',
  features: [
    'Profil premium artisan',
    'Portfolio illimité',
    'Badge Artisan Certifié',
    'Mise en avant recherche',
    'Demandes urgentes',
    'Statistiques',
    'Support prioritaire',
  ],
};

// Static config — comparison features
interface PlanFeature {
  name: string;
  seed: string | boolean;
  grow: string | boolean;
  lead: string | boolean;
}

const comparisonFeatures: PlanFeature[] = [
  { name: 'Annonces actives', seed: '15', grow: '50', lead: '∞' },
  { name: 'Photos', seed: 'Illimitées', grow: '+ Vidéo', lead: '+ Vidéo 360°' },
  { name: 'Badge', seed: 'Pro', grow: 'Premium Or', lead: 'Elite Diamant' },
  { name: 'Rebecca IA', seed: 'Basique', grow: 'Avancée', lead: 'Complète' },
  { name: 'CRM intégré', seed: false, grow: true, lead: true },
  { name: 'API Access', seed: false, grow: false, lead: true },
  { name: 'Compte dédié', seed: false, grow: false, lead: true },
  { name: 'Mise en avant', seed: false, grow: true, lead: true },
  { name: 'Support', seed: 'Email', grow: 'Prioritaire', lead: 'Dédié 24/7' },
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

  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'agent', label: 'Agent', icon: '' },
    { key: 'hotel', label: 'PMS Hôtelier', icon: '<Hotel className="w-4 h-4" />' },
    { key: 'artisan', label: 'Artisan', icon: '<Wrench className="w-4 h-4" />' },
  ];

  const getTiers = () => {
    if (activeCategory === 'agent') return agentTiers;
    if (activeCategory === 'hotel') return hotelTiers;
    return [artisanPlan];
  };

  // Handle "Choisir" plan button — opens confirmation modal
  const handleChoosePlan = (tierId: string, tierPrice: number) => {
    setSelectedPlan(tierId);
    setSelectedPlanPrice(tierPrice);
    setShowUpgrade(true);
  };

  // Handle "Confirmer" upgrade modal button — calls POST /api/subscriptions
  const handleConfirmUpgrade = () => {
    if (!selectedPlan) return;
    createSubscription.mutate(
      {
        planType: selectedPlan,
        priceXof: selectedPlanPrice,
        currency: 'XOF',
        autoRenew: true,
      },
      {
        onSuccess: () => {
          toast.success('Abonnement activé', { description: 'Votre nouveau plan est maintenant actif' });
          setShowUpgrade(false);
          setSelectedPlan(null);
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de l\'activation', { description: error.message });
        },
      }
    );
  };

  // Handle "Annuler" subscription button — calls PATCH /api/subscriptions/[id]
  const handleCancelSubscription = (subId: string) => {
    cancelSubscription.mutate(
      { id: subId },
      {
        onSuccess: () => {
          toast.success('Abonnement annulé', { description: 'Votre abonnement a été annulé. Il restera actif jusqu\'à la fin de la période en cours.' });
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de l\'annulation', { description: error.message });
        },
      }
    );
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            <RefreshCw className="w-4 h-4" /> Abonnements Premium — CDC §11
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Plans <span className="text-[#003087]">Premium</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Choisissez le plan adapté à votre activité et débloquez tout le potentiel d&apos;AfriBayit
          </p>
        </motion.div>

        {/* Current Subscription Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#003087] to-[#001a4d] rounded-3xl p-5 mb-8 text-white"
        >
          {subsLoading ? (
            <div className="animate-pulse">
              <div className="h-3 bg-white/20 rounded w-24 mb-2" />
              <div className="h-6 bg-white/20 rounded w-32 mb-2" />
              <div className="h-3 bg-white/20 rounded w-48" />
            </div>
          ) : currentSubscription ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-white/60 mb-1">Abonnement actuel</p>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-xl font-bold">{currentSubscription.plan}</h3>
                  <span className={`px-2 py-0.5 text-white text-[10px] font-bold rounded-full ${
                    currentSubscription.status === 'active' ? 'bg-[#00A651]' : 'bg-[#D4AF37]'
                  }`}>
                    {currentSubscription.status === 'active' ? 'Actif' : currentSubscription.status}
                  </span>
                </div>
                <p className="text-sm text-white/70 mt-1">
                  Prochaine facturation : {currentSubscription.nextBilling} · {currentSubscription.paymentMethod}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-2xl font-bold">{new Intl.NumberFormat('fr-FR').format(currentSubscription.price)} FCFA</p>
                  <p className="text-xs text-white/60">/mois</p>
                </div>
                {currentSubscription.status === 'active' && (
                  <button
                    onClick={() => handleCancelSubscription(currentSubscription.id)}
                    disabled={cancelSubscription.isPending}
                    className="px-4 py-2 border border-white/30 rounded-full text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {cancelSubscription.isPending ? '...' : 'Annuler'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 mb-1">Aucun abonnement actif</p>
                <h3 className="font-display text-xl font-bold">Choisissez un plan</h3>
                <p className="text-sm text-white/70 mt-1">Débloquez toutes les fonctionnalités d&apos;AfriBayit</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: easeOut }}
          >
            {/* Pricing Grid */}
            <div className={`grid gap-5 ${activeCategory === 'artisan' ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {getTiers().map((tier, i) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, ease: easeOut }}
                  className={`bg-white rounded-3xl p-6 shadow-sm border relative flex flex-col ${
                    'popular' in tier && tier.popular ? 'ring-2 ring-[#D4AF37]' : ''
                  }`}
                >
                  {'popular' in tier && tier.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">
                      Populaire
                    </span>
                  )}
                  <div className="text-center mb-4">
                    <span className="text-3xl block mb-2">{tier.icon}</span>
                    <h3 className="font-display text-lg font-bold text-[#2C2E2F]">{tier.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{tier.desc}</p>
                    <p className="font-mono text-2xl font-bold" style={{ color: tier.color }}>{tier.priceLabel}</p>
                  </div>

                  <div className="space-y-2 flex-1 mb-5">
                    {tier.features.map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-[#00A651]"><Check className="w-4 h-4" /></span>{f}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleChoosePlan(tier.planType, tier.price)}
                    disabled={currentSubscription?.plan === tier.name}
                    className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${
                      currentSubscription?.plan === tier.name
                        ? 'bg-gray-100 text-gray-500 cursor-default'
                        : tier.color === '#D4AF37'
                          ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]'
                          : 'bg-[#003087] text-white hover:bg-[#0047b3]'
                    }`}
                  >
                    {currentSubscription?.plan === tier.name ? 'Plan actuel' : 'Choisir'}
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Feature Comparison */}
            {activeCategory === 'agent' && (
              <div className="mt-8">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-white border text-gray-600 hover:bg-gray-50 transition-all"
                >
                  {showComparison ? 'Masquer' : 'Afficher'} la comparaison détaillée
                </button>

                <AnimatePresence>
                  {showComparison && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <div className="bg-white rounded-3xl p-5 shadow-sm border overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-3 pr-4 text-gray-500 font-medium">Fonctionnalité</th>
                              <th className="text-center py-3 px-2 font-bold text-[#00A651]">SEED</th>
                              <th className="text-center py-3 px-2 font-bold text-[#009CDE]">GROW</th>
                              <th className="text-center py-3 px-2 font-bold text-[#D4AF37]">LEAD</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comparisonFeatures.map((feat, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-3 pr-4 text-gray-700">{feat.name}</td>
                                <td className="text-center py-3 px-2">
                                  {typeof feat.seed === 'boolean' ? (
                                    feat.seed ? <span className="text-[#00A651]"><Check className="w-4 h-4" /></span> : <span className="text-gray-300">—</span>
                                  ) : <span className="font-mono text-xs">{feat.seed}</span>}
                                </td>
                                <td className="text-center py-3 px-2">
                                  {typeof feat.grow === 'boolean' ? (
                                    feat.grow ? <span className="text-[#00A651]"><Check className="w-4 h-4" /></span> : <span className="text-gray-300">—</span>
                                  ) : <span className="font-mono text-xs">{feat.grow}</span>}
                                </td>
                                <td className="text-center py-3 px-2">
                                  {typeof feat.lead === 'boolean' ? (
                                    feat.lead ? <span className="text-[#00A651]"><Check className="w-4 h-4" /></span> : <span className="text-gray-300">—</span>
                                  ) : <span className="font-mono text-xs">{feat.lead}</span>}
                                </td>
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
                  <span className="text-2xl"><Ruler className="w-4 h-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2E2F]">Géomètre</p>
                    <p className="text-xs text-gray-500">Plans sur mesure — Contactez-nous</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-3">
                  <span className="text-2xl"><Scale className="w-4 h-4" /></span>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2E2F]">Notaire</p>
                    <p className="text-xs text-gray-500">Plans Standard / Premium / Elite</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Upgrade/Downgrade Modal */}
        {showUpgrade && selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full"
            >
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Confirmer le changement</h3>
              <p className="text-sm text-gray-500 mb-4">
                Vous allez changer votre abonnement. Le prorata sera calculé automatiquement.
              </p>
              <div className="p-3 bg-gray-50 rounded-2xl mb-4">
                <p className="text-xs text-gray-500">Nouveau plan</p>
                <p className="text-sm font-bold text-[#2C2E2F]">{selectedPlan.replace(/_/g, ' ').toUpperCase()}</p>
                {selectedPlanPrice > 0 && (
                  <p className="font-mono text-lg font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(selectedPlanPrice)} FCFA/mois</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgrade(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmUpgrade}
                  disabled={createSubscription.isPending}
                  className="flex-1 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] disabled:opacity-50"
                >
                  {createSubscription.isPending ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
