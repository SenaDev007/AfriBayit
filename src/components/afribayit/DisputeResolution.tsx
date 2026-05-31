'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Clock,
  FileText,
  MessageSquare,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  Send,
  ChevronRight,
  User,
  Scale,
  ArrowRight,
  Handshake,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
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
}

const DISPUTE_STEPS: DisputeStepInfo[] = [
  {
    step: 1,
    titleFr: 'Litige ouvert',
    titleEn: 'Dispute opened',
    descriptionFr: 'Notification automatique envoyée aux deux parties. Le montant en escrow est bloqué.',
    icon: ShieldAlert,
    duration: 'Immédiat',
  },
  {
    step: 2,
    titleFr: 'Soumission des preuves',
    titleEn: 'Evidence submission',
    descriptionFr: 'Les deux parties téléchargent leurs documents justificatifs (photos, contrats, rapports).',
    icon: FileText,
    duration: '48h',
  },
  {
    step: 3,
    titleFr: 'Tentative de médiation',
    titleEn: 'Mediation attempt',
    descriptionFr: 'Un médiateur tente de résoudre le litige à l\'amiable entre les deux parties.',
    icon: Handshake,
    duration: '48h',
  },
  {
    step: 4,
    titleFr: 'Révision admin',
    titleEn: 'Admin review',
    descriptionFr: 'L\'équipe AfriBayit examine le dossier, les preuves et les échanges.',
    icon: Scale,
    duration: '72h',
  },
  {
    step: 5,
    titleFr: 'Décision',
    titleEn: 'Decision',
    descriptionFr: 'Décision rendue: partage des fonds ou remboursement intégral.',
    icon: Gavel,
    duration: 'Immédiat',
  },
  {
    step: 6,
    titleFr: 'Fenêtre d\'appel',
    titleEn: 'Appeal window',
    descriptionFr: 'Les parties ont 72h pour faire appel de la décision.',
    icon: Timer,
    duration: '72h',
  },
];

interface Evidence {
  id: string;
  party: 'buyer' | 'seller';
  fileName: string;
  uploadedAt: string;
  type: string;
}

interface Message {
  id: string;
  sender: 'buyer' | 'seller' | 'admin' | 'system';
  content: string;
  timestamp: string;
}

interface DisputeResolutionProps {
  disputeId: string;
  transactionRef: string;
  amount: number;
  buyerName: string;
  sellerName: string;
  currentStep: DisputeStep;
  isAdmin?: boolean;
  onResolve?: (decision: { type: 'split' | 'full_refund'; splitPercentage: number; reason: string }) => void;
}

// ============ Component ============

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

export default function DisputeResolution({
  disputeId,
  transactionRef,
  amount,
  buyerName,
  sellerName,
  currentStep,
  isAdmin = false,
  onResolve,
}: DisputeResolutionProps) {
  const [activeStep, setActiveStep] = useState<DisputeStep>(currentStep);
  const [evidence, setEvidence] = useState<Evidence[]>([
    { id: '1', party: 'buyer', fileName: 'contrat_achat.pdf', uploadedAt: '2025-12-14T10:00:00', type: 'Contrat' },
    { id: '2', party: 'seller', fileName: 'rapport_inspection.jpg', uploadedAt: '2025-12-14T12:00:00', type: 'Photo' },
    { id: '3', party: 'buyer', fileName: 'releve_bancaire.pdf', uploadedAt: '2025-12-14T14:00:00', type: 'Financier' },
  ]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'system', content: 'Litige ouvert automatiquement. Les fonds sont bloqués en escrow.', timestamp: '2025-12-14T09:00:00' },
    { id: '2', sender: 'buyer', content: 'Je conteste l\'état du bien. Les photos ne correspondent pas à la description.', timestamp: '2025-12-14T09:15:00' },
    { id: '3', sender: 'seller', content: 'Le bien était en bon état lors de la visite. Les photos sont anciennes.', timestamp: '2025-12-14T09:30:00' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [splitPercentage, setSplitPercentage] = useState(50);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionType, setDecisionType] = useState<'split' | 'full_refund'>('split');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: String(prev.length + 1),
      sender: isAdmin ? 'admin' : 'buyer',
      content: newMessage,
      timestamp: new Date().toISOString(),
    }]);
    setNewMessage('');
  };

  const handleResolve = () => {
    onResolve?.({
      type: decisionType,
      splitPercentage: decisionType === 'split' ? splitPercentage : 0,
      reason: decisionReason,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Résolution de Litige</h3>
            <p className="text-xs text-gray-500">
              Réf: {disputeId} · Transaction: {transactionRef} · Montant: {formatXOF(amount)}
            </p>
          </div>
        </div>
        <Badge className="bg-red-50 text-red-700 border border-red-200">
          Étape {currentStep}/6
        </Badge>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#003087] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Acheteur</p>
            <p className="text-sm font-medium text-gray-900">{buyerName}</p>
          </div>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Vendeur</p>
            <p className="text-sm font-medium text-gray-900">{sellerName}</p>
          </div>
        </div>
      </div>

      {/* Timeline Steps */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Protocole d&apos;arbitrage — 6 étapes</h4>
          <div className="space-y-2">
            {DISPUTE_STEPS.map((stepInfo, index) => {
              const StepIcon = stepInfo.icon;
              const isActive = stepInfo.step === activeStep;
              const isCompleted = stepInfo.step < activeStep;
              const isPending = stepInfo.step > activeStep;

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
                    isCompleted ? 'bg-green-100' :
                    isActive ? 'bg-[#003087]' :
                    'bg-gray-100'
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <StepIcon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-gray-400')} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        'text-sm font-medium',
                        isActive ? 'text-[#003087]' :
                        isCompleted ? 'text-green-700' :
                        'text-gray-500'
                      )}>
                        {stepInfo.titleFr}
                      </p>
                      {stepInfo.duration && (
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {stepInfo.duration}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <p className="text-xs text-gray-500 mt-0.5">{stepInfo.descriptionFr}</p>
                    )}
                  </div>
                  <ChevronRight className={cn('w-4 h-4 shrink-0', isActive ? 'text-[#003087]' : 'text-gray-300')} />
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {activeStep === 2 && (
          <motion.div key="evidence" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#003087]" /> Preuves soumises
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {doc.party === 'buyer' ? 'Acheteur' : 'Vendeur'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Ajouter une pièce justificative
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeStep === 3 && (
          <motion.div key="mediation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-[#00A651]" /> Tentative de médiation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Fenêtre de médiation de 48h. Les deux parties sont invitées à trouver un accord.
                </div>
                {/* Messages */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
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

        {(activeStep === 4 || activeStep === 5) && isAdmin && (
          <motion.div key="admin-decision" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="border-[#003087]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#003087]" /> Panneau de décision admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Decision Type */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase">Type de décision</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      className={cn(
                        'p-3 rounded-xl border text-sm font-medium transition-all',
                        decisionType === 'split'
                          ? 'border-[#003087] bg-[#003087]/5 text-[#003087]'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      )}
                      onClick={() => setDecisionType('split')}
                    >
                      <Scale className="w-5 h-5 mx-auto mb-1" />
                      Partage des fonds
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
                      Remboursement intégral
                    </button>
                  </div>
                </div>

                {/* Split Slider */}
                {decisionType === 'split' && (
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
                    {/* Visual Bar */}
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
                  className="w-full bg-[#003087] hover:bg-[#002a70]"
                  onClick={handleResolve}
                  disabled={!decisionReason}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  {decisionType === 'split' ? 'Partager les fonds' : 'Rembourser intégralement'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeStep === 6 && (
          <motion.div key="appeal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <Timer className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-amber-800">Fenêtre d&apos;appel active</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Les parties ont 72h pour faire appel de la décision. Au-delà, la décision sera exécutée automatiquement.
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Button variant="outline" size="sm" className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100">
                      Faire appel
                    </Button>
                    <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700">
                      Accepter la décision
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
