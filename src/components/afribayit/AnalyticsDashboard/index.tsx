'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useProperties } from '@/hooks/useProperties';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { Calendar, Coins, BarChart3, Download, Eye, Users } from 'lucide-react';

import { ANALYTICS_TABS, PERIOD_OPTIONS } from './tabs';
import {
  AGENT_ANALYTICS,
  CITY_COLORS,
  CONNECTIONS_GROWTH,
  CONTENT_ENGAGEMENT,
  MONTH_LABELS,
  PROFILE_VIEWS_DATA,
  SEARCH_APPEARANCES,
} from './demoData';
import { formatPrice } from './utils';

import OverviewPanel from './OverviewPanel';
import ProfileViewsPanel from './ProfileViewsPanel';
import SearchPanel from './SearchPanel';
import ProfilesPanel from './ProfilesPanel';
import HeatmapPanel from './HeatmapPanel';
import RebeccaPanel from './RebeccaPanel';
import ExportPanel from './ExportPanel';

import type {
  AnalyticsTab,
  BarDataPoint,
  ChartDataPoint,
  KPI,
  PeriodKey,
  ProfileTab,
} from './types';

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState<PeriodKey>('30j');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [activeProfile, setActiveProfile] = useState<ProfileTab>('agent');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const { user } = useAuthStore();
  const { selectedCountry } = useCountry();
  const userId = user?.id;

  const { data: txnData, isLoading: txnLoading, isError: txnError } = useTransactions(userId, selectedCountry, 1, 100);
  const { data: propsData, isLoading: propsLoading, isError: propsError } = useProperties({ country: selectedCountry, limit: 100 });

  const transactions = (txnData?.transactions ?? []) as Record<string, unknown>[];
  const properties = ((propsData?.properties ?? []) as unknown) as Record<string, unknown>[];

  const totalRevenue = transactions
    .filter(t => String(t.status) === 'RELEASED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalTransactions = transactions.length;
  const newClients = new Set(transactions.map(t => String(t.buyerId))).size;

  const periodKey = period === 'custom' ? '30j' : period;
  const profileViews = PROFILE_VIEWS_DATA[periodKey] || PROFILE_VIEWS_DATA['30j'];
  const connectionsData = CONNECTIONS_GROWTH[periodKey] || CONNECTIONS_GROWTH['30j'];
  const engagementData = CONTENT_ENGAGEMENT[periodKey] || CONTENT_ENGAGEMENT['30j'];

  const kpis: KPI[] = [
    { label: 'Revenus totaux', value: formatPrice(totalRevenue), change: '+12%', icon: <Coins className="w-4 h-4" />, color: '#D4AF37' },
    { label: 'Transactions', value: String(totalTransactions), change: '+8%', icon: <BarChart3 className="w-4 h-4" />, color: '#00A651' },
    { label: 'Nouveaux clients', value: String(newClients), change: '+5%', icon: <Users className="w-4 h-4" />, color: '#009CDE' },
    { label: 'Vues profil', value: profileViews.total.toLocaleString('fr-FR'), change: `+${profileViews.evolution}%`, icon: <Eye className="w-4 h-4" />, color: '#003087' },
  ];

  const chartData: ChartDataPoint[] = useMemo(() => {
    const monthlyRevenue: Record<string, number> = {};
    transactions.forEach(t => {
      const date = String(t.createdAt ?? t.date ?? '');
      if (date) {
        const monthKey = date.substring(0, 7);
        monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (Number(t.amount) || 0);
      }
    });
    const sortedMonths = Object.keys(monthlyRevenue).sort();
    return sortedMonths.map(m => ({
      month: MONTH_LABELS[m.substring(5, 7)] || m,
      value: monthlyRevenue[m] / 1000000,
    }));
  }, [transactions]);

  const hasChartData = chartData.length > 0;

  const barData: BarDataPoint[] = useMemo(() => {
    const cityBreakdown: Record<string, number> = {};
    properties.forEach(p => {
      const city = String(p.city ?? 'Autre');
      cityBreakdown[city] = (cityBreakdown[city] || 0) + 1;
    });
    const totalProps = properties.length || 1;
    return Object.entries(cityBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([city, count]) => ({
        label: city,
        value: Math.round((count / totalProps) * 100),
        color: CITY_COLORS[city] || '#6b7280',
      }));
  }, [properties]);

  const isLoading = txnLoading || propsLoading;
  const hasError = txnError || propsError;

  const searchAppearances = SEARCH_APPEARANCES[periodKey] || SEARCH_APPEARANCES['30j'];

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'pdf') {
      const htmlContent = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>AfriBayit Analytics Report</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:40px 20px;color:#2C2E2F}
  h1{color:#003087;font-size:24px;border-bottom:3px solid #D4AF37;padding-bottom:8px}
  h2{color:#003087;font-size:18px;margin-top:24px}
  .kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
  .kpi{background:#f8f9fa;border-radius:12px;padding:16px}
  .kpi-label{font-size:12px;color:#6b7280}.kpi-value{font-size:24px;font-weight:700;color:#003087}
  table{width:100%;border-collapse:collapse;margin:12px 0}
  th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px}
  th{color:#6b7280;font-weight:500}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af}
  .badge{display:inline-block;background:#00A651;color:white;padding:2px 8px;border-radius:12px;font-size:11px}
</style></head><body>
<h1>AfriBayit - Rapport Analytique</h1>
<p>Période : ${PERIOD_OPTIONS.find(p => p.key === period)?.label || period} | Pays : ${COUNTRY_NAMES[selectedCountry] || selectedCountry} | Généré le : ${new Date().toLocaleDateString('fr-FR')}</p>

<h2>Indicateurs clés</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-label">Revenus totaux</div><div class="kpi-value">${formatPrice(totalRevenue)}</div></div>
  <div class="kpi"><div class="kpi-label">Transactions</div><div class="kpi-value">${totalTransactions}</div></div>
  <div class="kpi"><div class="kpi-label">Nouveaux clients</div><div class="kpi-value">${newClients}</div></div>
  <div class="kpi"><div class="kpi-label">Vues profil</div><div class="kpi-value">${profileViews.total}</div></div>
</div>

<h2>Vues de profil par origine</h2>
<table><tr><th>Origine</th><th>Vues</th><th>Part</th></tr>
<tr><td>Recherche</td><td>${profileViews.search}</td><td>${Math.round((profileViews.search / profileViews.total) * 100)}%</td></tr>
<tr><td>Accès direct</td><td>${profileViews.direct}</td><td>${Math.round((profileViews.direct / profileViews.total) * 100)}%</td></tr>
<tr><td>Referral</td><td>${profileViews.referral}</td><td>${Math.round((profileViews.referral / profileViews.total) * 100)}%</td></tr>
</table>

<h2>Apparitions en recherche</h2>
<table><tr><th>Mot-clé</th><th>Apparitions</th><th>Clics</th><th>CTR</th></tr>
${searchAppearances.map(kw => `<tr><td>${kw.keyword}</td><td>${kw.appearances}</td><td>${kw.clicks}</td><td>${kw.ctr}%</td></tr>`).join('')}
</table>

<h2>Entonnoir de conversion (Agent)</h2>
<table><tr><th>Étape</th><th>Nombre</th><th>%</th></tr>
${AGENT_ANALYTICS.conversionFunnel.map(s => `<tr><td>${s.stage}</td><td>${s.count}</td><td>${s.pct}%</td></tr>`).join('')}
</table>

<h2>Comparaison marché</h2>
<p><span class="badge">Insight</span> Votre taux de conversion est 18% supérieur à la moyenne des agents de ${AGENT_ANALYTICS.localRanking.city}.</p>

<div class="footer">AfriBayit - Plateforme Immobilière Pan-Africaine | Rapport généré automatiquement par Rebecca IA</div>
</body></html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => { printWindow.print(); };
      }
      return;
    }

    try {
      const res = await fetch(`/api/analytics/export?format=${format}&userId=${userId || 'demo'}&type=listings`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `afribayit-analytics.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      const csvRows = [
        'Métrique,Valeur',
        `Revenus totaux,${totalRevenue}`,
        `Transactions,${totalTransactions}`,
        `Nouveaux clients,${newClients}`,
        `Vues profil (${period}),${profileViews.total}`,
        `Taux de conversion,${AGENT_ANALYTICS.conversionFunnel[4].pct}%`,
        `Temps de vente moyen,${AGENT_ANALYTICS.timeToSale.avg} jours`,
        `Classement local,${AGENT_ANALYTICS.localRanking.position}/${AGENT_ANALYTICS.localRanking.totalAgents}`,
        `ROI Premium,${AGENT_ANALYTICS.roiPremium.roi}%`,
        `Volume transactions,${AGENT_ANALYTICS.volumeTransactions.total}`,
      ];
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `afribayit-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#2C2E2F]">Analytique</h1>
            <p className="text-sm text-gray-500 mt-1">Vue d&apos;ensemble de vos performances</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Pays:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
                {COUNTRY_NAMES[selectedCountry] || selectedCountry}
              </span>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-full p-0.5">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    period === p.key ? 'bg-white shadow-sm text-[#003087]' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#003087] text-white text-xs font-medium hover:bg-[#003087]/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter
            </button>
          </div>
        </div>

        {/* Custom date range */}
        <AnimatePresence>
          {period === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-center gap-3 bg-white p-3 rounded-xl border shadow-sm"
            >
              <Calendar className="w-4 h-4 text-gray-400" />
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#003087]" />
              <span className="text-sm text-gray-500">à</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#003087]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {ANALYTICS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <OverviewPanel
            isLoading={isLoading}
            hasError={hasError}
            kpis={kpis}
            chartData={chartData}
            hasChartData={hasChartData}
            barData={barData}
            connectionsData={connectionsData}
            engagementData={engagementData}
            totalRevenue={totalRevenue}
          />
        )}

        {activeTab === 'profile_views' && (
          <ProfileViewsPanel profileViews={profileViews} />
        )}

        {activeTab === 'search' && (
          <SearchPanel searchAppearances={searchAppearances} />
        )}

        {activeTab === 'profiles' && (
          <ProfilesPanel activeProfile={activeProfile} setActiveProfile={setActiveProfile} />
        )}

        {activeTab === 'heatmap' && <HeatmapPanel />}

        {activeTab === 'rebecca' && <RebeccaPanel />}

        {activeTab === 'export' && <ExportPanel onExport={handleExport} />}
      </div>
    </section>
  );
}
