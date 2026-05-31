'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost, apiPatch, apiFetch } from '@/lib/api';
import { useEscrowDetail, useEscrowLedger } from '@/hooks/useEscrow';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardList, Coins, Scale, Globe, FileText, Landmark, CheckCircle, AlertTriangle, Ban, Undo2, Lock, Hourglass, Link } from 'lucide-react';
import type { TransactionState, ReleaseConditions } from '@/lib/payments/types';

// ============ Types ============

type EscrowState = TransactionState | 'DOCS_VALIDATED' | 'GEOTRUST_VALIDATED' | 'NOTARY_IN_PROGRESS' | 'EXPIRED';

interface EscrowDashboardProps {
  transactionId: string;
  userRole: 'buyer' | 'seller' | 'admin' | 'notary' | 'geometer';
  onNavigate?: (section: string) => void;
}

// ============ State Config ============

interface StateConfig {
  key: EscrowState;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'normal' | 'success' | 'exception';
}

const NORMAL_STATES: StateConfig[] = [
  { key: 'CREATED', label: 'Créé', icon: <ClipboardList className="w-4 h-4" />, description: 'Transaction initiée', category: 'normal' },
  { key: 'FUNDED', label: 'Financé', icon: <Coins className="w-4 h-4" />, description: 'Fonds déposés en escrow', category: 'normal' },
  { key: 'NOTARY_ASSIGNED', label: 'Notaire assigné', icon: <Scale className="w-4 h-4" />, description: 'Notaire désigné', category: 'normal' },
  { key: 'GEO_VERIFIED', label: 'GeoTrust validé', icon: <Globe className="w-4 h-4" />, description: 'Validation géomatique', category: 'normal' },
  { key: 'DEED_SIGNED', label: 'Acte signé', icon: <FileText className="w-4 h-4" />, description: 'Acte de vente signé', category: 'normal' },
  { key: 'ANDF_REGISTERED', label: 'ANDF enregistré', icon: <Landmark className="w-4 h-4" />, description: 'Enregistrement ANDF', category: 'normal' },
  { key: 'RELEASED', label: 'Libéré', icon: <CheckCircle className="w-4 h-4 text-green-500" />, description: 'Fonds libérés — Transaction terminée', category: 'success' },
];

const EXCEPTION_STATES: StateConfig[] = [
  { key: 'DISPUTED', label: 'Litige', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, description: 'Litige signalé — Médiation en cours', category: 'exception' },
  { key: 'CANCELLED', label: 'Annulé', icon: <Ban className="w-4 h-4" />, description: 'Transaction annulée', category: 'exception' },
  { key: 'REFUNDED', label: 'Remboursé', icon: <Undo2 className="w-4 h-4" />, description: 'Fonds remboursés', category: 'exception' },
];

const NORMAL_FLOW_ORDER: EscrowState[] = [
  'CREATED', 'FUNDED', 'NOTARY_ASSIGNED', 'GEO_VERIFIED', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED',
];

// ============ Available Actions per State ============

interface ActionConfig {
  target: EscrowState;
  label: string;
  icon: React.ReactNode;
  actorType: string;
  variant: 'default' | 'destructive' | 'outline';
}

const STATE_ACTIONS: Record<string, ActionConfig[]> = {
  CREATED: [
    { target: 'FUNDED', label: 'Financer l\'escrow', icon: <Coins className="w-4 h-4" />, actorType: 'buyer', variant: 'default' },
  ],
  FUNDED: [
    { target: 'NOTARY_ASSIGNED', label: 'Assigner un notaire', icon: <Scale className="w-4 h-4" />, actorType: 'admin', variant: 'default' },
  ],
  NOTARY_ASSIGNED: [
    { target: 'GEO_VERIFIED', label: 'Valider GeoTrust', icon: <Globe className="w-4 h-4" />, actorType: 'geometer', variant: 'default' },
  ],
  GEO_VERIFIED: [
    { target: 'DEED_SIGNED', label: 'Signer l\'acte', icon: <FileText className="w-4 h-4" />, actorType: 'notary', variant: 'default' },
  ],
  DEED_SIGNED: [
    { target: 'ANDF_REGISTERED', label: 'Enregistrer ANDF', icon: <Landmark className="w-4 h-4" />, actorType: 'notary', variant: 'default' },
  ],
  ANDF_REGISTERED: [
    { target: 'RELEASED', label: 'Libérer les fonds', icon: <CheckCircle className="w-4 h-4 text-green-500" />, actorType: 'admin', variant: 'default' },
  ],
  DISPUTED: [
    { target: 'FUNDED', label: 'Résoudre → Financé', icon: <Undo2 className="w-4 h-4" />, actorType: 'admin', variant: 'outline' },
    { target: 'REFUNDED', label: 'Rembourser', icon: <Undo2 className="w-4 h-4" />, actorType: 'admin', variant: 'destructive' },
  ],
};

const easeOut = [0.16, 1, 0.3, 1] as const;

function formatFCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.abs(n)) + ' FCFA';
}

// ============ Component ============

export default function EscrowDashboard({ transactionId, userRole, onNavigate }: EscrowDashboardProps) {
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const { data, isLoading, refetch } = useEscrowDetail(transactionId);
  const { data: ledgerData } = useEscrowLedger(transactionId);

  const transaction = data?.transaction as Record<string, unknown> | undefined;
  const escrowAccount = transaction?.escrowAccount as Record<string, unknown> | undefined;
  const timelineEvents = (transaction?.timelineEvents as Array<Record<string, unknown>>) || [];
  const property = transaction?.property as Record<string, unknown> | undefined;

  // Derive current state
  const currentState = (transaction?.status || 'CREATED') as EscrowState;
  const amount = (transaction?.amount as number) || 0;
  const currency = (transaction?.currency as string) || 'XOF';
  const commissionRate = (transaction?.commissionRate as number) || 0.025;
  const commission = Math.round(amount * commissionRate);
  const sellerPayout = amount - commission;

  const isExceptionActive = ['DISPUTED', 'CANCELLED', 'REFUNDED'].includes(currentState);
  const isTerminalState = ['RELEASED', 'CANCELLED', 'REFUNDED'].includes(currentState);
  const availableActions = STATE_ACTIONS[currentState] || [];
  const canDispute = !isTerminalState && currentState !== 'DISPUTED';

  // Release conditions state
  const releaseConditions = useMemo<ReleaseConditions>(() => {
    const idx = NORMAL_FLOW_ORDER.indexOf(currentState);
    return {
      docsValidated: idx >= NORMAL_FLOW_ORDER.indexOf('NOTARY_ASSIGNED'),
      geoTrustValidated: idx >= NORMAL_FLOW_ORDER.indexOf('GEO_VERIFIED'),
      notaryAssigned: idx >= NORMAL_FLOW_ORDER.indexOf('NOTARY_ASSIGNED'),
      deedSigned: idx >= NORMAL_FLOW_ORDER.indexOf('DEED_SIGNED'),
      andfRegistered: idx >= NORMAL_FLOW_ORDER.indexOf('ANDF_REGISTERED'),
    };
  }, [currentState]);

  const completedConditions = Object.values(releaseConditions).filter(Boolean).length;
  const totalConditions = Object.values(releaseConditions).length;

  // Get the status of a step in the timeline
  const getStepStatus = (stateKey: EscrowState): 'completed' | 'current' | 'upcoming' => {
    if (isExceptionActive) {
      const currentIdx = NORMAL_FLOW_ORDER.indexOf(currentState as EscrowState);
      const stepIdx = NORMAL_FLOW_ORDER.indexOf(stateKey);
      if (stepIdx < currentIdx) return 'completed';
      if (stepIdx === currentIdx) return 'current';
      return 'upcoming';
    }
    const currentIdx = NORMAL_FLOW_ORDER.indexOf(currentState);
    const stepIdx = NORMAL_FLOW_ORDER.indexOf(stateKey);
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  // Handle state transition
  const handleTransition = async (targetState: EscrowState, actorType: string) => {
    setIsTransitioning(true);
    try {
      // Use specific API endpoints for certain transitions
      if (targetState === 'FUNDED') {
        await apiPost('/api/escrow/fund', { transactionId });
      } else if (targetState === 'RELEASED') {
        await apiPost('/api/escrow/release', { transactionId });
      } else {
        await apiPatch(`/api/escrow/${transactionId}`, {
          targetStatus: targetState,
          actorType,
        });
      }
      toast.success(`Transition vers ${targetState} réussie`);
      refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur de transition';
      toast.error('Erreur de transition', { description: msg });
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle dispute
  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error('Veuillez indiquer la raison du litige');
      return;
    }
    setIsTransitioning(true);
    try {
      await apiPost('/api/escrow/dispute', {
        transactionId,
        reason: disputeReason,
      });
      toast.error('Litige signalé — Médiation en cours');
      setShowDisputeInput(false);
      setDisputeReason('');
      refetch();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur';
      toast.error('Erreur', { description: msg });
    } finally {
      setIsTransitioning(false);
    }
  };

  // Ledger entries
  const ledgerEntries = (ledgerData?.ledger as Array<Record<string, unknown>>) ||
    (escrowAccount?.ledger as Array<Record<string, unknown>>) || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
          <Lock className="w-4 h-4" /> Escrow Sécurisé
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
          Tableau de Bord Escrow
        </h1>
        <p className="text-gray-500 text-sm">
          {(property?.title as string) || `Transaction ${transactionId.slice(0, 8)}...`}
        </p>
      </motion.div>

      {/* Current State Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex justify-center"
      >
        <Badge
          className={`text-sm px-4 py-2 ${
            isExceptionActive
              ? currentState === 'DISPUTED'
                ? 'bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20'
                : 'bg-[#FF9800]/10 text-[#E65100] border-[#FF9800]/20'
              : currentState === 'RELEASED'
                ? 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20'
                : 'bg-[#003087]/10 text-[#003087] border-[#003087]/20'
          }`}
        >
          {[...NORMAL_STATES, ...EXCEPTION_STATES].find((s) => s.key === currentState)?.icon}{' '}
          {[...NORMAL_STATES, ...EXCEPTION_STATES].find((s) => s.key === currentState)?.label || currentState}
        </Badge>
      </motion.div>

      {/* Transaction Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-[#2C2E2F] mb-4">Cycle de Vie</h3>

        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-start shrink-0">
                <Skeleton className="w-10 h-10 rounded-full" />
                {i < 6 && <Skeleton className="w-6 h-0.5 mt-5" />}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Timeline */}
            <div className="flex items-start gap-1 overflow-x-auto pb-3">
              {NORMAL_STATES.map((state, i) => {
                const status = getStepStatus(state.key);
                return (
                  <div key={state.key} className="flex items-start shrink-0">
                    <div className="flex flex-col items-center w-14 sm:w-18">
                      <motion.div
                        initial={false}
                        animate={{ scale: status === 'current' ? 1.15 : 1 }}
                        className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                          status === 'completed'
                            ? 'bg-[#00A651]/10 ring-2 ring-[#00A651]/30'
                            : status === 'current'
                            ? 'bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]'
                            : 'bg-gray-100'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-[#00A651]" />
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
                    </div>
                    {i < NORMAL_STATES.length - 1 && (
                      <div className={`w-3 sm:w-5 h-0.5 mt-5 shrink-0 transition-colors duration-300 ${
                        getStepStatus(NORMAL_STATES[i + 1].key) !== 'upcoming' ? 'bg-[#00A651]' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current state description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentState}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={`mt-4 p-3 rounded-2xl text-xs ${
                  isExceptionActive
                    ? currentState === 'DISPUTED'
                      ? 'bg-[#D93025]/5 text-[#D93025]'
                      : 'bg-[#FF9800]/5 text-[#E65100]'
                    : currentState === 'RELEASED'
                    ? 'bg-[#00A651]/5 text-[#00A651]'
                    : 'bg-[#003087]/5 text-[#003087]'
                }`}
              >
                <span className="font-semibold">Étape actuelle : </span>
                {[...NORMAL_STATES, ...EXCEPTION_STATES].find((s) => s.key === currentState)?.description}
              </motion.div>
            </AnimatePresence>

            {/* Exception states */}
            {isExceptionActive && (
              <div className="mt-4 flex gap-2">
                {EXCEPTION_STATES.map((state) => {
                  const isActive = currentState === state.key;
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
                      {state.icon}
                      <span className="font-medium">{state.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Two-column layout for conditions and amounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Release Conditions Checklist */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#2C2E2F]">Conditions de libération</h3>
            <span className="text-xs font-mono text-gray-500">
              {completedConditions}/{totalConditions}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(completedConditions / totalConditions) * 100}%` }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="h-full bg-[#00A651] rounded-full"
            />
          </div>

          <div className="space-y-3">
            {[
              { key: 'docsValidated' as const, label: 'Documents légaux validés', icon: <FileText className="w-3 h-3" /> },
              { key: 'geoTrustValidated' as const, label: 'Validation GeoTrust', icon: <Globe className="w-3 h-3" /> },
              { key: 'notaryAssigned' as const, label: 'Notaire assigné', icon: <Scale className="w-3 h-3" /> },
              { key: 'deedSigned' as const, label: 'Acte de vente signé', icon: <FileText className="w-3 h-3" /> },
              { key: 'andfRegistered' as const, label: 'Enregistrement ANDF', icon: <Landmark className="w-3 h-3" /> },
            ].map((condition) => (
              <div
                key={condition.key}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                  releaseConditions[condition.key]
                    ? 'bg-[#00A651]/5'
                    : 'bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  releaseConditions[condition.key]
                    ? 'bg-[#00A651] text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {releaseConditions[condition.key] ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    condition.icon
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  releaseConditions[condition.key] ? 'text-[#00A651]' : 'text-gray-400'
                }`}>
                  {condition.label}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Amount Breakdown */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-[#2C2E2F] mb-4">Répartition des fonds</h3>

          <div className="space-y-4">
            {/* Buyer deposit */}
            <div className="p-3 rounded-2xl bg-[#009CDE]/5 border border-[#009CDE]/10">
              <p className="text-[10px] text-[#009CDE] font-semibold mb-1">Dépôt acheteur</p>
              <p className="font-mono text-xl font-bold text-[#009CDE]">{formatFCFA(amount)}</p>
            </div>

            {/* Escrow balance */}
            <div className="p-3 rounded-2xl bg-[#003087]/5 border border-[#003087]/10">
              <p className="text-[10px] text-[#003087] font-semibold mb-1">Solde escrow</p>
              <p className="font-mono text-xl font-bold text-[#003087]">
                {formatFCFA((escrowAccount?.heldAmount as number) || (currentState !== 'CREATED' ? amount : 0))}
              </p>
            </div>

            <Separator />

            {/* Commission */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 flex items-center gap-1">
                <Coins className="w-4 h-4" /> Commission ({(commissionRate * 100).toFixed(1)}%)
              </span>
              <span className="font-mono font-bold text-[#D4AF37]">{formatFCFA(commission)}</span>
            </div>

            {/* Seller payout */}
            <div className="p-3 rounded-2xl bg-[#00A651]/5 border border-[#00A651]/10">
              <p className="text-[10px] text-[#00A651] font-semibold mb-1">Paiement vendeur</p>
              <p className="font-mono text-xl font-bold text-[#00A651]">{formatFCFA(sellerPayout)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      {!isLoading && (availableActions.length > 0 || canDispute) && (
        <Card className="p-6">
          <h4 className="text-sm font-bold text-[#2C2E2F] mb-3">Actions disponibles</h4>
          <div className="flex flex-wrap gap-3">
            {availableActions
              .filter((action) => {
                // Filter actions based on user role
                if (userRole === 'admin') return true;
                if (action.actorType === userRole) return true;
                return false;
              })
              .map((action) => (
                <motion.div key={action.target} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={() => handleTransition(action.target, action.actorType)}
                    disabled={isTransitioning}
                    variant={action.variant === 'destructive' ? 'destructive' : action.variant === 'outline' ? 'outline' : 'default'}
                    className={`${
                      action.variant === 'default' ? 'bg-[#003087] hover:bg-[#0047b3]' : ''
                    }`}
                  >
                    <span className="mr-2">{action.icon}</span>
                    {action.label}
                  </Button>
                </motion.div>
              ))}

            {canDispute && (
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  onClick={() => setShowDisputeInput(!showDisputeInput)}
                  className="border-[#D93025]/20 text-[#D93025] hover:bg-[#D93025]/5"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Signaler un litige
                </Button>
              </motion.div>
            )}
          </div>

          {/* Dispute input */}
          <AnimatePresence>
            {showDisputeInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="p-4 bg-[#D93025]/5 rounded-2xl border border-[#D93025]/10">
                  <label className="text-xs font-semibold text-[#D93025] mb-2 block">
                    Raison du litige
                  </label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Décrivez le problème..."
                    className="w-full p-3 rounded-xl border border-[#D93025]/20 text-sm resize-none focus:outline-none focus:border-[#D93025] focus:ring-1 focus:ring-[#D93025]/20"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={handleDispute}
                      disabled={isTransitioning || !disputeReason.trim()}
                      variant="destructive"
                    >
                      Confirmer le litige
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setShowDisputeInput(false); setDisputeReason(''); }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isTransitioning && (
            <p className="mt-2 text-xs text-gray-400 animate-pulse">Transition en cours...</p>
          )}
        </Card>
      )}

      {/* Ledger Entries with Hash Verification */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#2C2E2F]">Grand Livre Escrow</h3>
          <Badge variant="secondary" className="text-[10px]">
            <Link className="w-3 h-3 mr-1" /> SHA-256 chaîné
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Aucune entrée dans le grand livre</p>
            <p className="text-xs text-gray-300 mt-1">Les entrées apparaîtront une fois l&apos;escrow financé</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {ledgerEntries.map((entry, i) => {
                const entryType = entry.entryType as string;
                const entryAmount = entry.amount as number;
                const balanceAfter = entry.balanceAfter as number;
                const entryCurrency = (entry.currency as string) || 'XOF';
                const reference = entry.reference as string;
                const createdAt = entry.createdAt as string;

                const typeColors: Record<string, string> = {
                  CREDIT: '#009CDE',
                  DEBIT: '#D93025',
                  HOLD: '#FF9800',
                  RELEASE: '#00A651',
                  REFUND: '#FF9800',
                  COMMISSION: '#D4AF37',
                };

                const typeLabels: Record<string, string> = {
                  CREDIT: 'Crédit',
                  DEBIT: 'Débit',
                  HOLD: 'Blocage',
                  RELEASE: 'Libération',
                  REFUND: 'Remboursement',
                  COMMISSION: 'Commission',
                };

                const color = typeColors[entryType] || '#6b7280';

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, ease: easeOut }}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {entryType.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#2C2E2F]">
                          {typeLabels[entryType] || entryType}
                        </span>
                        <span className="font-mono text-xs font-bold" style={{ color }}>
                          {entryAmount > 0 ? '+' : ''}{formatFCFA(entryAmount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">
                          Solde: {formatFCFA(balanceAfter)} {entryCurrency}
                        </span>
                        <span className="text-[10px] text-gray-300">
                          {new Date(createdAt).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {/* Hash verification */}
                      {reference && (
                        <p className="text-[8px] font-mono text-gray-300 mt-0.5 truncate" title={reference}>
                          <Link className="w-2.5 h-2.5 inline" /> {reference.slice(0, 16)}...
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* Timeline Events */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-[#2C2E2F] mb-4">Historique des événements</h3>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : timelineEvents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">Aucun événement enregistré</p>
          </div>
        ) : (
          <ScrollArea className="max-h-60">
            <div className="space-y-2">
              {timelineEvents.map((event, i) => (
                <div key={i} className="flex items-start gap-3 p-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-[#003087] mt-1.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-[#2C2E2F]">
                      {event.fromStatus as string} → {event.toStatus as string}
                    </span>
                    <p className="text-gray-400 text-[10px]">
                      {event.description as string} — {event.actorType as string}
                    </p>
                    <p className="text-gray-300 text-[9px]">
                      {new Date(event.createdAt as string).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
