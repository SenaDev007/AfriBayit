'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  ArrowLeftRight,
  Wallet,
  DollarSign,
  Activity,
  ShieldCheck,
  FileCheck,
  Globe,
  TrendingUp,
  Hotel,
  Home,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PILOT_COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

interface AdminStats {
  users: { total: number; byCountry: Record<string, number>; byRole: Record<string, number>; recent7d: number; recent30d: number };
  properties: { total: number; byCountry: Record<string, number>; byStatus: Record<string, number>; pending: number };
  transactions: { total: number; totalVolume: number; totalCommission: number; byStatus: Record<string, number> };
  escrow: { active: number; totalHeld: number };
  kyc: { pending: number };
  hospitality: { hotels: number; guesthouses: number; hotelBookings: number; guesthouseBookings: number };
  revenue: { monthly: Array<{ month: string; amount: number }> };
  platform: { activeUsers24h: number; uptime: number };
}

interface AnalyticsData {
  countryComparison: Array<{ code: string; users: number; properties: number; transactions: number; volume: number; commission: number }>;
  revenueByCountry: Array<{ country: string; revenue: number }>;
  propertiesByType: Array<{ type: string; count: number }>;
  transactionStatusDistribution: Array<{ status: string; count: number }>;
}

function StatCard({
  title, value, subtitle, icon: Icon, trend, trendLabel, color = 'blue',
}: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; color?: 'blue' | 'green' | 'gold' | 'red' | 'navy';
}) {
  const iconBgMap = { blue: 'bg-[#009CDE]/10 text-[#009CDE]', green: 'bg-[#00A651]/10 text-[#00A651]', gold: 'bg-[#D4AF37]/10 text-[#D4AF37]', red: 'bg-red-50 text-red-500', navy: 'bg-[#003087]/10 text-[#003087]' };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
          {trend && trendLabel && (
            <div className="mt-2 flex items-center gap-1">
              {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500" />}
              {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
              <span className={cn('text-xs font-semibold', trend === 'up' && 'text-green-600', trend === 'down' && 'text-red-600', trend === 'neutral' && 'text-gray-500')}>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data, labels, colors }: { data: number[]; labels: string[]; colors?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">{v > 0 ? (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v) : '0'}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((v / max) * 100, 4)}%`,
              backgroundColor: colors?.[i] || '#003087',
              opacity: 0.85,
            }}
          />
          <span className="text-[10px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function GlobalAdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch<AdminStats>('/api/admin/stats'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: analytics } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: () => apiFetch<AnalyticsData>('/api/admin/analytics'),
    staleTime: 5 * 60 * 1000,
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-2 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const s = stats || {
    users: { total: 0, byCountry: {}, byRole: {}, recent7d: 0, recent30d: 0 },
    properties: { total: 0, byCountry: {}, byStatus: {}, pending: 0 },
    transactions: { total: 0, totalVolume: 0, totalCommission: 0, byStatus: {} },
    escrow: { active: 0, totalHeld: 0 },
    kyc: { pending: 0 },
    hospitality: { hotels: 0, guesthouses: 0, hotelBookings: 0, guesthouseBookings: 0 },
    revenue: { monthly: [] },
    platform: { activeUsers24h: 0, uptime: 99.9 },
  };

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

  const countryComp = analytics?.countryComparison || [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#003087]" />
            Tableau de bord Global
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Vue d&apos;ensemble de toutes les activités AfriBayit — Zone FCFA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
            <ShieldCheck className="w-3 h-3 mr-1" />
            SUPER_ADMIN
          </Badge>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            En ligne
          </span>
        </div>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Utilisateurs totaux" value={s.users.total.toLocaleString('fr-FR')} subtitle={`+${s.users.recent7d} cette semaine`} icon={Users} trend="up" trendLabel="+12.5% vs semaine dernière" color="blue" />
        <StatCard title="Propriétés" value={s.properties.total.toLocaleString('fr-FR')} subtitle={`${s.properties.pending} en attente`} icon={Building2} trend="up" trendLabel="+8.3%" color="navy" />
        <StatCard title="Transactions" value={s.transactions.total.toLocaleString('fr-FR')} subtitle={formatXOF(s.transactions.totalVolume)} icon={ArrowLeftRight} trend="up" trendLabel="+15.2%" color="green" />
        <StatCard title="Commissions" value={formatXOF(s.transactions.totalCommission)} subtitle="Total commissions perçues" icon={DollarSign} trend="up" trendLabel="+22.1%" color="gold" />
        <StatCard title="Escrow actifs" value={s.escrow.active} subtitle={formatXOF(s.escrow.totalHeld)} icon={Wallet} color="navy" />
        <StatCard title="KYC en attente" value={s.kyc.pending} subtitle="Documents à vérifier" icon={FileCheck} color={s.kyc.pending > 10 ? 'red' : 'green'} />
        <StatCard title="Hôtellerie" value={`${s.hospitality.hotels + s.hospitality.guesthouses}`} subtitle={`${s.hospitality.hotels} hôtels, ${s.hospitality.guesthouses} guesthouses`} icon={Hotel} color="blue" />
        <StatCard title="Utilisateurs 24h" value={s.platform.activeUsers24h} subtitle="Actifs dernières 24h" icon={Activity} color="green" />
      </div>

      {/* Country Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users by country chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Utilisateurs par pays</h2>
            <Badge variant="outline" className="text-[10px]">4 pays</Badge>
          </div>
          <MiniBarChart
            data={PILOT_COUNTRIES.map((c) => s.users.byCountry[c.code] || 0)}
            labels={PILOT_COUNTRIES.map((c) => c.code)}
            colors={['#003087', '#009CDE', '#D4AF37', '#00A651']}
          />
        </div>

        {/* Properties by country chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Propriétés par pays</h2>
            <Badge variant="outline" className="text-[10px]">4 pays</Badge>
          </div>
          <MiniBarChart
            data={PILOT_COUNTRIES.map((c) => s.properties.byCountry[c.code] || 0)}
            labels={PILOT_COUNTRIES.map((c) => c.code)}
            colors={['#003087', '#009CDE', '#D4AF37', '#00A651']}
          />
        </div>
      </div>

      {/* Revenue comparison + Country cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue by country */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenus par pays</h2>
          <div className="space-y-3">
            {countryComp.map((c) => {
              const countryInfo = PILOT_COUNTRIES.find((p) => p.code === c.code);
              const maxRevenue = Math.max(...countryComp.map((x) => x.commission), 1);
              const pct = (c.commission / maxRevenue) * 100;
              return (
                <div key={c.code}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">{countryInfo?.flag} {countryInfo?.name}</span>
                    <span className="text-gray-500">{formatXOF(c.commission)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#003087] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Country quick access cards */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Accès rapide par pays</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PILOT_COUNTRIES.map((country) => {
              const comp = countryComp.find((c) => c.code === country.code);
              return (
                <Link key={country.code} href={`/admin/${country.code}/dashboard`} className="block">
                  <Card className="rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer">
                    <div className="h-1.5 bg-gradient-to-r from-[#003087] to-[#D4AF37]" />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{country.flag}</span>
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">{country.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-mono">{country.code}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="w-3 h-3" />
                          <span>{comp?.users || 0} users</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Building2 className="w-3 h-3" />
                          <span>{comp?.properties || 0} props</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{comp?.transactions || 0} txns</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[#D4AF37] font-medium">
                          <TrendingUp className="w-3 h-3" />
                          <span>{comp ? ((comp.commission / 1000000).toFixed(1) + 'M') : '0'} FCFA</span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-[#003087] text-xs h-7 group-hover:bg-[#003087]/5">
                          Accéder <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Revenus mensuels (commissions)</h2>
            <p className="text-xs text-gray-500 mt-0.5">12 derniers mois — Tous pays</p>
          </div>
        </div>
        {s.revenue.monthly.length > 0 ? (
          <MiniBarChart
            data={s.revenue.monthly.map((m) => m.amount)}
            labels={s.revenue.monthly.map((m) => m.month.slice(5))}
          />
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
            Aucune donnée de revenus disponible
          </div>
        )}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Ce mois</p>
            <p className="text-lg font-bold text-gray-900">
              {s.revenue.monthly.length > 0 ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 1].amount) : '0 XOF'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Mois dernier</p>
            <p className="text-lg font-bold text-gray-900">
              {s.revenue.monthly.length > 1 ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 2].amount) : '0 XOF'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Moyenne</p>
            <p className="text-lg font-bold text-gray-900">
              {formatXOF(s.revenue.monthly.length > 0 ? Math.round(s.revenue.monthly.reduce((a, b) => a + b.amount, 0) / s.revenue.monthly.length) : 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total 12 mois</p>
            <p className="text-lg font-bold text-gray-900">
              {formatXOF(s.revenue.monthly.reduce((a, b) => a + b.amount, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/countries" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#003087]/20 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Pays</p>
            <p className="text-xs text-gray-500">Backoffices</p>
          </div>
        </Link>
        <Link href="/admin/accreditations" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#D4AF37]/20 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Accréditations</p>
            <p className="text-xs text-gray-500">Gérer les accès</p>
          </div>
        </Link>
        <Link href="/admin/BJ/dashboard" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#009CDE]/20 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
            <Eye className="w-5 h-5 text-[#009CDE]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Bénin</p>
            <p className="text-xs text-gray-500">Backoffice BJ</p>
          </div>
        </Link>
        <Link href="/admin/CI/dashboard" className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#00A651]/20 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#00A651]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#00A651]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Côte d&apos;Ivoire</p>
            <p className="text-xs text-gray-500">Backoffice CI</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
