'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useWallet, useCreateWalletTransaction, type WalletTransaction } from '@/hooks/useWallet';
import { useCountry } from '@/contexts/CountryContext';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ClipboardList, Download, Upload, Lock, Unlock, Coins, RefreshCw,
  CreditCard, Star, Smartphone, CheckCircle, Hourglass, XCircle,
  Shield, AlertTriangle, ArrowRightLeft, TrendingUp, Eye, EyeOff,
  Wallet, Banknote, Clock, BadgeCheck
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

type TransactionType = 'deposit' | 'withdrawal' | 'escrow_fund' | 'escrow_release' | 'commission' | 'subscription';

const filterTypes: { key: TransactionType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Tous', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: 'deposit', label: 'Depots', icon: <Download className="w-3.5 h-3.5" /> },
  { key: 'withdrawal', label: 'Retraits', icon: <Upload className="w-3.5 h-3.5" /> },
  { key: 'escrow_fund', label: 'Escrow (financement)', icon: <Lock className="w-3.5 h-3.5" /> },
  { key: 'escrow_release', label: 'Escrow (liberation)', icon: <Unlock className="w-3.5 h-3.5" /> },
  { key: 'commission', label: 'Commissions', icon: <Coins className="w-3.5 h-3.5" /> },
  { key: 'subscription', label: 'Abonnements', icon: <RefreshCw className="w-3.5 h-3.5" /> },
];

const afriPointsRedemption = [
  { points: 500, reward: '500 FCFA de credit wallet', type: 'subscription', available: true },
  { points: 1000, reward: '1 000 FCFA de credit wallet', type: 'subscription', available: true },
  { points: 2500, reward: 'Reduction 10% sur abonnement', type: 'subscription', available: true },
  { points: 5000, reward: 'Visite gratuite GeoTrust', type: 'subscription', available: false },
];

// ─── Currency rates (BCEAO fallback + Fixer.io live with 1h cache) ─────────
// Per CDC §5.x: AfriBayit operates in XOF (FCFA) pegged to EUR at 655.957
// (BCEAO fixed parity). Static fallback used when Fixer API key is missing
// or the request fails. Live rates are cached for 1 hour client-side.
export type CurrencyCode = 'XOF' | 'EUR' | 'USD';

export const STATIC_RATES: Record<CurrencyCode, number> = {
  // BCEAO fixed parity: 1 EUR = 655.957 XOF, 1 USD ≈ 610 XOF (approx)
  XOF: 1,
  EUR: 1 / 655.957,
  USD: 1 / 610,
};

// Module-level cache for live rates (1h TTL)
let cachedRates: { rates: Record<CurrencyCode, number>; fetchedAt: number } | null = null;
const RATES_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live currency rates from Fixer.io.
 * Falls back to STATIC_RATES when API key is missing or fetch fails.
 * Result is cached for 1 hour to limit API calls.
 */
export async function fetchCurrencyRates(): Promise<Record<CurrencyCode, number>> {
  const apiKey = process.env.NEXT_PUBLIC_FIXER_API_KEY;
  // Serve from cache if still fresh
  if (cachedRates && Date.now() - cachedRates.fetchedAt < RATES_CACHE_TTL_MS) {
    return cachedRates.rates;
  }
  // No API key — use static BCEAO rates
  if (!apiKey) {
    return STATIC_RATES;
  }
  try {
    const res = await fetch(
      `https://data.fixer.io/api/latest?access_key=${encodeURIComponent(apiKey)}&base=EUR&symbols=USD,XOF`,
    );
    if (!res.ok) throw new Error(`Fixer.io HTTP ${res.status}`);
    const data = await res.json();
    if (!data || data.success === false || !data.rates) {
      throw new Error('Fixer.io invalid response');
    }
    const xofPerEur = typeof data.rates.XOF === 'number' ? data.rates.XOF : 655.957;
    const usdPerEur = typeof data.rates.USD === 'number' ? data.rates.USD : 0.00164 * 655.957;
    const rates: Record<CurrencyCode, number> = {
      XOF: 1,
      EUR: 1 / xofPerEur,
      USD: 1 / (xofPerEur / usdPerEur),
    };
    cachedRates = { rates, fetchedAt: Date.now() };
    return rates;
  } catch {
    // On any failure, fall back to static rates (still serve the UI)
    return STATIC_RATES;
  }
}

/**
 * React hook that subscribes to live currency rates.
 * Returns STATIC_RATES immediately, then swaps to live rates when fetched.
 */
export function useCurrencyRates(): Record<CurrencyCode, number> {
  const [rates, setRates] = useState<Record<CurrencyCode, number>>(STATIC_RATES);
  useEffect(() => {
    let cancelled = false;
    fetchCurrencyRates().then((live) => {
      if (!cancelled && live) setRates(live);
    });
    return () => { cancelled = true; };
  }, []);
  return rates;
}

// Transaction types that represent a credit (money flowing IN to the user)
// Used to compute totalTransactedLifetime without counting debits twice.
const CREDIT_TXN_TYPES = new Set(['deposit', 'escrow_release', 'payout', 'refund']);

const paymentProviders = [
  { key: 'mtn', name: 'MTN Mobile Money', icon: <Smartphone className="w-5 h-5" style={{ color: '#FFC300' }} />, color: '#FFC300' },
  { key: 'orange', name: 'Orange Money', icon: <Smartphone className="w-5 h-5 text-orange-500" />, color: '#FF6600' },
  { key: 'moov', name: 'Moov Money', icon: <Smartphone className="w-5 h-5 text-blue-600" />, color: '#0066CC' },
  { key: 'fedapay', name: 'FedaPay', icon: <CreditCard className="w-5 h-5" />, color: '#003087' },
  { key: 'stripe', name: 'Stripe (Carte)', icon: <CreditCard className="w-5 h-5 text-purple-500" />, color: '#635bff' },
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

function convertCurrency(amount: number, currency: string, rates: Record<CurrencyCode, number> = STATIC_RATES): string {
  const rate = rates[currency as CurrencyCode] ?? 1;
  const converted = amount * rate;
  if (currency === 'XOF') return formatFCFA(amount);
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2 }).format(converted);
}

type TabKey = 'overview' | 'history' | 'add' | 'withdraw' | 'points';

// ─── KYC Verification Gate ───────────────────────────────────────

function KycGate({ kycLevel, requiredLevel, children }: { kycLevel: number; requiredLevel: number; children: React.ReactNode }) {
  const { t } = useTranslation();
  if (kycLevel >= requiredLevel) return <>{children}</>;
  return (
    <div className="p-6 bg-[#D4AF37]/5 rounded-2xl border border-[#D4AF37]/20 text-center">
      <Shield className="w-10 h-10 text-[#D4AF37] mx-auto mb-3" />
      <h4 className="font-display text-base font-bold text-[#0a2a5e] mb-2">{t('walletModule.kycGateTitle', 'Vérification KYC requise')}</h4>
      <p className="text-sm text-gray-600 mb-3">
        {t('walletModule.kycGateBody', 'Vous devez atteindre le niveau KYC')} {requiredLevel} {t('walletModule.kycGateBody2', 'pour accéder à cette fonctionnalité.')}
        {t('walletModule.kycGateCurrent', 'Votre niveau actuel est')} <span className="font-bold text-[#D4AF37]">{kycLevel}</span>.
      </p>
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((level) => (
          <div key={level} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            kycLevel >= level ? 'bg-[#00A651] text-white' : 'bg-gray-200 text-gray-400'
          }`}>{level}</div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">{t('walletModule.kycGateLevels', 'Niveau 1: Email · Niveau 2: Pièce d\'identité · Niveau 3: Justificatif de domicile')}</p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function WalletModule({ onNavigate }: ModuleProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'XOF' | 'EUR' | 'USD'>('XOF');
  const [addAmount, setAddAmount] = useState('');
  const [addProvider, setAddProvider] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawProvider, setWithdrawProvider] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);

  const { user } = useAuthStore();
  const userId = user?.id;
  const isLoggedIn = !!userId;
  const { selectedCountry } = useCountry();

  const { data: walletData, isLoading: walletLoading, isError: walletError } = useWallet(userId, selectedCountry);
  const createWalletTx = useCreateWalletTransaction();

  const summary = walletData?.summary;
  const transactions = walletData?.transactions ?? [];

  // Live currency rates (1h cache, falls back to BCEAO static rates)
  const rates = useCurrencyRates();

  const balance = summary?.balance ?? 0;
  const escrowHeld = summary?.escrowHeld ?? 0;
  const pendingPayout = summary?.pendingPayout ?? 0;
  const afriPoints = summary?.afriPoints ?? 0;
  const kycLevel = summary?.kycLevel ?? 0;

  // Total transacted lifetime — prefer backend-computed value when available.
  // Fall back to summing only CREDIT-type txns (deposit, escrow_release,
  // payout, refund) — NOT abs(amount), which would double-count debits.
  const totalTransactedLifetime = useMemo(() => {
    const backend = (summary as { totalTransactedLifetime?: number } | undefined)?.totalTransactedLifetime;
    if (typeof backend === 'number' && backend > 0) return backend;
    return transactions
      .filter((t) => CREDIT_TXN_TYPES.has(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [transactions, summary]);

  const filteredTransactions = filterType === 'all'
    ? transactions
    : transactions.filter((t: WalletTransaction) => t.type === filterType);

  const handleDeposit = () => {
    if (!addAmount || !addProvider) return;
    createWalletTx.mutate({
      type: 'deposit', amount: Number(addAmount), providerRef: addProvider,
      metadata: { provider: addProvider, action: 'deposit' },
    }, {
      onSuccess: () => {
        toast.success(t('walletModule.toastDepositSuccess', 'Dépôt effectué'), { description: `${formatFCFA(Number(addAmount))} ${t('walletModule.toastDepositDesc', 'ajoutés à votre portefeuille')}` });
        setAddAmount(''); setAddProvider(null); setActiveTab('overview');
      },
      onError: (error: Error) => { toast.error(t('walletModule.toastDepositError', 'Erreur lors du dépôt'), { description: error.message }); },
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || !withdrawProvider || Number(withdrawAmount) > balance) return;
    if (kycLevel < 2) {
      toast.error(t('walletModule.toastKycRequired', 'Vérification KYC requise'), { description: t('walletModule.toastKycRequiredDesc', 'Niveau 2 minimum pour les retraits') });
      return;
    }
    createWalletTx.mutate({
      type: 'withdrawal', amount: -Number(withdrawAmount), providerRef: withdrawProvider,
      metadata: { provider: withdrawProvider, action: 'withdrawal' },
    }, {
      onSuccess: () => {
        toast.success(t('walletModule.toastWithdrawInit', 'Retrait initié'), { description: `${formatFCFA(Number(withdrawAmount))} ${t('walletModule.toastWithdrawDesc', 'en cours de traitement')}` });
        setWithdrawAmount(''); setWithdrawProvider(null); setActiveTab('overview');
      },
      onError: (error: Error) => { toast.error(t('walletModule.toastWithdrawError', 'Erreur lors du retrait'), { description: error.message }); },
    });
  };

  const handleExchange = (points: number, type: string) => {
    createWalletTx.mutate({
      type, amount: points, metadata: { points, action: 'afripoints_redemption' },
    }, {
      onSuccess: () => { toast.success(t('walletModule.toastExchangeSuccess', 'Échange effectué'), { description: `${points} ${t('walletModule.toastExchangeDesc', 'AfriPoints échangés avec succès')}` }); },
      onError: (error: Error) => { toast.error(t('walletModule.toastExchangeError', 'Erreur'), { description: error.message }); },
    });
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: t('walletModule.tabOverview', 'Aperçu'), icon: <Wallet className="w-4 h-4" /> },
    { key: 'history', label: t('walletModule.tabHistory', 'Historique'), icon: <ClipboardList className="w-4 h-4" /> },
    { key: 'add', label: t('walletModule.tabAdd', 'Ajouter fonds'), icon: <Download className="w-4 h-4" /> },
    { key: 'withdraw', label: t('walletModule.tabWithdraw', 'Retirer'), icon: <Upload className="w-4 h-4" /> },
    { key: 'points', label: t('walletModule.tabPoints', 'AfriPoints'), icon: <Star className="w-4 h-4 text-yellow-500" /> },
  ];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            <Wallet className="w-4 h-4" /> {t('walletModule.eyebrow', 'Portefeuille AfriBayit')}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0a2a5e] mb-3">
            {t('walletModule.title', 'Mon Portefeuille').split(' ')[0]} <span className="text-[#D4AF37]">{t('walletModule.title', 'Mon Portefeuille').split(' ')[1]}</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            {isLoggedIn ? t('walletModule.subtitleLoggedIn', 'Gérez vos fonds, escrows et AfriPoints en toute sécurité') : t('walletModule.subtitleLoggedOut', 'Connectez-vous pour gérer vos fonds et AfriPoints')}
          </p>
        </motion.div>

        {/* Guest mode notice */}
        {!isLoggedIn && (
          <div className="bg-[#003087]/5 border border-[#003087]/10 rounded-2xl p-6 text-center mb-6">
            <Shield className="w-10 h-10 text-[#003087] mx-auto mb-3" />
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-2">{t('walletModule.guestTitle', 'Connexion requise')}</h3>
            <p className="text-sm text-gray-600 mb-4">{t('walletModule.guestBody', 'Pour accéder à votre portefeuille, veuillez vous connecter.')}</p>
            <a href="/auth/login" className="px-5 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#002266] transition-colors inline-block">
              {t('walletModule.login', 'Se connecter')}
            </a>
          </div>
        )}

        {/* Currency Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          {(['XOF', 'EUR', 'USD'] as const).map(c => (
            <button key={c} onClick={() => setSelectedCurrency(c)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCurrency === c ? 'bg-[#003087] text-white' : 'bg-white text-gray-500 border hover:bg-gray-50'
              }`}>{c}</button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}>{tab.icon} {tab.label}</button>
          ))}
        </div>

        {walletError && (
          <div className="bg-red-50 rounded-2xl p-4 mb-6 text-center border border-red-200">
            <p className="text-sm text-[#D93025]">{t('walletModule.errorLoading', 'Erreur lors du chargement des données du portefeuille.')}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ===== OVERVIEW ===== */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {/* Main Balance Card */}
              {walletLoading ? (
                <div className="bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-xl p-6">
                  <Skeleton className="h-4 w-32 mb-2 bg-white/20" /><Skeleton className="h-10 w-48 mb-4 bg-white/20" />
                  <div className="grid grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl bg-white/20" />)}</div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#003087] to-[#001a4d] rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-white/60">{t('walletModule.balanceAvailableLabel', 'Solde disponible (balance_available)')}</p>
                    <button onClick={() => setShowBalance(!showBalance)} className="p-1.5 rounded-lg hover:bg-white/10">
                      {showBalance ? <Eye className="w-4 h-4 text-white/60" /> : <EyeOff className="w-4 h-4 text-white/60" />}
                    </button>
                  </div>
                  <p className="font-mono text-3xl sm:text-4xl font-bold mb-4">
                    {showBalance ? convertCurrency(balance, selectedCurrency, rates) : '****'}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">{t('walletModule.balanceEscrowHeld', 'Escrow bloqué')}</p>
                      <p className="font-mono text-sm font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> {showBalance ? convertCurrency(escrowHeld, selectedCurrency, rates) : '****'}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">{t('walletModule.balancePendingPayout', 'Paiement en attente')}</p>
                      <p className="font-mono text-sm font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {showBalance ? convertCurrency(pendingPayout, selectedCurrency, rates) : '****'}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">{t('walletModule.balanceTotalTransacted', 'Total transacted')}</p>
                      <p className="font-mono text-sm font-bold flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" /> {showBalance ? convertCurrency(totalTransactedLifetime, selectedCurrency, rates) : '****'}</p>
                    </div>
                    <div className="p-3 bg-white/10 rounded-2xl">
                      <p className="text-[10px] text-white/60">{t('walletModule.balanceAfriPoints', 'AfriPoints')}</p>
                      <p className="font-mono text-sm font-bold text-[#D4AF37] flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {afriPoints}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('walletModule.balanceCardAvailable', 'Disponible'), key: 'balance_available', value: balance, icon: <Banknote className="w-5 h-5" />, color: '#00A651' },
                  { label: t('walletModule.balanceCardEscrow', 'Escrow'), key: 'balance_escrow_held', value: escrowHeld, icon: <Lock className="w-5 h-5" />, color: '#009CDE' },
                  { label: t('walletModule.balanceCardPending', 'En attente'), key: 'balance_pending_payout', value: pendingPayout, icon: <Clock className="w-5 h-5" />, color: '#D4AF37' },
                  { label: t('walletModule.balanceCardTotal', 'Total trans.'), key: 'total_transacted_lifetime', value: totalTransactedLifetime, icon: <TrendingUp className="w-5 h-5" />, color: '#003087' },
                ].map((item) => (
                  <motion.button key={item.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-2xl p-4 shadow-sm border text-left hover:border-[#003087]/20 transition-all">
                    <div className="flex items-center gap-2 mb-1"><span style={{ color: item.color }}>{item.icon}</span><span className="text-[10px] text-gray-500 font-mono">{item.key}</span></div>
                    <p className="font-mono text-lg font-bold" style={{ color: item.color }}>{formatFCFA(item.value)}</p>
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* KYC Level Indicator */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-[#0a2a5e] flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#003087]" /> {t('walletModule.kycLevelLabel', 'Niveau KYC')}</h4>
                  <span className="font-mono text-sm font-bold text-[#003087]">{kycLevel}/3</span>
                </div>
                <div className="flex gap-2">
                  {[
                    { level: 1, label: t('walletModule.kycLevelEmail', 'Email'), required: false },
                    { level: 2, label: t('walletModule.kycLevelIdentity', 'Identité'), required: true },
                    { level: 3, label: t('walletModule.kycLevelDomicile', 'Domicile'), required: true },
                  ].map((item) => (
                    <div key={item.level} className={`flex-1 p-2 rounded-xl text-center ${
                      kycLevel >= item.level ? 'bg-[#00A651]/10 border border-[#00A651]/20' : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <div className={`w-6 h-6 rounded-lg mx-auto mb-1 flex items-center justify-center text-xs font-bold ${
                        kycLevel >= item.level ? 'bg-[#00A651] text-white' : 'bg-gray-200 text-gray-400'
                      }`}>{kycLevel >= item.level ? <CheckCircle className="w-4 h-4" /> : item.level}</div>
                      <p className="text-[10px] text-gray-600 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: t('walletModule.quickActionAddFunds', 'Ajouter fonds'), icon: <Download className="w-5 h-5" />, action: () => setActiveTab('add') },
                  { label: t('walletModule.quickActionWithdraw', 'Retirer'), icon: <Upload className="w-5 h-5" />, action: () => setActiveTab('withdraw') },
                  { label: t('walletModule.quickActionHistory', 'Historique'), icon: <ClipboardList className="w-5 h-5" />, action: () => setActiveTab('history') },
                  { label: t('walletModule.quickActionPoints', 'AfriPoints'), icon: <Star className="w-5 h-5 text-yellow-500" />, action: () => setActiveTab('points') },
                ].map(btn => (
                  <motion.button key={btn.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={btn.action}
                    className="bg-white rounded-2xl p-4 shadow-sm border text-center hover:border-[#003087]/20 transition-all">
                    <span className="flex items-center justify-center mb-1 text-gray-600">{btn.icon}</span>
                    <p className="text-xs font-semibold text-[#0a2a5e]">{btn.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-[#0a2a5e]">{t('walletModule.recentTransactions', 'Transactions récentes')}</h3>
                  <button onClick={() => setActiveTab('history')} className="text-xs text-[#003087] font-semibold">{t('walletModule.viewAll', 'Voir tout →')}</button>
                </div>
                {walletLoading ? (
                  <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-lg shrink-0" /><div className="flex-1"><Skeleton className="h-4 w-40 mb-1" /><Skeleton className="h-3 w-20" /></div><Skeleton className="h-4 w-20" /></div>
                  ))}</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8"><p className="text-sm text-gray-500">{t('walletModule.noRecent', 'Aucune transaction récente')}</p></div>
                ) : (
                  <div className="space-y-3">
                    {transactions.slice(0, 4).map((txn: WalletTransaction) => (
                      <div key={txn.id} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${getTypeColor(txn.type)}10` }}>{getTypeIcon(txn.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0a2a5e] truncate">{txn.reference || txn.type}</p>
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
              <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
                {filterTypes.map(ft => (
                  <button key={ft.key} onClick={() => setFilterType(ft.key)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      filterType === ft.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                    }`}>{ft.icon} {ft.label}</button>
                ))}
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                {walletLoading ? (
                  <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                      <Skeleton className="w-10 h-10 rounded-lg shrink-0" /><div className="flex-1"><Skeleton className="h-4 w-40 mb-1" /><Skeleton className="h-3 w-32" /></div>
                      <div className="text-right"><Skeleton className="h-4 w-20 mb-1 ml-auto" /><Skeleton className="h-3 w-14 ml-auto" /></div>
                    </div>
                  ))}</div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-8"><p className="text-sm text-gray-500">{t('walletModule.noFound', 'Aucune transaction trouvée')}</p></div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {filteredTransactions.map((txn: WalletTransaction, i: number) => (
                      <motion.div key={txn.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, ease: easeOut }}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${getTypeColor(txn.type)}10` }}>{getTypeIcon(txn.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0a2a5e] truncate">{txn.reference || txn.type}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{txn.reference ?? '—'} · {new Date(txn.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-mono text-sm font-bold ${txn.amount > 0 ? 'text-[#00A651]' : 'text-[#D93025]'}`}>
                            {txn.amount > 0 ? '+' : ''}{formatFCFA(txn.amount)}
                          </p>
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                            txn.status === 'completed' ? 'text-[#00A651]' : txn.status === 'pending' ? 'text-[#D4AF37]' : 'text-[#D93025]'
                          }`}>
                            {txn.status === 'completed' ? <><CheckCircle className="w-3 h-3" /> {t('walletModule.txnValid', 'Validé')}</> : txn.status === 'pending' ? <><Hourglass className="w-3 h-3" /> {t('walletModule.txnPending', 'En attente')}</> : <><XCircle className="w-3 h-3" /> {t('walletModule.txnFailed', 'Échoué')}</>}
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
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><Download className="w-5 h-5 text-[#00A651]" /> {t('walletModule.addFundsTitle', 'Ajouter des fonds')}</h3>
                <div className="mb-5">
                  <label className="text-xs text-gray-500 mb-1 block">{t('walletModule.amountLabel', 'Montant (FCFA)')}</label>
                  <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="0"
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-lg font-mono font-bold focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20" />
                  <div className="flex gap-2 mt-2">
                    {[50000, 100000, 250000, 500000].map(amt => (
                      <button key={amt} onClick={() => setAddAmount(String(amt))} className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                        {new Intl.NumberFormat('fr-FR').format(amt)}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="text-xs text-gray-500 mb-2 block">{t('walletModule.paymentMethodLabel', 'Moyen de paiement')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {paymentProviders.map(p => (
                    <motion.button key={p.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setAddProvider(p.key)}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${addProvider === p.key ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                      <span className="flex items-center justify-center mb-1">{p.icon}</span>
                      <p className="text-[10px] font-semibold text-[#0a2a5e]">{p.name}</p>
                    </motion.button>
                  ))}
                </div>
                <button onClick={handleDeposit} disabled={!addAmount || !addProvider || createWalletTx.isPending}
                  className="w-full py-3 bg-[#00A651] text-white rounded-lg font-semibold text-sm hover:bg-[#008f46] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {createWalletTx.isPending ? t('walletModule.processing', 'Traitement en cours...') : `${t('walletModule.deposit', 'Déposer')} ${addAmount ? formatFCFA(Number(addAmount)) : ''}`}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== WITHDRAW ===== */}
          {activeTab === 'withdraw' && (
            <motion.div key="withdraw" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-lg mx-auto">
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-1 flex items-center gap-2"><Upload className="w-5 h-5 text-[#D93025]" /> {t('walletModule.withdrawTitle', 'Retirer des fonds')}</h3>
                <p className="text-xs text-gray-500 mb-4">{t('walletModule.balanceLabel', 'Solde disponible :')} <span className="font-mono font-bold text-[#00A651]">{formatFCFA(balance)}</span></p>

                <KycGate kycLevel={kycLevel} requiredLevel={2}>
                  <div className="mb-5">
                    <label className="text-xs text-gray-500 mb-1 block">{t('walletModule.withdrawAmountLabel', 'Montant du retrait (FCFA)')}</label>
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="0"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-lg font-mono font-bold focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/20" />
                    <div className="flex gap-2 mt-2">
                      {[100000, 250000, 500000].map(amt => (
                        <button key={amt} onClick={() => setWithdrawAmount(String(amt))} className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                          {new Intl.NumberFormat('fr-FR').format(amt)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="text-xs text-gray-500 mb-2 block">{t('walletModule.withdrawDestinationLabel', 'Destination Mobile Money')}</label>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {paymentProviders.filter(p => ['mtn', 'orange', 'moov'].includes(p.key)).map(p => (
                      <motion.button key={p.key} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setWithdrawProvider(p.key)}
                        className={`p-3 rounded-2xl border-2 text-center transition-all ${withdrawProvider === p.key ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                        <span className="flex items-center justify-center mb-1">{p.icon}</span>
                        <p className="text-[10px] font-semibold text-[#0a2a5e]">{p.name}</p>
                      </motion.button>
                    ))}
                  </div>
                  <button onClick={handleWithdraw} disabled={!withdrawAmount || !withdrawProvider || Number(withdrawAmount) > balance || createWalletTx.isPending}
                    className="w-full py-3 bg-[#D93025] text-white rounded-lg font-semibold text-sm hover:bg-[#b3261e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    {createWalletTx.isPending ? t('walletModule.processing', 'Traitement en cours...') : `${t('walletModule.withdraw', 'Retirer')} ${withdrawAmount ? formatFCFA(Number(withdrawAmount)) : ''}`}
                  </button>
                </KycGate>
              </div>
            </motion.div>
          )}

          {/* ===== AFRIPOINTS ===== */}
          {activeTab === 'points' && (
            <motion.div key="points" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {walletLoading ? (
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#a08820] rounded-xl p-6 text-white text-center">
                  <Skeleton className="h-4 w-32 mx-auto mb-2 bg-white/20" /><Skeleton className="h-12 w-24 mx-auto mb-2 bg-white/20" /><Skeleton className="h-3 w-40 mx-auto bg-white/20" />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-[#D4AF37] to-[#a08820] rounded-xl p-6 text-white text-center">
                  <p className="text-sm text-white/60 mb-1">{t('walletModule.pointsTitle', 'Vos AfriPoints')}</p>
                  <p className="font-mono text-4xl font-bold mb-2 flex items-center justify-center gap-2"><Star className="w-6 h-6" /> {afriPoints}</p>
                  <p className="text-xs text-white/70">{t('walletModule.pointsRateHint', '1 point = 1 FCFA de crédit')}</p>
                </div>
              )}
              <div className="bg-white rounded-xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4">{t('walletModule.pointsExchangeOptions', 'Options d\'échange')}</h3>
                <div className="space-y-3">
                  {afriPointsRedemption.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, ease: easeOut }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center font-mono text-sm font-bold text-[#D4AF37]">{item.points}</div>
                        <p className="text-sm text-[#0a2a5e] font-medium">{item.reward}</p>
                      </div>
                      <button onClick={() => handleExchange(item.points, item.type)}
                        disabled={!item.available || afriPoints < item.points || createWalletTx.isPending}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          item.available && afriPoints >= item.points ? 'bg-[#D4AF37] text-white hover:bg-[#c4a030]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}>{createWalletTx.isPending ? '...' : t('walletModule.pointsExchange', 'Échanger')}</button>
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
