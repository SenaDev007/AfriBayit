'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { currentUser, transactions, kycLevels, formatPrice } from '@/lib/mockData';

interface UserDashboardProps {
  onNavigate: (section: string) => void;
  onLogout: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const sideNavItems = [
  { key: 'overview', label: "Vue d'ensemble", icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'wallet', label: 'Portefeuille', icon: 'M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z' },
  { key: 'transactions', label: 'Transactions', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
  { key: 'settings', label: 'Paramètres', icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const statusColors: Record<string, string> = {
  CREATED: '#6b7280', FUNDED: '#009CDE', IN_PROGRESS: '#D4AF37',
  NOTARY_ASSIGNED: '#003087', DEED_SIGNED: '#00A651', RELEASED: '#00A651'
};

const statusLabels: Record<string, string> = {
  CREATED: 'Créé', FUNDED: 'Financé', IN_PROGRESS: 'En cours',
  NOTARY_ASSIGNED: 'Notaire', DEED_SIGNED: 'Acte signé', RELEASED: 'Libéré'
};

export default function UserDashboard({ onLogout }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const user = currentUser;
  const userKyc = kycLevels[user.kycLevel];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-60 shrink-0">
            <div className="bg-white rounded-3xl p-4 shadow-sm border sticky top-24">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#D4AF37]"
                />
                <div>
                  <h3 className="text-sm font-semibold text-[#2C2E2F]">{user.name}</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${userKyc.color}15`, color: userKyc.color }}>
                    {userKyc.icon} {userKyc.name}
                  </span>
                </div>
              </div>
              <nav className="space-y-1">
                {sideNavItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === item.key ? 'bg-[#003087] text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#D93025] hover:bg-red-50 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Déconnexion
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Annonces actives', value: '3', icon: '🏠', color: '#003087' },
                { label: 'Transactions', value: '7', icon: '📊', color: '#00A651' },
                { label: 'Solde wallet', value: formatPrice(user.walletBalance), icon: '💰', color: '#D4AF37' },
                { label: 'Score AfriBayit', value: `${user.score}/100`, icon: '⭐', color: '#009CDE' },
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
              ))}
            </div>

            {/* Wallet Card */}
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
                      {new Intl.NumberFormat('fr-FR').format(user.walletBalance)} <span className="text-sm text-white/60">FCFA</span>
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                    </svg>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-white/40 text-[10px] mb-0.5">Escrow bloqué</p>
                    <p className="font-mono-data text-sm font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(user.escrowHeld)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] mb-0.5">En attente</p>
                    <p className="font-mono-data text-sm font-bold text-white">{new Intl.NumberFormat('fr-FR').format(user.pendingPayout)}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-[10px] mb-0.5">KYC Level</p>
                    <p className="text-sm font-bold text-white">{userKyc.icon} {userKyc.name}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
              className="bg-white rounded-3xl p-6 shadow-sm border"
            >
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Transactions récentes</h3>
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div key={txn.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${statusColors[txn.status]}10` }}>
                      <span className="text-lg">
                        {txn.status === 'RELEASED' ? '✅' : txn.status === 'FUNDED' ? '💰' : txn.status === 'IN_PROGRESS' ? '🔄' : '📋'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2C2E2F] truncate">{txn.propertyTitle}</p>
                      <p className="text-xs text-gray-400">{txn.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-data text-sm font-bold text-[#2C2E2F]">{new Intl.NumberFormat('fr-FR').format(txn.amount)}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColors[txn.status]}10`, color: statusColors[txn.status] }}>
                        {statusLabels[txn.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* KYC Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
              className="bg-white rounded-3xl p-6 shadow-sm border mt-6"
            >
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Niveau KYC</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {kycLevels.map((level) => (
                  <div
                    key={level.level}
                    className={`p-3 rounded-2xl border-2 text-center transition-colors ${
                      user.kycLevel >= level.level ? 'border-[#00A651] bg-[#00A651]/5' : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{level.icon}</span>
                    <p className="text-xs font-semibold" style={{ color: user.kycLevel >= level.level ? '#00A651' : '#9ca3af' }}>
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
