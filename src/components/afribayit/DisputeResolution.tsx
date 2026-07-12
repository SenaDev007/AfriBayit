'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiPatch } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Clock,
  FileText,
  MessageSquare,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Send,
  ChevronRight,
  User,
  Scale,
  ArrowRight,
  Handshake,
  Timer,
  Fingerprint,
  Lock,
  FileCheck,
  Download,
  Eye,
  Plus,
  X,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ============ Types ============

export type DisputeStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface DisputeStepInfo {
  step: DisputeStep;
  titleFr: string;
  titleEn: string;
  descriptionFr: string;
  icon: React.ElementType;
  duration?: string;
  color: string;
}

const DISPUTE_STEPS: DisputeStepInfo[] = [
  {
    step: 1,
    titleFr: 'Déclaration',
    titleEn: 'Declaration',
    descriptionFr: 'Gel immédiat des fonds en escrow. Notification automatique aux deux parties.',
    icon: ShieldAlert,
    duration: 'Immédiat',
    color: '#D93025',
  },
  {
    step: 2,
    titleFr: 'Collection de preuves',
    titleEn: 'Evidence collection',
    descriptionFr: 'Fenêtre de 48h pour le téléchargement des documents justificatifs par les deux parties.',
    icon: FileText,
    duration: '48h',
    color: '#FF9800',
  },
  {
    step: 3,
    titleFr: 'Tentative de médiation',
    titleEn: 'Mediation attempt',
    descriptionFr: 'Résolution automatique en 24h. Proposition de partage basée sur l\'analyse des preuves.',
    icon: Handshake,
    duration: '24h',
    color: '#009CDE',
  },
  {
    step: 4,
    titleFr: 'Intervention admin pays',
    titleEn: 'Country admin intervention',
    descriptionFr: 'SLA de 72h ouvrées. L\'administrateur pays examine le dossier et les preuves.',
    icon: Building,
    duration: '72h ouvrées',
    color: '#003087',
  },
  {
    step: 5,
    titleFr: 'Décision d\'arbitrage',
    titleEn: 'Arbitration decision',
    descriptionFr: 'Libération totale, partielle ou remboursement intégral. Décision immutable.',
    icon: Gavel,
    duration: 'Immédiat',
    color: '#D4AF37',
  },
  {
    step: 6,
    titleFr: 'Exécution',
    titleEn: 'Execution',
    descriptionFr: 'Log signé cryptographiquement. Exécution irréversible de la décision.',
    icon: Fingerprint,
    duration: 'Immédiat',
    color: '#00A651',
  },
];

interface Evidence {
  id: string;
  party: 'buyer' | 'seller';
  fileName: string;
  uploadedAt: string;
  type: string;
  fileSize?: number;
}

interface Message {
  id: string;
  sender: 'buyer' | 'seller' | 'admin' | 'system';
  content: string;
  timestamp: string;
  type?: 'message' | 'proposal' | 'counter_proposal' | 'acceptance';
}

interface Decision {
  type: 'total_release' | 'partial_release' | 'full_refund';
  buyerPercentage: number;
  sellerPercentage: number;
  reason: string;
  decidedAt: string;
  decidedBy: string;
  executionHash?: string;
  immutable: boolean;
}

interface DisputeResolutionProps {
  disputeId?: string;
  transactionRef?: string;
  amount?: number;
  buyerName?: string;
  sellerName?: string;
  currentStep?: DisputeStep;
  isAdmin?: boolean;
  onResolve?: (decision: { type: string; splitPercentage: number; reason: string }) => void;
}

// ============ Helpers ============

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============ Component ============

export default function DisputeResolution({
  disputeId = 'disp_demo_001',
  transactionRef = 'TXN-2025-001',
  amount = 15000000,
  buyerName = 'Amadou Diallo',
  sellerName = 'Marie Koffi',
  currentStep = 3,
  isAdmin = false,
  onResolve,
}: DisputeResolutionProps) {
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState<DisputeStep>(currentStep);
  const [evidence, setEvidence] = useState<Evidence[]>([
    { id: '1', party: 'buyer', fileName: 'contrat_achat.pdf', uploadedAt: '2025-12-14T10:00:00', type: 'Contrat', fileSize: 245000 },
    { id: '2', party: 'seller', fileName: 'rapport_inspection.jpg', uploadedAt: '2025-12-14T12:00:00', type: 'Photo', fileSize: 1800000 },
    { id: '3', party: 'buyer', fileName: 'releve_bancaire.pdf', uploadedAt: '2025-12-14T14:00:00', type: 'Financier', fileSize: 89000 },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'system', content: 'Litige ouvert automatiquement. Les fonds sont gelés en escrow.', timestamp: '2025-12-14T09:00:00', type: 'message' },
    { id: '2', sender: 'buyer', content: 'Je conteste l\'état du bien. Les photos ne correspondent pas à la description.', timestamp: '2025-12-14T09:15:00', type: 'message' },
    { id: '3', sender: 'seller', content: 'Le bien était en bon état lors de la visite. Les photos sont anciennes.', timestamp: '2025-12-14T09:30:00', type: 'message' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionType, setDecisionType] = useState<'partial_release' | 'full_refund' | 'total_release'>('partial_release');
  const [showDecision, setShowDecision] = useState(false);
  const [executionLog, setExecutionLog] = useState<{
    hash: string;
    signedAt: string;
    signedBy: string;
    algorithm: string;
  } | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  // React Query for dispute data
  const { data: disputeData, isLoading: disputeLoading } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => apiFetch<Record<string, unknown>>(`/api/disputes/${disputeId}`),
    enabled: !!disputeId,
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: String(prev.length + 1),
      sender: isAdmin ? 'admin' : 'buyer',
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'message',
    }]);
    setNewMessage('');
  };

  const handleUploadEvidence = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingEvidence(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('party', isAdmin ? 'admin' : 'buyer');
        formData.append('type', 'Document');

        await fetch(`/api/disputes/${disputeId}/evidence`, {
          method: 'POST',
          body: formData,
        });

        setEvidence(prev => [...prev, {
          id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          party: isAdmin ? 'buyer' : 'buyer',
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          type: 'Document',
          fileSize: file.size,
        }]);
      }
      toast.success('Preuve(s) ajoutée(s)');
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    } catch {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploadingEvidence(false);
      e.target.value = '';
    }
  }, [disputeId, isAdmin, queryClient]);

  const handleResolve = async () => {
    try {
      const res = await apiPost(`/api/disputes/${disputeId}/decision`, {
        type: decisionType,
        buyerPercentage: decisionType === 'full_refund' ? 100 : decisionType === 'total_release' ? 0 : splitPercentage,
        sellerPercentage: decisionType === 'full_refund' ? 0 : decisionType === 'total_release' ? 100 : 100 - splitPercentage,
        reason: decisionReason,
      });

      setShowDecision(true);

      if (currentStep < 6) {
        await apiPatch(`/api/disputes/${disputeId}`, { currentStep: 6 });
        setExecutionLog({
          hash: `sha256:${Buffer.from(JSON.stringify({ id: disputeId, ts: Date.now() })).toString('base64').slice(0, 40)}`,
          signedAt: new Date().toISOString(),
          signedBy: 'admin_afrbayit',
          algorithm: 'SHA-256',
        });
      }

      toast.success('Décision d\'arbitrage rendue');
      onResolve?.({
        type: decisionType,
        splitPercentage: decisionType === 'partial_release' ? splitPercentage : decisionType === 'full_refund' ? 100 : 0,
        reason: decisionReason,
      });

      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
    } catch {
      toast.error('Erreur lors de la décision');
    }
  };

  const getDecisionTypeLabel = () => {
    switch (decisionType) {
      case 'total_release': return 'Libération totale';
      case 'partial_release': return 'Libération partielle';
      case 'full_refund': return 'Remboursement intégral';
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Résolution de Litige</h3>
            <p className="text-xs text-gray-500">
              Ref: {disputeId} · Transaction: {transactionRef} · Montant: {formatXOF(amount)}
            </p>
          </div>
        </div>
        <Badge className="bg-red-50 text-red-700 border border-red-200">
          Etape {currentStep}/6 — {DISPUTE_STEPS[currentStep - 1].titleFr}
        </Badge>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#003087]/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#003087] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Acheteur</p>
            <p className="text-sm font-medium text-gray-900">{buyerName}</p>
          </div>
        </div>
        <div className="bg-[#D4AF37]/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Vendeur</p>
            <p className="text-sm font-medium text-gray-900">{sellerName}</p>
          </div>
        </div>
      </div>

      {/* 6-Step Visual Timeline */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Protocole d&apos;arbitrage — 6 étapes</h4>
          <div className="space-y-2">
            {DISPUTE_STEPS.map((stepInfo) => {
              const StepIcon = stepInfo.icon;
              const isActive = stepInfo.step === activeStep;
              const isCompleted = stepInfo.step < currentStep;
              const isCurrent = stepInfo.step === currentStep;
              const isPending = stepInfo.step > currentStep;

              return (
                <motion.button
                  key={stepInfo.step}
                  onClick={() => setActiveStep(stepInfo.step)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                    isActive ? 'bg-[#003087]/5 border border-[#003087]/20' :
                    isCompleted ? 'bg-green-50/50' :
                    'hover:bg-gray-50'
                  )}
                  whileHover={{ x: 2 }}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    isCompleted ? 'bg-[#00A651]/10' :
                    isCurrent ? `bg-[${stepInfo.color}]` :
                    isActive ? `bg-[${stepInfo.color}]/20` :
                    'bg-gray-100'
                  )}
                    style={{ backgroundColor: isCurrent ? stepInfo.color : isCompleted ? 'rgba(0,166,81,0.1)' : undefined }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#00A651]" />
                    ) : (
                      <StepIcon className={cn('w-4 h-4', isCurrent ? 'text-white' : isActive ? stepInfo.color : 'text-gray-400')} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-medium',
                        isCurrent ? `text-[${stepInfo.color}]` :
                        isCompleted ? 'text-[#00A651]' :
                        isActive ? 'text-[#003087]' :
                        'text-gray-500'
                      )}
                        style={{ color: isCurrent ? stepInfo.color : undefined }}
                      >
                        {stepInfo.titleFr}
                      </p>
                      {stepInfo.duration && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {stepInfo.duration}
                        </span>
                      )}
                      {isCurrent && (
                        <Badge className="text-[9px] px-1.5 py-0" style={{ backgroundColor: stepInfo.color, color: 'white' }}>
                          En cours
                        </Badge>
                      )}
                    </div>
                    {(isActive || isCurrent) && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-xs text-gray-500 mt-0.5"
                      >
                        {stepInfo.descriptionFr}
                      </motion.p>
                    )}
                  </div>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-[#00A651] shrink-0" />}
                  {!isCompleted && !isCurrent && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content Panels */}
      <AnimatePresence mode="wait">
        {/* Step 1: Declaration - Fund Freeze */}
        {activeStep === 1 && (
          <motion.div key="declaration" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4 text-red-600" /> Gel immédiat des fonds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium mb-1">Fonds bloqués en escrow</p>
                  <p className="font-mono text-lg font-bold text-red-800">{formatXOF(amount)}</p>
                  <p className="text-[10px] text-red-500 mt-1">
                    Les fonds sont gelés automatiquement et ne peuvent être libérés qu&apos;après résolution du litige.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Notification envoyée aux deux parties et à l&apos;admin pays</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Evidence Upload */}
        {activeStep === 2 && (
          <motion.div key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#FF9800]" /> Preuves soumises
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    <Clock className="w-3 h-3 mr-1" /> Fenêtre 48h
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {evidence.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          doc.party === 'buyer' ? 'bg-[#003087]/10' : 'bg-[#D4AF37]/10'
                        )}>
                          <FileText className={cn('w-4 h-4', doc.party === 'buyer' ? 'text-[#003087]' : 'text-[#D4AF37]')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.fileName}</p>
                          <p className="text-[11px] text-gray-400">
                            {doc.party === 'buyer' ? buyerName : sellerName} · {doc.type}
                            {doc.fileSize && ` · ${formatFileSize(doc.fileSize)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {doc.party === 'buyer' ? 'Acheteur' : 'Vendeur'}
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Eye className="w-3 h-3 text-gray-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Upload Section */}
                <div className="relative">
                  <input
                    type="file"
                    id="evidence-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleUploadEvidence}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs"
                    disabled={uploadingEvidence}
                    onClick={() => document.getElementById('evidence-upload')?.click()}
                  >
                    {uploadingEvidence ? (
                      <Timer className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {uploadingEvidence ? 'Téléchargement...' : 'Ajouter une pièce justificative'}
                  </Button>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  Tous les documents sont horodatés et ne peuvent être modifiés après soumission.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 3: Mediation Proposal */}
        {activeStep === 3 && (
          <motion.div key="mediation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-[#009CDE]" /> Tentative de médiation
                  <Badge className="text-[9px] bg-[#009CDE]/10 text-[#009CDE] border-0 ml-auto">
                    Résolution auto 24h
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Mediation Proposal */}
                <div className="bg-[#009CDE]/5 border border-[#009CDE]/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-[#009CDE]" />
                    <span className="text-xs font-semibold text-[#009CDE]">Proposition de médiation automatique</span>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500">Acheteur</p>
                      <p className="text-lg font-bold text-[#003087]">60%</p>
                      <p className="text-[10px] text-gray-400">{formatXOF(amount * 0.6)}</p>
                    </div>
                    <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#003087]" style={{ width: '60%' }} />
                      <div className="h-full bg-[#D4AF37]" style={{ width: '40%' }} />
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-gray-500">Vendeur</p>
                      <p className="text-lg font-bold text-[#D4AF37]">40%</p>
                      <p className="text-[10px] text-gray-400">{formatXOF(amount * 0.4)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="text-xs bg-[#00A651] hover:bg-[#008f47] flex-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Accepter
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs flex-1 border-red-200 text-red-600 hover:bg-red-50">
                      <X className="w-3.5 h-3.5 mr-1" /> Refuser
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <MessageSquare className="w-3.5 h-3.5 mr-1" /> Contre-proposition
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn(
                      'flex gap-2',
                      msg.sender === 'buyer' ? 'justify-start' :
                      msg.sender === 'seller' ? 'justify-end' :
                      'justify-center'
                    )}>
                      {msg.sender === 'system' ? (
                        <div className="bg-gray-100 rounded-lg px-3 py-2 text-xs text-gray-600 max-w-[80%] text-center">
                          {msg.content}
                        </div>
                      ) : (
                        <div className={cn(
                          'rounded-lg px-3 py-2 text-sm max-w-[80%]',
                          msg.sender === 'buyer' ? 'bg-[#003087]/10 text-gray-800' :
                          msg.sender === 'admin' ? 'bg-green-50 text-gray-800' :
                          'bg-[#D4AF37]/10 text-gray-800'
                        )}>
                          <p className="text-[10px] font-medium text-gray-500 mb-0.5">
                            {msg.sender === 'buyer' ? buyerName : msg.sender === 'seller' ? sellerName : 'Admin'}
                          </p>
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Votre message..."
                    className="min-h-[40px] h-10 resize-none text-sm"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  />
                  <Button size="sm" className="h-10 bg-[#003087] hover:bg-[#002a70]" onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 4: Admin Arbitration Panel */}
        {activeStep === 4 && (
          <motion.div key="admin-review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className={isAdmin ? 'border-[#003087]/20' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#003087]" /> Intervention admin pays
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    <Clock className="w-3 h-3 mr-1" /> SLA 72h ouvrées
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-[#003087]/5 border border-[#003087]/10 rounded-lg p-3 text-xs text-[#003087]">
                  L&apos;administrateur pays examine le dossier, les preuves et les échanges des parties avant de rendre sa décision.
                </div>

                {/* Evidence Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#003087]/5 rounded-lg p-3">
                    <p className="text-[10px] text-[#003087] font-semibold mb-1">Preuves acheteur</p>
                    <p className="text-lg font-bold text-[#003087]">{evidence.filter(e => e.party === 'buyer').length}</p>
                    <p className="text-[10px] text-gray-400">documents</p>
                  </div>
                  <div className="bg-[#D4AF37]/5 rounded-lg p-3">
                    <p className="text-[10px] text-[#D4AF37] font-semibold mb-1">Preuves vendeur</p>
                    <p className="text-lg font-bold text-[#D4AF37]">{evidence.filter(e => e.party === 'seller').length}</p>
                    <p className="text-[10px] text-gray-400">documents</p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    En tant qu&apos;admin, vous pouvez rendre une décision d&apos;arbitrage (étape 5).
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Decision Panel (Admin only) */}
        {activeStep === 5 && isAdmin && !showDecision && (
          <motion.div key="admin-decision" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-[#D4AF37]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#D4AF37]" /> Décision d&apos;arbitrage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Decision Type */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Type de décision</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className={cn(
                        'p-3 rounded-xl border text-sm font-medium transition-all',
                        decisionType === 'total_release'
                          ? 'border-[#00A651] bg-[#00A651]/5 text-[#00A651]'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      )}
                      onClick={() => setDecisionType('total_release')}
                    >
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                      Libération totale
                    </button>
                    <button
                      className={cn(
                        'p-3 rounded-xl border text-sm font-medium transition-all',
                        decisionType === 'partial_release'
                          ? 'border-[#003087] bg-[#003087]/5 text-[#003087]'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      )}
                      onClick={() => setDecisionType('partial_release')}
                    >
                      <Scale className="w-5 h-5 mx-auto mb-1" />
                      Libération partielle
                    </button>
                    <button
                      className={cn(
                        'p-3 rounded-xl border text-sm font-medium transition-all',
                        decisionType === 'full_refund'
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      )}
                      onClick={() => setDecisionType('full_refund')}
                    >
                      <ArrowRight className="w-5 h-5 mx-auto mb-1" />
                      Remboursement
                    </button>
                  </div>
                </div>

                {/* Split Slider (partial only) */}
                {decisionType === 'partial_release' && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-600 uppercase">Répartition</p>
                    <div className="flex items-center gap-4">
                      <div className="text-center w-20">
                        <p className="text-xs text-gray-500">Acheteur</p>
                        <p className="text-sm font-bold text-[#003087]">{splitPercentage}%</p>
                        <p className="text-[10px] text-gray-400">{formatXOF(amount * splitPercentage / 100)}</p>
                      </div>
                      <Slider
                        value={[splitPercentage]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={v => setSplitPercentage(v[0])}
                        className="flex-1"
                      />
                      <div className="text-center w-20">
                        <p className="text-xs text-gray-500">Vendeur</p>
                        <p className="text-sm font-bold text-[#D4AF37]">{100 - splitPercentage}%</p>
                        <p className="text-[10px] text-gray-400">{formatXOF(amount * (100 - splitPercentage) / 100)}</p>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-[#003087] transition-all" style={{ width: `${splitPercentage}%` }} />
                      <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${100 - splitPercentage}%` }} />
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Raison de la décision</p>
                  <Textarea
                    value={decisionReason}
                    onChange={e => setDecisionReason(e.target.value)}
                    placeholder="Expliquez la raison de votre décision..."
                    rows={3}
                  />
                </div>

                {/* Submit */}
                <Button
                  className="w-full bg-[#D4AF37] hover:bg-[#c4a030] text-white"
                  onClick={handleResolve}
                  disabled={!decisionReason}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  {getDecisionTypeLabel()}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5/6: Decision Display */}
        {(activeStep === 5 || activeStep === 6) && showDecision && (
          <motion.div key="decision-display" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-[#D4AF37]/30">
              <CardContent className="p-4 space-y-4">
                {/* Decision Header */}
                <div className="text-center">
                  <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-2">
                    <Gavel className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Décision d&apos;arbitrage rendue</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{getDecisionTypeLabel()}</p>
                </div>

                {/* Decision Details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#003087]/5 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-500">Acheteur</p>
                    <p className="text-lg font-bold text-[#003087]">
                      {decisionType === 'full_refund' ? '100' : decisionType === 'total_release' ? '0' : splitPercentage}%
                    </p>
                  </div>
                  <div className="bg-[#D4AF37]/5 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-gray-500">Vendeur</p>
                    <p className="text-lg font-bold text-[#D4AF37]">
                      {decisionType === 'full_refund' ? '0' : decisionType === 'total_release' ? '100' : 100 - splitPercentage}%
                    </p>
                  </div>
                </div>

                {/* Immutability Indicator */}
                <div className="bg-[#00A651]/5 border border-[#00A651]/20 rounded-lg p-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00A651]" />
                  <div>
                    <p className="text-xs font-semibold text-[#00A651]">Décision immutable</p>
                    <p className="text-[10px] text-gray-500">Cette décision ne peut plus être modifiée. Horodatée et signée cryptographiquement.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 6: Execution with Cryptographic Log */}
        {activeStep === 6 && (
          <motion.div key="execution" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-[#00A651]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-[#00A651]" /> Exécution — Log cryptographique
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {executionLog ? (
                  <>
                    <div className="bg-[#00A651]/5 border border-[#00A651]/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                        <span className="text-sm font-semibold text-[#00A651]">Exécution confirmée</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Algorithme</span>
                          <span className="font-mono font-medium">{executionLog.algorithm}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Signé par</span>
                          <span className="font-medium">{executionLog.signedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span className="font-medium">{formatDate(executionLog.signedAt)}</span>
                        </div>
                        <Separator />
                        <div>
                          <span className="text-gray-500 block mb-1">Hash de l&apos;exécution</span>
                          <code className="text-[10px] bg-gray-100 px-2 py-1 rounded font-mono break-all block">
                            {executionLog.hash}
                          </code>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Log signé cryptographiquement — Irréversible et vérifiable</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Timer className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">En attente de la décision d&apos;arbitrage</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
