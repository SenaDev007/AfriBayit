'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Bot, Calendar, Check, ClipboardList, Coins, FileText, Folder, Home, PenTool, ScrollText } from 'lucide-react';


import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tableau de bord notaire — AfriBayit",
  description: "Gérez vos actes et signatures notariales sur AfriBayit.",
  keywords: ["dashboard notaire", "actes", "signatures"],
  openGraph: {
    title: "Tableau de bord notaire — AfriBayit",
    description: "Gérez vos actes et signatures notariales sur AfriBayit.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tableau de bord notaire — AfriBayit",
    description: "Gérez vos actes et signatures notariales sur AfriBayit.",
  },
};

const easeOut = [0.16, 1, 0.3, 1] as const;

//  Types 
interface Transaction {
  id: string;
  propertyTitle: string;
  buyer: string;
  seller: string;
  amount: number;
  status: string;
  country: string;
  createdAt: string;
}

interface DeedDraft {
  id: string;
  title: string;
  templateId: string;
  country: string;
  deedType: string;
  sections: { id: string; title: string; content: string }[];
  status: string;
  generatedAt: string;
}

interface SignatureItem {
  id: string;
  documentTitle: string;
  signers: { name: string; role: string; status: string }[];
  status: string;
  createdAt: string;
}

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'visit' | 'signing' | 'consultation';
  client: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

//  Demo Data 
const DEMO_TRANSACTIONS: Transaction[] = [
  { id: 'txn-001', propertyTitle: 'Villa 4ch Cotonou', buyer: 'Adama Diallo', seller: 'Kofi Mensah', amount: 35000000, status: 'NOTARY_ASSIGNED', country: 'BJ', createdAt: '2025-01-15' },
  { id: 'txn-002', propertyTitle: 'Terrain Akpakpa', buyer: 'Fatou Ouédraogo', seller: 'Yao Koffi', amount: 12000000, status: 'NOTARY_IN_PROGRESS', country: 'BJ', createdAt: '2025-01-10' },
  { id: 'txn-003', propertyTitle: 'Appartement Abidjan', buyer: 'Jean Brou', seller: 'Marie Koné', amount: 28000000, status: 'DEED_SIGNED', country: 'CI', createdAt: '2025-01-08' },
  { id: 'txn-004', propertyTitle: 'Commerce Ouaga', buyer: 'Pascal Zoungrana', seller: 'Aline Traoré', amount: 45000000, status: 'NOTARY_ASSIGNED', country: 'BF', createdAt: '2025-01-05' },
  { id: 'txn-005', propertyTitle: 'Villa Lomé', buyer: 'Essivi Agbo', seller: 'Kodjo Amegee', amount: 22000000, status: 'FUNDED', country: 'TG', createdAt: '2025-01-03' },
];

const DEMO_DEEDS: DeedDraft[] = [
  { id: 'deed-001', title: 'Acte de Vente (TF)', templateId: 'BJ-ACTE-VENTE-TF', country: 'BJ', deedType: 'acte_vente_tf', sections: [{ id: 's1', title: 'En-tête', content: 'RÉPUBLIQUE DU BÉNIN...' }, { id: 's2', title: 'Parties', content: 'LE VENDEUR : Kofi Mensah...' }], status: 'draft', generatedAt: '2025-01-15' },
  { id: 'deed-002', title: 'Contrat de Bail', templateId: 'BJ-BAIL', country: 'BJ', deedType: 'bail', sections: [{ id: 's1', title: 'En-tête', content: 'CONTRAT DE BAIL...' }], status: 'review', generatedAt: '2025-01-12' },
  { id: 'deed-003', title: 'Acte de Vente (ACD)', templateId: 'CI-ACTE-VENTE-ACD', country: 'CI', deedType: 'acte_vente_acd', sections: [{ id: 's1', title: 'En-tête', content: 'RÉPUBLIQUE DE CÔTE D\'IVOIRE...' }], status: 'pending_signature', generatedAt: '2025-01-10' },
];

const DEMO_SIGNATURES: SignatureItem[] = [
  { id: 'sig-001', documentTitle: 'Acte de Vente - Villa Cotonou', signers: [{ name: 'Kofi Mensah', role: 'Vendeur', status: 'signed' }, { name: 'Adama Diallo', role: 'Acquéreur', status: 'pending' }, { name: 'Me. Ako', role: 'Notaire', status: 'pending' }], status: 'in_progress', createdAt: '2025-01-15' },
  { id: 'sig-002', documentTitle: 'Contrat de Bail - Appartement', signers: [{ name: 'Yao Koffi', role: 'Bailleur', status: 'signed' }, { name: 'Fatou Ouédraogo', role: 'Preneur', status: 'signed' }], status: 'completed', createdAt: '2025-01-10' },
];

const DEMO_APPOINTMENTS: Appointment[] = [
  { id: 'apt-001', title: 'Signature acte de vente', date: '2025-02-05', time: '10:00', type: 'signing', client: 'Adama Diallo', status: 'upcoming' },
  { id: 'apt-002', title: 'Visite terrain Akpakpa', date: '2025-02-06', time: '14:00', type: 'visit', client: 'Fatou Ouédraogo', status: 'upcoming' },
  { id: 'apt-003', title: 'Consultation succession', date: '2025-02-07', time: '09:00', type: 'consultation', client: 'Jean Brou', status: 'upcoming' },
];

const DEMO_CONVENTIONS = [
  { id: 'conv-001', transactionId: 'txn-001', type: 'Convention de séquestre', status: 'signed', signers: 2, signedCount: 2 },
  { id: 'conv-002', transactionId: 'txn-002', type: 'Convention notariale', status: 'in_progress', signers: 3, signedCount: 1 },
  { id: 'conv-003', transactionId: 'txn-004', type: 'Convention de mandat', status: 'pending', signers: 2, signedCount: 0 },
];

const TABS = [
  { key: 'dashboard', label: 'Tableau de bord', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'deeds', label: 'Actes', icon: <ScrollText className="w-4 h-4" /> },
  { key: 'signatures', label: 'Signatures', icon: <PenTool className="w-4 h-4" /> },
  { key: 'conventions', label: 'Conventions', icon: <FileText className="w-4 h-4" /> },
  { key: 'calendar', label: 'Calendrier', icon: <Calendar className="w-4 h-4" /> },
  { key: 'documents', label: 'Documents', icon: <Folder className="w-4 h-4" /> },
];

type TabKey = typeof TABS[number]['key'];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    NOTARY_ASSIGNED: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    NOTARY_IN_PROGRESS: 'bg-[#003087]/10 text-[#003087]',
    DEED_SIGNED: 'bg-[#00A651]/10 text-[#00A651]',
    FUNDED: 'bg-[#009CDE]/10 text-[#009CDE]',
    draft: 'bg-gray-100 text-gray-600',
    review: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    pending_signature: 'bg-[#003087]/10 text-[#003087]',
    completed: 'bg-[#00A651]/10 text-[#00A651]',
    in_progress: 'bg-[#003087]/10 text-[#003087]',
    signed: 'bg-[#00A651]/10 text-[#00A651]',
    pending: 'bg-gray-100 text-gray-600',
    upcoming: 'bg-[#009CDE]/10 text-[#009CDE]',
  };
  return colors[status] || 'bg-gray-100 text-gray-600';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    NOTARY_ASSIGNED: 'Notaire assigné',
    NOTARY_IN_PROGRESS: 'En cours',
    DEED_SIGNED: 'Acte signé',
    FUNDED: 'Financé',
    draft: 'Brouillon',
    review: 'En révision',
    pending_signature: 'En attente signature',
    completed: 'Complété',
    in_progress: 'En cours',
    signed: 'Signé',
    pending: 'En attente',
    upcoming: 'À venir',
  };
  return labels[status] || status;
}

//  Main Component 
export default function NotaryDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [generating, setGenerating] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const totalRevenue = DEMO_TRANSACTIONS.reduce((sum, t) => sum + t.amount * 0.03, 0);
  const activeTransactions = DEMO_TRANSACTIONS.filter(t => ['NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS'].includes(t.status)).length;
  const pendingDeeds = DEMO_DEEDS.filter(d => ['draft', 'review'].includes(d.status)).length;
  const pendingSignatures = DEMO_SIGNATURES.filter(s => s.status === 'in_progress').length;

  const handleGenerateDeed = async () => {
    if (!selectedTransaction || !selectedTemplate) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/notary/deeds/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTransaction,
          templateId: selectedTemplate,
          data: { country: 'BJ' },
        }),
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Acte généré: ${result.deed.title} (${result.deed.id})`);
      }
    } catch {
      alert('Acte généré (demo)');
    }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50/30 pt-20 pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F]">Espace Notaire</h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos actes, signatures et rendez-vous</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-[#003087] text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-100 hover:border-[#003087]/30 hover:text-[#003087]'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/*  DASHBOARD TAB  */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Revenus notariaux', value: formatPrice(totalRevenue), icon: <Coins className="w-4 h-4" />, color: '#D4AF37' },
                  { label: 'Transactions actives', value: String(activeTransactions), icon: <ClipboardList className="w-4 h-4" />, color: '#003087' },
                  { label: 'Actes en attente', value: String(pendingDeeds), icon: <ScrollText className="w-4 h-4" />, color: '#009CDE' },
                  { label: 'Signatures en attente', value: String(pendingSignatures), icon: <PenTool className="w-4 h-4" />, color: '#00A651' },
                ].map((kpi, i) => (
                  <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: easeOut }} className="bg-white rounded-2xl p-4 shadow-sm border">
                    <div className="text-xl">{kpi.icon}</div>
                    <p className="font-mono text-lg font-bold text-[#2C2E2F] mt-2">{kpi.value}</p>
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Active Transactions */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-6">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Transactions actives</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {DEMO_TRANSACTIONS.filter(t => ['NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'FUNDED'].includes(t.status)).map(txn => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C2E2F] truncate">{txn.propertyTitle}</p>
                        <p className="text-xs text-gray-500">{txn.buyer} → {txn.seller}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-sm font-bold text-[#D4AF37]">{formatPrice(txn.amount)}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(txn.status)}`}>
                          {getStatusLabel(txn.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Deed Reviews */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Actes en révision</h3>
                <div className="space-y-3">
                  {DEMO_DEEDS.filter(d => d.status === 'review').map(deed => (
                    <div key={deed.id} className="flex items-center justify-between p-3 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">{deed.title}</p>
                        <p className="text-xs text-gray-500">{deed.country} · {deed.sections.length} sections</p>
                      </div>
                      <button className="px-4 py-2 bg-[#D4AF37] text-white text-xs font-semibold rounded-full hover:bg-[#c9a030] transition-colors">
                        Réviser
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/*  DEEDS TAB  */}
          {activeTab === 'deeds' && (
            <motion.div key="deeds" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Deed Generator */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-6">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Rédaction IA d&apos;actes</h3>
                <p className="text-sm text-gray-500 mb-4">Sélectionnez une transaction et un modèle d&apos;acte pour générer un brouillon automatique.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Transaction</label>
                    <select
                      value={selectedTransaction || ''}
                      onChange={e => setSelectedTransaction(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#003087] focus:outline-none"
                    >
                      <option value="">-- Choisir --</option>
                      {DEMO_TRANSACTIONS.map(t => (
                        <option key={t.id} value={t.id}>{t.propertyTitle} ({formatPrice(t.amount)})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Modèle d&apos;acte</label>
                    <select
                      value={selectedTemplate}
                      onChange={e => setSelectedTemplate(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#003087] focus:outline-none"
                    >
                      <option value="">-- Choisir --</option>
                      <optgroup label="Bénin">
                        <option value="BJ-ACTE-VENTE-TF">Acte de Vente (TF)</option>
                        <option value="BJ-BAIL">Contrat de Bail</option>
                        <option value="BJ-DONATION">Acte de Donation</option>
                      </optgroup>
                      <optgroup label="Côte d'Ivoire">
                        <option value="CI-ACTE-VENTE-ACD">Acte de Vente (ACD)</option>
                        <option value="CI-BAIL-COMMERCIAL">Bail Commercial</option>
                      </optgroup>
                      <optgroup label="Burkina Faso">
                        <option value="BF-ACTE-VENTE-APFR">Acte de Vente (APFR)</option>
                        <option value="BF-BAIL">Contrat de Bail</option>
                      </optgroup>
                      <optgroup label="Togo">
                        <option value="TG-ACTE-VENTE-CFD">Acte de Vente (CFD)</option>
                        <option value="TG-BAIL">Contrat de Bail</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGenerateDeed}
                  disabled={!selectedTransaction || !selectedTemplate || generating}
                  className="px-6 py-3 bg-[#003087] text-white rounded-full font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <><span className="animate-spin">⏳</span> Génération en cours...</>
                  ) : (
                    <><span><Bot className="w-4 h-4" /></span> Générer l&apos;acte</>
                  )}
                </button>
              </div>

              {/* Existing Deeds */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Actes récents</h3>
                <div className="space-y-3">
                  {DEMO_DEEDS.map(deed => (
                    <div key={deed.id} className="p-4 rounded-2xl border border-gray-100 hover:border-[#003087]/20 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-[#2C2E2F]">{deed.title}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(deed.status)}`}>
                          {getStatusLabel(deed.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{deed.country} · {deed.sections.length} sections · Généré le {deed.generatedAt}</p>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-semibold text-[#003087] bg-[#003087]/5 rounded-full hover:bg-[#003087]/10 transition-colors">
                          Voir
                        </button>
                        <button className="px-3 py-1.5 text-xs font-semibold text-[#00A651] bg-[#00A651]/5 rounded-full hover:bg-[#00A651]/10 transition-colors">
                          Modifier
                        </button>
                        <button className="px-3 py-1.5 text-xs font-semibold text-[#D4AF37] bg-[#D4AF37]/5 rounded-full hover:bg-[#D4AF37]/10 transition-colors">
                          Envoyer signature
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/*  SIGNATURES TAB  */}
          {activeTab === 'signatures' && (
            <motion.div key="signatures" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="space-y-4">
                {DEMO_SIGNATURES.map(sig => {
                  const signed = sig.signers.filter(s => s.status === 'signed').length;
                  const total = sig.signers.length;
                  return (
                    <div key={sig.id} className="bg-white rounded-3xl p-6 shadow-sm border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-[#2C2E2F]">{sig.documentTitle}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(sig.status)}`}>
                          {getStatusLabel(sig.status)}
                        </span>
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progression signature</span>
                          <span className="font-semibold text-[#003087]">{signed}/{total}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#003087] to-[#009CDE] rounded-full" style={{ width: `${(signed / total) * 100}%` }} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {sig.signers.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${s.status === 'signed' ? 'bg-[#00A651]' : 'bg-gray-300'}`}>
                              {s.status === 'signed' ? <Check className="w-4 h-4" /> : (i + 1)}
                            </div>
                            <span className="text-sm text-[#2C2E2F]">{s.name}</span>
                            <span className="text-xs text-gray-400 ml-auto">{s.role}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(s.status)}`}>
                              {getStatusLabel(s.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/*  CONVENTIONS TAB  */}
          {activeTab === 'conventions' && (
            <motion.div key="conventions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="space-y-4">
                {DEMO_CONVENTIONS.map(conv => {
                  const progress = conv.signers > 0 ? (conv.signedCount / conv.signers) * 100 : 0;
                  return (
                    <div key={conv.id} className="bg-white rounded-3xl p-6 shadow-sm border">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-[#2C2E2F]">{conv.type}</h4>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(conv.status)}`}>
                          {getStatusLabel(conv.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-3">Transaction: {conv.transactionId}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${progress === 100 ? 'bg-[#00A651]' : 'bg-[#003087]'}`} style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-[#003087]">{conv.signedCount}/{conv.signers}</span>
                      </div>
                    </div>
                  );
                })}

                <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-3xl text-sm font-semibold text-gray-400 hover:text-[#003087] hover:border-[#003087]/30 transition-colors">
                  + Envoyer une nouvelle convention
                </button>
              </div>
            </motion.div>
          )}

          {/*  CALENDAR TAB  */}
          {activeTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Rendez-vous à venir</h3>
                  <button className="px-4 py-2 bg-[#003087] text-white text-xs font-semibold rounded-full hover:bg-[#0047b3] transition-colors">
                    + Nouveau RDV
                  </button>
                </div>
                <div className="space-y-3">
                  {DEMO_APPOINTMENTS.map(apt => {
                    const typeIcons: Record<string, React.ReactNode> = { visit: <Home className="w-4 h-4" />, signing: <PenTool className="w-4 h-4" />, consultation: null };
                    const typeLabels: Record<string, string> = { visit: 'Visite', signing: 'Signature', consultation: 'Consultation' };
                    return (
                      <div key={apt.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-12 h-12 rounded-xl bg-[#003087]/10 flex items-center justify-center text-xl shrink-0">
                          {typeIcons[apt.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C2E2F]">{apt.title}</p>
                          <p className="text-xs text-gray-500">{apt.client} · {typeLabels[apt.type]}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-[#003087]">{apt.date}</p>
                          <p className="text-xs text-gray-400">{apt.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/*  DOCUMENTS TAB  */}
          {activeTab === 'documents' && (
            <motion.div key="documents" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Archives documentaires</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:border-[#003087] focus:outline-none w-48"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Acte_Vente_Villa_Cotonou.pdf', type: 'PDF', size: '2.4 MB', date: '2025-01-15' },
                    { name: 'Bail_Appartement_Abidjan.pdf', type: 'PDF', size: '1.8 MB', date: '2025-01-12' },
                    { name: 'Convention_Séquestre_TXN001.pdf', type: 'PDF', size: '540 KB', date: '2025-01-10' },
                    { name: 'Rapport_Géomètre_Akpakpa.pdf', type: 'PDF', size: '3.1 MB', date: '2025-01-08' },
                    { name: 'Certificat_Propriété_ANDF.pdf', type: 'PDF', size: '320 KB', date: '2025-01-05' },
                  ].map((doc, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-lg bg-[#D93025]/10 flex items-center justify-center text-sm font-bold text-[#D93025]">
                        PDF
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2C2E2F] truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">{doc.size} · {doc.date}</p>
                      </div>
                      <button className="px-3 py-1.5 text-xs font-semibold text-[#003087] bg-[#003087]/5 rounded-full hover:bg-[#003087]/10 transition-colors">
                        Télécharger
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
