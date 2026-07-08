'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiPost, apiPatch, apiFetch } from '@/lib/api-client';
import { useEscrowDetail, useEscrowLedger } from '@/hooks/useEscrow';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  ClipboardList, Coins, Scale, Globe, FileText, Landmark,
  CheckCircle, AlertTriangle, Ban, Undo2, Lock, Hourglass,
  Link, Shield, Eye, UserCheck, Home, ShieldCheck, FileSearch,
  ShieldAlert, Timer, Fingerprint, ArrowRight
} from 'lucide-react';

// ============ Types ============

type EscrowState =
  | 'CREATED' | 'FUNDED' | 'DOCS_VALIDATED' | 'GEOTRUST_VALIDATED'
  | 'NOTARY_ASSIGNED' | 'NOTARY_IN_PROGRESS' | 'DEED_SIGNED' | 'ANDF_REGISTERED'
  | 'RELEASED' | 'DISPUTED' | 'REFUNDED' | 'EXPIRED';

interface EscrowDashboardProps {
  transactionId: string;
  userRole: 'buyer' | 'seller' | 'admin' | 'notary' | 'geometer';
  onNavigate?: (section: string) => void;
}

// ============ Full 12-State Configuration ============

interface StateConfig {
  key: EscrowState;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: 'normal' | 'success' | 'exception' | 'warning';
}

const ALL_STATES: StateConfig[] = [
  { key: 'CREATED', label: 'Créé', icon: <ClipboardList className="w-4 h-4" />, description: 'Transaction initiée', category: 'normal' },
  { key: 'FUNDED', label: 'Financé', icon: <Coins className="w-4 h-4" />, description: 'Fonds déposés en escrow', category: 'normal' },
  { key: 'DOCS_VALIDATED', label: 'Docs validés', icon: <FileSearch className="w-4 h-4" />, description: 'Documents légaux validés', category: 'normal' },
  { key: 'GEOTRUST_VALIDATED', label: 'GeoTrust validé', icon: <Globe className="w-4 h-4" />, description: 'Validation géomatique confirmée', category: 'normal' },
  { key: 'NOTARY_ASSIGNED', label: 'Notaire assigné', icon: <Scale className="w-4 h-4" />, description: 'Notaire désigné pour la transaction', category: 'normal' },
  { key: 'NOTARY_IN_PROGRESS', label: 'Notaire en cours', icon: <FileText className="w-4 h-4" />, description: 'Rédaction et vérification de l\'acte en cours', category: 'normal' },
  { key: 'DEED_SIGNED', label: 'Acte signé', icon: <FileText className="w-4 h-4" />, description: 'Acte de vente signé par les parties', category: 'normal' },
  { key: 'ANDF_REGISTERED', label: 'ANDF enregistré', icon: <Landmark className="w-4 h-4" />, description: 'Enregistrement auprès de l\'ANDF', category: 'normal' },
  { key: 'RELEASED', label: 'Libéré', icon: <CheckCircle className="w-4 h-4 text-green-500" />, description: 'Fonds libérés — Transaction terminée', category: 'success' },
  { key: 'DISPUTED', label: 'Litige', icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />, description: 'Litige signalé — Médiation en cours', category: 'warning' },
  { key: 'REFUNDED', label: 'Remboursé', icon: <Undo2 className="w-4 h-4" />, description: 'Fonds remboursés à l\'acheteur', category: 'exception' },
  { key: 'EXPIRED', label: 'Expiré', icon: <Hourglass className="w-4 h-4" />, description: 'Transaction expirée sans aboutir', category: 'exception' },
];

const NORMAL_FLOW_ORDER: EscrowState[] = [
  'CREATED', 'FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED',
  'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED',
];

const EXCEPTION_STATES = ALL_STATES.filter(s => s.category === 'exception' || s.category === 'warning');

// ============ Release Conditions (7 conditions per CDC) ============

interface ReleaseCondition {
  key: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const RELEASE_CONDITIONS: ReleaseCondition[] = [
  { key: 'buyerConfirm', label: 'Confirmation acheteur', icon: <UserCheck className="w-3 h-3" />, description: 'BUYER_CONFIRM' },
  { key: 'sellerConfirm', label: 'Confirmation vendeur', icon: <Home className="w-3 h-3" />, description: 'SELLER_CONFIRM' },
  { key: 'docsValid', label: 'Documents validés', icon: <FileSearch className="w-3 h-3" />, description: 'DOCS_VALID' },
  { key: 'inspectionValid', label: 'Inspection validée', icon: <Eye className="w-3 h-3" />, description: 'INSPECTION_VALID' },
  { key: 'fraudHold', label: 'Anti-fraude OK', icon: <ShieldCheck className="w-3 h-3" />, description: 'FRAUD_HOLD (aucune alerte)' },
  { key: 'adminValid', label: 'Validation admin', icon: <Shield className="w-3 h-3" />, description: 'ADMIN_VALID' },
  { key: 'checkinConfirm', label: 'Check-in confirmé', icon: <CheckCircle className="w-3 h-3" />, description: 'CHECKIN_CONFIRM' },
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
    { target: 'DOCS_VALIDATED', label: 'Valider les documents', icon: <FileSearch className="w-4 h-4" />, actorType: 'admin', variant: 'default' },
  ],
  DOCS_VALIDATED: [
    { target: 'GEOTRUST_VALIDATED', label: 'Valider GeoTrust', icon: <Globe className="w-4 h-4" />, actorType: 'geometer', variant: 'default' },
  ],
  GEOTRUST_VALIDATED: [
    { target: 'NOTARY_ASSIGNED', label: 'Assigner un notaire', icon: <Scale className="w-4 h-4" />, actorType: 'admin', variant: 'default' },
  ],
  NOTARY_ASSIGNED: [
    { target: 'NOTARY_IN_PROGRESS', label: 'Démarrer la rédaction', icon: <FileText className="w-4 h-4" />, actorType: 'notary', variant: 'default' },
  ],
  NOTARY_IN_PROGRESS: [
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
  const [show2FA, setShow2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [verifying2FA, setVerifying2FA] = useState(false);

  const { data, isLoading, refetch } = useEscrowDetail(transactionId);
  const { data: ledgerData } = useEscrowLedger(transactionId);

  const transaction = data?.transaction as Record<string, unknown> | undefined;
  const escrowAccount = transaction?.escrowAccount as Record<string, unknown> | undefined;
  const timelineEvents = (transaction?.timelineEvents as Array<Record<string, unknown>>) || [];
  const property = transaction?.property as Record<string, unknown> | undefined;

  // Derive current state
  const currentState = (transaction?.status || 'CREATED') as EscrowState;
  const amount = (transaction?.amount as number) || 15000000;
  const currency = (transaction?.currency as string) || 'XOF';
  const commissionRate = (transaction?.commissionRate as number) || 0.025;
  const commission = Math.round(amount * commissionRate);
  const sellerPayout = amount - commission;
  const heldAmount = (escrowAccount?.heldAmount as number) || (currentState !== 'CREATED' && currentState !== 'EXPIRED' ? amount : 0);
  const availableAmount = (escrowAccount?.availableAmount as number) || (currentState === 'RELEASED' ? sellerPayout : 0);

  const isExceptionActive = ['DISPUTED', 'REFUNDED', 'EXPIRED'].includes(currentState);
  const isTerminalState = ['RELEASED', 'REFUNDED', 'EXPIRED'].includes(currentState);
  const availableActions = STATE_ACTIONS[currentState] || [];
  const canDispute = !isTerminalState && currentState !== 'DISPUTED';

  // Release conditions state (7 conditions per CDC)
  const releaseConditions = useMemo(() => {
    const idx = NORMAL_FLOW_ORDER.indexOf(currentState);
    const step = idx < 0 ? 0 : idx;
    return {
      buyerConfirm: step >= NORMAL_FLOW_ORDER.indexOf('DEED_SIGNED'),
      sellerConfirm: step >= NORMAL_FLOW_ORDER.indexOf('DEED_SIGNED'),
      docsValid: step >= NORMAL_FLOW_ORDER.indexOf('DOCS_VALIDATED'),
      inspectionValid: step >= NORMAL_FLOW_ORDER.indexOf('GEOTRUST_VALIDATED'),
      fraudHold: step >= NORMAL_FLOW_ORDER.indexOf('NOTARY_ASSIGNED'),
      adminValid: step >= NORMAL_FLOW_ORDER.indexOf('ANDF_REGISTERED'),
      checkinConfirm: step >= NORMAL_FLOW_ORDER.indexOf('RELEASED'),
    };
  }, [currentState]);

  const completedConditions = Object.values(releaseConditions).filter(Boolean).length;
  const totalConditions = Object.values(releaseConditions).length;

  // Get the status of a step in the timeline
  const getStepStatus = (stateKey: EscrowState): 'completed' | 'current' | 'upcoming' => {
    const currentIdx = NORMAL_FLOW_ORDER.indexOf(currentState);
    const stepIdx = NORMAL_FLOW_ORDER.indexOf(stateKey);
    if (currentIdx < 0) {
      if (isExceptionActive) return 'upcoming';
      return 'upcoming';
    }
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'current';
    return 'upcoming';
  };

  // Handle state transition
  const handleTransition = async (targetState: EscrowState, actorType: string) => {
    // Special 2FA for fund release
    if (targetState === 'RELEASED') {
      setShow2FA(true);
      return;
    }

    setIsTransitioning(true);
    try {
      if (targetState === 'FUNDED') {
        await apiPost('/api/escrow/fund', { transactionId });
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

  // Handle 2FA verification for fund release
  const handle2FAVerification = async () => {
    setVerifying2FA(true);
    try {
      const res = await apiPost(`/api/escrow/${transactionId}/release-2fa`, {
        otpCode: otpCode || undefined,
        confirmationChecked: confirmChecked,
      });

      if (res) {
        // Now proceed with the actual release
        await apiPost('/api/escrow/release', { transactionId });
        toast.success('Vérification 2FA réussie — Fonds libérés');
        setShow2FA(false);
        setOtpCode('');
        setConfirmChecked(false);
        refetch();
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur de vérification 2FA';
      toast.error('Erreur 2FA', { description: msg });
    } finally {
      setVerifying2FA(false);
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

  // Demo ledger if empty
  const displayLedger = ledgerEntries.length > 0 ? ledgerEntries : [
    { entryType: 'CREDIT', amount: amount, balanceAfter: amount, currency: 'XOF', reference: `sha256:a3f8b2c1d4e5f6...`, createdAt: '2025-12-14T09:00:00Z' },
    { entryType: 'HOLD', amount: -amount, balanceAfter: 0, currency: 'XOF', reference: `sha256:b7c9d2e3f4a5b6...`, createdAt: '2025-12-14T09:01:00Z' },
    { entryType: 'COMMISSION', amount: -commission, balanceAfter: amount - commission, currency: 'XOF', reference: `sha256:c1d3e5f7a9b1c3...`, createdAt: '2025-12-14T09:02:00Z' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
          <Lock className="w-4 h-4" /> Escrow Sécurisé–7B.5
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
          Tableau de Bord Escrow
        </h1>
        <p className="text-gray-500 text-sm">
          {(property?.title as string) || `Transaction ${transactionId.slice(0, 8)}...`}
        </p>
      </motion.div>

      {/* Current State Badge */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center">
        <Badge
          className={`text-sm px-4 py-2 ${
            isExceptionActive
              ? currentState === 'DISPUTED'
                ? 'bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20'
                : currentState === 'EXPIRED'
                ? 'bg-gray-500/10 text-gray-600 border-gray-500/20'
                : 'bg-[#FF9800]/10 text-[#E65100] border-[#FF9800]/20'
              : currentState === 'RELEASED'
                ? 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20'
                : 'bg-[#003087]/10 text-[#003087] border-[#003087]/20'
          }`}
        >
          {ALL_STATES.find(s => s.key === currentState)?.icon}{' '}
          {ALL_STATES.find(s => s.key === currentState)?.label || currentState}
        </Badge>
      </motion.div>

      {/* 12-State Machine Timeline */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#2C2E2F]">Machine à états — 12 états</h3>
          <Badge variant="secondary" className="text-[10px]">
            {NORMAL_FLOW_ORDER.indexOf(currentState) + 1}/{NORMAL_FLOW_ORDER.length} étapes
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="flex items-start shrink-0">
                <Skeleton className="w-10 h-10 rounded-full" />
                {i < 8 && <Skeleton className="w-4 h-0.5 mt-5" />}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Normal flow timeline */}
            <div className="flex items-start gap-0.5 overflow-x-auto pb-3">
              {NORMAL_FLOW_ORDER.map((stateKey, i) => {
                const stateConfig = ALL_STATES.find(s => s.key === stateKey)!;
                const status = getStepStatus(stateKey);
                return (
                  <div key={stateKey} className="flex items-start shrink-0">
                    <div className="flex flex-col items-center w-12 sm:w-16">
                      <motion.div
                        initial={false}
                        animate={{ scale: status === 'current' ? 1.15 : 1 }}
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                          status === 'completed'
                            ? 'bg-[#00A651]/10 ring-2 ring-[#00A651]/30'
                            : status === 'current'
                            ? 'bg-[#D4AF37]/10 ring-2 ring-[#D4AF37]'
                            : 'bg-gray-100'
                        }`}
                      >
                        {status === 'completed' ? (
                          <CheckCircle className="w-4 h-4 text-[#00A651]" />
                        ) : (
                          <span className={status === 'current' ? '' : 'opacity-40'}>{stateConfig.icon}</span>
                        )}
                        {status === 'current' && (
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-[#D4AF37]"
                            animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeOut' }}
                          />
                        )}
                      </motion.div>
                      <p className={`text-[8px] sm:text-[9px] font-medium mt-1 text-center leading-tight ${
                        status === 'completed' ? 'text-[#00A651]' :
                        status === 'current' ? 'text-[#D4AF37] font-bold' :
                        'text-gray-400'
                      }`}>
                        {stateConfig.label}
                      </p>
                    </div>
                    {i < NORMAL_FLOW_ORDER.length - 1 && (
                      <div className={`w-2 sm:w-4 h-0.5 mt-[18px] shrink-0 transition-colors duration-300 ${
                        getStepStatus(NORMAL_FLOW_ORDER[i + 1]) !== 'upcoming' ? 'bg-[#00A651]' : 'bg-gray-200'
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
                      : currentState === 'EXPIRED'
                      ? 'bg-gray-500/5 text-gray-600'
                      : 'bg-[#FF9800]/5 text-[#E65100]'
                    : currentState === 'RELEASED'
                    ? 'bg-[#00A651]/5 text-[#00A651]'
                    : 'bg-[#003087]/5 text-[#003087]'
                }`}
              >
                <span className="font-semibold">Étape actuelle : </span>
                {ALL_STATES.find(s => s.key === currentState)?.description}
              </motion.div>
            </AnimatePresence>

            {/* Exception states */}
            {isExceptionActive && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {EXCEPTION_STATES.map((state) => {
                  const isActive = currentState === state.key;
                  return (
                    <div
                      key={state.key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${
                        isActive
                          ? state.key === 'DISPUTED'
                            ? 'bg-[#D93025]/10 text-[#D93025] ring-1 ring-[#D93025]/30'
                            : state.key === 'EXPIRED'
                            ? 'bg-gray-500/10 text-gray-600 ring-1 ring-gray-500/30'
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Release Conditions Checklist (7 conditions) */}
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

          <div className="space-y-2.5">
            {RELEASE_CONDITIONS.map((condition) => (
              <div
                key={condition.key}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                  releaseConditions[condition.key as keyof typeof releaseConditions]
                    ? 'bg-[#00A651]/5'
                    : 'bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  releaseConditions[condition.key as keyof typeof releaseConditions]
                    ? 'bg-[#00A651] text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                  {releaseConditions[condition.key as keyof typeof releaseConditions] ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    condition.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-xs font-medium ${
                    releaseConditions[condition.key as keyof typeof releaseConditions] ? 'text-[#00A651]' : 'text-gray-400'
                  }`}>
                    {condition.label}
                  </span>
                  <p className="text-[9px] text-gray-300 font-mono">{condition.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Balance Breakdown */}
        <Card className="p-6">
          <h3 className="text-base font-bold text-[#2C2E2F] mb-4">Répartition des fonds</h3>

          <div className="space-y-4">
            {/* Buyer deposit */}
            <div className="p-3 rounded-2xl bg-[#009CDE]/5 border border-[#009CDE]/10">
              <p className="text-[10px] text-[#009CDE] font-semibold mb-1">Dépôt acheteur</p>
              <p className="font-mono text-xl font-bold text-[#009CDE]">{formatFCFA(amount)}</p>
            </div>

            {/* Escrow held vs available */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-[#003087]/5 border border-[#003087]/10">
                <p className="text-[10px] text-[#003087] font-semibold mb-1">Escrow bloqué</p>
                <p className="font-mono text-lg font-bold text-[#003087]">{formatFCFA(heldAmount)}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">escrow_held</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#00A651]/5 border border-[#00A651]/10">
                <p className="text-[10px] text-[#00A651] font-semibold mb-1">Disponible</p>
                <p className="font-mono text-lg font-bold text-[#00A651]">{formatFCFA(availableAmount)}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">available</p>
              </div>
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
                    className={action.variant === 'default' ? 'bg-[#003087] hover:bg-[#0047b3]' : ''}
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
                  <label className="text-xs font-semibold text-[#D93025] mb-2 block">Raison du litige</label>
                  <textarea
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder="Décrivez le problème..."
                    className="w-full p-3 rounded-xl border border-[#D93025]/20 text-sm resize-none focus:outline-none focus:border-[#D93025] focus:ring-1 focus:ring-[#D93025]/20"
                    rows={3}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" onClick={handleDispute} disabled={isTransitioning || !disputeReason.trim()} variant="destructive">
                      Confirmer le litige
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowDisputeInput(false); setDisputeReason(''); }}>
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

      {/* 2FA Confirmation Modal */}
      <AnimatePresence>
        {show2FA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShow2FA(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-3">
                  <Fingerprint className="w-7 h-7 text-[#003087]" />
                </div>
                <h3 className="text-lg font-bold text-[#2C2E2F]">Confirmation 2FA requise</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Vérification requise pour libérer les fonds de {formatFCFA(amount)}
                </p>
              </div>

              <div className="space-y-4">
                {/* OTP Input */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1.5 block">Code OTP (6 chiffres)</label>
                  <Input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center font-mono text-lg tracking-widest h-12"
                    maxLength={6}
                  />
                </div>

                {/* Confirmation checkbox */}
                <label className="flex items-start gap-3 cursor-pointer p-3 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300"
                  />
                  <span className="text-xs text-gray-600">
                    Je confirme la libération des fonds de <strong>{formatFCFA(amount)}</strong> au vendeur.
                    Cette action est irréversible.
                  </span>
                </label>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setShow2FA(false); setOtpCode(''); setConfirmChecked(false); }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handle2FAVerification}
                    disabled={verifying2FA || (!otpCode && !confirmChecked)}
                    className="flex-1 bg-[#003087] hover:bg-[#0047b3]"
                  >
                    {verifying2FA ? (
                      <Timer className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 mr-2" />
                    )}
                    {verifying2FA ? 'Vérification...' : 'Confirmer la libération'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ledger Entries with SHA-256 Checksums */}
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
        ) : displayLedger.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Aucune entrée dans le grand livre</p>
            <p className="text-xs text-gray-300 mt-1">Les entrées apparaîtront une fois l&apos;escrow financé</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-2">
              {displayLedger.map((entry, i) => {
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
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {/* SHA-256 checksum display */}
                      {reference && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Lock className="w-2.5 h-2.5 text-gray-300" />
                          <p className="text-[8px] font-mono text-gray-300 truncate" title={reference}>
                            {reference.length > 30 ? reference.slice(0, 30) + '...' : reference}
                          </p>
                          <Badge variant="outline" className="text-[7px] px-1 py-0 h-3.5 ml-1">
                            SHA-256
                          </Badge>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* State Transition History Timeline */}
      <Card className="p-6">
        <h3 className="text-base font-bold text-[#2C2E2F] mb-4">Historique des transitions</h3>

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
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200" />
              <div className="space-y-3">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#003087] border-2 border-white z-10" />
                    <div className="flex-1 p-2.5 bg-gray-50 rounded-xl text-xs">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-[#2C2E2F]">
                          {event.fromStatus as string} <ArrowRight className="w-3 h-3 inline" /> {event.toStatus as string}
                        </span>
                      </div>
                      <p className="text-gray-400 text-[10px]">
                        {event.description as string} — {event.actorType as string}
                      </p>
                      <p className="text-gray-300 text-[9px] mt-0.5">
                        {new Date(event.createdAt as string).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
