'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, ArrowDownRight, ArrowLeftRight, ArrowUpRight, Building2, CheckCircle2, Clock, DollarSign, Eye, FileCheck, Globe, Home, Hotel, ShieldCheck, TrendingUp, UserPlus, Users, Wallet } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

const COUNTRY_NAMES: Record<string, string> = {
  BJ: 'Bénin',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  TG: 'Togo',
};

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

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
  const iconBgMap = {
    blue: 'bg-[#009CDE]/10 text-[#009CDE]',
    green: 'bg-[#00A651]/10 text-[#00A651]',
    gold: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    red: 'bg-red-50 text-red-500',
    navy: 'bg-[#003087]/10 text-[#003087]',
  };

  const colorMap = {
    blue: 'from-[#009CDE] to-[#0077B6]',
    green: 'from-[#00A651] to-[#008C44]',
    gold: 'from-[#D4AF37] to-[#B8962E]',
    red: 'from-red-500 to-red-600',
    navy: 'from-[#003087] to-[#002A70]',
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
      <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-lg bg-gradient-to-r', colorMap[color])}
          style={{ width: '65%' }}
        />
      </div>
    </div>
  );
}

function MiniChart({ data, color = '#003087' }: { data: number[]; color?: string }) {
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
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', iconColor)}>
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

export default function CountryDashboard() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const countryName = COUNTRY_NAMES[country] || country;
  const countryFlag = COUNTRY_FLAGS[country] || '🌐';
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['admin-stats', country],
    queryFn: () => apiFetch<AdminStats>(`/api/admin/stats?country=${country}`),
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
              <div className="h-2 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">
            {countryFlag} {t('adminCountryDashboard.pageTitle', 'Tableau de bord —')} {countryName}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('adminCountryDashboard.pageSubtitle', "Vue d'ensemble des activités pour le")} {countryName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {t('adminCountryDashboard.online', 'En ligne')}
          </span>
          <span className="text-xs text-gray-400">
            {t('adminCountryDashboard.uptime', 'Uptime:')} {s.platform.uptime}%
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('adminCountryDashboard.statUsers', 'Utilisateurs')}
          value={s.users.total.toLocaleString('fr-FR')}
          subtitle={`+${s.users.recent7d} ${t('adminCountryDashboard.recent7d', 'cette semaine')}`}
          icon={Users}
          trend="up"
          trendLabel={t('adminCountryDashboard.trendUsers', '+12.5% vs semaine dernière')}
          color="blue"
        />
        <StatCard
          title={t('adminCountryDashboard.statProperties', 'Propriétés')}
          value={s.properties.total.toLocaleString('fr-FR')}
          subtitle={`${s.properties.pending} ${t('adminCountryDashboard.propertiesPending', 'en attente de validation')}`}
          icon={Building2}
          trend="up"
          trendLabel="+8.3%"
          color="navy"
        />
        <StatCard
          title={t('adminCountryDashboard.statTransactions', 'Transactions')}
          value={s.transactions.total.toLocaleString('fr-FR')}
          subtitle={formatXOF(s.transactions.totalVolume) + ' ' + t('adminCountryDashboard.totalVolume', 'volume total')}
          icon={ArrowLeftRight}
          trend="up"
          trendLabel="+15.2%"
          color="green"
        />
        <StatCard
          title={t('adminCountryDashboard.statCommissions', 'Commissions')}
          value={formatXOF(s.transactions.totalCommission)}
          subtitle={t('adminCountryDashboard.totalCommissions', 'Total commissions perçues')}
          icon={DollarSign}
          trend="up"
          trendLabel="+22.1%"
          color="gold"
        />
        <StatCard
          title={t('adminCountryDashboard.statEscrowActive', 'Escrow actifs')}
          value={s.escrow.active}
          subtitle={formatXOF(s.escrow.totalHeld) + ' ' + t('adminCountryDashboard.heldAmount', 'détenus')}
          icon={Wallet}
          color="navy"
        />
        <StatCard
          title={t('adminCountryDashboard.statKycPending', 'KYC en attente')}
          value={s.kyc.pending}
          subtitle={t('adminCountryDashboard.docsToVerify', 'Documents à vérifier')}
          icon={FileCheck}
          trend={s.kyc.pending > 10 ? 'down' : 'neutral'}
          trendLabel={s.kyc.pending > 10 ? t('adminCountryDashboard.attention', 'Attention') : t('adminCountryDashboard.normal', 'Normal')}
          color={s.kyc.pending > 10 ? 'red' : 'green'}
        />
        <StatCard
          title={t('adminCountryDashboard.statCertifiedAgents', 'Agents certifiés')}
          value={(s.users.byRole['agent'] || 0).toLocaleString('fr-FR')}
          subtitle={t('adminCountryDashboard.verifiedAgents', 'Agents vérifiés')}
          icon={ShieldCheck}
          color="blue"
        />
        <StatCard
          title={t('adminCountryDashboard.statUsers24h', 'Utilisateurs 24h')}
          value={s.platform.activeUsers24h}
          subtitle={t('adminCountryDashboard.active24h', 'Actifs dernières 24h')}
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
              <h2 className="text-base font-semibold text-gray-900">{t('adminCountryDashboard.monthlyRevenueTitle', 'Revenus mensuels —')} {countryName}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{t('adminCountryDashboard.monthlyRevenueSubtitle', 'Commissions par mois')}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded bg-[#003087]/10 text-[#003087] font-medium">{t('adminCountryDashboard.last12Months', '12 mois')}</span>
            </div>
          </div>
          <MiniChart
            data={s.revenue.monthly.map((m) => m.amount) || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}
            color="#003087"
          />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">{t('adminCountryDashboard.thisMonth', 'Ce mois')}</p>
              <p className="text-lg font-bold text-gray-900">
                {s.revenue.monthly.length > 0
                  ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 1].amount)
                  : '0 XOF'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('adminCountryDashboard.lastMonth', 'Mois dernier')}</p>
              <p className="text-lg font-bold text-gray-900">
                {s.revenue.monthly.length > 1
                  ? formatXOF(s.revenue.monthly[s.revenue.monthly.length - 2].amount)
                  : '0 XOF'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">{t('adminCountryDashboard.average', 'Moyenne')}</p>
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
              <p className="text-xs text-gray-500">{t('adminCountryDashboard.total12Months', 'Total 12 mois')}</p>
              <p className="text-lg font-bold text-gray-900">
                {formatXOF(s.revenue.monthly.reduce((a, b) => a + b.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('adminCountryDashboard.recentActivity', 'Activité récente')}</h2>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto custom-scrollbar-thin">
            <ActivityItem
              icon={UserPlus}
              iconColor="bg-blue-50 text-blue-500"
              title={t('adminCountryDashboard.newUser', 'Nouvel utilisateur')}
              description={`${t('adminCountryDashboard.signupOn', 'Inscription sur')} ${countryName}`}
              time="Il y a 5 min"
            />
            <ActivityItem
              icon={CheckCircle2}
              iconColor="bg-green-50 text-green-500"
              title={t('adminCountryDashboard.transactionCompleted', 'Transaction complétée')}
              description={`${t('adminCountryDashboard.saleFinalized', 'Vente finalisée —')} ${countryName}`}
              time="Il y a 15 min"
            />
            <ActivityItem
              icon={FileCheck}
              iconColor="bg-amber-50 text-amber-500"
              title={t('adminCountryDashboard.kycValidated', 'KYC validé')}
              description={t('adminCountryDashboard.docVerified', 'Document vérifié avec succès')}
              time="Il y a 30 min"
            />
            <ActivityItem
              icon={AlertTriangle}
              iconColor="bg-red-50 text-red-500"
              title={t('adminCountryDashboard.report', 'Signalement')}
              description={t('adminCountryDashboard.propertyReported', 'Propriété signalée')}
              time="Il y a 1h"
            />
            <ActivityItem
              icon={ShieldCheck}
              iconColor="bg-purple-50 text-purple-500"
              title={t('adminCountryDashboard.agentCertified', 'Agent certifié')}
              description={`${t('adminCountryDashboard.agentVerified', 'Agent vérifié —')} ${countryName}`}
              time="Il y a 2h"
            />
            <ActivityItem
              icon={Clock}
              iconColor="bg-gray-100 text-gray-500"
              title={t('adminCountryDashboard.escrowPending', 'Escrow en attente')}
              description={t('adminCountryDashboard.pendingFunding', 'En attente de financement')}
              time="Il y a 3h"
            />
          </div>
        </div>
      </div>

      {/* Users by Role + Properties by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users by role */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t('adminCountryDashboard.usersByRole', 'Utilisateurs par rôle')}</h2>
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
                    <span className="text-gray-700 font-medium">{roleLabels[role] || role}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003087] rounded-lg transition-all duration-500"
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
          <h2 className="text-base font-semibold text-gray-900 mb-4">{t('adminCountryDashboard.propertiesByStatus', 'Propriétés par statut')}</h2>
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
                    <span className="text-gray-700 font-medium">{statusLabels[status] || status}</span>
                    <span className="text-gray-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-lg transition-all duration-500', statusColors[status] || 'bg-gray-400')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick links row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <a
          href={`/admin/${country}/users`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#003087]/20 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('adminCountryDashboard.quickLinkUsers', 'Utilisateurs')}</p>
            <p className="text-xs text-gray-500">{t('adminCountryDashboard.quickLinkUsersDesc', 'Gérer les comptes')}</p>
          </div>
        </a>
        <a
          href={`/admin/${country}/properties`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#003087]/20 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('adminCountryDashboard.quickLinkProperties', 'Propriétés')}</p>
            <p className="text-xs text-gray-500">{t('adminCountryDashboard.quickLinkPropertiesDesc', 'Valider & publier')}</p>
          </div>
        </a>
        <a
          href={`/admin/${country}/hospitality`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#D4AF37]/20 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('adminCountryDashboard.quickLinkHospitality', 'Hôtellerie')}</p>
            <p className="text-xs text-gray-500">{t('adminCountryDashboard.quickLinkHospitalityDesc', 'Hôtels & séjours')}</p>
          </div>
        </a>
        <a
          href={`/admin/${country}/accreditations`}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-[#D4AF37]/20 transition-all flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{t('adminCountryDashboard.quickLinkAccreditations', 'Accréditations')}</p>
            <p className="text-xs text-gray-500">{t('adminCountryDashboard.quickLinkAccreditationsDesc', 'Gérer les accès')}</p>
          </div>
        </a>
      </div>
    </div>
  );
}
