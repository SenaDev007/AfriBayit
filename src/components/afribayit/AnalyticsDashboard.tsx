'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useTransactions } from '@/hooks/useTransactions';
import { useProperties } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import {
  BarChart3,
  Coins,
  FileText,
  Inbox,
  Search,
  TrendingUp,
  Trophy,
  Users,
  Timer,
  Download,
  Star,
  MapPin,
  Briefcase,
  GraduationCap,
  Landmark,
  Lightbulb,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Eye,
  MousePointerClick,
  Heart,
  Phone,
  Target,
  Award,
  Zap,
  Crown,
  Shield,
  Building2,
  Wrench,
  BookOpen,
  Banknote,
  ChevronRight,
  Globe2,
  LayoutGrid,
  PieChart,
} from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

// ─── Period Types ───
type PeriodKey = '7j' | '30j' | '3m' | '12m' | 'custom';
type ProfileTab = 'agent' | 'artisan' | 'formateur' | 'investisseur';
type AnalyticsTab = 'overview' | 'profile_views' | 'search' | 'profiles' | 'heatmap' | 'rebecca' | 'export';

// ─── Period Data ───
const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: '7j', label: '7j' },
  { key: '30j', label: '30j' },
  { key: '3m', label: '3 mois' },
  { key: '12m', label: '12 mois' },
  { key: 'custom', label: 'Personnalisé' },
];

// ─── Profile Views Demo Data ───
const PROFILE_VIEWS_DATA: Record<string, { total: number; direct: number; search: number; referral: number }> = {
  '7j': { total: 142, direct: 45, search: 62, referral: 35 },
  '30j': { total: 587, direct: 189, search: 248, referral: 150 },
  '3m': { total: 1842, direct: 580, search: 782, referral: 480 },
  '12m': { total: 7250, direct: 2280, search: 3070, referral: 1900 },
};

// ─── Search Appearances ───
const SEARCH_APPEARANCES: Record<string, { keyword: string; appearances: number; clicks: number; ctr: number }[]> = {
  '7j': [
    { keyword: 'villa Cotonou', appearances: 28, clicks: 5, ctr: 17.8 },
    { keyword: 'terrain Abidjan', appearances: 22, clicks: 4, ctr: 18.2 },
    { keyword: 'appartement Lomé', appearances: 15, clicks: 3, ctr: 20.0 },
    { keyword: 'maison Ouagadougou', appearances: 12, clicks: 2, ctr: 16.7 },
    { keyword: 'investissement Bénin', appearances: 8, clicks: 1, ctr: 12.5 },
  ],
  '30j': [
    { keyword: 'villa Cotonou', appearances: 112, clicks: 19, ctr: 17.0 },
    { keyword: 'terrain Abidjan', appearances: 95, clicks: 16, ctr: 16.8 },
    { keyword: 'appartement Lomé', appearances: 68, clicks: 12, ctr: 17.6 },
    { keyword: 'maison Ouagadougou', appearances: 45, clicks: 7, ctr: 15.6 },
    { keyword: 'investissement Bénin', appearances: 32, clicks: 5, ctr: 15.6 },
  ],
  '3m': [
    { keyword: 'villa Cotonou', appearances: 342, clicks: 58, ctr: 17.0 },
    { keyword: 'terrain Abidjan', appearances: 285, clicks: 47, ctr: 16.5 },
    { keyword: 'appartement Lomé', appearances: 198, clicks: 35, ctr: 17.7 },
    { keyword: 'maison Ouagadougou', appearances: 142, clicks: 22, ctr: 15.5 },
    { keyword: 'investissement Bénin', appearances: 95, clicks: 14, ctr: 14.7 },
  ],
  '12m': [
    { keyword: 'villa Cotonou', appearances: 1340, clicks: 228, ctr: 17.0 },
    { keyword: 'terrain Abidjan', appearances: 1120, clicks: 187, ctr: 16.7 },
    { keyword: 'appartement Lomé', appearances: 780, clicks: 138, ctr: 17.7 },
    { keyword: 'maison Ouagadougou', appearances: 560, clicks: 87, ctr: 15.5 },
    { keyword: 'investissement Bénin', appearances: 380, clicks: 56, ctr: 14.7 },
  ],
};

// ─── Agent Analytics ───
const AGENT_ANALYTICS = {
  timeToSale: { avg: 45, median: 32, best: 7, unit: 'jours' },
  conversionFunnel: [
    { stage: 'Vues annonce', count: 1247, pct: 100 },
    { stage: 'Contacts', count: 89, pct: 7.1 },
    { stage: 'Visites', count: 34, pct: 2.7 },
    { stage: 'Offres', count: 12, pct: 1.0 },
    { stage: 'Ventes', count: 5, pct: 0.4 },
  ],
  localRanking: { position: 3, totalAgents: 47, city: 'Cotonou', score: 87 },
};

// ─── Artisan Analytics ───
const ARTISAN_ANALYTICS = {
  missionsCompleted: 28,
  avgRating: 4.7,
  responseTime: 45,
  repeatClients: 62,
  monthlyRevenue: 1250000,
  specialties: [
    { name: 'Carrelage', missions: 12, rating: 4.8 },
    { name: 'Peinture', missions: 9, rating: 4.6 },
    { name: 'Plomberie', missions: 7, rating: 4.7 },
  ],
  conversionFunnel: [
    { stage: 'Demandes reçues', count: 85, pct: 100 },
    { stage: 'Devis envoyés', count: 62, pct: 72.9 },
    { stage: 'Devis acceptés', count: 38, pct: 44.7 },
    { stage: 'Missions terminées', count: 28, pct: 32.9 },
  ],
};

// ─── Formateur Analytics ───
const FORMATEUR_ANALYTICS = {
  coursesPublished: 4,
  totalStudents: 342,
  avgRating: 4.8,
  completionRate: 78,
  monthlyRevenue: 850000,
  topCourses: [
    { name: 'Droit foncier Bénin', students: 145, rating: 4.9, revenue: 362500 },
    { name: 'Investissement immobilier', students: 112, rating: 4.7, revenue: 280000 },
    { name: 'Gestion locative', students: 85, rating: 4.8, revenue: 212500 },
  ],
  conversionFunnel: [
    { stage: 'Vues cours', count: 2840, pct: 100 },
    { stage: 'Inscriptions', count: 520, pct: 18.3 },
    { stage: 'Complétions', count: 342, pct: 12.0 },
    { stage: 'Certificats', count: 267, pct: 9.4 },
  ],
};

// ─── Investisseur Analytics ───
const INVESTISSEUR_ANALYTICS = {
  portfolioValue: 85000000,
  totalROI: 14.2,
  propertiesOwned: 6,
  monthlyRentalIncome: 1450000,
  occupancyRate: 92,
  investments: [
    { name: 'Villa Cotonou Godomey', value: 25000000, roi: 16.5, type: 'villa' },
    { name: 'Appartement Abidjan Cocody', value: 18000000, roi: 12.8, type: 'appartement' },
    { name: 'Terrain Lomé Agoè', value: 15000000, roi: 22.0, type: 'terrain' },
    { name: 'Commerce Cotonou Ganhi', value: 12000000, roi: 10.5, type: 'commerce' },
  ],
  conversionFunnel: [
    { stage: 'Biens analysés', count: 340, pct: 100 },
    { stage: 'Visites effectuées', count: 45, pct: 13.2 },
    { stage: 'Offres faites', count: 12, pct: 3.5 },
    { stage: 'Acquisitions', count: 6, pct: 1.8 },
  ],
};

// ─── Profile Completeness ───
const DEMO_COMPLETENESS = {
  percentage: 65,
  missing: [
    { field: 'certifications', labelFr: 'Certifications', weight: 10 },
    { field: 'portfolio', labelFr: 'Portfolio', weight: 10 },
    { field: 'education', labelFr: 'Formation', weight: 10 },
  ],
};

// ─── Market Comparison ───
const DEMO_COMPARISON = {
  metrics: [
    { labelFr: 'Taux de conversion', user: 5.2, market: 4.5, unit: '%', status: 'above' as const },
    { labelFr: 'Temps de réponse', user: 150, market: 180, unit: 'min', status: 'above' as const },
    { labelFr: 'Vues par annonce', user: 200, market: 250, unit: '/mois', status: 'below' as const },
    { labelFr: 'Taux de clôture', user: 22, market: 20, unit: '%', status: 'above' as const },
    { labelFr: 'Complétude annonces', user: 58, market: 65, unit: '%', status: 'below' as const },
  ],
};

// ─── Zone Heatmap Data ───
const ZONE_PERFORMANCE = [
  { zone: 'Cotonou Godomey', performance: 87, trend: 'up' as const, avgPrice: 35000000 },
  { zone: 'Cotonou Ganhi', performance: 72, trend: 'up' as const, avgPrice: 28000000 },
  { zone: 'Abidjan Cocody', performance: 91, trend: 'up' as const, avgPrice: 45000000 },
  { zone: 'Abidjan Yopougon', performance: 65, trend: 'down' as const, avgPrice: 18000000 },
  { zone: 'Lomé Agoè', performance: 58, trend: 'stable' as const, avgPrice: 12000000 },
  { zone: 'Ouagadougou Koulouba', performance: 44, trend: 'down' as const, avgPrice: 15000000 },
  { zone: 'Cotonou Fidjrossè', performance: 79, trend: 'up' as const, avgPrice: 22000000 },
  { zone: 'Abidjan Plateau', performance: 95, trend: 'up' as const, avgPrice: 65000000 },
];

// ─── Rebecca Recommendations ───
const REBECCA_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    title: 'Optimisez vos annonces',
    description: 'Ajoutez des photos HD et une description détaillée pour augmenter vos vues de 40%. Les annonces avec 8+ photos reçoivent 2x plus de contacts.',
    action: 'Compléter mes annonces',
    priority: 'high' as const,
    icon: 'listing' as const,
  },
  {
    id: 'rec-2',
    title: 'Répondez plus rapidement',
    description: 'Votre temps de réponse moyen est de 150 min. Les agents qui répondent en moins de 30 min ont un taux de conversion 3x supérieur.',
    action: 'Voir les messages non lus',
    priority: 'high' as const,
    icon: 'message' as const,
  },
  {
    id: 'rec-3',
    title: 'Passez en Premium Essentiel',
    description: 'Avec le plan Essentiel, vos annonces seraient vues en premier. Boost x1.5 sur toutes vos publications. ROI estimé: +35% de contacts.',
    action: 'Découvrir Premium',
    priority: 'medium' as const,
    icon: 'premium' as const,
  },
  {
    id: 'rec-4',
    title: 'Ciblez Godomey et Cocody',
    description: 'Ces zones montrent une forte demande actuelle. 3 de vos annonces correspondent aux critères recherchés dans ces quartiers.',
    action: 'Voir les opportunités',
    priority: 'medium' as const,
    icon: 'location' as const,
  },
  {
    id: 'rec-5',
    title: 'Obtenez votre certification',
    description: 'Les agents certifiés gagnent 28% plus de confiance. Complétez votre vérification KYC pour débloquer le badge certifié.',
    action: 'Commencer la vérification',
    priority: 'low' as const,
    icon: 'cert' as const,
  },
];

// ─── Tab Definitions ───
const ANALYTICS_TABS: { key: AnalyticsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'profile_views', label: 'Vues profil', icon: <Eye className="w-4 h-4" /> },
  { key: 'search', label: 'Recherche', icon: <Search className="w-4 h-4" /> },
  { key: 'profiles', label: 'Par profil', icon: <Users className="w-4 h-4" /> },
  { key: 'heatmap', label: 'Zone', icon: <MapPin className="w-4 h-4" /> },
  { key: 'rebecca', label: 'Rebecca', icon: <Lightbulb className="w-4 h-4" /> },
  { key: 'export', label: 'Export', icon: <Download className="w-4 h-4" /> },
];

// ─── Profile Tab Definitions ───
const PROFILE_TABS_DEF: { key: ProfileTab; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'agent', label: 'Agent', icon: <Briefcase className="w-4 h-4" />, color: '#003087' },
  { key: 'artisan', label: 'Artisan', icon: <Wrench className="w-4 h-4" />, color: '#D4AF37' },
  { key: 'formateur', label: 'Formateur', icon: <BookOpen className="w-4 h-4" />, color: '#009CDE' },
  { key: 'investisseur', label: 'Investisseur', icon: <Landmark className="w-4 h-4" />, color: '#00A651' },
];

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

  // Compute analytics from live data
  const totalRevenue = transactions
    .filter(t => String(t.status) === 'RELEASED')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalTransactions = transactions.length;
  const newClients = new Set(transactions.map(t => String(t.buyerId))).size;

  const periodKey = period === 'custom' ? '30j' : period;
  const profileViews = PROFILE_VIEWS_DATA[periodKey === '7j' ? '7j' : periodKey === '30j' ? '30j' : periodKey === '3m' ? '3m' : '12m'];

  const kpis = [
    { label: 'Revenus totaux', value: formatPrice(totalRevenue), change: '+12%', icon: <Coins className="w-4 h-4" />, color: '#D4AF37' },
    { label: 'Transactions', value: String(totalTransactions), change: '+8%', icon: <BarChart3 className="w-4 h-4" />, color: '#00A651' },
    { label: 'Nouveaux clients', value: String(newClients), change: '+5%', icon: <Users className="w-4 h-4" />, color: '#009CDE' },
    { label: 'Vues profil', value: profileViews.total.toLocaleString('fr-FR'), change: '+18%', icon: <Eye className="w-4 h-4" />, color: '#003087' },
  ];

  // Monthly revenue chart
  const monthlyRevenue: Record<string, number> = {};
  transactions.forEach(t => {
    const date = String(t.createdAt ?? t.date ?? '');
    if (date) {
      const monthKey = date.substring(0, 7);
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (Number(t.amount) || 0);
    }
  });

  const monthLabels: Record<string, string> = {
    '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Aoû', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
  };

  const sortedMonths = Object.keys(monthlyRevenue).sort();
  const chartData = sortedMonths.map(m => ({
    month: monthLabels[m.substring(5, 7)] || m,
    value: monthlyRevenue[m] / 1000000,
  }));

  const hasChartData = chartData.length > 0;

  // City breakdown
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
      // Fallback CSV export
      const csvRows = [
        'Métrique,Valeur',
        `Revenus totaux,${totalRevenue}`,
        `Transactions,${totalTransactions}`,
        `Nouveaux clients,${newClients}`,
        `Vues profil (${period}),${profileViews.total}`,
        `Taux de conversion,${AGENT_ANALYTICS.conversionFunnel[4].pct}%`,
        `Temps de vente moyen,${AGENT_ANALYTICS.timeToSale.avg} jours`,
        `Classement local,${AGENT_ANALYTICS.localRanking.position}/${AGENT_ANALYTICS.localRanking.totalAgents}`,
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
  }, [userId, totalRevenue, totalTransactions, newClients, period, profileViews]);

  const searchAppearances = SEARCH_APPEARANCES[periodKey] || SEARCH_APPEARANCES['30j'];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Header ─── */}
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
            {/* ─── Period Selector ─── */}
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
            {/* Export button */}
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
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#003087]"
                placeholder="Début"
              />
              <span className="text-sm text-gray-500">à</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#003087]"
                placeholder="Fin"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Tabs ─── */}
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

        {/* ═══════════════════════════════════════════ */}
        {/* OVERVIEW TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
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
                      <span style={{ color: kpi.color }}>{kpi.icon}</span>
                      <span className="text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">
                        {kpi.change}
                      </span>
                    </div>
                    <p className="font-mono text-lg sm:text-xl font-bold text-[#2C2E2F]">{kpi.value}</p>
                    <p className="text-xs text-gray-500">{kpi.label}</p>
                  </motion.div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border"
              >
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Revenus mensuels</h3>
                {!hasChartData ? (
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

              {/* City Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
                className="bg-white rounded-3xl p-6 shadow-sm border"
              >
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Par ville</h3>
                {barData.length === 0 ? (
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
                            <span className="font-mono text-sm font-bold" style={{ color: item.color }}>{item.value}%</span>
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

            {/* Profile Completeness & Market Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45, ease: easeOut }}
                className="bg-white rounded-3xl p-6 shadow-sm border"
              >
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Complétude du profil</h3>
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

              {/* Market Comparison with text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
                className="bg-white rounded-3xl p-6 shadow-sm border"
              >
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Comparaison marché</h3>
                <div className="space-y-3">
                  {DEMO_COMPARISON.metrics.map(metric => {
                    const diff = metric.status === 'above'
                      ? Math.round(((metric.user - metric.market) / metric.market) * 100)
                      : Math.round(((metric.market - metric.user) / metric.market) * 100);
                    return (
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
                        {metric.status === 'above' ? (
                          <ArrowUpRight className="w-3.5 h-3.5 text-[#00A651]" />
                        ) : metric.status === 'below' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-[#D93025]" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-[#D4AF37]" />
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Market comparison insight */}
                <div className="mt-4 p-3 bg-[#00A651]/5 rounded-xl border border-[#00A651]/10">
                  <p className="text-xs text-[#2C2E2F]">
                    <span className="font-semibold text-[#00A651]">Votre taux de conversion est 15.6% supérieur</span> à la moyenne des agents de {AGENT_ANALYTICS.localRanking.city}.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Rebecca Mini Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
              className="mt-6 bg-gradient-to-r from-[#003087] to-[#003087]/90 rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
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
          </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* PROFILE VIEWS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'profile_views' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <Eye className="w-4 h-4 text-[#003087] mb-1" />
                <p className="font-mono text-xl font-bold text-[#003087] mt-1">{profileViews.total}</p>
                <p className="text-xs text-gray-500">Vues totales</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <MousePointerClick className="w-4 h-4 text-[#00A651] mb-1" />
                <p className="font-mono text-xl font-bold text-[#00A651] mt-1">{profileViews.direct}</p>
                <p className="text-xs text-gray-500">Accès direct</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <Search className="w-4 h-4 text-[#009CDE] mb-1" />
                <p className="font-mono text-xl font-bold text-[#009CDE] mt-1">{profileViews.search}</p>
                <p className="text-xs text-gray-500">Via recherche</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <Users className="w-4 h-4 text-[#D4AF37] mb-1" />
                <p className="font-mono text-xl font-bold text-[#D4AF37] mt-1">{profileViews.referral}</p>
                <p className="text-xs text-gray-500">Via referral</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Origine des vues</h3>
              <div className="space-y-4">
                {[
                  { label: 'Recherche', value: profileViews.search, total: profileViews.total, color: '#009CDE' },
                  { label: 'Accès direct', value: profileViews.direct, total: profileViews.total, color: '#00A651' },
                  { label: 'Referral', value: profileViews.referral, total: profileViews.total, color: '#D4AF37' },
                ].map((item, i) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="font-mono text-sm font-bold" style={{ color: item.color }}>
                        {item.value} ({Math.round((item.value / item.total) * 100)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.value / item.total) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* SEARCH APPEARANCES TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#009CDE]" />
                Apparitions en recherche
              </h3>
              <p className="text-sm text-gray-500 mb-4">Mots-clés par lesquels vos biens apparaissent dans les résultats de recherche.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-500 font-medium">Mot-clé</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Apparitions</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Clics</th>
                      <th className="text-right py-2 text-gray-500 font-medium">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchAppearances.map((kw) => (
                      <tr key={kw.keyword} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 font-medium text-[#2C2E2F]">{kw.keyword}</td>
                        <td className="py-3 text-right font-mono">{kw.appearances}</td>
                        <td className="py-3 text-right font-mono text-[#003087]">{kw.clicks}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            kw.ctr >= 17 ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                          }`}>
                            {kw.ctr}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* PER-PROFILE ANALYTICS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'profiles' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Profile Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {PROFILE_TABS_DEF.map((pt) => (
                <button
                  key={pt.key}
                  onClick={() => setActiveProfile(pt.key)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    activeProfile === pt.key
                      ? 'text-white shadow-md'
                      : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                  style={activeProfile === pt.key ? { backgroundColor: pt.color } : {}}
                >
                  {pt.icon}
                  {pt.label}
                </button>
              ))}
            </div>

            {/* Agent Profile */}
            {activeProfile === 'agent' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-[#003087]" />
                    <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Temps de vente moyen</h4>
                    <p className="font-mono text-2xl font-bold text-[#00A651]">{AGENT_ANALYTICS.timeToSale.avg} jours</p>
                    <p className="text-xs text-gray-500 mt-1">Médiane : {AGENT_ANALYTICS.timeToSale.median}j · Record : {AGENT_ANALYTICS.timeToSale.best}j</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-[#D4AF37]" />
                    <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Classement local</h4>
                    <p className="font-mono text-2xl font-bold text-[#D4AF37]">#{AGENT_ANALYTICS.localRanking.position}</p>
                    <p className="text-xs text-gray-500 mt-1">sur {AGENT_ANALYTICS.localRanking.totalAgents} agents · {AGENT_ANALYTICS.localRanking.city}</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-sm border text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-[#009CDE]" />
                    <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Score agent</h4>
                    <p className="font-mono text-2xl font-bold text-[#003087]">{AGENT_ANALYTICS.localRanking.score}/100</p>
                    <p className="text-xs text-gray-500 mt-1">Basé sur performance + avis + activité</p>
                  </motion.div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir de conversion</h3>
                  <div className="space-y-3">
                    {AGENT_ANALYTICS.conversionFunnel.map((stage, i) => (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <div className="w-36 shrink-0 text-sm text-gray-600">{stage.stage}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }}
                            className="h-8 rounded-xl flex items-center justify-end pr-2"
                            style={{
                              backgroundColor: i === 0 ? '#003087' : i === AGENT_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#009CDE',
                              minWidth: stage.pct > 0 ? '40px' : '0',
                            }}
                          >
                            <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                          </motion.div>
                          <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Artisan Profile */}
            {activeProfile === 'artisan' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Wrench className="w-5 h-5 text-[#D4AF37] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.missionsCompleted}</p>
                    <p className="text-xs text-gray-500">Missions terminées</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Star className="w-5 h-5 text-[#D4AF37] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.avgRating}</p>
                    <p className="text-xs text-gray-500">Note moyenne</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Timer className="w-5 h-5 text-[#009CDE] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.responseTime} min</p>
                    <p className="text-xs text-gray-500">Temps de réponse</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Users className="w-5 h-5 text-[#00A651] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{ARTISAN_ANALYTICS.repeatClients}%</p>
                    <p className="text-xs text-gray-500">Clients récurrents</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir de conversion artisan</h3>
                  <div className="space-y-3">
                    {ARTISAN_ANALYTICS.conversionFunnel.map((stage, i) => (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <div className="w-40 shrink-0 text-sm text-gray-600">{stage.stage}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }}
                            className="h-8 rounded-xl flex items-center justify-end pr-2"
                            style={{ backgroundColor: i === ARTISAN_ANALYTICS.conversionFunnel.length - 1 ? '#D4AF37' : '#003087', minWidth: '40px' }}
                          >
                            <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                          </motion.div>
                          <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Spécialités</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {ARTISAN_ANALYTICS.specialties.map(spec => (
                      <div key={spec.name} className="p-4 bg-gray-50 rounded-xl">
                        <p className="font-semibold text-sm text-[#2C2E2F]">{spec.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{spec.missions} missions · <span className="text-[#D4AF37]">{spec.rating}/5</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Formateur Profile */}
            {activeProfile === 'formateur' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <BookOpen className="w-5 h-5 text-[#009CDE] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{FORMATEUR_ANALYTICS.coursesPublished}</p>
                    <p className="text-xs text-gray-500">Cours publiés</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <GraduationCap className="w-5 h-5 text-[#003087] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{FORMATEUR_ANALYTICS.totalStudents}</p>
                    <p className="text-xs text-gray-500">Étudiants total</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Star className="w-5 h-5 text-[#D4AF37] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{FORMATEUR_ANALYTICS.avgRating}</p>
                    <p className="text-xs text-gray-500">Note moyenne</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Award className="w-5 h-5 text-[#00A651] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{FORMATEUR_ANALYTICS.completionRate}%</p>
                    <p className="text-xs text-gray-500">Taux de complétion</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir de conversion formateur</h3>
                  <div className="space-y-3">
                    {FORMATEUR_ANALYTICS.conversionFunnel.map((stage, i) => (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <div className="w-40 shrink-0 text-sm text-gray-600">{stage.stage}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }}
                            className="h-8 rounded-xl flex items-center justify-end pr-2"
                            style={{ backgroundColor: i === FORMATEUR_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#009CDE', minWidth: '40px' }}
                          >
                            <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                          </motion.div>
                          <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Cours les plus performants</h3>
                  <div className="space-y-3">
                    {FORMATEUR_ANALYTICS.topCourses.map(course => (
                      <div key={course.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-semibold text-sm text-[#2C2E2F]">{course.name}</p>
                          <p className="text-xs text-gray-500">{course.students} étudiants · <span className="text-[#D4AF37]">{course.rating}/5</span></p>
                        </div>
                        <p className="font-mono text-sm font-bold text-[#00A651]">{formatPrice(course.revenue)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Investisseur Profile */}
            {activeProfile === 'investisseur' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Landmark className="w-5 h-5 text-[#00A651] mb-1" />
                    <p className="font-mono text-lg font-bold text-[#2C2E2F]">{formatPrice(INVESTISSEUR_ANALYTICS.portfolioValue)}</p>
                    <p className="text-xs text-gray-500">Valeur portefeuille</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <TrendingUp className="w-5 h-5 text-[#00A651] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#00A651]">{INVESTISSEUR_ANALYTICS.totalROI}%</p>
                    <p className="text-xs text-gray-500">ROI total</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Building2 className="w-5 h-5 text-[#003087] mb-1" />
                    <p className="font-mono text-xl font-bold text-[#2C2E2F]">{INVESTISSEUR_ANALYTICS.propertiesOwned}</p>
                    <p className="text-xs text-gray-500">Biens détenus</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border">
                    <Banknote className="w-5 h-5 text-[#D4AF37] mb-1" />
                    <p className="font-mono text-lg font-bold text-[#2C2E2F]">{formatPrice(INVESTISSEUR_ANALYTICS.monthlyRentalIncome)}</p>
                    <p className="text-xs text-gray-500">Revenus locatifs/mois</p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Entonnoir d'investissement</h3>
                  <div className="space-y-3">
                    {INVESTISSEUR_ANALYTICS.conversionFunnel.map((stage, i) => (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <div className="w-40 shrink-0 text-sm text-gray-600">{stage.stage}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stage.pct}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }}
                            className="h-8 rounded-xl flex items-center justify-end pr-2"
                            style={{ backgroundColor: i === INVESTISSEUR_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#003087', minWidth: '40px' }}
                          >
                            <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                          </motion.div>
                          <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Portefeuille immobilier</h3>
                  <div className="space-y-3">
                    {INVESTISSEUR_ANALYTICS.investments.map(inv => (
                      <div key={inv.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-[#003087]" />
                          <div>
                            <p className="font-semibold text-sm text-[#2C2E2F]">{inv.name}</p>
                            <p className="text-xs text-gray-500">{inv.type} · {formatPrice(inv.value)}</p>
                          </div>
                        </div>
                        <span className={`font-mono text-sm font-bold ${inv.roi >= 15 ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>{inv.roi}% ROI</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-[#00A651]/5 rounded-xl border border-[#00A651]/10">
                    <p className="text-xs text-[#2C2E2F]">
                      <span className="font-semibold text-[#00A651]">Taux d'occupation : {INVESTISSEUR_ANALYTICS.occupancyRate}%</span> — Supérieur de 7% à la moyenne du marché.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* HEATMAP / ZONE TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'heatmap' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#D93025]" />
                Performance par zone
              </h3>
              <p className="text-sm text-gray-500 mb-6">Carte de chaleur des performances immobilières par quartier et ville.</p>

              {/* Heat Map Placeholder — Grid Visualization */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {ZONE_PERFORMANCE.map(zone => {
                  const heatColor = zone.performance >= 80
                    ? 'bg-[#00A651]'
                    : zone.performance >= 60
                    ? 'bg-[#D4AF37]'
                    : zone.performance >= 40
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#D93025]';
                  const heatOpacity = Math.max(0.3, zone.performance / 100);
                  return (
                    <motion.div
                      key={zone.zone}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative p-4 rounded-xl text-white ${heatColor} overflow-hidden`}
                      style={{ opacity: heatOpacity }}
                    >
                      <p className="font-semibold text-sm leading-tight">{zone.zone}</p>
                      <p className="font-mono text-2xl font-bold mt-1">{zone.performance}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {zone.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : zone.trend === 'down' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        <span className="text-xs">{zone.trend === 'up' ? 'En hausse' : zone.trend === 'down' ? 'En baisse' : 'Stable'}</span>
                      </div>
                      <p className="text-xs mt-1 opacity-80">Prix moy: {formatPrice(zone.avgPrice)}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 justify-center text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#00A651]" />
                  <span>Excellent (80+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#D4AF37]" />
                  <span>Bon (60-79)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#F59E0B]" />
                  <span>Moyen (40-59)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#D93025]" />
                  <span>Faible (&lt;40)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* REBECCA RECOMMENDATIONS TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'rebecca' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Rebecca Header */}
            <div className="bg-gradient-to-r from-[#003087] to-[#003087]/90 rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#D4AF37]/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center shadow-lg">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-white text-xl font-bold">Rebecca — Votre conseillère IA</h2>
                  <p className="text-white/60 text-sm mt-1">Recommandations personnalisées basées sur vos données et les tendances du marché</p>
                </div>
              </div>
            </div>

            {/* Priority Categories */}
            <div className="space-y-4">
              {(['high', 'medium', 'low'] as const).map(priority => {
                const items = REBECCA_RECOMMENDATIONS.filter(r => r.priority === priority);
                if (items.length === 0) return null;
                const priorityConfig = {
                  high: { label: 'Priorité haute', color: '#D93025', bg: 'bg-[#D93025]/5', border: 'border-[#D93025]/10' },
                  medium: { label: 'Priorité moyenne', color: '#D4AF37', bg: 'bg-[#D4AF37]/5', border: 'border-[#D4AF37]/10' },
                  low: { label: 'Suggestions', color: '#009CDE', bg: 'bg-[#009CDE]/5', border: 'border-[#009CDE]/10' },
                };
                const cfg = priorityConfig[priority];
                return (
                  <div key={priority}>
                    <h3 className="text-sm font-bold mb-2" style={{ color: cfg.color }}>{cfg.label}</h3>
                    <div className="space-y-3">
                      {items.map((rec, i) => {
                        const recIcon = rec.icon === 'listing' ? <LayoutGrid className="w-5 h-5" />
                          : rec.icon === 'message' ? <Phone className="w-5 h-5" />
                          : rec.icon === 'premium' ? <Crown className="w-5 h-5" />
                          : rec.icon === 'location' ? <MapPin className="w-5 h-5" />
                          : <Shield className="w-5 h-5" />;
                        return (
                          <motion.div
                            key={rec.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.4, ease: easeOut }}
                            className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 flex items-start gap-4`}
                          >
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cfg.color + '15', color: cfg.color }}>
                              {recIcon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-[#2C2E2F]">{rec.title}</h4>
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.description}</p>
                            </div>
                            <button
                              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                              style={{ backgroundColor: cfg.color }}
                            >
                              {rec.action}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* EXPORT TAB */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'export' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-3xl p-6 shadow-sm border max-w-2xl mx-auto text-center">
              <Download className="w-10 h-10 mx-auto mb-3 text-[#003087]" />
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">Exporter vos données</h3>
              <p className="text-sm text-gray-500 mb-6">Téléchargez vos statistiques et données analytiques au format de votre choix.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport('csv')}
                  className="p-4 border-2 border-[#00A651]/20 rounded-2xl hover:border-[#00A651] hover:bg-[#00A651]/5 transition-all"
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-[#00A651]" />
                  <h4 className="font-display text-base font-bold text-[#2C2E2F]">CSV</h4>
                  <p className="text-xs text-gray-500 mt-1">Compatible Excel, Google Sheets</p>
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="p-4 border-2 border-[#003087]/20 rounded-2xl hover:border-[#003087] hover:bg-[#003087]/5 transition-all"
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-[#003087]" />
                  <h4 className="font-display text-base font-bold text-[#2C2E2F]">PDF</h4>
                  <p className="text-xs text-gray-500 mt-1">Rapport formaté prêt à imprimer</p>
                </button>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-left">
                <p className="text-xs text-gray-500 mb-2">Données incluses dans l&apos;export :</p>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-center gap-2"><Coins className="w-4 h-4 text-[#D4AF37]" /> Revenus et transactions</li>
                  <li className="flex items-center gap-2"><Eye className="w-4 h-4 text-[#003087]" /> Vues de profil (origines)</li>
                  <li className="flex items-center gap-2"><Search className="w-4 h-4 text-[#009CDE]" /> Apparitions en recherche</li>
                  <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00A651]" /> Entonnoir de conversion</li>
                  <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-[#D4AF37]" /> Classement et performance</li>
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#003087]" /> Tendances mensuelles</li>
                  <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D93025]" /> Performance par zone</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
