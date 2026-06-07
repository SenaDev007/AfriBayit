'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useWallet } from '@/hooks/useWallet';
import { useMyProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, BarChart3, Building2, CheckCircle, ClipboardList, Coins, CreditCard, Crown, Home, LogOut, RefreshCw, Settings, ShieldCheck, User, Wallet } from 'lucide-react';

interface UserDashboardProps {
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const sideNavItems = [
  { key: 'overview', label: "Vue d'ensemble", icon: Home, href: '/dashboard' },
  { key: 'profile', label: 'Mon profil', icon: User, href: '/profile' },
  { key: 'kyc', label: 'KYC Vérification', icon: ShieldCheck, href: '/kyc' },
  { key: 'wallet', label: 'Portefeuille', icon: Wallet, href: '/wallet' },
  { key: 'transactions', label: 'Transactions', icon: ClipboardList, href: '/escrow' },
  { key: 'subscriptions', label: 'Mes abonnements', icon: CreditCard, href: '/subscriptions' },
  { key: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
  { key: 'agent-dashboard', label: 'Mes annonces', icon: Building2, href: '/agent-dashboard' },
  { key: 'settings', label: 'Paramètres', icon: Settings, href: '/settings' },
];

const statusColors: Record<string, string> = {
  CREATED: '#6b7280', FUNDED: '#009CDE', IN_PROGRESS: '#D4AF37',
  NOTARY_ASSIGNED: '#003087', DEED_SIGNED: '#00A651', RELEASED: '#00A651',
  DOCS_VALIDATED: '#009CDE', GEOTRUST_VALIDATED: '#00A651', NOTARY_IN_PROGRESS: '#D4AF37',
  ANDF_REGISTERED: '#003087', DISPUTED: '#D93025', REFUNDED: '#6b7280', EXPIRED: '#6b7280',
};

const statusLabels: Record<string, string> = {
  CREATED: 'Créé', FUNDED: 'Financé', IN_PROGRESS: 'En cours',
  NOTARY_ASSIGNED: 'Notaire', DEED_SIGNED: 'Acte signé', RELEASED: 'Libéré',
  DOCS_VALIDATED: 'Docs validés', GEOTRUST_VALIDATED: 'GeoTrust validé',
  NOTARY_IN_PROGRESS: 'Notaire en cours', ANDF_REGISTERED: 'ANDF enregistré',
  DISPUTED: 'Litige', REFUNDED: 'Remboursé', EXPIRED: 'Expiré',
};

const kycLevels = [
  { level: 0, name: "Anonyme", color: "#6b7280", maxActions: "Consultation uniquement", Icon: User },
  { level: 1, name: "Standard", color: "#009CDE", maxActions: "Contacts limités, pas de transaction", Icon: Badge },
  { level: 2, name: "Avancé", color: "#00A651", maxActions: "Transactions, escrow, publications", Icon: CheckCircle },
  { level: 3, name: "Pro", color: "#D4AF37", maxActions: "Accès complet, API, outils pro", Icon: Crown },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

export default function UserDashboard({ onNavigate, onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  // Use NextAuth session as the primary source of truth for auth state
  // AppShell syncs session → authStore, so both are available after OAuth
  const { data: session, status: sessionStatus } = useSession();
  const { user: storeUser } = useAuthStore();

  // Prefer session user (works after OAuth), fall back to store (works after credentials login)
  const user = session?.user
    ? {
        id: ((session.user as Record<string, unknown>).id as string) || storeUser?.id || '',
        email: session.user.email || storeUser?.email || '',
        name: session.user.name || storeUser?.name || '',
        role: ((session.user as Record<string, unknown>).role as string) || storeUser?.role || 'buyer',
        country: ((session.user as Record<string, unknown>).country as string | null) || storeUser?.country || null,
        kycLevel: ((session.user as Record<string, unknown>).kycLevel as number) || storeUser?.kycLevel || 0,
        avatar: session.user.image || storeUser?.avatar || null,
      }
    : storeUser;

  const userId = user?.id;
  const isLoggedIn = !!userId && sessionStatus !== 'loading';

  const { data: walletData, isLoading: walletLoading, isError: walletError } = useWallet(userId);
  const { data: txnData, isLoading: txnLoading, isError: txnError } = useTransactions(userId);
  const { data: myPropertiesData } = useMyProperties(userId);
  const activeListingsCount = myPropertiesData?.pagination?.total ?? myPropertiesData?.properties?.length ?? 0;

  const summary = walletData?.summary;
  const transactions = (txnData?.transactions ?? []) as Record<string, unknown>[];
  const userKyc = summary ? kycLevels[summary.kycLevel] ?? kycLevels[0] : kycLevels[0];

  const userName = summary?.name || user?.name || 'Utilisateur';
  const userAvatar = summary?.avatar || user?.avatar || '';
  const userKycLevel = summary?.kycLevel ?? user?.kycLevel ?? 0;
  const userScore = summary?.score ?? 0;
  const walletBalance = summary?.balance ?? 0;
  const escrowHeld = summary?.escrowHeld ?? 0;
  const pendingPayout = summary?.pendingPayout ?? 0;

  // Guest mode banner when not logged in
  if (!isLoggedIn) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-[#003087]/10 flex items-center justify-center mx-auto mb-6">
              <Home className="w-10 h-10 text-[#003087]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#2C2E2F] mb-3">
              Bienvenue sur AfriBayit
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Connectez-vous pour acceder a votre tableau de bord, gerer vos transactions et suivre vos activites immobilieres.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="/auth/login"
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#002266] transition-colors"
              >
                Se connecter
              </a>
              <a
                href="/auth/register"
                className="px-6 py-3 bg-white text-[#003087] border border-[#003087]/20 rounded-full text-sm font-semibold hover:bg-[#003087]/5 transition-colors"
              >
                Creer un compte
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <div className="bg-white rounded-3xl p-4 shadow-sm border sticky top-24">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center border-2 border-[#D4AF37]">
                    <span className="text-gray-500 text-sm font-bold">{userName.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-[#2C2E2F]">{userName}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${userKyc.color}15`, color: userKyc.color }}>
                    <userKyc.Icon className="w-3 h-3 inline" /> {userKyc.name}
                  </span>
                </div>
              </div>
              <nav className="space-y-1">
                {sideNavItems.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveTab(item.key);
                        router.push(item.href);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.key ? 'bg-[#003087] text-white' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#D93025] hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Déconnexion
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {walletLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border">
                    <div className="flex items-center justify-between mb-3">
                      <Skeleton className="w-8 h-8 rounded" />
                      <Skeleton className="w-2 h-2 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-20 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : walletError ? (
                <div className="col-span-4 bg-red-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-[#D93025]">Erreur lors du chargement des données du wallet</p>
                </div>
              ) : (
                [
                  { label: 'Annonces actives', value: String(activeListingsCount), icon: <Home className="w-4 h-4" />, color: '#003087' },
                  { label: 'Transactions', value: String(transactions.length), icon: <BarChart3 className="w-4 h-4" />, color: '#00A651' },
                  { label: 'Solde wallet', value: formatPrice(walletBalance), icon: <Coins className="w-4 h-4" />, color: '#D4AF37' },
                  { label: 'Score AfriBayit', value: `${userScore}/100`, icon: null, color: '#009CDE' },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                    className="bg-white rounded-2xl p-4 shadow-sm border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{kpi.icon}</span>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: kpi.color }} />
                    </div>
                    <p className="font-mono-data text-lg sm:text-xl font-bold text-[#2C2E2F]">{kpi.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
                  </motion.div>
                ))
              )}
            </div>

            {/* Wallet Card */}
            {walletLoading ? (
              <div className="bg-navy-gradient rounded-3xl p-6 sm:p-8 mb-6">
                <Skeleton className="h-4 w-32 mb-2 bg-white/20" />
                <Skeleton className="h-10 w-48 mb-6 bg-white/20" />
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-2xl bg-white/20" />
                  ))}
                </div>
              </div>
            ) : walletError ? (
              <div className="bg-red-50 rounded-3xl p-6 mb-6 border border-red-200 text-center">
                <p className="text-sm text-[#D93025]">Impossible de charger les données du portefeuille</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                className="bg-navy-gradient rounded-3xl p-6 sm:p-8 mb-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-white/60 text-xs mb-1">Portefeuille AfriBayit</p>
                      <p className="font-mono-data text-3xl sm:text-4xl font-bold text-white">
                        {new Intl.NumberFormat('fr-FR').format(walletBalance)} <span className="text-sm text-white/60">FCFA</span>
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-[#D4AF37]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-white/40 text-[10px] mb-0.5">Escrow bloqué</p>
                      <p className="font-mono-data text-sm font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(escrowHeld)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] mb-0.5">En attente</p>
                      <p className="font-mono-data text-sm font-bold text-white">{new Intl.NumberFormat('fr-FR').format(pendingPayout)}</p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] mb-0.5">KYC Level</p>
                      <p className="text-sm font-bold text-white flex items-center gap-1"><userKyc.Icon className="w-3.5 h-3.5" /> {userKyc.name}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
              className="bg-white rounded-3xl p-6 shadow-sm border"
            >
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Transactions récentes</h3>
              {txnLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3">
                      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-20 mb-1 ml-auto" />
                        <Skeleton className="h-3 w-14 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : txnError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[#D93025]">Erreur lors du chargement des transactions</p>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">Aucune transaction trouvée</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => {
                    const status = String(txn.status ?? 'CREATED');
                    const amount = Number(txn.amount ?? 0);
                    const propertyTitle = String(txn.propertyTitle ?? (txn as Record<string, unknown>).propertyId ?? 'Transaction');
                    const date = String(txn.date ?? txn.createdAt ?? '');
                    const displayDate = date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                    return (
                      <div key={String(txn.id)} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${statusColors[status] || '#6b7280'}10` }}>
                          <span className="text-lg">
                            {status === 'RELEASED' ? <CheckCircle className="w-4 h-4" /> : status === 'FUNDED' ? <Coins className="w-4 h-4" /> : status === 'IN_PROGRESS' ? <RefreshCw className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2E2F] truncate">{propertyTitle}</p>
                          <p className="text-xs text-gray-400">{displayDate}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono-data text-sm font-bold text-[#2C2E2F]">{new Intl.NumberFormat('fr-FR').format(amount)}</p>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColors[status] || '#6b7280'}10`, color: statusColors[status] || '#6b7280' }}>
                            {statusLabels[status] || status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* KYC Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
              className="bg-white rounded-3xl p-6 shadow-sm border mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Niveau KYC</h3>
                <a href="/kyc" className="text-xs font-semibold text-[#003087] hover:underline">Vérifier mon identité →</a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kycLevels.map((level) => (
                  <div
                    key={level.level}
                    className={`p-3 rounded-2xl border-2 text-center transition-colors ${
                      userKycLevel >= level.level ? 'border-[#00A651] bg-[#00A651]/5' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <level.Icon className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs font-semibold" style={{ color: userKycLevel >= level.level ? '#00A651' : '#9ca3af' }}>
                      {level.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Niveau {level.level}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
