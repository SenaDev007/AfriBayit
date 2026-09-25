'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/use-translate';
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
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  KeyRound,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CountryFlag } from '@/components/ui/CountryFlag';

const PILOT_COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: 'BJ' },
  { code: 'CI', name: "Côte d'Ivoire", flag: 'CI' },
  { code: 'BF', name: 'Burkina Faso', flag: 'BF' },
  { code: 'TG', name: 'Togo', flag: 'TG' },
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

/**
 * Carte KPI — design Win-Agro (backoffice admin/dashboard) porté sur
 * navy AfriBayit : panneau sombre translucide #0A1A33, liseré bleu
 * innovation, icône bleue, valeur serif noire sur fond sombre,
 * micro-libellé descriptif — identique aux cartes « Visiteurs actifs ».
 */
function StatCard({
  title, value, subtitle, icon: Icon, trend, trendLabel, color = 'blue',
}: {
  title: string; value: string | number; subtitle?: string; icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral'; trendLabel?: string; color?: 'blue' | 'green' | 'gold' | 'red' | 'navy';
}) {
  const iconColorMap = {
    blue: 'text-primary-green',
    green: 'text-green-400',
    gold: 'text-accent-yellow',
    red: 'text-red-400',
    navy: 'text-primary-green',
  };
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="bg-admin-panel/50 border border-primary-green/10 rounded-2xl p-5 shadow-lg hover:border-primary-green/25 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between text-gray-400 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        <Icon className={cn('w-5 h-5', iconColorMap[color])} />
      </div>
      <p className="text-2xl sm:text-3xl font-serif font-black text-white">{value}</p>
      {subtitle && <p className="text-[10px] text-gray-400 mt-1 font-sans">{subtitle}</p>}
      {trend && trendLabel && (
        <div className="mt-2 flex items-center gap-1">
          {trend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-400" />}
          {trend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-400" />}
          <span className={cn('text-xs font-semibold', trendColor)}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

function MiniBarChart({ data, labels, colors }: { data: number[]; labels: string[]; colors?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-400 font-medium">{v > 0 ? (v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v) : '0'}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((v / max) * 100, 4)}%}`,
              backgroundColor: colors?.[i] || '#009CDE',
              opacity: 0.85,
            }}
          />
          <span className="text-[10px] text-gray-500">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function GlobalAdminDashboard() {
  const { t } = useTranslation();
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
            <div key={i} className="bg-admin-panel/50 border border-primary-green/10 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-24 mb-3" />
              <div className="h-8 bg-white/10 rounded w-20 mb-2" />
              <div className="h-2 bg-white/5 rounded-lg" />
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
      {/* En-tête de page — design Win-Agro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary-green" />
            {t('adminDashboard.pageTitle', 'Tableau de bord')} Global
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('adminDashboard.pageSubtitle', "Vue d'ensemble de la plateforme")} — Zone FCFA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-white/5 border-primary-green/20 text-primary-green">
            <ShieldCheck className="w-3 h-3 mr-1" />
            SUPER_ADMIN
          </Badge>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-primary-green/10 text-primary-green text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-green animate-pulse" />
            EN LIGNE
          </span>
        </div>
      </div>

      {/* Cartes KPI globales — style Win-Agro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Utilisateurs totaux" value={s.users.total.toLocaleString('fr-FR')} subtitle={`+${s.users.recent7d} cette semaine`} icon={Users} trend="up" trendLabel="+12.5% vs semaine dernière" color="blue" />
        <StatCard title="Propriétés" value={s.properties.total.toLocaleString('fr-FR')} subtitle={`${s.properties.pending} en attente`} icon={Building2} trend="up" trendLabel="+8.3%" color="blue" />
        <StatCard title="Transactions" value={s.transactions.total.toLocaleString('fr-FR')} subtitle={formatXOF(s.transactions.totalVolume)} icon={ArrowLeftRight} trend="up" trendLabel="+15.2%" color="green" />
        <StatCard title="Commissions" value={formatXOF(s.transactions.totalCommission)} subtitle="Total commissions perçues" icon={DollarSign} trend="up" trendLabel="+22.1%" color="gold" />
        <StatCard title="Escrow actifs" value={s.escrow.active} subtitle={formatXOF(s.escrow.totalHeld)} icon={Wallet} color="blue" />
        <StatCard title="KYC en attente" value={s.kyc.pending} subtitle="Documents à vérifier" icon={FileCheck} color={s.kyc.pending > 10 ? 'red' : 'green'} />
        <StatCard title="Hôtellerie" value={`${s.hospitality.hotels + s.hospitality.guesthouses}`} subtitle={`${s.hospitality.hotels} hôtels, ${s.hospitality.guesthouses} guesthouses`} icon={Hotel} color="blue" />
        <StatCard title="Utilisateurs 24h" value={s.platform.activeUsers24h} subtitle="Actifs dernières 24h" icon={Activity} color="green" />
      </div>

      {/* Comparaison par pays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Utilisateurs par pays */}
        <div className="bg-admin-panel/50 border border-primary-green/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-white">Utilisateurs par pays</h2>
            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-gray-400">4 pays</Badge>
          </div>
          <MiniBarChart
            data={PILOT_COUNTRIES.map((c) => s.users.byCountry[c.code] || 0)}
            labels={PILOT_COUNTRIES.map((c) => c.code)}
            colors={['#003087', '#009CDE', '#D4AF37', '#00A651']}
          />
        </div>

        {/* Propriétés par pays */}
        <div className="bg-admin-panel/50 border border-primary-green/10 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-white">Propriétés par pays</h2>
            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-gray-400">4 pays</Badge>
          </div>
          <MiniBarChart
            data={PILOT_COUNTRIES.map((c) => s.properties.byCountry[c.code] || 0)}
            labels={PILOT_COUNTRIES.map((c) => c.code)}
            colors={['#003087', '#009CDE', '#D4AF37', '#00A651']}
          />
        </div>
      </div>

      {/* Comparaison revenus + cartes pays */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenus par pays — barres de progression Win-Agro */}
        <div className="lg:col-span-1 bg-admin-panel/50 border border-primary-green/10 rounded-3xl p-6 shadow-xl">
          <h2 className="font-serif text-lg font-bold text-white mb-4">Revenus par pays</h2>
          <div className="space-y-3.5">
            {countryComp.map((c) => {
              const countryInfo = PILOT_COUNTRIES.find((p) => p.code === c.code);
              const maxRevenue = Math.max(...countryComp.map((x) => x.commission), 1);
              const pct = (c.commission / maxRevenue) * 100;
              return (
                <div key={c.code} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-300"><CountryFlag code={countryInfo?.flag} /> {countryInfo?.name}</span>
                    <span className="text-gray-400 font-mono">{formatXOF(c.commission)}</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cartes d'accès rapide par pays */}
        <div className="lg:col-span-2">
          <h2 className="font-serif text-lg font-bold text-white mb-4">Accès rapide par pays</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PILOT_COUNTRIES.map((country) => {
              const comp = countryComp.find((c) => c.code === country.code);
              return (
                <Link key={country.code} href={`/admin/${country.code}/dashboard`} className="block">
                  <Card className="rounded-2xl bg-admin-panel/50 border border-primary-green/10 overflow-hidden hover:shadow-xl hover:border-primary-green/30 transition-all duration-300 group cursor-pointer">
                    <div className="h-1.5 bg-gradient-to-r from-primary-deep via-primary-green to-accent-yellow" />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl"><CountryFlag code={country.flag} /></span>
                        <div>
                          <h3 className="text-sm font-bold text-white">{country.name}</h3>
                          <Badge variant="outline" className="text-[10px] font-mono bg-white/5 border-white/10 text-gray-400">{country.code}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>{comp?.users || 0} users</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Building2 className="w-3 h-3" />
                          <span>{comp?.properties || 0} props</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <ArrowLeftRight className="w-3 h-3" />
                          <span>{comp?.transactions || 0} txns</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-accent-yellow font-medium">
                          <TrendingUp className="w-3 h-3" />
                          <span>{comp ? ((comp.commission / 1000000).toFixed(1) + 'M') : '0'} FCFA</span>
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" className="text-primary-green text-xs h-7 hover:bg-white/5 hover:text-white">
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

      {/* Revenus mensuels */}
      <div className="bg-admin-panel/50 border border-primary-green/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-white">Revenus mensuels (commissions)</h2>
            <p className="text-[11px] text-gray-400">12 derniers mois — Tous pays</p>
          </div>
        </div>
        {s.revenue.monthly.length > 0 ? (
          <div className="w-full bg-black/30 rounded-2xl border border-white/5 p-4">
            <MiniBarChart
              data={s.revenue.monthly.map((m) => m.amount)}
              labels={s.revenue.monthly.map((m) => m.month.slice(5))}
            />
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
            Aucune donnée de revenus disponible
          </div>
        )}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-primary-green/10">
          <div>
            <p className="text-xs text-gray-500">Ce mois</p>
            <p className="text-lg font-serif font-bold text-white">
              {s.revenue.monthly.length > 0 ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 1].amount) : '0 XOF'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Mois dernier</p>
            <p className="text-lg font-serif font-bold text-white">
              {s.revenue.monthly.length > 1 ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 2].amount) : '0 XOF'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Moyenne</p>
            <p className="text-lg font-serif font-bold text-white">
              {formatXOF(s.revenue.monthly.length > 0 ? Math.round(s.revenue.monthly.reduce((a, b) => a + b.amount, 0) / s.revenue.monthly.length) : 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total 12 mois</p>
            <p className="text-lg font-serif font-bold text-white">
              {formatXOF(s.revenue.monthly.reduce((a, b) => a + b.amount, 0))}
            </p>
          </div>
        </div>
      </div>

      {/* Liens rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/countries" className="bg-admin-panel/50 border border-primary-green/10 rounded-2xl p-4 hover:shadow-lg hover:border-primary-green/30 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Pays</p>
            <p className="text-xs text-gray-500">Backoffices</p>
          </div>
        </Link>
        <Link href="/admin/accreditations" className="bg-admin-panel/50 border border-primary-green/10 rounded-2xl p-4 hover:shadow-lg hover:border-accent-yellow/30 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-accent-yellow" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Accréditations</p>
            <p className="text-xs text-gray-500">Gérer les accès</p>
          </div>
        </Link>
        <Link href="/admin/BJ/dashboard" className="bg-admin-panel/50 border border-primary-green/10 rounded-2xl p-4 hover:shadow-lg hover:border-primary-green/30 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Bénin</p>
            <p className="text-xs text-gray-500">Backoffice BJ</p>
          </div>
        </Link>
        <Link href="/admin/CI/dashboard" className="bg-admin-panel/50 border border-primary-green/10 rounded-2xl p-4 hover:shadow-lg hover:border-green-400/30 transition-all flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Côte d&apos;Ivoire</p>
            <p className="text-xs text-gray-500">Backoffice CI</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
