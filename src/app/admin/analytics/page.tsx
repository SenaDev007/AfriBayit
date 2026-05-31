'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Users, DollarSign, Building2, Globe,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
} from 'recharts';

const RANGE_OPTIONS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '12m', label: '12 mois' },
];

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
];

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n);

const PIE_COLORS = ['#003087', '#009CDE', '#D4AF37', '#00A651', '#D93025'];

interface AnalyticsData {
  acquisition: {
    newUsers: number;
    totalUsers: number;
    signupsByCountry: Array<{ country: string; count: number }>;
    conversionFunnel: { visitors: number; signups: number; firstAction: number };
  };
  engagement: {
    dau: number;
    mau: number;
    dauMauRatio: number;
    avgSessionMinutes: number;
    mostVisitedPages: Array<{ page: string; views: number }>;
    retentionCurve: number[];
  };
  revenue: {
    totalRevenue: number;
    totalCommission: number;
    mrr: number;
    transactionCount: number;
    revenueOverTime: Array<{ month: string; revenue: number; commission: number }>;
    revenueByModule: Array<{ module: string; amount: number }>;
  };
  properties: {
    total: number;
    published: number;
    pending: number;
    approvalRate: number;
    byCountry: Array<{ country: string; count: number }>;
    avgDaysToPublish: number;
    viewsDistribution: Array<{ range: string; count: number }>;
  };
  geographic: {
    usersByCountry: Array<{ country: string; count: number }>;
    propertiesByCountry: Array<{ country: string; count: number }>;
    topCities: Array<{ city: string; country: string; users: number; properties: number }>;
  };
}

export default function AdminAnalyticsPage() {
  const [filters, setFilters] = useState({ range: '30d', country: '' });

  const params = new URLSearchParams();
  params.set('range', filters.range);
  if (filters.country) params.set('country', filters.country);

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics', filters],
    queryFn: () => apiFetch<AnalyticsData>(`/api/admin/analytics?${params.toString()}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-32 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-72 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const d = data || {
    acquisition: { newUsers: 0, totalUsers: 0, signupsByCountry: [], conversionFunnel: { visitors: 0, signups: 0, firstAction: 0 } },
    engagement: { dau: 0, mau: 0, dauMauRatio: 0, avgSessionMinutes: 0, mostVisitedPages: [], retentionCurve: [0] },
    revenue: { totalRevenue: 0, totalCommission: 0, mrr: 0, transactionCount: 0, revenueOverTime: [], revenueByModule: [] },
    properties: { total: 0, published: 0, pending: 0, approvalRate: 0, byCountry: [], avgDaysToPublish: 0, viewsDistribution: [] },
    geographic: { usersByCountry: [], propertiesByCountry: [], topCities: [] },
  };

  const countryFlags: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };
  const countryNames: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analyse détaillée de la plateforme</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filters.range} onValueChange={(v) => setFilters((f) => ({ ...f, range: v }))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === '__all' ? '' : v }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Nouveaux utilisateurs', value: d.acquisition.newUsers, icon: Users, color: 'bg-[#003087]/10 text-[#003087]' },
          { label: 'Utilisateurs totaux', value: d.acquisition.totalUsers, icon: Users, color: 'bg-[#009CDE]/10 text-[#009CDE]' },
          { label: 'DAU', value: d.engagement.dau, icon: TrendingUp, color: 'bg-[#00A651]/10 text-[#00A651]' },
          { label: 'MAU', value: d.engagement.mau, icon: TrendingUp, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
          { label: 'MRR', value: formatXOF(d.revenue.mrr) + ' XOF', icon: DollarSign, color: 'bg-[#00A651]/10 text-[#00A651]' },
          { label: 'Taux d\'approbation', value: d.properties.approvalRate + '%', icon: Building2, color: 'bg-[#003087]/10 text-[#003087]' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', card.color)}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ============ ACQUISITION ============ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-[#003087]" /> Acquisition
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Signups by Country */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Inscriptions par pays</CardTitle>
              <CardDescription className="text-xs">Nouveaux utilisateurs par pays</CardDescription>
            </CardHeader>
            <CardContent>
              {d.acquisition.signupsByCountry.length > 0 ? (
                <ChartContainer config={{ count: { label: 'Inscriptions', color: '#003087' } }} className="h-56">
                  <BarChart data={d.acquisition.signupsByCountry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#003087" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Aucune donnée disponible</div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Entonnoir de conversion</CardTitle>
              <CardDescription className="text-xs">Visiteurs → Inscriptions → Première action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-4">
                {[
                  { label: 'Visiteurs', value: d.acquisition.conversionFunnel.visitors, color: 'bg-[#009CDE]', pct: 100 },
                  { label: 'Inscriptions', value: d.acquisition.conversionFunnel.signups, color: 'bg-[#003087]', pct: d.acquisition.conversionFunnel.visitors > 0 ? Math.round((d.acquisition.conversionFunnel.signups / d.acquisition.conversionFunnel.visitors) * 100) : 0 },
                  { label: 'Première action', value: d.acquisition.conversionFunnel.firstAction, color: 'bg-[#D4AF37]', pct: d.acquisition.conversionFunnel.visitors > 0 ? Math.round((d.acquisition.conversionFunnel.firstAction / d.acquisition.conversionFunnel.visitors) * 100) : 0 },
                ].map((step) => (
                  <div key={step.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{step.label}</span>
                      <span className="text-gray-500">{step.value.toLocaleString('fr-FR')} ({step.pct}%)</span>
                    </div>
                    <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                      <div className={cn('h-full rounded-lg transition-all duration-500 flex items-center justify-center', step.color)} style={{ width: `${Math.max(step.pct, 5)}%` }}>
                        <span className="text-white text-xs font-semibold">{step.value.toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============ ENGAGEMENT ============ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#00A651]" /> Engagement
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* DAU/MAU */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">DAU/MAU Ratio</CardTitle>
              <CardDescription className="text-xs">Ratio d&apos;engagement quotidien/mensuel: {d.engagement.dauMauRatio}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#003087]">{d.engagement.dau}</p>
                  <p className="text-xs text-gray-500 mt-1">Utilisateurs actifs/jour</p>
                </div>
                <div className="text-3xl text-gray-300">/</div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#009CDE]">{d.engagement.mau}</p>
                  <p className="text-xs text-gray-500 mt-1">Utilisateurs actifs/mois</p>
                </div>
                <div className="ml-auto">
                  <div className="w-20 h-20 rounded-full border-4 border-[#00A651] flex items-center justify-center">
                    <span className="text-xl font-bold text-[#00A651]">{d.engagement.dauMauRatio}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Most Visited Pages */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Pages les plus visitées</CardTitle>
              <CardDescription className="text-xs">Top pages par nombre de vues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 pt-2">
                {d.engagement.mostVisitedPages.map((page, i) => (
                  <div key={page.page} className="flex items-center gap-3">
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white',
                      i === 0 ? 'bg-[#D4AF37]' : i === 1 ? 'bg-[#009CDE]' : i === 2 ? 'bg-[#00A651]' : 'bg-gray-400'
                    )}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">{page.page}</span>
                        <span className="text-xs text-gray-500 ml-2">{page.views.toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#003087] rounded-full" style={{ width: `${Math.min((page.views / (d.engagement.mostVisitedPages[0]?.views || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Retention Curve */}
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Courbe de rétention</CardTitle>
            <CardDescription className="text-xs">Pourcentage d&apos;utilisateurs actifs par jour après inscription</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ retention: { label: 'Rétention %', color: '#003087' } }} className="h-48">
              <AreaChart data={d.engagement.retentionCurve.map((v, i) => ({ day: `J${i + 1}`, retention: v }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="retentionGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#003087" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="retention" stroke="#003087" fill="url(#retentionGrad)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ============ REVENUE ============ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#D4AF37]" /> Revenus
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue Over Time */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenus dans le temps</CardTitle>
              <CardDescription className="text-xs">Volume et commissions mensuels</CardDescription>
            </CardHeader>
            <CardContent>
              {d.revenue.revenueOverTime.length > 0 ? (
                <ChartContainer config={{ revenue: { label: 'Revenu', color: '#003087' }, commission: { label: 'Commission', color: '#D4AF37' } }} className="h-56">
                  <AreaChart data={d.revenue.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#003087" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#003087" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="revenue" stroke="#003087" fill="url(#revGrad)" />
                    <Line type="monotone" dataKey="commission" stroke="#D4AF37" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by Module */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Revenus par module</CardTitle>
              <CardDescription className="text-xs">Répartition des revenus par module</CardDescription>
            </CardHeader>
            <CardContent>
              {d.revenue.revenueByModule.length > 0 ? (
                <ChartContainer config={{ amount: { label: 'Montant', color: '#003087' } }} className="h-56">
                  <PieChart>
                    <Pie data={d.revenue.revenueByModule} dataKey="amount" nameKey="module" cx="50%" cy="50%" outerRadius={80} label={({ module }) => module}>
                      {d.revenue.revenueByModule.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent nameKey="module" />} />
                  </PieChart>
                </ChartContainer>
              ) : (
                <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* MRR + Commission Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">MRR</p>
              <p className="mt-1 text-2xl font-bold text-[#00A651]">{formatXOF(d.revenue.mrr)} XOF</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Commissions totales</p>
              <p className="mt-1 text-2xl font-bold text-[#D4AF37]">{formatXOF(d.revenue.totalCommission)} XOF</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Transactions</p>
              <p className="mt-1 text-2xl font-bold text-[#003087]">{d.revenue.transactionCount}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============ PROPERTIES ============ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#009CDE]" /> Propriétés
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Propriétés par pays</CardTitle>
            </CardHeader>
            <CardContent>
              {d.properties.byCountry.length > 0 ? (
                <ChartContainer config={{ count: { label: 'Propriétés', color: '#009CDE' } }} className="h-48">
                  <BarChart data={d.properties.byCountry}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="country" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#009CDE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Total propriétés', value: d.properties.total },
                  { label: 'Publiées', value: d.properties.published },
                  { label: 'En attente', value: d.properties.pending },
                  { label: 'Taux d\'approbation', value: d.properties.approvalRate + '%' },
                  { label: 'Délai moyen de publication', value: d.properties.avgDaysToPublish + ' jours' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============ GEOGRAPHIC ============ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-[#00A651]" /> Géographie
        </h2>

        {/* Country Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {d.geographic.usersByCountry.map((c) => {
            const propCount = d.geographic.propertiesByCountry.find((p) => p.country === c.country)?.count || 0;
            return (
              <div key={c.country} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#003087]/20 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{countryFlags[c.country] || '🌍'}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{countryNames[c.country] || c.country}</p>
                    <p className="text-[11px] text-gray-400">{c.country}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Utilisateurs</span>
                    <span className="font-semibold text-gray-900">{c.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Propriétés</span>
                    <span className="font-semibold text-gray-900">{propCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Cities Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top villes</CardTitle>
            <CardDescription className="text-xs">Villes avec le plus d&apos;activité</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold">Ville</TableHead>
                  <TableHead className="text-xs font-semibold">Pays</TableHead>
                  <TableHead className="text-xs font-semibold">Utilisateurs</TableHead>
                  <TableHead className="text-xs font-semibold">Propriétés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.geographic.topCities.map((city) => (
                  <TableRow key={city.city}>
                    <TableCell className="text-sm font-medium">{city.city}</TableCell>
                    <TableCell className="text-sm">{countryFlags[city.country]} {countryNames[city.country] || city.country}</TableCell>
                    <TableCell className="text-sm">{city.users}</TableCell>
                    <TableCell className="text-sm">{city.properties}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
