'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEscrowList, useCreateEscrow } from '@/hooks/useEscrow';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';

interface EscrowFlowProps {
  onNavigate: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — payment providers
const paymentProviders = [
  { key: 'mtn', name: 'MTN Mobile Money', icon: '📱', color: '#FFC300' },
  { key: 'orange', name: 'Orange Money', icon: '🍊', color: '#FF6600' },
  { key: 'moov', name: 'Moov Money', icon: '🔵', color: '#0066CC' },
  { key: 'carte', name: 'Carte bancaire', icon: '💳', color: '#003087' },
];

// Full escrow state machine — CDC §5.0bis.4
type EscrowState = 'CREATED' | 'FUNDED' | 'DOCS_VALIDATED' | 'GEOTRUST_VALIDATED' | 'NOTARY_ASSIGNED' | 'NOTARY_IN_PROGRESS' | 'DEED_SIGNED' | 'ANDF_REGISTERED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'EXPIRED';

interface EscrowStateConfig {
  key: EscrowState;
  label: string;
  icon: string;
  description: string;
  category: 'normal' | 'success' | 'exception';
}

const escrowStatesConfig: EscrowStateConfig[] = [
  { key: 'CREATED', label: 'Créé', icon: '📋', description: 'Transaction initiée par l\'acheteur', category: 'normal' },
  { key: 'FUNDED', label: 'Financé', icon: '💰', description: 'Fonds déposés en escrow sécurisé', category: 'normal' },
  { key: 'DOCS_VALIDATED', label: 'Docs validés', icon: '📄', description: 'Documents légaux vérifiés par l\'IA', category: 'normal' },
  { key: 'GEOTRUST_VALIDATED', label: 'GeoTrust', icon: '🌍', description: 'Validation géomatique du bien', category: 'normal' },
  { key: 'NOTARY_ASSIGNED', label: 'Notaire assigné', icon: '⚖️', description: 'Un notaire est désigné pour la transaction', category: 'normal' },
  { key: 'NOTARY_IN_PROGRESS', label: 'Notaire en cours', icon: '🔨', description: 'Le notaire prépare l\'acte de vente', category: 'normal' },
  { key: 'DEED_SIGNED', label: 'Acte signé', icon: '📝', description: 'L\'acte de vente est signé par les parties', category: 'normal' },
  { key: 'ANDF_REGISTERED', label: 'ANDF enregistré', icon: '🏛️', description: 'Enregistrement à l\'ANDF confirmé', category: 'normal' },
  { key: 'RELEASED', label: 'Libéré', icon: '✅', description: 'Fonds libérés au vendeur — Transaction terminée', category: 'success' },
];

const exceptionStatesConfig: EscrowStateConfig[] = [
  { key: 'DISPUTED', label: 'Litige', icon: '⚠️', description: 'Un litige a été signalé — Médiation en cours', category: 'exception' },
  { key: 'REFUNDED', label: 'Remboursé', icon: '↩️', description: 'Fonds remboursés à l\'acheteur', category: 'exception' },
  { key: 'EXPIRED', label: 'Expiré', icon: '⏰', description: 'Transaction expirée sans aboutir', category: 'exception' },
];

const normalFlowOrder: EscrowState[] = ['CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED', 'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED'];

export default function EscrowFlow({ onNavigate }: EscrowFlowProps) {
  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentEscrowState, setCurrentEscrowState] = useState<EscrowState>('FUNDED');

  const { selectedCountry } = useCountry();
  const { data, isLoading } = useEscrowList(1, 20, selectedCountry);
  const createEscrow = useCreateEscrow();

  // Get the first escrow account for transaction details (or use selected one)
  const escrowAccounts = (data?.escrowAccounts as Array<{
    id: string;
    property?: string;
    buyer?: string;
    amount?: number;
    status: string;
    currency?: string;
    createdAt?: string;
    updatedAt?: string;
    transaction?: { id: string; propertyId: string; buyerId: string; status: string; amount: number; currency: string };
  }>) || [];

  const selectedEscrow = escrowAccounts[0];

  // Derive property name and amount from API data
  const propertyName = selectedEscrow?.property || selectedEscrow?.transaction?.propertyId || 'Propriété';
  const amount = selectedEscrow?.amount || selectedEscrow?.transaction?.amount || 0;
  const currency = selectedEscrow?.currency || selectedEscrow?.transaction?.currency || 'XOF';
  const escrowFee = Math.round(amount * 0.015);
  const totalAmount = amount + escrowFee;

  // Build completed timestamps from actual API data
  const completedTimestamps = useMemo<Record<EscrowState, string | null>>(() => {
    const ts: Record<EscrowState, string | null> = {
      CREATED: null, FUNDED: null, DOCS_VALIDATED: null, GEOTRUST_VALIDATED: null,
      NOTARY_ASSIGNED: null, NOTARY_IN_PROGRESS: null, DEED_SIGNED: null,
      ANDF_REGISTERED: null, RELEASED: null, DISPUTED: null, REFUNDED: null, EXPIRED: null,
    };
    if (selectedEscrow?.createdAt) {
      ts.CREATED = new Date(selectedEscrow.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    if (selectedEscrow?.updatedAt && currentEscrowState !== 'CREATED') {
      ts[currentEscrowState] = new Date(selectedEscrow.updatedAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return ts;
  }, [selectedEscrow, currentEscrowState]);

  const steps = [
    { title: 'Choisir le moyen de paiement', desc: 'Sélectionnez votre fournisseur de paiement' },
    { title: 'Montant et détails', desc: 'Vérifiez les informations de la transaction' },
    { title: 'Confirmation', desc: 'Confirmez le paiement en escrow' },
  ];

  const handleConfirm = () => {
    if (!selectedEscrow?.transaction?.id && !selectedEscrow?.id) {
      toast.error('Aucune transaction sélectionnée');
      return;
    }
    createEscrow.mutate(
      {
        transactionId: selectedEscrow?.transaction?.id || selectedEscrow?.id,
        currency,
        provider: selectedProvider,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          toast.success('Paiement escrow confirmé !');
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de la confirmation', { description: error.message });
        },
      }
    );
  };

  // Determine the state of each step in the timeline
  const getStateStatus = (stateKey: EscrowState): 'completed' | 'current' | 'upcoming' | 'exception' => {
    if (exceptionStatesConfig.some(s => s.key === stateKey)) {
      if (currentEscrowState === 'DISPUTED' || currentEscrowState === 'REFUNDED' || currentEscrowState === 'EXPIRED') {
        if (currentEscrowState === stateKey) return 'exception';
      }
      return 'upcoming';
    }
    const currentIndex = normalFlowOrder.indexOf(currentEscrowState);
    const stateIndex = normalFlowOrder.indexOf(stateKey);
    if (currentEscrowState === 'DISPUTED' || currentEscrowState === 'REFUNDED' || currentEscrowState === 'EXPIRED') {
      return stateIndex < currentIndex ? 'completed' : 'upcoming';
    }
    if (stateIndex < currentIndex) return 'completed';
    if (stateIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const isExceptionActive = ['DISPUTED', 'REFUNDED', 'EXPIRED'].includes(currentEscrowState);

  const formatFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
            🔒 Escrow Sécurisé — CDC §5.0bis.4
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
            Transaction Escrow
          </h1>
          <p className="text-gray-500 text-sm">Vos fonds sont protégés jusqu&apos;à la signature notariale</p>
        </motion.div>

        {/* Escrow State Timeline — Full State Machine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="bg-white rounded-3xl p-6 shadow-sm border mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Cycle de vie Escrow</h3>
            <select
              value={currentEscrowState}
              onChange={(e) => setCurrentEscrowState(e.target.value as EscrowState)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:border-[#003087]"
              aria-label="Simuler l'état escrow"
            >
              {normalFlowOrder.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              {exceptionStatesConfig.map(s => (
                <option key={s.key} value={s.key}>{s.key} (exception)</option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-start shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                    <div className="w-20 h-3 bg-gray-100 rounded mt-1 animate-pulse" />
                  </div>
                  {i < 8 && <div className="w-8 h-0.5 mt-5 bg-gray-200 shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Normal flow timeline */}
              <div className="flex items-start gap-1 overflow-x-auto pb-3">
                {escrowStatesConfig.map((state, i) => {
                  const status = getStateStatus(state.key);
                  return (
                    <div key={state.key} className="flex items-start shrink-0">
                      <div className="flex flex-col items-center w-16 sm:w-20">
                        <motion.div
                          initial={false}
                          animate={{
                            scale: status === 'current' ? 1.15 : 1,
                          }}
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                            status === 'completed'
                              ? 'bg-[#00A651]/10 ring-2 ring-[#00A651]/30'
                              : status === 'current'
                              ? 'bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]'
                              : 'bg-gray-100'
                          }`}
                        >
                          {status === 'completed' ? (
                            <svg className="w-5 h-5 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className={status === 'current' ? '' : 'opacity-40'}>{state.icon}</span>
                          )}
                          {status === 'current' && (
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-[#D4AF37]"
                              animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                            />
                          )}
                        </motion.div>
                        <p className={`text-[9px] sm:text-[10px] font-medium mt-1 text-center leading-tight ${
                          status === 'completed' ? 'text-[#00A651]' :
                          status === 'current' ? 'text-[#D4AF37] font-bold' :
                          'text-gray-400'
                        }`}>
                          {state.label}
                        </p>
                        {status === 'completed' && completedTimestamps[state.key] && (
                          <p className="text-[8px] text-gray-400 text-center mt-0.5">
                            {completedTimestamps[state.key]}
                          </p>
                        )}
                      </div>
                      {i < escrowStatesConfig.length - 1 && (
                        <div className={`w-4 sm:w-6 h-0.5 mt-5 shrink-0 transition-colors duration-300 ${
                          getStateStatus(escrowStatesConfig[i + 1].key) !== 'upcoming' ? 'bg-[#00A651]' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Current state description */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEscrowState}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`mt-4 p-3 rounded-2xl text-xs ${
                    isExceptionActive
                      ? currentEscrowState === 'DISPUTED'
                        ? 'bg-[#D93025]/5 text-[#D93025]'
                        : 'bg-[#FF9800]/5 text-[#E65100]'
                      : currentEscrowState === 'RELEASED'
                      ? 'bg-[#00A651]/5 text-[#00A651]'
                      : 'bg-[#003087]/5 text-[#003087]'
                  }`}
                >
                  <span className="font-semibold">Étape actuelle : </span>
                  {escrowStatesConfig.find(s => s.key === currentEscrowState)?.description ||
                   exceptionStatesConfig.find(s => s.key === currentEscrowState)?.description}
                </motion.div>
              </AnimatePresence>

              {/* Exception states */}
              {isExceptionActive && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-2"
                >
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">États exceptionnels</p>
                  <div className="flex gap-2">
                    {exceptionStatesConfig.map((state) => {
                      const isActive = currentEscrowState === state.key;
                      return (
                        <div
                          key={state.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                            isActive
                              ? state.key === 'DISPUTED'
                                ? 'bg-[#D93025]/10 text-[#D93025] ring-1 ring-[#D93025]/30'
                                : 'bg-[#FF9800]/10 text-[#E65100] ring-1 ring-[#FF9800]/30'
                              : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          <span>{state.icon}</span>
                          <span className="font-medium">{state.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* State Machine Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
          className="bg-white rounded-3xl p-5 shadow-sm border mb-6"
        >
          <h4 className="font-display text-sm font-bold text-[#2C2E2F] mb-3">Machine à états Escrow</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {escrowStatesConfig.map((state) => {
              const status = getStateStatus(state.key);
              return (
                <div key={state.key} className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    status === 'completed' ? 'bg-[#00A651]/10' :
                    status === 'current' ? 'bg-[#D4AF37]/10' :
                    'bg-gray-100'
                  }`}>
                    <span className="text-xs">{state.icon}</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${
                      status === 'completed' ? 'text-[#00A651]' :
                      status === 'current' ? 'text-[#D4AF37]' :
                      'text-gray-400'
                    }`}>
                      {state.label}
                      {status === 'current' && (
                        <span className="ml-1 px-1.5 py-0.5 bg-[#D4AF37] text-white text-[8px] rounded-full font-bold">ACTIF</span>
                      )}
                    </p>
                    <p className="text-gray-400 text-[10px]">{state.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">États exceptionnels (accessibles depuis tout état actif)</p>
            <div className="flex flex-wrap gap-2">
              {exceptionStatesConfig.map((state) => (
                <span
                  key={state.key}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] ${
                    state.key === 'DISPUTED' ? 'bg-[#D93025]/5 text-[#D93025]' :
                    state.key === 'REFUNDED' ? 'bg-[#FF9800]/5 text-[#E65100]' :
                    'bg-gray-100 text-gray-500'
                  }`}
                >
                  {state.icon} {state.label} — {state.description}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payment Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
          className="bg-white rounded-3xl p-6 shadow-sm border"
        >
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  i <= step ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${i < step ? 'bg-[#003087]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-1">{steps[step].title}</h2>
          <p className="text-sm text-gray-500 mb-6">{steps[step].desc}</p>

          {/* Step 1: Payment Provider */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {paymentProviders.map((provider) => (
                <motion.button
                  key={provider.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedProvider(provider.key)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedProvider === provider.key
                      ? 'border-[#003087] bg-[#003087]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className="text-2xl block mb-2">{provider.icon}</span>
                  <p className="text-sm font-semibold text-[#2C2E2F]">{provider.name}</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* Step 2: Amount & Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Bien</p>
                <p className="text-sm font-semibold text-[#2C2E2F]">{propertyName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Montant</p>
                <p className="font-mono-data text-2xl font-bold text-[#D4AF37]">{amount > 0 ? formatFCFA(amount) : '—'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-xs text-gray-500 mb-1">Frais escrow (1.5%)</p>
                <p className="font-mono-data text-sm font-bold text-[#2C2E2F]">{amount > 0 ? formatFCFA(escrowFee) : '—'}</p>
              </div>
              <div className="p-4 bg-[#00A651]/5 rounded-2xl">
                <p className="text-xs text-[#00A651] mb-1">Total à payer</p>
                <p className="font-mono-data text-2xl font-bold text-[#00A651]">{amount > 0 ? formatFCFA(totalAmount) : '—'}</p>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 2 && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">Confirmer le paiement</h3>
              <p className="text-sm text-gray-500 mb-6">
                En confirmant, vous acceptez de placer les fonds en escrow jusqu&apos;à la signature notariale.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                if (step < steps.length - 1) setStep(step + 1);
                else handleConfirm();
              }}
              disabled={(step === 0 && !selectedProvider) || createEscrow.isPending}
              className="flex-1 py-3 bg-[#003087] text-white rounded-full font-semibold text-sm hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createEscrow.isPending
                ? 'Traitement en cours...'
                : step === steps.length - 1
                  ? 'Confirmer le paiement'
                  : 'Continuer'}
            </motion.button>
          </div>
        </motion.div>

        {/* Success Overlay */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-[#00A651] flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 className="font-display text-2xl font-bold text-[#2C2E2F] mb-2">Paiement Confirmé !</h3>
              <p className="text-sm text-gray-500 mb-4">
                Vos fonds sont maintenant en escrow sécurisé. Vous serez notifié à chaque étape du cycle de vie.
              </p>
              <button
                onClick={() => { setShowSuccess(false); onNavigate('dashboard'); }}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold"
              >
                Voir la transaction
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
