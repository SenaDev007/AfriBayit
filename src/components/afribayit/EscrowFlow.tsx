'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEscrowList, useCreateEscrow, useTransitionEscrow } from '@/hooks/useEscrow';
import { useCountry } from '@/contexts/CountryContext';
import { toast } from 'sonner';
import { Smartphone, CreditCard, ClipboardList, Coins, FileText, Globe, Scale, Hammer, PenSquare, Landmark, CheckCircle, AlertTriangle, RotateCcw, Clock, Lock } from 'lucide-react';

interface EscrowFlowProps {
  onNavigate: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — payment providers
const paymentProviders = [
  { key: 'mtn', name: 'MTN Mobile Money', icon: <Smartphone className="w-5 h-5" style={{ color: '#FFC300' }} />, color: '#FFC300' },
  { key: 'orange', name: 'Orange Money', icon: <Smartphone className="w-5 h-5 text-orange-500" />, color: '#FF6600' },
  { key: 'moov', name: 'Moov Money', icon: <Smartphone className="w-5 h-5 text-blue-600" />, color: '#0066CC' },
  { key: 'carte', name: 'Carte bancaire', icon: <CreditCard className="w-5 h-5" />, color: '#003087' },
];

// Full escrow state machine
type EscrowState = 'CREATED' | 'FUNDED' | 'DOCS_VALIDATED' | 'GEOTRUST_VALIDATED' | 'NOTARY_ASSIGNED' | 'NOTARY_IN_PROGRESS' | 'DEED_SIGNED' | 'ANDF_REGISTERED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'EXPIRED';

interface EscrowStateConfig {
  key: EscrowState;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'normal' | 'success' | 'exception';
}

const escrowStatesConfig: EscrowStateConfig[] = [
  { key: 'CREATED', label: 'Créé', icon: <ClipboardList className="w-4 h-4" />, description: 'Transaction initiée par l\'acheteur', category: 'normal' },
  { key: 'FUNDED', label: 'Financé', icon: <Coins className="w-4 h-4" />, description: 'Fonds déposés en escrow sécurisé', category: 'normal' },
  { key: 'DOCS_VALIDATED', label: 'Docs validés', icon: <FileText className="w-4 h-4" />, description: 'Documents légaux vérifiés par l\'IA', category: 'normal' },
  { key: 'GEOTRUST_VALIDATED', label: 'GeoTrust', icon: <Globe className="w-4 h-4" />, description: 'Validation géomatique du bien', category: 'normal' },
  { key: 'NOTARY_ASSIGNED', label: 'Notaire assigné', icon: <Scale className="w-4 h-4" />, description: 'Un notaire est désigné pour la transaction', category: 'normal' },
  { key: 'NOTARY_IN_PROGRESS', label: 'Notaire en cours', icon: <Hammer className="w-4 h-4" />, description: 'Le notaire prépare l\'acte de vente', category: 'normal' },
  { key: 'DEED_SIGNED', label: 'Acte signé', icon: <PenSquare className="w-4 h-4" />, description: 'L\'acte de vente est signé par les parties', category: 'normal' },
  { key: 'ANDF_REGISTERED', label: 'ANDF enregistré', icon: <Landmark className="w-4 h-4" />, description: 'Enregistrement à l\'ANDF confirmé', category: 'normal' },
  { key: 'RELEASED', label: 'Libéré', icon: <CheckCircle className="w-4 h-4 text-green-500" />, description: 'Fonds libérés au vendeur — Transaction terminée', category: 'success' },
];

const exceptionStatesConfig: EscrowStateConfig[] = [
  { key: 'DISPUTED', label: 'Litige', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, description: 'Un litige a été signalé — Médiation en cours', category: 'exception' },
  { key: 'REFUNDED', label: 'Remboursé', icon: <RotateCcw className="w-4 h-4" />, description: 'Fonds remboursés à l\'acheteur', category: 'exception' },
  { key: 'EXPIRED', label: 'Expiré', icon: <Clock className="w-4 h-4" />, description: 'Transaction expirée sans aboutir', category: 'exception' },
];

const normalFlowOrder: EscrowState[] = ['CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED', 'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED'];

// Valid forward transitions per state — mirrors the server-side VALID_TRANSITIONS
const NEXT_STATE_ACTIONS: Record<string, { target: EscrowState; label: string; icon: React.ReactNode; actorType: string }[]> = {
  CREATED: [{ target: 'FUNDED', label: 'Financer l\'escrow', icon: <Coins className="w-4 h-4" />, actorType: 'buyer' }],
  FUNDED: [{ target: 'DOCS_VALIDATED', label: 'Valider les documents', icon: <FileText className="w-4 h-4" />, actorType: 'system' }],
  DOCS_VALIDATED: [{ target: 'GEOTRUST_VALIDATED', label: 'Valider GeoTrust', icon: <Globe className="w-4 h-4" />, actorType: 'system' }],
  GEOTRUST_VALIDATED: [{ target: 'NOTARY_ASSIGNED', label: 'Assigner un notaire', icon: <Scale className="w-4 h-4" />, actorType: 'admin' }],
  NOTARY_ASSIGNED: [{ target: 'NOTARY_IN_PROGRESS', label: 'Démarrer la procédure', icon: <Hammer className="w-4 h-4" />, actorType: 'notary' }],
  NOTARY_IN_PROGRESS: [{ target: 'DEED_SIGNED', label: 'Signer l\'acte', icon: <PenSquare className="w-4 h-4" />, actorType: 'notary' }],
  DEED_SIGNED: [{ target: 'ANDF_REGISTERED', label: 'Enregistrer ANDF', icon: <Landmark className="w-4 h-4" />, actorType: 'notary' }],
  ANDF_REGISTERED: [{ target: 'RELEASED', label: 'Libérer les fonds', icon: <CheckCircle className="w-4 h-4 text-green-500" />, actorType: 'notary' }],
  DISPUTED: [
    { target: 'FUNDED', label: 'Résoudre → Financé', icon: <RotateCcw className="w-4 h-4" />, actorType: 'admin' },
    { target: 'NOTARY_IN_PROGRESS', label: 'Résoudre → Notaire', icon: <Scale className="w-4 h-4" />, actorType: 'admin' },
    { target: 'REFUNDED', label: 'Rembourser', icon: <RotateCcw className="w-4 h-4" />, actorType: 'admin' },
  ],
};

export default function EscrowFlow({ onNavigate }: EscrowFlowProps) {
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const { selectedCountry } = useCountry();
  const { data, isLoading } = useEscrowList(1, 20, selectedCountry);
  const createEscrow = useCreateEscrow();
  const transitionEscrow = useTransitionEscrow();

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
    commission?: number;
    commissionRate?: number;
    fee?: number;
    transaction?: { id: string; propertyId: string; buyerId: string; status: string; amount: number; currency: string; commission?: number; commissionRate?: number; fee?: number };
  }>) || [];

  const selectedEscrow = escrowAccounts[0];

  // Derive the current escrow state from the API response, not local state
  const currentEscrowState = (selectedEscrow?.transaction?.status || selectedEscrow?.status || 'CREATED') as EscrowState;

  // Derive property name and amount from API data
  const propertyName = selectedEscrow?.property || selectedEscrow?.transaction?.propertyId || 'Propriété';
  const amount = selectedEscrow?.amount || selectedEscrow?.transaction?.amount || 0;
  const currency = selectedEscrow?.currency || selectedEscrow?.transaction?.currency || 'XOF';
  // CDC §6.2 — escrow commission is 3% of transaction amount.
  // Prefer the backend-provided `commission` / `fee` (already computed) when
  // available; otherwise fall back to 3% of the amount (was previously 1.5%).
  const escrowFee =
    typeof selectedEscrow?.commission === 'number' ? selectedEscrow.commission :
    typeof selectedEscrow?.fee === 'number' ? selectedEscrow.fee :
    typeof selectedEscrow?.transaction?.commission === 'number' ? selectedEscrow.transaction.commission :
    typeof selectedEscrow?.transaction?.fee === 'number' ? selectedEscrow.transaction.fee :
    Math.round(amount * 0.03);
  // Compute display rate from chosen fee + amount (so label is always correct)
  const escrowFeeRate = amount > 0 ? escrowFee / amount : 0;
  const totalAmount = amount + escrowFee;

  // Get the escrow transaction ID for PATCH calls
  const escrowTransactionId = selectedEscrow?.transaction?.id || selectedEscrow?.id || '';

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

  const handleTransition = (targetStatus: EscrowState, actorType: string) => {
    if (!escrowTransactionId) {
      toast.error('Aucune transaction sélectionnée');
      return;
    }
    transitionEscrow.mutate(
      {
        id: escrowTransactionId,
        targetStatus,
        actorType,
      },
      {
        onSuccess: () => {
          toast.success(`Transition vers ${targetStatus} réussie !`);
        },
        onError: (error: Error) => {
          toast.error('Erreur de transition', { description: error.message });
        },
      }
    );
  };

  const handleDispute = () => {
    if (!escrowTransactionId) {
      toast.error('Aucune transaction sélectionnée');
      return;
    }
    transitionEscrow.mutate(
      {
        id: escrowTransactionId,
        targetStatus: 'DISPUTED',
        actorType: 'buyer',
        reason: 'Litige signalé par l\'acheteur',
      },
      {
        onSuccess: () => {
          toast.error('Litige signalé — Médiation en cours');
        },
        onError: (error: Error) => {
          toast.error('Erreur lors du signalement', { description: error.message });
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
  const isTerminalState = ['RELEASED', 'REFUNDED', 'EXPIRED'].includes(currentEscrowState);

  // Available actions for the current state
  const availableActions = NEXT_STATE_ACTIONS[currentEscrowState] || [];
  const canDispute = !isTerminalState && currentEscrowState !== 'DISPUTED';

  const formatFCFA = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold uppercase tracking-wider mb-4">
            <Lock className="w-4 h-4" /> Escrow Sécurisé
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-primary-deep mb-2">
            Transaction Escrow
          </h1>
          <p className="text-gray-text text-sm">Vos fonds sont protégés jusqu&apos;à la signature notariale</p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-4 rounded-full" />
        </motion.div>

        {/* Escrow State Timeline — Full State Machine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
          className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale mb-6 overflow-visible"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg font-bold text-primary-deep">Cycle de vie Escrow</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-pale text-primary-deep border border-primary-green/20">
              {escrowStatesConfig.find(s => s.key === currentEscrowState)?.label ||
               exceptionStatesConfig.find(s => s.key === currentEscrowState)?.label ||
               currentEscrowState}
            </span>
          </div>

          {isLoading ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex items-start shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary-pale animate-pulse" />
                    <div className="w-20 h-3 bg-primary-pale/60 rounded-full mt-1 animate-pulse" />
                  </div>
                  {i < 8 && <div className="w-8 h-0.5 mt-5 bg-primary-pale shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Normal flow timeline */}
              <div className="flex items-start gap-2 sm:gap-3 overflow-x-auto pb-4 pt-2 px-1">
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
                          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                            status === 'completed'
                              ? 'bg-green-100 ring-2 ring-green-500/30'
                              : status === 'current'
                              ? 'bg-accent-yellow/15 ring-2 ring-accent-yellow'
                              : 'bg-primary-pale/60'
                          }`}
                        >
                          {status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <span className={status === 'current' ? 'text-primary-deep' : 'opacity-40 text-gray-text'}>{state.icon}</span>
                          )}
                        </motion.div>
                        <p className={`text-[9px] sm:text-[10px] font-medium mt-1 text-center leading-tight ${
                          status === 'completed' ? 'text-green-600' :
                          status === 'current' ? 'text-accent-dark font-bold' :
                          'text-gray-text/50'
                        }`}>
                          {state.label}
                        </p>
                        {status === 'completed' && completedTimestamps[state.key] && (
                          <p className="text-[8px] text-gray-text/60 text-center mt-0.5">
                            {completedTimestamps[state.key]}
                          </p>
                        )}
                      </div>
                      {i < escrowStatesConfig.length - 1 && (
                        <div className={`w-4 sm:w-6 h-0.5 mt-5 shrink-0 transition-colors duration-300 rounded-full ${
                          getStateStatus(escrowStatesConfig[i + 1].key) !== 'upcoming' ? 'bg-green-500' : 'bg-primary-pale'
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
                  className={`mt-4 p-3 rounded-3xl text-xs ${
                    isExceptionActive
                      ? currentEscrowState === 'DISPUTED'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-[#FF9800]/5 text-[#E65100]'
                      : currentEscrowState === 'RELEASED'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-primary-pale/60 text-primary-deep'
                  }`}
                >
                  <span className="font-bold">Étape actuelle : </span>
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
                  <p className="text-[10px] font-bold text-gray-text/70 uppercase tracking-wider">États exceptionnels</p>
                  <div className="flex gap-2">
                    {exceptionStatesConfig.map((state) => {
                      const isActive = currentEscrowState === state.key;
                      return (
                        <div
                          key={state.key}
                          className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs ${
                            isActive
                              ? state.key === 'DISPUTED'
                                ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                                : 'bg-[#FF9800]/10 text-[#E65100] ring-1 ring-[#FF9800]/30'
                              : 'bg-primary-pale/40 text-gray-text/50'
                          }`}
                        >
                          {state.icon}
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

        {/* Action Buttons — Based on Current State */}
        {!isLoading && (availableActions.length > 0 || canDispute) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: easeOut }}
            className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale mb-6"
          >
            <h4 className="font-serif text-sm font-bold text-primary-deep mb-3">Actions disponibles</h4>
            <div className="flex flex-wrap gap-3">
              {availableActions.map((action) => (
                <motion.button
                  key={action.target}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTransition(action.target, action.actorType)}
                  disabled={transitionEscrow.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-green text-white text-sm font-bold rounded-full hover:bg-primary-deep shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </motion.button>
              ))}
              {canDispute && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDispute}
                  disabled={transitionEscrow.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-full hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Signaler un litige</span>
                </motion.button>
              )}
            </div>
            {transitionEscrow.isPending && (
              <p className="mt-2 text-xs text-gray-text/60 animate-pulse">Transition en cours...</p>
            )}
          </motion.div>
        )}

        {/* State Machine Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
          className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale mb-6"
        >
          <h4 className="font-serif text-sm font-bold text-primary-deep mb-3">Machine à états Escrow</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {escrowStatesConfig.map((state) => {
              const status = getStateStatus(state.key);
              return (
                <div key={state.key} className="flex items-start gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    status === 'completed' ? 'bg-green-100' :
                    status === 'current' ? 'bg-accent-yellow/15' :
                    'bg-primary-pale/60'
                  }`}>
                    {state.icon}
                  </div>
                  <div>
                    <p className={`font-bold ${
                      status === 'completed' ? 'text-green-600' :
                      status === 'current' ? 'text-accent-dark' :
                      'text-gray-text/50'
                    }`}>
                      {state.label}
                      {status === 'current' && (
                        <span className="ml-1 px-1.5 py-0.5 bg-accent-yellow text-primary-deep text-[8px] rounded-full font-bold">ACTIF</span>
                      )}
                    </p>
                    <p className="text-gray-text/60 text-[10px]">{state.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-primary-pale">
            <p className="text-[10px] font-bold text-gray-text/70 uppercase tracking-wider mb-2">États exceptionnels (accessibles depuis tout état actif)</p>
            <div className="flex flex-wrap gap-2">
              {exceptionStatesConfig.map((state) => (
                <span
                  key={state.key}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${
                    state.key === 'DISPUTED' ? 'bg-red-50 text-red-600' :
                    state.key === 'REFUNDED' ? 'bg-[#FF9800]/5 text-[#E65100]' :
                    'bg-primary-pale/60 text-gray-text'
                  }`}
                >
                  {state.icon} {state.label} — {state.description}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Payment Steps (only shown for CREATED state when user needs to fund) */}
        {currentEscrowState === 'CREATED' && (
          <PaymentSteps
            selectedProvider={selectedProvider}
            setSelectedProvider={setSelectedProvider}
            propertyName={propertyName}
            amount={amount}
            escrowFee={escrowFee}
            escrowFeeRate={escrowFeeRate}
            totalAmount={totalAmount}
            formatFCFA={formatFCFA}
            onConfirm={handleConfirm}
            isPending={createEscrow.isPending}
          />
        )}

        {/* Success Overlay */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-sm border border-primary-pale shadow-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="font-serif text-2xl font-bold text-primary-deep mb-2">Paiement Confirmé !</h3>
              <p className="text-sm text-gray-text mb-4">
                Vos fonds sont maintenant en escrow sécurisé. Vous serez notifié à chaque étape du cycle de vie.
              </p>
              <button
                onClick={() => { setShowSuccess(false); onNavigate('dashboard'); }}
                className="px-6 py-3 bg-primary-green text-white rounded-full text-sm font-bold hover:bg-primary-deep shadow-md transition-colors"
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

// Extracted Payment Steps component
function PaymentSteps({
  selectedProvider,
  setSelectedProvider,
  propertyName,
  amount,
  escrowFee,
  escrowFeeRate,
  totalAmount,
  formatFCFA,
  onConfirm,
  isPending,
}: {
  selectedProvider: string | null;
  setSelectedProvider: (v: string | null) => void;
  propertyName: string;
  amount: number;
  escrowFee: number;
  escrowFeeRate: number;
  totalAmount: number;
  formatFCFA: (n: number) => string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const [step, setStep] = React.useState(0);

  const steps = [
    { title: 'Choisir le moyen de paiement', desc: 'Sélectionnez votre fournisseur de paiement' },
    { title: 'Montant et détails', desc: 'Vérifiez les informations de la transaction' },
    { title: 'Confirmation', desc: 'Confirmez le paiement en escrow' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale"
    >
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
              i <= step ? 'bg-primary-deep text-white' : 'bg-primary-pale/60 text-gray-text/40'
            }`}>
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full ${i < step ? 'bg-primary-deep' : 'bg-primary-pale'}`} />
            )}
          </div>
        ))}
      </div>

      <h2 className="font-serif text-xl font-bold text-primary-deep mb-1">{steps[step].title}</h2>
      <p className="text-sm text-gray-text mb-6">{steps[step].desc}</p>

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
                  ? 'border-primary-deep bg-primary-pale/60'
                  : 'border-primary-pale/60 hover:border-primary-green/40'
              }`}
            >
              <span className="flex items-center justify-center mb-2">{provider.icon}</span>
              <p className="text-sm font-bold text-primary-deep">{provider.name}</p>
            </motion.button>
          ))}
        </div>
      )}

      {/* Step 2: Amount & Details */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="p-4 bg-primary-pale/30 rounded-3xl">
            <p className="text-xs text-gray-text/70 mb-1">Bien</p>
            <p className="text-sm font-bold text-primary-deep">{propertyName}</p>
          </div>
          <div className="p-4 bg-primary-pale/30 rounded-3xl">
            <p className="text-xs text-gray-text/70 mb-1">Montant</p>
            <p className="font-serif text-2xl font-black text-primary-deep">{amount > 0 ? formatFCFA(amount) : '—'}</p>
          </div>
          <div className="p-4 bg-primary-pale/30 rounded-3xl">
            <p className="text-xs text-gray-text/70 mb-1">Frais escrow ({(escrowFeeRate * 100).toFixed(1)}%)</p>
            <p className="font-serif text-sm font-black text-primary-deep">{amount > 0 ? formatFCFA(escrowFee) : '—'}</p>
          </div>
          <div className="p-4 bg-green-50 border border-green-100 rounded-3xl">
            <p className="text-xs text-green-700 mb-1">Total à payer</p>
            <p className="font-serif text-2xl font-black text-green-700">{amount > 0 ? formatFCFA(totalAmount) : '—'}</p>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 2 && (
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-full bg-primary-pale flex items-center justify-center mx-auto mb-4">
            <Lock className="w-10 h-10 text-primary-deep" />
          </div>
          <h3 className="font-serif text-xl font-bold text-primary-deep mb-2">Confirmer le paiement</h3>
          <p className="text-sm text-gray-text mb-6">
            En confirmant, vous acceptez de placer les fonds en escrow jusqu&apos;à la signature notariale.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 py-3 border border-primary-deep/20 rounded-full text-sm font-bold text-primary-deep hover:bg-primary-pale transition-colors"
          >
            Retour
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else onConfirm();
          }}
          disabled={(step === 0 && !selectedProvider) || isPending}
          className="flex-1 py-3 bg-primary-green text-white rounded-full font-bold text-sm hover:bg-primary-deep shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? 'Traitement en cours...'
            : step === steps.length - 1
              ? 'Confirmer le paiement'
              : 'Continuer'}
        </motion.button>
      </div>
    </motion.div>
  );
}
