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
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
    glow: 'shadow-blue-200/50',
    icon: 'text-blue-600',
  },
  2: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    glow: 'shadow-amber-200/50',
    icon: 'text-amber-600',
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
      return <Clock className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
    default:
      return <Circle className="w-4 h-4 text-gray-300 shrink-0" />;
  }
}

function getStatusLabel(status: KycDocRequirement['status']): string {
  switch (status) {
    case 'human_validated':
      return 'Validé';
    case 'ai_validated':
      return 'Validé par IA';
    case 'pending':
      return 'En attente';
    case 'rejected':
      return 'Rejeté';
    default:
      return 'Non soumis';
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
      className={`relative rounded-2xl border-2 p-5 sm:p-6 transition-shadow ${
        isCurrentLevel ? `shadow-lg ${colors.glow}` : ''
      } ${state === 'locked' ? 'opacity-60' : ''} ${colors.border} ${colors.bg}`}
    >
      {/* Badge niveau actuel */}
      {isCurrentLevel && (
        <span
          className={`absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}
        >
          Niveau actuel
        </span>
      )}

      {/* En-tête */}
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.badge}`}>
          <span className={colors.icon}>{getLevelIcon(level)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-bold text-gray-900">
              KYC {level} — {name}
            </h3>
            {state === 'locked' && <Lock className="w-4 h-4 text-gray-400" />}
          </div>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        </div>
      </div>

      {/* Limite de transaction */}
      <div className="mb-4 px-3 py-2 rounded-lg bg-white/70 border border-gray-200/60">
        <p className="text-xs text-gray-500 font-medium">Limite de transaction mensuelle</p>
        <p className="text-base font-bold text-gray-900">{limit}</p>
      </div>

      {/* Barre de progression */}
      {state !== 'locked' && requirements.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Progression</span>
            <span className="font-semibold">
              {validatedCount}/{requirements.length} documents
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, delay: index * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-lg ${
                progressPct === 100
                  ? 'bg-emerald-500'
                  : progressPct > 0
                    ? 'bg-amber-400'
                    : 'bg-gray-300'
              }`}
            />
          </div>
        </div>
      )}

      {/* Liste des documents requis */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Documents requis
        </p>
        {requirements.map((req) => (
          <div
            key={req.docType}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white/50 transition-colors"
          >
            {getStatusIcon(req.status)}
            <span className="text-sm text-gray-700 flex-1">{req.label}</span>
            <span
              className={`text-xs font-medium ${
                req.status === 'human_validated' || req.status === 'ai_validated'
                  ? 'text-emerald-600'
                  : req.status === 'pending'
                    ? 'text-amber-600'
                    : req.status === 'rejected'
                      ? 'text-red-600'
                      : 'text-gray-400'
              }`}
            >
              {getStatusLabel(req.status)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
