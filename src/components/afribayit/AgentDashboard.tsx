'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { premiumTiers, formatPrice } from '@/lib/mockData';

interface AgentDashboardProps {
  onLogout: () => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const kpiData = [
  { label: 'Annonces actives', value: '12', change: '+3', icon: '🏠', color: '#003087' },
  { label: 'Vues ce mois', value: '2 340', change: '+18%', icon: '👁️', color: '#009CDE' },
  { label: 'Contacts reçus', value: '47', change: '+12', icon: '📞', color: '#00A651' },
  { label: 'Taux conversion', value: '23%', change: '+5%', icon: '📈', color: '#D4AF37' },
  { label: 'Revenus', value: '1.2M FCFA', change: '+22%', icon: '💰', color: '#D4AF37' },
  { label: 'Position locale', value: '#3 Cotonou', change: '+2', icon: '🏆', color: '#003087' },
];

const kanbanColumns = [
  { key: 'nouveau', label: 'Nouveau', color: '#6b7280', items: ['M. Akossi - Villa Ganhi', 'Mme. Adjo - Terrain Lomé'] },
  { key: 'qualifie', label: 'Qualifié', color: '#009CDE', items: ['Société InvestBénin'] },
  { key: 'rdv', label: 'RDV', color: '#D4AF37', items: ['M. Coulibaly - Bureau Plateau'] },
  { key: 'offre', label: 'Offre', color: '#003087', items: ['Mme. Diallo - Penthouse Cocody'] },
  { key: 'signe', label: 'Signé', color: '#00A651', items: ['M. Traoré - Villa Ouaga'] },
];

export default function AgentDashboard({ onLogout }: AgentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F]">Dashboard Agent</h1>
            <p className="text-sm text-gray-500 mt-1">Bienvenue, Kofi Mensah • Agent certifié</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#D4AF37] text-white rounded-full text-sm font-semibold shadow-lg">
              + Nouvelle annonce
            </button>
            <button onClick={onLogout} className="px-4 py-2 bg-white border rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50">
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {[
            { key: 'overview', label: 'Vue d\'ensemble' },
            { key: 'listings', label: 'Annonces' },
            { key: 'pipeline', label: 'Pipeline CRM' },
            { key: 'premium', label: 'Plans Premium' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {kpiData.map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
                  className="bg-white rounded-2xl p-4 shadow-sm border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl">{kpi.icon}</span>
                    <span className="text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
                      {kpi.change}
                    </span>
                  </div>
                  <p className="font-mono-data text-xl font-bold text-[#2C2E2F]">{kpi.value}</p>
                  <p className="text-xs text-gray-500">{kpi.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Rebecca Pro Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
              className="bg-navy-gradient rounded-3xl p-6 mb-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center">
                    <span className="text-white text-sm font-bold">R</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Rebecca Pro Insights</h3>
                    <p className="text-white/50 text-xs">Intelligence artificielle pour agents</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'Tendance marché', desc: 'Les villas à Cotonou sont en hausse de 12% ce trimestre', action: 'Voir l\'analyse' },
                    { title: 'Optimisation', desc: '3 annonces pourraient améliorer leur visibilité avec de meilleures photos', action: 'Optimiser' },
                    { title: 'Lead prioritaire', desc: 'Nouveau lead qualifié pour le Penthouse Cocody - Budget confirmé', action: 'Contacter' },
                  ].map((insight, i) => (
                    <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur">
                      <h4 className="text-white text-sm font-semibold mb-1">{insight.title}</h4>
                      <p className="text-white/60 text-xs mb-3">{insight.desc}</p>
                      <button className="text-[#D4AF37] text-xs font-semibold hover:underline">{insight.action} →</button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {activeTab === 'listings' && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-[#2C2E2F]">Mes annonces (12)</h3>
              <button className="text-sm text-[#003087] font-medium hover:underline">+ Ajouter</button>
            </div>
            <div className="divide-y">
              {[
                { title: 'Villa Prestige Les Cocotiers', status: 'Active', views: 1240, contacts: 23, price: '85 000 000 FCFA' },
                { title: 'Studio Meublé Fidjrossè', status: 'Active', views: 334, contacts: 8, price: '120 000 FCFA/mois' },
                { title: 'Commerce Emplacement N°1', status: 'Active', views: 890, contacts: 31, price: '800 000 FCFA/mois' },
                { title: 'Terrain 1000m² Akpakpa', status: 'En revue', views: 389, contacts: 12, price: '25 000 000 FCFA' },
              ].map((listing) => (
                <div key={listing.title} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V5.25a1.5 1.5 0 00-1.5-1.5H3.75a1.5 1.5 0 00-1.5 1.5v14.25c0 .828.672 1.5 1.5 1.5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2E2F] truncate">{listing.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        listing.status === 'Active' ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                      }`}>
                        {listing.status}
                      </span>
                      <span className="text-xs text-gray-400">{listing.views} vues</span>
                      <span className="text-xs text-gray-400">{listing.contacts} contacts</span>
                    </div>
                  </div>
                  <p className="font-mono-data text-sm font-bold text-[#D4AF37] shrink-0">{listing.price}</p>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max pb-4">
              {kanbanColumns.map((col) => (
                <div key={col.key} className="w-64 shrink-0">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <h4 className="text-sm font-semibold text-[#2C2E2F]">{col.label}</h4>
                    <span className="text-xs text-gray-400 ml-auto">{col.items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.items.map((item) => (
                      <motion.div
                        key={item}
                        whileHover={{ y: -2 }}
                        className="bg-white rounded-2xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <p className="text-sm font-medium text-[#2C2E2F]">{item}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Mis à jour il y a 2h</p>
                      </motion.div>
                    ))}
                    <button className="w-full py-2 border-2 border-dashed border-gray-200 rounded-2xl text-xs text-gray-400 hover:border-[#003087] hover:text-[#003087] transition-colors">
                      + Ajouter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'premium' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {premiumTiers.map((tier) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className={`relative bg-white rounded-3xl p-6 shadow-sm border-2 transition-all ${
                  tier.highlighted ? 'border-[#D4AF37] gold-glow' : 'border-gray-100'
                }`}
              >
                {tier.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">
                    Populaire
                  </span>
                )}
                <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-1">{tier.name}</h3>
                <p className="font-mono-data text-2xl font-bold text-[#D4AF37] mb-4">{tier.priceLabel}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                      <svg className="w-4 h-4 text-[#00A651] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-full text-sm font-semibold transition-colors ${
                  tier.highlighted
                    ? 'bg-[#D4AF37] text-white hover:bg-[#b8961f]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}>
                  {tier.price === 0 ? 'Plan actuel' : 'Choisir'}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
