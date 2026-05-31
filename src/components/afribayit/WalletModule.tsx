'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useWallet, useCreateWalletTransaction, type WalletTransaction } from '@/hooks/useWallet';
import { useCountry } from '@/contexts/CountryContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ClipboardList, Download, Upload, Lock, Unlock, Coins, RefreshCw, CreditCard, Star, Smartphone, Mail, MessageCircle, CheckCircle, Hourglass, XCircle } from 'lucide-react';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

type TransactionType = 'deposit' | 'withdrawal' | 'escrow_fund' | 'escrow_release' | 'commission' | 'subscription';

const filterTypes: { key: TransactionType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Tous', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: 'deposit', label: 'Dépôts', icon: <Download className="w-3.5 h-3.5" /> },
  { key: 'withdrawal', label: 'Retraits', icon: <Upload className="w-3.5 h-3.5" /> },
  { key: 'escrow_fund', label: 'Escrow (financement)', icon: <Lock className="w-3.5 h-3.5" /> },
  { key: 'escrow_release', label: 'Escrow (libération)', icon: <Unlock className="w-3.5 h-3.5" /> },
  { key: 'commission', label: 'Commissions', icon: <Coins className="w-3.5 h-3.5" /> },
  { key: 'subscription', label: 'Abonnements', icon: <RefreshCw className="w-3.5 h-3.5" /> },
];

const afriPointsRedemption = [
  { points: 500, reward: '500 FCFA de crédit wallet', type: 'subscription', available: true },
  { points: 1000, reward: '1 000 FCFA de crédit wallet', type: 'subscription', available: true },
  { points: 2500, reward: 'Réduction 10% sur abonnement', type: 'subscription', available: true },
  { points: 5000, reward: 'Visite gratuite GeoTrust', type: 'subscription', available: false },
];

const currencyRates = {
  XOF: 1,
  EUR: 0.00152,
  USD: 0.00165,
};

const paymentProviders = [
  { key: 'mtn', name: 'MTN Mobile Money', icon: <Smartphone className="w-5 h-5" style={{ color: '#FFC300' }} />, color: '#FFC300' },
  { key: 'orange', name: 'Orange Money', icon: <Smartphone className="w-5 h-5 text-orange-500" />, color: '#FF6600' },
  { key: 'moov', name: 'Moov Money', icon: <Smartphone className="w-5 h-5 text-blue-600" />, color: '#0066CC' },
  { key: 'fedapay', name: 'FedaPay', icon: <CreditCard className="w-5 h-5" />, color: '#003087' },
  { key: 'stripe', name: 'Stripe', icon: <CreditCard className="w-5 h-5 text-purple-500" />, color: '#635bff' },
];

function getTypeColor(type: string): string {
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

function getTypeIcon(type: string): React.ReactNode {
  switch (type) {
    case 'deposit': return <Download className="w-4 h-4" />;
    case 'withdrawal': return <Upload className="w-4 h-4" />;
    case 'escrow_fund': return <Lock className="w-4 h-4" />;
    case 'escrow_release': return <Unlock className="w-4 h-4" />;
    case 'commission': return <Coins className="w-4 h-4" />;
    case 'subscription': return <RefreshCw className="w-4 h-4" />;
    default: return <ClipboardList className="w-4 h-4" />;
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

  const { user } = useAuthStore();
  const userId = user?.id;
  const { selectedCountry } = useCountry();

  const { data: walletData, isLoading: walletLoading, isError: walletError } = useWallet(userId, selectedCountry);
  const createWalletTx = useCreateWalletTransaction();

  const summary = walletData?.summary;
  const transactions = walletData?.transactions ?? [];

  const balance = summary?.balance ?? 0;
  const escrowHeld = summary?.escrowHeld ?? 0;
  const pendingPayout = summary?.pendingPayout ?? 0;
  const afriPoints = summary?.afriPoints ?? 0;

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter((t: WalletTransaction) => t.type === filterType);

  // Deposit handler
  const handleDeposit = () => {
    if (!addAmount || !addProvider) return;
    createWalletTx.mutate(
      {
        type: 'deposit',
        amount: Number(addAmount),
        providerRef: addProvider,
        metadata: { provider: addProvider, action: 'deposit' },
      },
      {
        onSuccess: () => {
          toast.success('Dépôt effectué', { description: `${formatFCFA(Number(addAmount))} ajoutés à votre portefeuille` });
          setAddAmount('');
          setAddProvider(null);
          setActiveTab('overview');
        },
        onError: (error: Error) => {
          toast.error('Erreur lors du dépôt', { description: error.message });
        },
      }
    );
  };

  // Withdraw handler
  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawProvider || Number(withdrawAmount) > balance) return;
    createWalletTx.mutate(
      {
        type: 'withdrawal',
        amount: -Number(withdrawAmount),
        providerRef: withdrawProvider,
        metadata: { provider: withdrawProvider, action: 'withdrawal' },
      },
      {
        onSuccess: () => {
          toast.success('Retrait initié', { description: `${formatFCFA(Number(withdrawAmount))} en cours de traitement` });
          setWithdrawAmount('');
          setWithdrawProvider(null);
          setActiveTab('overview');
        },
        onError: (error: Error) => {
          toast.error('Erreur lors du retrait', { description: error.message });
        },
      }
    );
  };

  // AfriPoints exchange handler
  const handleExchange = (points: number, type: string) => {
    createWalletTx.mutate(
      {
        type,
        amount: points,
        metadata: { points, action: 'afripoints_redemption' },
      },
      {
        onSuccess: () => {
          toast.success('Échange effectué', { description: `${points} AfriPoints échangés avec succès` });
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de l\'échange', { description: error.message });
        },
      }
    );
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Aperçu', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'history', label: 'Historique', icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'add', label: 'Ajouter fonds', icon: <Download className="w-4 h-4" /> },
    { key: 'withdraw', label: 'Retirer', icon: <Upload className="w-4 h-4" /> },
    { key: 'points', label: 'AfriPoints', icon: <Star className="w-4 h-4 text-yellow-500" /> },
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
            <CreditCard className="w-4 h-4" /> Portefeuille AfriBayit
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
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {walletError && (
          <div className="bg-red-50 rounded-2xl p-4 mb-6 text-center border border-red-200">
            <p className="text-sm text-[#D93025]">Erreur lors du chargement des données du portefeuille. Veuillez réessayer.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ===== OVERVIEW ===== */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {/* Balance Card */}
              {walletLoading ? (
                <div className="bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-3xl p-6">
                  <Skeleton className="h-4 w-32 mb-2 bg-white/20" />
                  <Skeleton className="h-10 w-48 mb-4 bg-white/20" />
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-2xl bg-white/20" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-3xl p-6 text-white">
                  <p className="text-sm text-white/60 mb-1">Solde disponible</p>
                  <p className="font-mono text-3xl sm:text-4xl font-bold mb-4">
                    {convertCurrency(balance, selectedCurrency)}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">Escrow bloqué</p>
                      <p className="font-mono text-sm font-bold">{convertCurrency(escrowHeld, selectedCurrency)}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">Paiement en attente</p>
                      <p className="font-mono text-sm font-bold">{convertCurrency(pendingPayout, selectedCurrency)}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">AfriPoints</p>
                      <p className="font-mono text-sm font-bold text-[#D4AF37] flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {afriPoints}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Ajouter fonds', icon: <Download className="w-5 h-5" />, action: () => setActiveTab('add') },
                  { label: 'Retirer', icon: <Upload className="w-5 h-5" />, action: () => setActiveTab('withdraw') },
                  { label: 'Historique', icon: <ClipboardList className="w-5 h-5" />, action: () => setActiveTab('history') },
                  { label: 'AfriPoints', icon: <Star className="w-5 h-5 text-yellow-500" />, action: () => setActiveTab('points') },
                ].map(btn => (
                  <motion.button
                    key={btn.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={btn.action}
                    className="bg-white rounded-2xl p-4 shadow-sm border text-center hover:border-[#003087]/20 transition-all"
                  >
                    <span className="flex items-center justify-center mb-1 text-gray-600">{btn.icon}</span>
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
                {walletLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Aucune transaction récente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 4).map((txn: WalletTransaction) => (
                      <div key={txn.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${getTypeColor(txn.type)}10` }}>
                          {getTypeIcon(txn.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C2E2F] truncate">{txn.reference || txn.type}</p>
                          <p className="text-xs text-gray-400">{new Date(txn.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <p className={`font-mono text-sm font-bold shrink-0 ${txn.amount > 0 ? 'text-[#00A651]' : 'text-[#D93025]'}`}>
                          {txn.amount > 0 ? '+' : '-'}{formatFCFA(txn.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
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
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      filterType === ft.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                    }`}
                  >
                    {ft.icon} {ft.label}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                {walletLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-20 mb-1 ml-auto" />
                          <Skeleton className="h-3 w-14 ml-auto" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">Aucune transaction trouvée</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredTransactions.map((txn: WalletTransaction, i: number) => (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, ease: easeOut }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${getTypeColor(txn.type)}10` }}>
                          {getTypeIcon(txn.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2C2E2F] truncate">{txn.reference || txn.type}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{txn.reference ?? '—'} · {new Date(txn.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-mono text-sm font-bold ${txn.amount > 0 ? 'text-[#00A651]' : 'text-[#D93025]'}`}>
                            {txn.amount > 0 ? '+' : ''}{formatFCFA(txn.amount)}
                          </p>
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                            txn.status === 'completed' ? 'text-[#00A651]' : txn.status === 'pending' ? 'text-[#D4AF37]' : 'text-[#D93025]'
                          }`}>
                            {txn.status === 'completed' ? <><CheckCircle className="w-3 h-3" /> Validé</> : txn.status === 'pending' ? <><Hourglass className="w-3 h-3" /> En attente</> : <><XCircle className="w-3 h-3" /> Échoué</>}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
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
                      <span className="flex items-center justify-center mb-1">{p.icon}</span>
                      <p className="text-[10px] font-semibold text-[#2C2E2F]">{p.name}</p>
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={!addAmount || !addProvider || createWalletTx.isPending}
                  className="w-full py-3 bg-[#00A651] text-white rounded-full font-semibold text-sm hover:bg-[#008f46] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createWalletTx.isPending ? 'Traitement en cours...' : `Déposer ${addAmount ? formatFCFA(Number(addAmount)) : ''}`}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== WITHDRAW ===== */}
          {activeTab === 'withdraw' && (
            <motion.div key="withdraw" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-lg mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">Retirer des fonds</h3>
                <p className="text-xs text-gray-500 mb-4">Solde disponible : <span className="font-mono font-bold text-[#00A651]">{formatFCFA(balance)}</span></p>

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
                      <span className="flex items-center justify-center mb-1">{p.icon}</span>
                      <p className="text-[10px] font-semibold text-[#2C2E2F]">{p.name}</p>
                    </motion.button>
                  ))}
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || !withdrawProvider || Number(withdrawAmount) > balance || createWalletTx.isPending}
                  className="w-full py-3 bg-[#D93025] text-white rounded-full font-semibold text-sm hover:bg-[#b3261e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {createWalletTx.isPending ? 'Traitement en cours...' : `Retirer ${withdrawAmount ? formatFCFA(Number(withdrawAmount)) : ''}`}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== AFRIPOINTS ===== */}
          {activeTab === 'points' && (
            <motion.div key="points" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {/* Points Balance */}
              {walletLoading ? (
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#a08820] rounded-3xl p-6 text-white text-center">
                  <Skeleton className="h-4 w-32 mx-auto mb-2 bg-white/20" />
                  <Skeleton className="h-12 w-24 mx-auto mb-2 bg-white/20" />
                  <Skeleton className="h-3 w-40 mx-auto bg-white/20" />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#a08820] rounded-3xl p-6 text-white text-center">
                  <p className="text-sm text-white/60 mb-1">Vos AfriPoints</p>
                  <p className="font-mono text-4xl font-bold mb-2 flex items-center justify-center gap-2"><Star className="w-6 h-6" /> {afriPoints}</p>
                  <p className="text-xs text-white/70">1 point = 1 FCFA de crédit</p>
                </div>
              )}

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
                        onClick={() => handleExchange(item.points, item.type)}
                        disabled={!item.available || afriPoints < item.points || createWalletTx.isPending}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          item.available && afriPoints >= item.points
                            ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {createWalletTx.isPending ? '...' : 'Échanger'}
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
