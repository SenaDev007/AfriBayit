'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Eye,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface AdminStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    byCountry: Record<string, number>;
    recent7d: number;
    recent30d: number;
  };
  properties: {
    total: number;
    byStatus: Record<string, number>;
    byCountry: Record<string, number>;
    pending: number;
  };
  transactions: {
    total: number;
    totalVolume: number;
    totalCommission: number;
    byStatus: Record<string, number>;
  };
  escrow: {
    active: number;
    totalHeld: number;
  };
  kyc: {
    pending: number;
  };
  revenue: {
    monthly: Array<{ month: string; amount: number }>;
  };
  platform: {
    activeUsers24h: number;
    uptime: number;
  };
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  color?: 'blue' | 'green' | 'gold' | 'red' | 'navy';
}) {
  const colorMap = {
    blue: 'from-[#009CDE] to-[#0077B6]',
    green: 'from-[#00A651] to-[#008C44]',
    gold: 'from-[#D4AF37] to-[#B8962E]',
    red: 'from-red-500 to-red-600',
    navy: 'from-[#003087] to-[#002A70]',
  };

  const iconBgMap = {
    blue: 'bg-[#009CDE]/10 text-[#009CDE]',
    green: 'bg-[#00A651]/10 text-[#00A651]',
    gold: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    red: 'bg-red-50 text-red-500',
    navy: 'bg-[#003087]/10 text-[#003087]',
  };

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
              <span
                className={cn(
                  'text-xs font-semibold',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-gray-500'
                )}
              >
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {/* Mini bar */}
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r', colorMap[color])}
          style={{ width: '65%' }}
        />
      </div>
    </div>
  );
}

function MiniChart({ data, color = '#009CDE' }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function ActivityItem({
  icon: Icon,
  iconColor,
  title,
  description,
  time,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{description}</p>
      </div>
      <span className="text-[11px] text-gray-400 shrink-0">{time}</span>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiFetch<AdminStats>('/api/admin/stats'),
    refetchInterval: 30000,
  });

  if (isLoading) {
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

  // Provide safe defaults
  const s = stats || {
    users: { total: 0, byRole: {}, byCountry: {}, recent7d: 0, recent30d: 0 },
    properties: { total: 0, byStatus: {}, byCountry: {}, pending: 0 },
    transactions: { total: 0, totalVolume: 0, totalCommission: 0, byStatus: {} },
    escrow: { active: 0, totalHeld: 0 },
    kyc: { pending: 0 },
    revenue: { monthly: [] },
    platform: { activeUsers24h: 0, uptime: 99.9 },
  };

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) +
    ' XOF';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Vue d&apos;ensemble de la plateforme AfriBayit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            En ligne
          </span>
          <span className="text-xs text-gray-400">
            Uptime: {s.platform.uptime}%
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Utilisateurs"
          value={s.users.total.toLocaleString('fr-FR')}
          subtitle={`+${s.users.recent7d} cette semaine`}
          icon={Users}
          trend="up"
          trendLabel="+12.5% vs semaine dernière"
          color="blue"
        />
        <StatCard
          title="Propriétés"
          value={s.properties.total.toLocaleString('fr-FR')}
          subtitle={`${s.properties.pending} en attente de validation`}
          icon={Building2}
          trend="up"
          trendLabel="+8.3%"
          color="navy"
        />
        <StatCard
          title="Transactions"
          value={s.transactions.total.toLocaleString('fr-FR')}
          subtitle={formatXOF(s.transactions.totalVolume) + ' volume total'}
          icon={ArrowLeftRight}
          trend="up"
          trendLabel="+15.2%"
          color="green"
        />
        <StatCard
          title="Commissions"
          value={formatXOF(s.transactions.totalCommission)}
          subtitle="Total commissions perçues"
          icon={DollarSign}
          trend="up"
          trendLabel="+22.1%"
          color="gold"
        />
        <StatCard
          title="Escrow actifs"
          value={s.escrow.active}
          subtitle={formatXOF(s.escrow.totalHeld) + ' détenus'}
          icon={Wallet}
          color="navy"
        />
        <StatCard
          title="KYC en attente"
          value={s.kyc.pending}
          subtitle="Documents à vérifier"
          icon={FileCheck}
          trend={s.kyc.pending > 10 ? 'down' : 'neutral'}
          trendLabel={s.kyc.pending > 10 ? 'Attention' : 'Normal'}
          color={s.kyc.pending > 10 ? 'red' : 'green'}
        />
        <StatCard
          title="Agents certifiés"
          value={(s.users.byRole['agent'] || 0).toLocaleString('fr-FR')}
          subtitle="Agents vérifiés"
          icon={ShieldCheck}
          color="blue"
        />
        <StatCard
          title="Utilisateurs 24h"
          value={s.platform.activeUsers24h}
          subtitle="Actifs dernières 24h"
          icon={Activity}
          color="green"
        />
      </div>

      {/* Charts + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Revenus mensuels</h2>
              <p className="text-xs text-gray-500 mt-0.5">Volume de transactions par mois</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-[#003087]/10 text-[#003087] font-medium">12 mois</span>
            </div>
          </div>
          <MiniChart
            data={s.revenue.monthly.map((m) => m.amount) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
            color="#003087"
          />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Ce mois</p>
              <p className="text-lg font-bold text-gray-900">
                {s.revenue.monthly.length > 0
                  ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 1].amount)
                  : '0 XOF'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Mois dernier</p>
              <p className="text-lg font-bold text-gray-900">
                {s.revenue.monthly.length > 1
                  ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 2].amount)
                  : '0 XOF'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Moyenne</p>
              <p className="text-lg font-bold text-gray-900">
                {formatXOF(
                  s.revenue.monthly.length > 0
                    ? Math.round(
                        s.revenue.monthly.reduce((a, b) => a + b.amount, 0) /
                          s.revenue.monthly.length
                      )
                    : 0
                )}
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

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Activité récente</h2>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto custom-scrollbar-thin">
            <ActivityItem
              icon={UserPlus}
              iconColor="bg-blue-50 text-blue-500"
              title="Nouvel utilisateur"
              description="Kofi Mensah s'est inscrit"
              time="Il y a 5 min"
            />
            <ActivityItem
              icon={CheckCircle2}
              iconColor="bg-green-50 text-green-500"
              title="Transaction complétée"
              description="Villa Cotonou - 45M XOF"
              time="Il y a 15 min"
            />
            <ActivityItem
              icon={FileCheck}
              iconColor="bg-amber-50 text-amber-500"
              title="KYC validé"
              description="Amadou Diallo - Passeport"
              time="Il y a 30 min"
            />
            <ActivityItem
              icon={AlertTriangle}
              iconColor="bg-red-50 text-red-500"
              title="Signalement"
              description="Propriété #PRT-003 signalée"
              time="Il y a 1h"
            />
            <ActivityItem
              icon={ShieldCheck}
              iconColor="bg-purple-50 text-purple-500"
              title="Agent certifié"
              description="Fatou Bamba - Abidjan"
              time="Il y a 2h"
            />
            <ActivityItem
              icon={Clock}
              iconColor="bg-gray-100 text-gray-500"
              title="Escrow en attente"
              description="Terrain Lomé - 12M XOF"
              time="Il y a 3h"
            />
          </div>
        </div>
      </div>

      {/* Users by Role + Properties by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users by role */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Utilisateurs par rôle</h2>
          <div className="space-y-3">
            {Object.entries(s.users.byRole).map(([role, count]) => {
              const pct = s.users.total > 0 ? Math.round((count / s.users.total) * 100) : 0;
              const roleLabels: Record<string, string> = {
                buyer: 'Acheteur',
                seller: 'Vendeur',
                agent: 'Agent',
                investor: 'Investisseur',
                tourist: 'Touriste',
                artisan: 'Artisan',
                notary: 'Notaire',
                geometer: 'Géomètre',
                admin: 'Admin',
              };
              return (
                <div key={role}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">
                      {roleLabels[role] || role}
                    </span>
                    <span className="text-gray-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003087] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Properties by status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Propriétés par statut</h2>
          <div className="space-y-3">
            {Object.entries(s.properties.byStatus).map(([status, count]) => {
              const pct = s.properties.total > 0 ? Math.round((count / s.properties.total) * 100) : 0;
              const statusLabels: Record<string, string> = {
                draft: 'Brouillon',
                pending: 'En attente',
                ai_review: 'Revue IA',
                human_review: 'Revue humaine',
                published: 'Publiée',
                sold: 'Vendue',
                rented: 'Louée',
                rejected: 'Rejetée',
              };
              const statusColors: Record<string, string> = {
                draft: 'bg-gray-400',
                pending: 'bg-amber-500',
                ai_review: 'bg-blue-500',
                human_review: 'bg-purple-500',
                published: 'bg-green-500',
                sold: 'bg-[#D4AF37]',
                rented: 'bg-[#009CDE]',
                rejected: 'bg-red-500',
              };
              return (
                <div key={status}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium">
                      {statusLabels[status] || status}
                    </span>
                    <span className="text-gray-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', statusColors[status] || 'bg-gray-400')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Countries breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Répartition par pays</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
            { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
            { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
            { code: 'TG', name: 'Togo', flag: '🇹🇬' },
          ].map((country) => {
            const userCount = s.users.byCountry[country.code] || 0;
            const propCount = s.properties.byCountry[country.code] || 0;
            return (
              <div
                key={country.code}
                className="border border-gray-100 rounded-lg p-4 hover:border-[#003087]/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{country.name}</p>
                    <p className="text-[11px] text-gray-400">{country.code}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Utilisateurs</span>
                    <span className="font-semibold text-gray-900">{userCount}</span>
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
      </div>
    </div>
  );
}
