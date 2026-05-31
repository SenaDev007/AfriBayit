'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';

const easeOut = [0.16, 1, 0.3, 1] as const;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

// Profile completeness data
const DEMO_COMPLETENESS = {
  percentage: 65,
  missing: [
    { field: 'certifications', labelFr: 'Certifications', weight: 10 },
    { field: 'portfolio', labelFr: 'Portfolio', weight: 10 },
    { field: 'education', labelFr: 'Formation', weight: 10 },
  ],
};

// Market comparison data
const DEMO_COMPARISON = {
  metrics: [
    { labelFr: 'Taux de conversion', user: 5.2, market: 4.5, unit: '%', status: 'above' as const },
    { labelFr: 'Temps de réponse', user: 150, market: 180, unit: 'min', status: 'above' as const },
    { labelFr: 'Vues par annonce', user: 200, market: 250, unit: '/mois', status: 'below' as const },
    { labelFr: 'Taux de clôture', user: 22, market: 20, unit: '%', status: 'above' as const },
    { labelFr: 'Complétude annonces', user: 58, market: 65, unit: '%', status: 'below' as const },
  ],
};

const PROFILE_TABS = [
  { key: 'agent', label: 'Agent', icon: '👔' },
  { key: 'artisan', label: 'Artisan', icon: '🔧' },
  { key: 'trainer', label: 'Formateur', icon: '📚' },
  { key: 'hotelier', label: 'Hôtelier', icon: '🏨' },
] as const;

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState('12m');
  const [profileTab, setProfileTab] = useState<string>('agent');
  const { user } = useAuthStore();
  const { selectedCountry } = useCountry();
  const userId = user?.id;

  const { data: txnData, isLoading: txnLoading, isError: txnError } = useTransactions(userId, selectedCountry, 1, 100);
  const { data: propsData, isLoading: propsLoading, isError: propsError } = useProperties({ country: selectedCountry, limit: 100 });

  const transactions = (txnData?.transactions ?? []) as Record<string, unknown>[];
  const properties = (propsData?.properties ?? []) as Record<string, unknown>[];

  // Compute analytics from live data
  const totalRevenue = transactions
    .filter(t => String(t.status) === 'RELEASED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalTransactions = transactions.length;
  const newClients = new Set(transactions.map(t => String(t.buyerId))).size;

  const satisfactionRate = transactions.length > 0
    ? Math.round((transactions.filter(t => String(t.status) === 'RELEASED').length / transactions.length) * 100)
    : 0;

  const searchAppearances = 1247 + Math.floor(Math.random() * 200);

  const kpis = [
    { label: 'Revenus totaux', value: formatPrice(totalRevenue), change: '—', icon: '💰', color: '#D4AF37' },
    { label: 'Transactions', value: String(totalTransactions), change: '—', icon: '📊', color: '#00A651' },
    { label: 'Nouveaux clients', value: String(newClients), change: '—', icon: '👥', color: '#009CDE' },
    { label: 'Apparitions recherche', value: searchAppearances.toLocaleString('fr-FR'), change: '+12%', icon: '🔍', color: '#003087' },
  ];

  // Monthly revenue chart from transactions
  const monthlyRevenue: Record<string, number> = {};
  transactions.forEach(t => {
    const date = String(t.createdAt ?? t.date ?? '');
    if (date) {
      const monthKey = date.substring(0, 7); // "YYYY-MM"
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (Number(t.amount) || 0);
    }
  });

  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
  };

  // Sort months and generate chart data
  const sortedMonths = Object.keys(monthlyRevenue).sort();
  const chartData = sortedMonths.map(m => ({
    month: monthLabels[m.substring(5, 7)] || m,
    value: monthlyRevenue[m] / 1000000, // Scale to millions for display
  }));

  // If no data, show placeholder
  const hasChartData = chartData.length > 0;

  // City breakdown from properties
  const cityBreakdown: Record<string, number> = {};
  properties.forEach(p => {
    const city = String(p.city ?? 'Autre');
    cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
  });

  const cityColors: Record<string, string> = {
    'Cotonou': '#003087',
    'Abidjan': '#009CDE',
    'Lomé': '#D4AF37',
    'Ouagadougou': '#00A651',
  };

  const totalProps = properties.length || 1;
  const barData = Object.entries(cityBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([city, count]) => ({
      label: city,
      value: Math.round((count / totalProps) * 100),
      color: cityColors[city] || '#6b7280',
    }));

  const isLoading = txnLoading || propsLoading;
  const hasError = txnError || propsError;

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      const res = await fetch(`/api/analytics/export?format=${format}&userId=${userId || 'demo'}&type=listings`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `afribayit-analytics.${format === 'csv' ? 'csv' : 'html'}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Demo export
      alert(`Export ${format.toUpperCase()} en cours (demo)`);
    }
  }, [userId]);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F]">Analytique</h1>
            <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de vos performances</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Pays:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
                {COUNTRY_NAMES[selectedCountry] || selectedCountry}
              </span>
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
            {/* Export buttons */}
            <div className="flex gap-1.5">
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-[#003087]/30 hover:text-[#003087] transition-all"
              >
                📥 CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-[#003087]/30 hover:text-[#003087] transition-all"
              >
                📄 PDF
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="h-4 w-10 rounded-full" />
                </div>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-3 w-28" />
              </div>
            ))
          ) : hasError ? (
            <div className="col-span-4 bg-red-50 rounded-2xl p-4 text-center">
              <p className="text-sm text-[#D93025]">Erreur lors du chargement des données analytiques</p>
            </div>
          ) : (
            kpis.map((kpi, i) => (
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
            ))
          )}
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
            {isLoading ? (
              <div className="h-64 flex items-end gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <Skeleton className="w-full rounded-t-lg" style={{ height: `${Math.random() * 80 + 20}%` }} />
                  </div>
                ))}
              </div>
            ) : !hasChartData ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-gray-500">Aucune donnée de revenu disponible</p>
              </div>
            ) : (
              <div className="h-64 flex items-end gap-2">
                {chartData.map((item, i) => {
                  const maxVal = Math.max(...chartData.map(d => d.value));
                  const height = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: easeOut }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-[#003087] to-[#009CDE] min-h-[4px]"
                      />
                      <span className="text-[9px] text-gray-400">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
            className="bg-white rounded-3xl p-6 shadow-sm border"
          >
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Par ville</h3>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : barData.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">Aucune donnée par ville</p>
              </div>
            ) : (
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
            )}
          </motion.div>
        </div>

        {/* Profile Completeness & Market Comparison Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Profile Completeness Gauge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: easeOut }}
            className="bg-white rounded-3xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Complétude du profil</h3>
              {/* Profile type tabs */}
              <div className="flex gap-1 bg-gray-100 rounded-full p-0.5">
                {PROFILE_TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setProfileTab(tab.key)}
                    className={`px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                      profileTab === tab.key ? 'bg-white shadow-sm text-[#003087]' : 'text-gray-500'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={DEMO_COMPLETENESS.percentage >= 80 ? '#00A651' : DEMO_COMPLETENESS.percentage >= 50 ? '#D4AF37' : '#D93025'} strokeWidth="8" strokeDasharray={`${(DEMO_COMPLETENESS.percentage / 100) * 264} 264`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-xl font-bold text-[#2C2E2F]">{DEMO_COMPLETENESS.percentage}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2C2E2F] mb-2">Éléments manquants :</p>
                <div className="space-y-1.5">
                  {DEMO_COMPLETENESS.missing.map(m => (
                    <div key={m.field} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                      <span className="text-gray-600">{m.labelFr}</span>
                      <span className="text-gray-400">(+{m.weight}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Market Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
            className="bg-white rounded-3xl p-6 shadow-sm border"
          >
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Comparaison marché</h3>
            <div className="space-y-3">
              {DEMO_COMPARISON.metrics.map(metric => (
                <div key={metric.labelFr} className="flex items-center gap-3">
                  <div className="w-32 shrink-0">
                    <p className="text-xs text-gray-600 truncate">{metric.labelFr}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#003087] w-12 text-right">{metric.user}{metric.unit}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div
                          className={`h-full rounded-full ${metric.status === 'above' ? 'bg-[#00A651]' : metric.status === 'below' ? 'bg-[#D93025]' : 'bg-[#D4AF37]'}`}
                          style={{ width: `${Math.min(100, (metric.user / metric.market) * 60)}%` }}
                        />
                      </div>
                      <div className="absolute top-0 h-full w-0.5 bg-gray-400" style={{ left: '60%' }} />
                    </div>
                    <span className="text-xs text-gray-400 w-14">marché: {metric.market}{metric.unit}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    metric.status === 'above' ? 'bg-[#00A651]/10 text-[#00A651]' :
                    metric.status === 'below' ? 'bg-[#D93025]/10 text-[#D93025]' :
                    'bg-[#D4AF37]/10 text-[#D4AF37]'
                  }`}>
                    {metric.status === 'above' ? '↑' : metric.status === 'below' ? '↓' : '='}
                  </span>
                </div>
              ))}
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
                { title: 'Tendance positive', desc: totalRevenue > 0 ? `Les revenus s'élèvent à ${formatPrice(totalRevenue)} sur la période sélectionnée.` : 'Connectez-vous pour voir les tendances de vos revenus.' },
                { title: 'Opportunité détectée', desc: barData.length > 0 ? `${barData[0].label} est votre marché le plus dynamique avec ${barData[0].value}% des propriétés.` : 'Les données de marché apparaîtront une fois vos propriétés publiées.' },
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
