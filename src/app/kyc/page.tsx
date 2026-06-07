'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import KycLevelCard, {
  type KycDocRequirement,
  type LevelState,
} from '@/components/afribayit/KycLevelCard';
import KycUploadForm, {
  type DocTypeOption,
} from '@/components/afribayit/KycUploadForm';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface KycDocument {
  id: string;
  docType: string;
  docUrl: string;
  ocrResult: string | null;
  ocrValid: boolean;
  aiScore: number | null;
  status: string; // pending, ai_validated, human_validated, rejected
  rejectionReason: string | null;
  country: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Level definitions (CDC §7B.8.1)                                    */
/* ------------------------------------------------------------------ */

interface LevelDef {
  level: number;
  name: string;
  description: string;
  limit: string;
  requiredDocs: { docType: string; label: string }[];
  badgeColor: string;
  accentColor: string;
}

const LEVEL_DEFS: LevelDef[] = [
  {
    level: 0,
    name: 'Anonyme',
    description: 'Email et téléphone vérifiés — Consultation uniquement',
    limit: 'Aucune transaction',
    requiredDocs: [],
    badgeColor: 'bg-gray-200 text-gray-700',
    accentColor: '#6B7280',
  },
  {
    level: 1,
    name: 'Standard',
    description: 'CNI/Passeport + selfie IA — Accès aux transactions de base',
    limit: "Jusqu'à 500 000 XOF/mois",
    requiredDocs: [
      { docType: 'id_card', label: "Carte d'identité nationale ou Passeport" },
      { docType: 'selfie', label: 'Selfie de vérification IA' },
    ],
    badgeColor: 'bg-blue-100 text-blue-800',
    accentColor: '#003087',
  },
  {
    level: 2,
    name: 'Avancé',
    description: 'KYC1 + justificatif de domicile + source de revenus',
    limit: "Jusqu'à 5 000 000 XOF/mois",
    requiredDocs: [
      { docType: 'id_card', label: "Carte d'identité nationale ou Passeport" },
      { docType: 'selfie', label: 'Selfie de vérification IA' },
      { docType: 'proof_address', label: 'Justificatif de domicile' },
      { docType: 'income_source', label: 'Justificatif de revenus' },
    ],
    badgeColor: 'bg-amber-100 text-amber-800',
    accentColor: '#D4AF37',
  },
  {
    level: 3,
    name: 'Professionnel',
    description: 'KYC2 + RCCM + statuts société — Volume illimité',
    limit: 'Illimité',
    requiredDocs: [
      { docType: 'id_card', label: "Carte d'identité nationale ou Passeport" },
      { docType: 'selfie', label: 'Selfie de vérification IA' },
      { docType: 'proof_address', label: 'Justificatif de domicile' },
      { docType: 'income_source', label: 'Justificatif de revenus' },
      { docType: 'rccm', label: 'RCCM (Registre du Commerce)' },
      { docType: 'company_statutes', label: 'Statuts de la société' },
    ],
    badgeColor: 'bg-emerald-100 text-emerald-800',
    accentColor: '#00A651',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getDocStatusForLevel(
  docs: KycDocument[],
  docType: string,
): KycDocRequirement['status'] {
  const matching = docs
    .filter((d) => {
      const dt = d.docType.toLowerCase();
      if (docType === 'id_card') return dt === 'id_card' || dt === 'passport';
      return dt === docType;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (matching.length === 0) return 'none';

  const latest = matching[0];
  if (latest.status === 'ai_validated' || latest.status === 'human_validated') {
    return latest.status as 'ai_validated' | 'human_validated';
  }
  if (latest.status === 'rejected') return 'rejected';
  return 'pending';
}

function computeLevelState(
  levelDef: LevelDef,
  currentKycLevel: number,
): LevelState {
  if (levelDef.level <= currentKycLevel) return 'achieved';
  if (levelDef.level === currentKycLevel + 1) return 'in_progress';
  return 'locked';
}

function getLevelIcon(level: number) {
  switch (level) {
    case 0:
      return <Shield className="w-6 h-6" />;
    case 1:
      return <ShieldCheck className="w-6 h-6" />;
    case 2:
      return <ShieldAlert className="w-6 h-6" />;
    case 3:
      return <ShieldCheck className="w-6 h-6" />;
    default:
      return <Shield className="w-6 h-6" />;
  }
}

function getDocTypeForNextLevel(currentKycLevel: number): DocTypeOption[] {
  if (currentKycLevel === 0) {
    return ['id_card', 'passport', 'selfie'];
  }
  if (currentKycLevel === 1) {
    return ['proof_address', 'income_source'];
  }
  if (currentKycLevel === 2) {
    return ['rccm', 'company_statutes'];
  }
  return [];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'human_validated':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="w-3 h-3" /> Validé
        </span>
      );
    case 'ai_validated':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <CheckCircle2 className="w-3 h-3" /> Validé IA
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" /> En attente
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <XCircle className="w-3 h-3" /> Rejeté
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          {status}
        </span>
      );
  }
}

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: "Carte d'identité",
  passport: 'Passeport',
  selfie: 'Selfie vérification',
  proof_address: 'Justificatif de domicile',
  income_source: 'Justificatif de revenus',
  rccm: 'RCCM',
  company_statutes: 'Statuts société',
  agent_license: 'Licence agent',
  notary_license: 'Licence notaire',
  geometer_license: 'Licence géomètre',
  business_reg: 'Registre commerce',
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function KycPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'levels' | 'documents' | 'upload'>('levels');

  const kycLevel = ((session?.user as Record<string, unknown>)?.kycLevel as number) ?? 0;
  const accessToken = (session?.user as Record<string, unknown>)?.accessToken as string | undefined;

  /* ---- Fetch documents ---- */

  const fetchDocuments = useCallback(async () => {
    setIsLoadingDocs(true);
    setFetchError(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/kyc', { headers });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors du chargement des documents');
      }
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoadingDocs(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      fetchDocuments();
    }
  }, [sessionStatus, fetchDocuments]);

  /* ---- Redirect if unauthenticated ---- */

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [sessionStatus, router]);

  /* ---- Build level cards data ---- */

  const levelCards = LEVEL_DEFS.map((def) => {
    const state = computeLevelState(def, kycLevel);
    const requirements: KycDocRequirement[] = def.requiredDocs.map((req) => ({
      docType: req.docType,
      label: req.label,
      status: getDocStatusForLevel(documents, req.docType),
    }));

    return {
      ...def,
      state,
      requirements,
      isCurrentLevel: def.level === kycLevel,
    };
  });

  /* ---- Loading / Unauthenticated states ---- */

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/30">
        <Loader2 className="w-8 h-8 animate-spin text-[#003087]" />
      </div>
    );
  }

  if (sessionStatus !== 'authenticated') {
    return null;
  }

  /* ---- Next level info ---- */

  const nextLevel = kycLevel < 3 ? LEVEL_DEFS[kycLevel + 1] : null;
  const allowedDocTypes = getDocTypeForNextLevel(kycLevel);

  return (
    <div className="min-h-screen bg-gray-50/30 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003087] via-[#001f5c] to-[#003087] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          {/* Navigation retour */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-white">{getLevelIcon(kycLevel)}</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                Vérification d&apos;identité (KYC)
              </h1>
              <p className="text-white/70 text-sm">
                Complétez votre vérification pour débloquer des limites de transaction plus élevées
              </p>
            </div>
            {/* Badge du niveau actuel */}
            <div
              className="px-4 py-2 rounded-xl font-bold text-sm shrink-0"
              style={{
                backgroundColor: `${LEVEL_DEFS[kycLevel].accentColor}20`,
                color: LEVEL_DEFS[kycLevel].accentColor,
                border: `2px solid ${LEVEL_DEFS[kycLevel].accentColor}40`,
              }}
            >
              KYC {kycLevel} — {LEVEL_DEFS[kycLevel].name}
            </div>
          </div>

          {/* Prochain niveau call-to-action */}
          {nextLevel && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${nextLevel.accentColor}30` }}
                >
                  <span style={{ color: nextLevel.accentColor }}>{getLevelIcon(nextLevel.level)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Prochain niveau : KYC {nextLevel.level} — {nextLevel.name}
                  </p>
                  <p className="text-xs text-white/60">
                    {nextLevel.limit} — Soumettez les documents requis ci-dessous
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-white text-[#003087] hover:bg-gray-100 transition-colors shrink-0"
              >
                Soumettre des documents
              </button>
            </motion.div>
          )}

          {kycLevel === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center gap-3"
            >
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              <div>
                <p className="text-sm font-semibold text-white">Niveau maximum atteint !</p>
                <p className="text-xs text-white/60">
                  Votre compte est entièrement vérifié. Vous bénéficiez de transactions illimitées.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5 flex gap-1">
          {[
            { key: 'levels' as const, label: 'Niveaux KYC', icon: <Shield className="w-4 h-4" /> },
            { key: 'documents' as const, label: 'Mes documents', icon: <FileText className="w-4 h-4" /> },
            { key: 'upload' as const, label: 'Soumettre', icon: <RefreshCw className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#003087] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <AnimatePresence mode="wait">
          {/* ======= Onglet Niveaux KYC ======= */}
          {activeTab === 'levels' && (
            <motion.div
              key="levels"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Info banner */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Comment fonctionne la vérification KYC ?</p>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    La vérification KYC (Know Your Customer) est un processus obligatoire pour lutter contre le blanchiment d&apos;argent et assurer la sécurité de nos utilisateurs. Chaque niveau débloque des limites de transaction plus élevées. Votre niveau est mis à jour automatiquement après validation de vos documents par notre IA ou notre équipe.
                  </p>
                </div>
              </div>

              {levelCards.map((card, i) => (
                <KycLevelCard
                  key={card.level}
                  level={card.level}
                  name={card.name}
                  description={card.description}
                  limit={card.limit}
                  state={card.state}
                  requirements={card.requirements}
                  isCurrentLevel={card.isCurrentLevel}
                  index={i}
                />
              ))}
            </motion.div>
          )}

          {/* ======= Onglet Mes documents ======= */}
          {activeTab === 'documents' && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Documents soumis</h3>
                  <button
                    onClick={fetchDocuments}
                    disabled={isLoadingDocs}
                    className="flex items-center gap-1.5 text-sm text-[#003087] hover:text-[#002060] font-medium transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingDocs ? 'animate-spin' : ''}`} />
                    Actualiser
                  </button>
                </div>

                {isLoadingDocs && (
                  <div className="p-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#003087]" />
                  </div>
                )}

                {fetchError && (
                  <div className="p-6 text-center">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">{fetchError}</p>
                    <button
                      onClick={fetchDocuments}
                      className="mt-3 px-4 py-2 text-sm font-medium text-[#003087] hover:bg-[#003087]/5 rounded-lg transition-colors"
                    >
                      Réessayer
                    </button>
                  </div>
                )}

                {!isLoadingDocs && !fetchError && documents.length === 0 && (
                  <div className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 mb-1">Aucun document soumis</p>
                    <p className="text-xs text-gray-400">
                      Commencez par soumettre vos documents pour la vérification
                    </p>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#003087] text-white hover:bg-[#002060] transition-colors"
                    >
                      Soumettre un document
                    </button>
                  </div>
                )}

                {!isLoadingDocs && !fetchError && documents.length > 0 && (
                  <div className="divide-y divide-gray-100 max-h-[32rem] overflow-y-auto">
                    {documents.map((doc, i) => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-5 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              doc.status === 'human_validated' || doc.status === 'ai_validated'
                                ? 'bg-emerald-100'
                                : doc.status === 'pending'
                                  ? 'bg-amber-100'
                                  : 'bg-red-100'
                            }`}
                          >
                            <FileText
                              className={`w-5 h-5 ${
                                doc.status === 'human_validated' || doc.status === 'ai_validated'
                                  ? 'text-emerald-600'
                                  : doc.status === 'pending'
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {DOC_TYPE_LABELS[doc.docType] || doc.docType}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Soumis le {formatDate(doc.createdAt)}
                              {doc.aiScore !== null && doc.aiScore !== undefined && (
                                <span className="ml-2">
                                  — Score IA : <span className="font-medium">{Math.round(doc.aiScore)}%</span>
                                </span>
                              )}
                            </p>
                            {doc.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                {doc.rejectionReason}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">{getStatusBadge(doc.status)}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ======= Onglet Soumettre ======= */}
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {kycLevel >= 3 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-lg font-bold text-gray-900 mb-1">
                    Vérification complète !
                  </p>
                  <p className="text-sm text-gray-500">
                    Vous avez atteint le niveau KYC maximum. Aucun document supplémentaire n&apos;est requis.
                  </p>
                </div>
              ) : (
                <>
                  {/* Info : que soumettre ? */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Documents requis pour le niveau {nextLevel?.level} — {nextLevel?.name}
                      </p>
                      <ul className="mt-1.5 space-y-0.5">
                        {nextLevel?.requiredDocs
                          .filter((req) => {
                            const status = getDocStatusForLevel(documents, req.docType);
                            return status !== 'ai_validated' && status !== 'human_validated';
                          })
                          .map((req) => (
                            <li key={req.docType} className="text-xs text-amber-700 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {req.label}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>

                  <KycUploadForm
                    allowedDocTypes={allowedDocTypes}
                    onSubmitted={fetchDocuments}
                    accessToken={accessToken}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
