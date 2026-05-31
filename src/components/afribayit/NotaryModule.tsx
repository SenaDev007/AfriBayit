'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotaries } from '@/hooks/useNotaries';
import { useEscrowList } from '@/hooks/useEscrow';
import { useCreateConversation } from '@/hooks/useChat';
import { useCreateSubscription } from '@/hooks/useSubscriptions';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

interface Notary {
  id: string;
  name: string;
  license: string;
  zone: string;
  country: string;
  rating: number;
  missions: number;
  certificationLevel: string;
  avatar: string;
  available: boolean;
  specialities: string[];
  subscription: string;
  userId?: string;
  certifiedAt?: string;
  createdAt?: string;
}

interface EscrowAccount {
  id: string;
  property: string;
  buyer: string;
  amount: number;
  status: string;
}

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — escrow notary state machine
const escrowNotaryStates = [
  { key: 'NOTARY_ASSIGNED', label: 'Notaire assigné', icon: '⚖️', color: '#009CDE' },
  { key: 'NOTARY_IN_PROGRESS', label: 'En cours notaire', icon: '📋', color: '#D4AF37' },
  { key: 'DEED_SIGNED', label: 'Acte signé', icon: '📝', color: '#00A651' },
  { key: 'ANDF_REGISTERED', label: 'ANDF enregistré', icon: '✅', color: '#003087' },
];

// Static config — certification steps
const certificationSteps = [
  { step: 1, title: 'Inscription', desc: 'Création du compte notaire sur AfriBayit', icon: '📋' },
  { step: 2, title: 'Documents KYC', desc: 'Carte ANDF, diplôme, extrait casier judiciaire', icon: '📄' },
  { step: 3, title: 'Vérification IA', desc: 'Analyse automatique des documents et antécédents', icon: '🤖' },
  { step: 4, title: 'Validation humaine', desc: 'Revue par un comité de notaires certifiés', icon: '👤' },
  { step: 5, title: 'Certification', desc: 'Badge Notaire Certifié AfriBayit délivré', icon: '🏅' },
];

// Static config — subscription tiers
const subscriptionTiers = [
  { name: 'Standard', planType: 'notary_standard', price: 0, priceLabel: 'Gratuit', commission: '15%', features: ['5 missions/mois', 'Profil basique', 'Support email'] },
  { name: 'Premium', planType: 'notary_premium', price: 25000, priceLabel: '25 000 FCFA/mois', commission: '12%', features: ['Missions illimitées', 'Profil avancé', 'Support prioritaire', 'Statistiques'] },
  { name: 'Elite', planType: 'notary_elite', price: 50000, priceLabel: '50 000 FCFA/mois', commission: '10%', features: ['Tout Premium +', 'Mise en avant', 'API Access', 'Compte dédié'] },
];

// Static config — filter options
const zones = ['Toutes', 'Cotonou', 'Abidjan', 'Lomé', 'Ouagadougou', 'Porto-Novo'];
const levels = ['Tous', 'Certifié', 'Senior', 'Expert'];

function NotarySkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-36 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-12 bg-gray-100 rounded-full" />
        <div className="h-4 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-9 bg-gray-200 rounded-full mt-3" />
    </div>
  );
}

function getCertificationColor(level: string): string {
  switch (level) {
    case 'Expert': return '#D4AF37';
    case 'Senior': return '#009CDE';
    case 'Certifié': return '#00A651';
    default: return '#6b7280';
  }
}

function getEscrowStateColor(status: string): string {
  const s = escrowNotaryStates.find(e => e.key === status);
  return s?.color || '#6b7280';
}

function getEscrowStateLabel(status: string): string {
  const s = escrowNotaryStates.find(e => e.key === status);
  return s?.label || status;
}

export default function NotaryModule({ onNavigate }: ModuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('Toutes');
  const [selectedLevel, setSelectedLevel] = useState('Tous');
  const [activeTab, setActiveTab] = useState<'notaries' | 'dashboard' | 'certification' | 'revenue'>('notaries');
  const [certStep, setCertStep] = useState(0);
  const [contactingNotaryId, setContactingNotaryId] = useState<string | null>(null);
  const { selectedCountry } = useCountry();

  const { data: notariesData, isLoading: notariesLoading, error: notariesError } = useNotaries(
    undefined,
    selectedZone === 'Toutes' ? undefined : selectedZone,
    selectedCountry
  );
  const { data: escrowData, isLoading: escrowLoading } = useEscrowList();

  const createConversation = useCreateConversation();
  const createSubscription = useCreateSubscription();

  const notaries: Notary[] = (notariesData?.notaries as Notary[]) || [];
  const escrowAccounts: EscrowAccount[] = (escrowData?.escrowAccounts as EscrowAccount[]) || [];

  const filteredNotaries = notaries.filter(n => {
    const matchSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) || n.license.toLowerCase().includes(searchQuery.toLowerCase());
    const matchZone = selectedZone === 'Toutes' || n.zone === selectedZone;
    const matchLevel = selectedLevel === 'Tous' || n.certificationLevel === selectedLevel;
    return matchSearch && matchZone && matchLevel;
  });

  // Compute revenue from escrow accounts instead of hardcoding
  const computedRevenue = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return escrowAccounts
      .filter(e => {
        // Use all escrow accounts as a proxy — in production, filter by month
        return true;
      })
      .reduce((sum, e) => sum + Math.round(e.amount * 0.12), 0); // 12% commission proxy
  }, [escrowAccounts]);

  const formatFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  // Handle contacter notary
  const handleContactNotary = (notary: Notary) => {
    setContactingNotaryId(notary.id);
    createConversation.mutate(
      {
        type: 'user_to_user',
        participantIds: [notary.userId || notary.id],
        metadata: { context: 'notary_contact', notaryName: notary.name },
      },
      {
        onSuccess: () => {
          toast.success('Conversation créée', { description: `Vous pouvez maintenant contacter ${notary.name}` });
          setContactingNotaryId(null);
          if (onNavigate) onNavigate('chat');
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de la création de la conversation', { description: error.message });
          setContactingNotaryId(null);
        },
      }
    );
  };

  // Handle choisir subscription for notary
  const handleChooseNotaryPlan = (tier: typeof subscriptionTiers[number]) => {
    createSubscription.mutate(
      {
        planType: tier.planType,
        priceXof: tier.price,
        currency: 'XOF',
        autoRenew: true,
      },
      {
        onSuccess: () => {
          toast.success('Abonnement activé', { description: `Plan ${tier.name} activé avec succès` });
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de l\'activation', { description: error.message });
        },
      }
    );
  };

  // ANDF status items — derive from escrow data instead of hardcoding
  const andfStatusItems = useMemo(() => {
    const andfRegistered = escrowAccounts.filter(e => e.status === 'ANDF_REGISTERED').length;
    return [
      { label: 'Inscription ANDF', status: andfRegistered > 0 ? 'Validé' : 'Non vérifié', done: andfRegistered > 0 },
      { label: 'Carte professionnelle', status: andfRegistered > 1 ? 'Validé' : 'En attente', done: andfRegistered > 1 },
      { label: 'Renouvellement 2025', status: 'En attente', done: false },
    ];
  }, [escrowAccounts]);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            ⚖️ Notaire Certifié — CDC §5.0bis
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Espace <span className="text-[#003087]">Notarial</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Notaires certifiés, processus de certification ANDF, et gestion des actes immobiliers
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {[
            { key: 'notaries' as const, label: 'Répertoire Notaires', icon: '⚖️' },
            { key: 'dashboard' as const, label: 'Tableau de bord', icon: '📊' },
            { key: 'certification' as const, label: 'Certification', icon: '🏅' },
            { key: 'revenue' as const, label: 'Modèle revenus', icon: '💰' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ===== NOTARIES LIST ===== */}
          {activeTab === 'notaries' && (
            <motion.div
              key="notaries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Rechercher un notaire..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20 bg-white"
                  />
                </div>
                <select
                  value={selectedZone}
                  onChange={e => setSelectedZone(e.target.value)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#003087]"
                >
                  {zones.map(z => <option key={z} value={z}>{z === 'Toutes' ? '🏘️ Toutes les zones' : z}</option>)}
                </select>
                <select
                  value={selectedLevel}
                  onChange={e => setSelectedLevel(e.target.value)}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#003087]"
                >
                  {levels.map(l => <option key={l} value={l}>{l === 'Tous' ? '🏅 Tous niveaux' : l}</option>)}
                </select>
              </div>

              {/* Loading */}
              {notariesLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <NotarySkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error */}
              {notariesError && (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">⚠️</span>
                  <p className="text-gray-600 font-semibold mb-1">Impossible de charger les notaires</p>
                  <p className="text-sm text-gray-400">{notariesError.message}</p>
                </div>
              )}

              {/* Empty */}
              {!notariesLoading && !notariesError && filteredNotaries.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">⚖️</span>
                  <p className="text-gray-600 font-semibold mb-1">Aucun notaire trouvé</p>
                  <p className="text-sm text-gray-400">Modifiez vos critères de recherche</p>
                </div>
              )}

              {/* Notary Cards */}
              {!notariesLoading && !notariesError && filteredNotaries.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredNotaries.map((notary, i) => (
                    <motion.div
                      key={notary.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                      whileHover={{ y: -4 }}
                      className="bg-white rounded-3xl p-5 shadow-sm border group cursor-pointer"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <ImageWithFallback src={notary.avatar} alt={notary.name} className="w-14 h-14 rounded-2xl" fallbackType="avatar" />
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${notary.available ? 'bg-[#00A651]' : 'bg-gray-300'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base font-bold text-[#2C2E2F] truncate group-hover:text-[#003087] transition-colors">
                            {notary.name}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono">{notary.license}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: getCertificationColor(notary.certificationLevel) }}>
                              {notary.certificationLevel}
                            </span>
                            <span className="text-xs text-gray-500">{notary.zone}, {notary.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {notary.rating}
                        </span>
                        <span className="text-xs text-gray-500">📋 {notary.missions} missions</span>
                      </div>
                      {(notary.certifiedAt || notary.createdAt) && (
                        <p className="text-[10px] text-gray-400 mb-2">
                          {notary.certifiedAt ? `Certifié ${timeAgo(notary.certifiedAt)}` : `Inscrit ${timeAgo(notary.createdAt!)}`}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {notary.specialities.map(s => (
                          <span key={s} className="px-2 py-0.5 bg-gray-50 rounded-full text-[10px] text-gray-600">{s}</span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className={`text-xs font-medium ${notary.available ? 'text-[#00A651]' : 'text-gray-400'}`}>
                          {notary.available ? '● Disponible' : '○ Indisponible'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleContactNotary(notary); }}
                          disabled={contactingNotaryId === notary.id || createConversation.isPending}
                          className="px-4 py-1.5 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {contactingNotaryId === notary.id ? '...' : 'Contacter'}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ===== NOTARY DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Transactions assignées', value: String(escrowAccounts.length), icon: '📋', color: '#009CDE' },
                  { label: 'Actes en cours', value: String(escrowAccounts.filter(e => e.status === 'NOTARY_IN_PROGRESS').length), icon: '📝', color: '#D4AF37' },
                  { label: 'ANDF enregistrés', value: String(escrowAccounts.filter(e => e.status === 'ANDF_REGISTERED').length), icon: '✅', color: '#00A651' },
                  { label: 'Revenus ce mois', value: formatFCFA(computedRevenue), icon: '💰', color: '#003087' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-2xl p-4 shadow-sm border"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{stat.icon}</span>
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </div>
                    <p className="font-mono text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Escrow State Machine */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Cycle notarial Escrow</h3>
                <div className="flex items-start gap-2 overflow-x-auto pb-2">
                  {escrowNotaryStates.map((state, i) => (
                    <div key={state.key} className="flex items-start shrink-0">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: `${state.color}15` }}>
                          {state.icon}
                        </div>
                        <p className="text-[10px] font-medium mt-1 text-center w-24" style={{ color: state.color }}>
                          {state.label}
                        </p>
                      </div>
                      {i < escrowNotaryStates.length - 1 && (
                        <div className="w-8 h-0.5 mt-6 shrink-0" style={{ backgroundColor: i < 2 ? state.color : '#e5e7eb' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned Transactions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Transactions assignées</h3>
                {escrowLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                  </div>
                ) : escrowAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">Aucune transaction assignée</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {escrowAccounts.map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C2E2F] truncate">{txn.property}</p>
                          <p className="text-xs text-gray-500">{txn.buyer}</p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <p className="font-mono text-sm font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(txn.amount)} FCFA</p>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: getEscrowStateColor(txn.status) }}>
                            {getEscrowStateLabel(txn.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ANDF Registration Status */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Statut ANDF</h3>
                <div className="space-y-3">
                  {andfStatusItems.map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <span className="text-sm text-[#2C2E2F]">{item.label}</span>
                      <span className={`text-xs font-semibold ${item.done ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>
                        {item.done ? '✅' : '⏳'} {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== CERTIFICATION PROCESS ===== */}
          {activeTab === 'certification' && (
            <motion.div
              key="certification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-6">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-6">Processus de certification notaire</h3>

                {/* Progress Stepper */}
                <div className="flex items-center gap-2 mb-8">
                  {certificationSteps.map((s, i) => (
                    <div key={s.step} className="flex items-center flex-1">
                      <button
                        onClick={() => setCertStep(i)}
                        className="flex flex-col items-center"
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                          i <= certStep ? 'bg-[#003087] text-white shadow-lg' : 'bg-gray-100'
                        }`}>
                          {i < certStep ? '✓' : s.icon}
                        </div>
                        <p className={`text-[10px] font-medium mt-1 text-center w-16 ${
                          i <= certStep ? 'text-[#003087]' : 'text-gray-400'
                        }`}>
                          {s.title}
                        </p>
                      </button>
                      {i < certificationSteps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${
                          i < certStep ? 'bg-[#003087]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Detail */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={certStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-5 bg-gray-50 rounded-2xl"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{certificationSteps[certStep].icon}</span>
                      <div>
                        <h4 className="font-display text-base font-bold text-[#2C2E2F]">
                          Étape {certificationSteps[certStep].step} : {certificationSteps[certStep].title}
                        </h4>
                        <p className="text-sm text-gray-500">{certificationSteps[certStep].desc}</p>
                      </div>
                    </div>
                    {certStep === 1 && (
                      <div className="mt-4 space-y-2">
                        {['Carte ANDF en cours de validité', 'Diplôme de notaire', 'Extrait casier judiciaire (< 3 mois)', 'Justificatif de domicile professionnel', 'Photo d\'identité'].map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded-xl">
                            <span className="text-sm">{idx < 3 ? '✅' : '⏳'}</span>
                            <span className="text-xs text-gray-700">{doc}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {certStep === 2 && (
                      <div className="mt-4 p-3 bg-white rounded-xl">
                        <p className="text-xs text-gray-600 mb-2">Analyse IA en cours...</p>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div className="h-full bg-[#009CDE] rounded-full" initial={{ width: '0%' }} animate={{ width: '75%' }} transition={{ duration: 1.5 }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">3/4 documents vérifiés</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCertStep(Math.max(0, certStep - 1))}
                    disabled={certStep === 0}
                    className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCertStep(Math.min(certificationSteps.length - 1, certStep + 1))}
                    className="flex-1 px-5 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    {certStep === certificationSteps.length - 1 ? 'Terminer' : 'Étape suivante'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== REVENUE MODEL ===== */}
          {activeTab === 'revenue' && (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {subscriptionTiers.map((tier, i) => (
                  <motion.div
                    key={tier.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className={`bg-white rounded-3xl p-6 shadow-sm border relative ${
                      tier.name === 'Premium' ? 'ring-2 ring-[#D4AF37]' : ''
                    }`}
                  >
                    {tier.name === 'Premium' && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">
                        Populaire
                      </span>
                    )}
                    <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">{tier.name}</h3>
                    <p className="font-mono text-2xl font-bold text-[#D4AF37] mb-1">{tier.priceLabel}</p>
                    <p className="text-xs text-gray-500 mb-4">Commission : <span className="font-bold text-[#2C2E2F]">{tier.commission}</span></p>
                    <div className="space-y-2">
                      {tier.features.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-[#00A651]">✓</span>{f}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleChooseNotaryPlan(tier)}
                      disabled={tier.name === 'Standard' || createSubscription.isPending}
                      className={`w-full mt-5 py-2.5 rounded-full text-sm font-semibold transition-colors disabled:opacity-50 ${
                        tier.name === 'Standard'
                          ? 'bg-gray-100 text-gray-500 cursor-default'
                          : tier.name === 'Premium'
                          ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]'
                          : 'bg-[#003087] text-white hover:bg-[#0047b3]'
                      }`}
                    >
                      {createSubscription.isPending ? '...' : tier.name === 'Standard' ? 'Actuel' : 'Choisir'}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Revenue breakdown */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Détail du modèle de revenus</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#00A651]/5 rounded-2xl">
                    <p className="text-xs text-[#00A651] font-semibold mb-1">Commission par transaction</p>
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">10 – 15%</p>
                    <p className="text-xs text-gray-500 mt-1">Selon le niveau d&apos;abonnement du notaire</p>
                  </div>
                  <div className="p-4 bg-[#003087]/5 rounded-2xl">
                    <p className="text-xs text-[#003087] font-semibold mb-1">Abonnement mensuel</p>
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">0 – 50 000 FCFA</p>
                    <p className="text-xs text-gray-500 mt-1">3 niveaux : Standard, Premium, Elite</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
