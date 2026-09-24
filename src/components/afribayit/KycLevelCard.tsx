'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Clock,
  Lock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface KycDocRequirement {
  docType: string;
  label: string;
  status: 'none' | 'pending' | 'ai_validated' | 'human_validated' | 'rejected';
}

export type LevelState = 'achieved' | 'in_progress' | 'locked';

export interface KycLevelCardProps {
  level: number; // 0-3
  name: string;
  description: string;
  limit: string;
  state: LevelState;
  requirements: KycDocRequirement[];
  isCurrentLevel: boolean;
  /** index pour l'animation décalée */
  index?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const levelColors: Record<number, { bg: string; border: string; badge: string; glow: string; icon: string }> = {
  0: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    badge: 'bg-gray-200 text-gray-700',
    glow: '',
    icon: 'text-gray-500',
  },
  1: {
    bg: 'bg-primary-pale/60',
    border: 'border-primary-green/30',
    badge: 'bg-primary-pale text-primary-deep',
    glow: 'shadow-primary-green/20',
    icon: 'text-primary-green',
  },
  2: {
    bg: 'bg-accent-yellow/10',
    border: 'border-accent-yellow/40',
    badge: 'bg-accent-yellow/20 text-accent-dark',
    glow: 'shadow-accent-yellow/20',
    icon: 'text-accent-dark',
  },
  3: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800',
    glow: 'shadow-emerald-200/50',
    icon: 'text-emerald-600',
  },
};

function getStatusIcon(status: KycDocRequirement['status']) {
  switch (status) {
    case 'human_validated':
    case 'ai_validated':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-accent-dark shrink-0" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-gray-300 shrink-0" />;
  }
}

function getStatusLabel(status: KycDocRequirement['status'], t: (key: string, fallback?: string) => string): string {
  switch (status) {
    case 'human_validated':
      return t('kyc.statusValidated', 'Validé');
    case 'ai_validated':
      return t('kyc.statusAiValidated', 'Validé par IA');
    case 'pending':
      return t('kyc.statusPending', 'En attente');
    case 'rejected':
      return t('kyc.statusRejected', 'Rejeté');
    default:
      return t('kyc.statusNotSubmitted', 'Non soumis');
  }
}

function getLevelIcon(level: number) {
  const cls = 'w-6 h-6';
  switch (level) {
    case 0:
      return <Shield className={cls} />;
    case 1:
      return <ShieldCheck className={cls} />;
    case 2:
      return <ShieldAlert className={cls} />;
    case 3:
      return <ShieldCheck className={cls} />;
    default:
      return <Shield className={cls} />;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function KycLevelCard({
  level,
  name,
  description,
  limit,
  state,
  requirements,
  isCurrentLevel,
  index = 0,
}: KycLevelCardProps) {
  const { t } = useTranslation();
  const colors = levelColors[level] ?? levelColors[0];

  const validatedCount = requirements.filter(
    (r) => r.status === 'ai_validated' || r.status === 'human_validated',
  ).length;
  const progressPct = requirements.length > 0 ? Math.round((validatedCount / requirements.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-3xl border-2 p-5 sm:p-6 transition-shadow ${
        isCurrentLevel ? `shadow-lg ${colors.glow}` : ''
      } ${state === 'locked' ? 'opacity-60' : ''} ${colors.border} ${colors.bg}`}
    >
      {/* Badge niveau actuel */}
      {isCurrentLevel && (
        <span
          className={`absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}
        >
          {t('kyc.currentLevel', 'Niveau actuel')}
        </span>
      )}

        <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors.badge}`}>
          <span className={colors.icon}>{getLevelIcon(level)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg font-bold text-primary-deep">
              KYC {level} — {name}
            </h3>
            {state === 'locked' && <Lock className="w-4 h-4 text-gray-400" />}
          </div>
          <p className="text-sm text-gray-text mt-0.5">{description}</p>
        </div>
      </div>

      {/* Limite de transaction */}
      <div className="mb-4 px-3 py-2 rounded-xl bg-white/70 border border-primary-pale">
        <p className="text-xs text-gray-text font-bold uppercase tracking-wider">{t('kyc.transactionLimit', 'Limite de transaction mensuelle')}</p>
        <p className="text-base font-bold text-primary-deep">{limit}</p>
      </div>

      {/* Barre de progression */}
      {state !== 'locked' && requirements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-text mb-1.5">
            <span>{t('kyc.progress', 'Progression')}</span>
            <span className="font-bold">
              {validatedCount}/{requirements.length} {t('kyc.documents', 'documents')}
            </span>
          </div>
          <div className="h-2 rounded-full bg-primary-pale overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, delay: index * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full ${
                progressPct === 100
                  ? 'bg-emerald-500'
                  : progressPct > 0
                    ? 'bg-accent-yellow'
                    : 'bg-gray-300'
              }`}
            />
          </div>
        </div>
      )}

      {/* Liste des documents requis */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-primary-deep uppercase tracking-wider">
          {t('kyc.requiredDocuments', 'Documents requis')}
        </p>
        {requirements.map((req) => (
          <div
            key={req.docType}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/60 transition-colors"
          >
            {getStatusIcon(req.status)}
            <span className="text-sm text-gray-text flex-1">{req.label}</span>
            <span
              className={`text-xs font-bold ${
                req.status === 'human_validated' || req.status === 'ai_validated'
                  ? 'text-emerald-600'
                  : req.status === 'pending'
                    ? 'text-accent-dark'
                    : req.status === 'rejected'
                      ? 'text-red-600'
                      : 'text-gray-400'
              }`}
            >
              {getStatusLabel(req.status, t)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
