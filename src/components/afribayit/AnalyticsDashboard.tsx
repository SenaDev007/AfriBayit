'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const kpis = [
  { label: 'Revenus totaux', value: '24 500 000 FCFA', change: '+22%', icon: '💰', color: '#D4AF37' },
  { label: 'Transactions', value: '47', change: '+15%', icon: '📊', color: '#00A651' },
  { label: 'Nouveaux clients', value: '128', change: '+30%', icon: '👥', color: '#009CDE' },
  { label: 'Taux de satisfaction', value: '98%', change: '+2%', icon: '⭐', color: '#003087' },
];

const chartData = [
  { month: 'Jan', value: 65 },
  { month: 'Fév', value: 78 },
  { month: 'Mar', value: 90 },
  { month: 'Avr', value: 85 },
  { month: 'Mai', value: 95 },
  { month: 'Jun', value: 110 },
  { month: 'Jul', value: 102 },
  { month: 'Aoû', value: 120 },
  { month: 'Sep', value: 115 },
  { month: 'Oct', value: 130 },
  { month: 'Nov', value: 142 },
  { month: 'Déc', value: 155 },
];

const barData = [
  { label: 'Cotonou', value: 45, color: '#003087' },
  { label: 'Abidjan', value: 38, color: '#009CDE' },
  { label: 'Lomé', value: 22, color: '#D4AF37' },
  { label: 'Ouaga', value: 15, color: '#00A651' },
];

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('12m');

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F]">Analytique</h1>
            <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de vos performances</p>
          </div>
          <div className="flex gap-1.5 bg-gray-100 rounded-full p-0.5">
            {[
              { key: '7d', label: '7 jours' },
              { key: '30d', label: '30 jours' },
              { key: '12m', label: '12 mois' },
            ].map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  period === p.key ? 'bg-white shadow-sm text-[#003087]' : 'text-gray-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
              className="bg-white rounded-2xl p-4 shadow-sm border"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{kpi.icon}</span>
                <span className="text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <p className="font-mono-data text-lg sm:text-xl font-bold text-[#2C2E2F]">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border"
          >
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Revenus mensuels</h3>
            <div className="h-64 flex items-end gap-2">
              {chartData.map((item, i) => {
                const maxVal = Math.max(...chartData.map(d => d.value));
                const height = (item.value / maxVal) * 100;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: easeOut }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-[#003087] to-[#009CDE] min-h-[4px]"
                    />
                    <span className="text-[9px] text-gray-400">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
            className="bg-white rounded-3xl p-6 shadow-sm border"
          >
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Par ville</h3>
            <div className="space-y-4">
              {barData.map((item, i) => {
                const maxVal = Math.max(...barData.map(d => d.value));
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="font-mono-data text-sm font-bold" style={{ color: item.color }}>{item.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / maxVal) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Rebecca Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
          className="mt-6 bg-navy-gradient rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center">
                <span className="text-white text-sm font-bold">R</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Rebecca Insights</h3>
                <p className="text-white/50 text-xs">Analyse IA de vos données</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Tendance positive', desc: 'Les revenus ont augmenté de 22% sur la période. Cotonou est votre marché le plus dynamique.' },
                { title: 'Opportunité détectée', desc: 'Le segment "Terrain" à Lomé montre une demande croissante de +35%. Envisagez d\'augmenter vos annonces.' },
              ].map((insight, i) => (
                <div key={i} className="bg-white/10 rounded-2xl p-4 backdrop-blur">
                  <h4 className="text-white text-sm font-semibold mb-1">{insight.title}</h4>
                  <p className="text-white/60 text-xs">{insight.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
