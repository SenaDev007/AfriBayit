'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

type TransactionType = 'deposit' | 'withdrawal' | 'escrow_fund' | 'escrow_release' | 'commission' | 'subscription';

const walletData = {
  balance: 2450000,
  escrowHeld: 15000000,
  pendingPayout: 850000,
  afriPoints: 3450,
};

const transactions: {
  id: string;
  type: TransactionType;
  label: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  reference: string;
}[] = [
  { id: 'wtxn-01', type: 'deposit', label: 'Dépôt Mobile Money', amount: 500000, date: '2025-03-12', status: 'completed', reference: 'MM-20250312-001' },
  { id: 'wtxn-02', type: 'escrow_fund', label: 'Financement Escrow — Villa Cocotiers', amount: -85000000, date: '2025-03-10', status: 'completed', reference: 'ESC-20250310-042' },
  { id: 'wtxn-03', type: 'commission', label: 'Commission vente — Terrain Akodessewa', amount: 150000, date: '2025-03-08', status: 'completed', reference: 'COM-20250308-018' },
  { id: 'wtxn-04', type: 'escrow_release', label: 'Libération Escrow — Studio Fidjrossè', amount: 120000, date: '2025-03-05', status: 'completed', reference: 'REL-20250305-009' },
  { id: 'wtxn-05', type: 'subscription', label: 'Abonnement HELM GROW — Mars', amount: -35000, date: '2025-03-01', status: 'completed', reference: 'SUB-20250301-003' },
  { id: 'wtxn-06', type: 'withdrawal', label: 'Retrait Mobile Money', amount: -200000, date: '2025-02-28', status: 'completed', reference: 'WD-20250228-012' },
  { id: 'wtxn-07', type: 'deposit', label: 'Dépôt Stripe', amount: 1200000, date: '2025-02-25', status: 'completed', reference: 'STR-20250225-007' },
  { id: 'wtxn-08', type: 'commission', label: 'Commission location — Appart Plateau', amount: 35000, date: '2025-02-20', status: 'pending', reference: 'COM-20250220-031' },
  { id: 'wtxn-09', type: 'escrow_fund', label: 'Financement Escrow — Penthouse Cocody', amount: -120000000, date: '2025-02-15', status: 'pending', reference: 'ESC-20250215-055' },
  { id: 'wtxn-10', type: 'withdrawal', label: 'Retrait Orange Money', amount: -500000, date: '2025-02-10', status: 'failed', reference: 'WD-20250210-008' },
];

const filterTypes: { key: TransactionType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'Tous', icon: '📋' },
  { key: 'deposit', label: 'Dépôts', icon: '📥' },
  { key: 'withdrawal', label: 'Retraits', icon: '📤' },
  { key: 'escrow_fund', label: 'Escrow (financement)', icon: '🔒' },
  { key: 'escrow_release', label: 'Escrow (libération)', icon: '🔓' },
  { key: 'commission', label: 'Commissions', icon: '💰' },
  { key: 'subscription', label: 'Abonnements', icon: '🔄' },
];

const afriPointsRedemption = [
  { points: 500, reward: '500 FCFA de crédit wallet', available: true },
  { points: 1000, reward: '1 000 FCFA de crédit wallet', available: true },
  { points: 2500, reward: 'Réduction 10% sur abonnement', available: true },
  { points: 5000, reward: 'Visite gratuite GeoTrust', available: false },
];

const currencyRates = {
  XOF: 1,
  EUR: 0.00152,
  USD: 0.00165,
};

function getTypeColor(type: TransactionType): string {
  switch (type) {
    case 'deposit': return '#00A651';
    case 'withdrawal': return '#D93025';
    case 'escrow_fund': return '#009CDE';
    case 'escrow_release': return '#003087';
    case 'commission': return '#D4AF37';
    case 'subscription': return '#6b7280';
    default: return '#6b7280';
  }
}

function getTypeIcon(type: TransactionType): string {
  switch (type) {
    case 'deposit': return '📥';
    case 'withdrawal': return '📤';
    case 'escrow_fund': return '🔒';
    case 'escrow_release': return '🔓';
    case 'commission': return '💰';
    case 'subscription': return '🔄';
    default: return '📋';
  }
}

function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.abs(amount)) + ' FCFA';
}

function convertCurrency(amount: number, currency: string): string {
  const rate = currencyRates[currency as keyof typeof currencyRates] || 1;
  const converted = amount * rate;
  if (currency === 'XOF') return formatFCFA(amount);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(converted);
}

type TabKey = 'overview' | 'history' | 'add' | 'withdraw' | 'points';

export default function WalletModule({ onNavigate }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'XOF' | 'EUR' | 'USD'>('XOF');
  const [addAmount, setAddAmount] = useState('');
  const [addProvider, setAddProvider] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawProvider, setWithdrawProvider] = useState<string | null>(null);

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter(t => t.type === filterType);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Aperçu', icon: '💳' },
    { key: 'history', label: 'Historique', icon: '📋' },
    { key: 'add', label: 'Ajouter fonds', icon: '📥' },
    { key: 'withdraw', label: 'Retirer', icon: '📤' },
    { key: 'points', label: 'AfriPoints', icon: '⭐' },
  ];

  const paymentProviders = [
    { key: 'mtn', name: 'MTN Mobile Money', icon: '📱', color: '#FFC300' },
    { key: 'orange', name: 'Orange Money', icon: '🍊', color: '#FF6600' },
    { key: 'moov', name: 'Moov Money', icon: '🔵', color: '#0066CC' },
    { key: 'fedapay', name: 'FedaPay', icon: '💳', color: '#003087' },
    { key: 'stripe', name: 'Stripe', icon: '💜', color: '#635bff' },
  ];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            💳 Portefeuille AfriBayit
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Mon <span className="text-[#D4AF37]">Portefeuille</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Gérez vos fonds, escrows et AfriPoints en toute sécurité
          </p>
        </motion.div>

        {/* Currency Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          {(['XOF', 'EUR', 'USD'] as const).map(c => (
            <button
              key={c}
              onClick={() => setSelectedCurrency(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCurrency === c ? 'bg-[#003087] text-white' : 'bg-white text-gray-500 border hover:bg-gray-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ===== OVERVIEW ===== */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {/* Balance Card */}
              <div className="bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-3xl p-6 text-white">
                <p className="text-sm text-white/60 mb-1">Solde disponible</p>
                <p className="font-mono text-3xl sm:text-4xl font-bold mb-4">
                  {convertCurrency(walletData.balance, selectedCurrency)}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <p className="text-[10px] text-white/60">Escrow bloqué</p>
                    <p className="font-mono text-sm font-bold">{convertCurrency(walletData.escrowHeld, selectedCurrency)}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <p className="text-[10px] text-white/60">Paiement en attente</p>
                    <p className="font-mono text-sm font-bold">{convertCurrency(walletData.pendingPayout, selectedCurrency)}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <p className="text-[10px] text-white/60">AfriPoints</p>
                    <p className="font-mono text-sm font-bold text-[#D4AF37]">⭐ {walletData.afriPoints}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Ajouter fonds', icon: '📥', action: () => setActiveTab('add') },
                  { label: 'Retirer', icon: '📤', action: () => setActiveTab('withdraw') },
                  { label: 'Historique', icon: '📋', action: () => setActiveTab('history') },
                  { label: 'AfriPoints', icon: '⭐', action: () => setActiveTab('points') },
                ].map(btn => (
                  <motion.button
                    key={btn.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={btn.action}
                    className="bg-white rounded-2xl p-4 shadow-sm border text-center hover:border-[#003087]/20 transition-all"
                  >
                    <span className="text-2xl block mb-1">{btn.icon}</span>
                    <p className="text-xs font-semibold text-[#2C2E2F]">{btn.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F]">Transactions récentes</h3>
                  <button onClick={() => setActiveTab('history')} className="text-xs text-[#003087] font-semibold">Voir tout →</button>
                </div>
                <div className="space-y-3">
                  {transactions.slice(0, 4).map(txn => (
                    <div key={txn.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: `${getTypeColor(txn.type)}10` }}>
                        {getTypeIcon(txn.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C2E2F] truncate">{txn.label}</p>
                        <p className="text-xs text-gray-400">{txn.date}</p>
                      </div>
                      <p className={`font-mono text-sm font-bold shrink-0 ${txn.amount > 0 ? 'text-[#00A651]' : 'text-[#D93025]'}`}>
                        {txn.amount > 0 ? '+' : '-'}{formatFCFA(txn.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== HISTORY ===== */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {/* Filter Chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                {filterTypes.map(ft => (
                  <button
                    key={ft.key}
                    onClick={() => setFilterType(ft.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      filterType === ft.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                    }`}
                  >
                    {ft.icon} {ft.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {filteredTransactions.map((txn, i) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, ease: easeOut }}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: `${getTypeColor(txn.type)}10` }}>
                        {getTypeIcon(txn.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2C2E2F] truncate">{txn.label}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{txn.reference} · {txn.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-mono text-sm font-bold ${txn.amount > 0 ? 'text-[#00A651]' : 'text-[#D93025]'}`}>
                          {txn.amount > 0 ? '+' : ''}{formatFCFA(txn.amount)}
                        </p>
                        <span className={`text-[10px] font-semibold ${
                          txn.status === 'completed' ? 'text-[#00A651]' : txn.status === 'pending' ? 'text-[#D4AF37]' : 'text-[#D93025]'
                        }`}>
                          {txn.status === 'completed' ? '✅ Validé' : txn.status === 'pending' ? '⏳ En attente' : '❌ Échoué'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== ADD FUNDS ===== */}
          {activeTab === 'add' && (
            <motion.div key="add" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-lg mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Ajouter des fonds</h3>
                <div className="mb-5">
                  <label className="text-xs text-gray-500 mb-1 block">Montant (FCFA)</label>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={e => setAddAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-lg font-mono font-bold focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20"
                  />
                  <div className="flex gap-2 mt-2">
                    {[50000, 100000, 250000, 500000].map(amt => (
                      <button key={amt} onClick={() => setAddAmount(String(amt))} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                        {new Intl.NumberFormat('fr-FR').format(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="text-xs text-gray-500 mb-2 block">Moyen de paiement</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {paymentProviders.map(p => (
                    <motion.button
                      key={p.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setAddProvider(p.key)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        addProvider === p.key ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl block mb-1">{p.icon}</span>
                      <p className="text-[10px] font-semibold text-[#2C2E2F]">{p.name}</p>
                    </motion.button>
                  ))}
                </div>

                <button
                  disabled={!addAmount || !addProvider}
                  className="w-full py-3 bg-[#00A651] text-white rounded-full font-semibold text-sm hover:bg-[#008f46] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Déposer {addAmount ? formatFCFA(Number(addAmount)) : ''}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== WITHDRAW ===== */}
          {activeTab === 'withdraw' && (
            <motion.div key="withdraw" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-lg mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Retirer des fonds</h3>
                <p className="text-xs text-gray-500 mb-4">Solde disponible : <span className="font-mono font-bold text-[#00A651]">{formatFCFA(walletData.balance)}</span></p>

                <div className="mb-5">
                  <label className="text-xs text-gray-500 mb-1 block">Montant du retrait (FCFA)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-lg font-mono font-bold focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20"
                  />
                  <div className="flex gap-2 mt-2">
                    {[100000, 250000, 500000].map(amt => (
                      <button key={amt} onClick={() => setWithdrawAmount(String(amt))} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                        {new Intl.NumberFormat('fr-FR').format(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="text-xs text-gray-500 mb-2 block">Destination Mobile Money</label>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {paymentProviders.filter(p => ['mtn', 'orange', 'moov'].includes(p.key)).map(p => (
                    <motion.button
                      key={p.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setWithdrawProvider(p.key)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${
                        withdrawProvider === p.key ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-xl block mb-1">{p.icon}</span>
                      <p className="text-[10px] font-semibold text-[#2C2E2F]">{p.name}</p>
                    </motion.button>
                  ))}
                </div>

                <button
                  disabled={!withdrawAmount || !withdrawProvider || Number(withdrawAmount) > walletData.balance}
                  className="w-full py-3 bg-[#D93025] text-white rounded-full font-semibold text-sm hover:bg-[#b3261e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Retirer {withdrawAmount ? formatFCFA(Number(withdrawAmount)) : ''}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== AFRIPOINTS ===== */}
          {activeTab === 'points' && (
            <motion.div key="points" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {/* Points Balance */}
              <div className="bg-gradient-to-br from-[#D4AF37] to-[#a08820] rounded-3xl p-6 text-white text-center">
                <p className="text-sm text-white/60 mb-1">Vos AfriPoints</p>
                <p className="font-mono text-4xl font-bold mb-2">⭐ {walletData.afriPoints}</p>
                <p className="text-xs text-white/70">1 point = 1 FCFA de crédit</p>
              </div>

              {/* Redemption Options */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Options d&apos;échange</h3>
                <div className="space-y-3">
                  {afriPointsRedemption.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, ease: easeOut }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center font-mono text-sm font-bold text-[#D4AF37]">
                          {item.points}
                        </div>
                        <p className="text-sm text-[#2C2E2F] font-medium">{item.reward}</p>
                      </div>
                      <button
                        disabled={!item.available || walletData.afriPoints < item.points}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          item.available && walletData.afriPoints >= item.points
                            ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Échanger
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
