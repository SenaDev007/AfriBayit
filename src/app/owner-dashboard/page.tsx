'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useOwnerDashboard } from '@/hooks/useLeases';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/authStore';
import {
  Building2, Coins, TrendingUp, AlertTriangle, Calendar, Users,
  ChevronRight, Home, Plus, ArrowUpRight, ArrowDownRight, Clock,
} from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import RoleContextBanner from '@/components/afribayit/RoleContextBanner';

export default function OwnerDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useOwnerDashboard();

  if (isLoading) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl mb-6" />
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  const kpis = data?.kpis;
  const revenueSeries = data?.revenueSeries || [];
  const upcomingPayments = data?.upcomingPayments || [];
  const vacantProperties = data?.vacantProperties || [];
  const activeLeases = data?.activeLeases || [];

  // No properties state
  if (kpis && kpis.totalProperties === 0) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-12 border text-center">
            <div className="w-16 h-16 rounded-lg bg-[#003087]/5 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-[#003087]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">
              Aucun bien en location
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Publiez votre premier bien à louer pour accéder à votre dashboard bailleur :
              revenus locatifs, taux d&apos;occupation, loyers à venir et vacancies.
            </p>
            <Link
              href="/publish"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Publier un bien à louer
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const fmt = (n: number, currency = 'XOF') => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  // Revenue chart max for scaling
  const maxRevenue = Math.max(...revenueSeries.map(r => r.amount), 1);

  return (
    <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <RoleContextBanner />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-[#003087]">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#003087] font-semibold">Dashboard bailleur</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#003087] mb-1">
            Dashboard bailleur
          </h1>
          <p className="text-sm text-gray-500">
            Suivez vos revenus locatifs, vos loyers à venir, vos vacancies et le taux d&apos;occupation de votre parc immobilier.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard
            label="Taux d'occupation"
            value={kpis ? `${kpis.occupancyRate}%` : '—'}
            sub={kpis ? `${kpis.occupiedCount}/${kpis.totalProperties} biens occupés` : ''}
            icon={<Building2 className="w-5 h-5" />}
            color="#003087"
            trend={kpis && kpis.occupancyRate >= 80 ? 'up' : 'down'}
          />
          <KpiCard
            label="Revenu mensuel théorique"
            value={kpis ? `${fmt(kpis.theoreticalMonthlyRent)} FCFA` : '—'}
            sub="Somme des loyers affichés"
            icon={<TrendingUp className="w-5 h-5" />}
            color="#00A651"
          />
          <KpiCard
            label="Encaissé ce mois"
            value={kpis ? `${fmt(kpis.collectedThisMonth)} FCFA` : '—'}
            sub={kpis && kpis.theoreticalMonthlyRent > 0
              ? `${Math.round((kpis.collectedThisMonth / kpis.theoreticalMonthlyRent) * 100)}% du théorique`
              : ''}
            icon={<Coins className="w-5 h-5" />}
            color="#D4AF37"
            trend={kpis && kpis.collectedThisMonth >= kpis.theoreticalMonthlyRent * 0.9 ? 'up' : 'down'}
          />
          <KpiCard
            label="Impayés"
            value={kpis ? `${fmt(kpis.outstandingAmount)} FCFA` : '—'}
            sub={kpis && kpis.overdueAmount > 0 ? `Dont ${fmt(kpis.overdueAmount)} en retard` : 'Aucun retard'}
            icon={<AlertTriangle className="w-5 h-5" />}
            color={kpis && kpis.overdueAmount > 0 ? '#ef4444' : '#9ca3af'}
          />
        </div>

        {/* Revenue chart + Occupancy donut */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Revenue bar chart (last 6 months) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenus locatifs (6 derniers mois)
              </h2>
            </div>
            {revenueSeries.length === 0 ? (
              <div className="text-center py-12 text-sm text-gray-400">Aucune donnée de revenu pour le moment</div>
            ) : (
              <div className="flex items-end justify-between gap-2 h-48 mb-2">
                {revenueSeries.map((r, i) => {
                  const heightPct = (r.amount / maxRevenue) * 100;
                  return (
                    <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[10px] font-mono-data text-gray-500">
                        {r.amount > 0 ? `${(r.amount / 1000).toFixed(0)}k` : ''}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="w-full rounded-t-lg"
                        style={{
                          background: r.amount > 0
                            ? 'linear-gradient(180deg, #00A651 0%, #003087 100%)'
                            : '#f3f4f6',
                          minHeight: '4px',
                        }}
                      />
                      <div className="text-[10px] text-gray-400">{r.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Occupancy donut */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border flex flex-col items-center justify-center"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] mb-4 text-center">Occupation</h2>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="#00A651" strokeWidth="10"
                  strokeDasharray={`${(kpis?.occupancyRate || 0) * 2.51} ${251 - (kpis?.occupancyRate || 0) * 2.51}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold text-[#003087]">{kpis?.occupancyRate || 0}%</span>
                <span className="text-[10px] text-gray-400">occupé</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 w-full text-center">
              <div className="p-2 bg-[#00A651]/5 rounded-xl">
                <p className="font-bold text-[#00A651] text-lg">{kpis?.occupiedCount || 0}</p>
                <p className="text-[10px] text-gray-400">Occupés</p>
              </div>
              <div className="p-2 bg-[#D4AF37]/5 rounded-xl">
                <p className="font-bold text-[#D4AF37] text-lg">{kpis?.vacancyCount || 0}</p>
                <p className="text-[10px] text-gray-400">Vacants</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Upcoming rents + Vacancies */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Upcoming payments */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-6 border"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5" />
              Loyers à venir (30 jours)
            </h2>
            {upcomingPayments.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                Aucun loyer à venir dans les 30 prochains jours.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {upcomingPayments.map((p) => {
                  const dueDate = new Date(p.dueDate);
                  const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl">
                      <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-gray-100 border">
                        <ImageWithFallback
                          src={p.lease?.tenant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'}
                          alt={p.lease?.tenant?.name || 'Locataire'}
                          fill
                          fallbackType="avatar"
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0a2a5e] truncate">
                          {p.lease?.property?.title || 'Bien'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.lease?.tenant?.name} · échéance {dueDate.toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono-data font-bold text-sm text-[#0a2a5e]">{fmt(p.amountDue)}</p>
                        <p className={`text-[10px] ${daysUntil <= 3 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                          {daysUntil === 0 ? "Aujourd'hui" : daysUntil > 0 ? `Dans ${daysUntil}j` : `Il y a ${Math.abs(daysUntil)}j`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Vacant properties */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2 mb-4">
              <Home className="w-5 h-5" />
              Biens vacants
            </h2>
            {vacantProperties.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-lg bg-[#00A651]/5 flex items-center justify-center mx-auto mb-2">
                  <Building2 className="w-6 h-6 text-[#00A651]" />
                </div>
                <p className="text-sm text-gray-500">Tous vos biens sont loués ! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {vacantProperties.map((p) => {
                  const images = (() => {
                    try {
                      const v = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                      return Array.isArray(v) ? v : [];
                    } catch { return []; }
                  })();
                  return (
                    <Link
                      key={p.id}
                      href={`/property/${p.id}`}
                      className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl hover:bg-gray-100/80 transition-colors"
                    >
                      <div className="shrink-0 w-12 h-12 rounded-xl overflow-hidden relative bg-gray-100">
                        <ImageWithFallback
                          src={images[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100&h=100&fit=crop'}
                          alt={p.title}
                          fill
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0a2a5e] truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.city} · {fmt(p.price)} FCFA/mois</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-xs font-semibold ${p.daysVacant > 60 ? 'text-red-500' : p.daysVacant > 30 ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                          {p.daysVacant}j vacant
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Active leases */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-6 border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2">
              <Users className="w-5 h-5" />
              Baux actifs ({activeLeases.length})
            </h2>
            <Link href="/leases?role=owner" className="text-xs font-semibold text-[#003087] hover:underline">
              Voir tous mes baux →
            </Link>
          </div>
          {activeLeases.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Aucun bail actif. Les nouveaux baux apparaîtront ici une fois signés.
            </div>
          ) : (
            <div className="space-y-2">
              {activeLeases.map((lease) => (
                <Link
                  key={lease.id}
                  href={`/leases/${lease.id}`}
                  className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl hover:bg-gray-100/80 transition-colors"
                >
                  <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-gray-100 border">
                    <ImageWithFallback
                      src={lease.tenant?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face'}
                      alt={lease.tenant?.name || 'Locataire'}
                      fill
                      fallbackType="avatar"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0a2a5e] truncate">
                      {lease.property?.title || 'Bien'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lease.tenant?.name} · depuis {new Date(lease.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-data font-bold text-sm text-[#00A651]">{fmt(lease.monthlyRent)} {lease.currency}</p>
                    {lease.nextPayment ? (
                      <p className={`text-[10px] ${lease.nextPayment.status === 'OVERDUE' ? 'text-red-500' : 'text-gray-400'}`}>
                        {lease.nextPayment.status === 'OVERDUE' ? 'En retard' : 'Prochain loyer'}: {new Date(lease.nextPayment.dueDate).toLocaleDateString('fr-FR')}
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-400">Jusqu&apos;au {new Date(lease.endDate).toLocaleDateString('fr-FR')}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

function KpiCard({
  label, value, sub, icon, color, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center text-[10px] font-semibold ${trend === 'up' ? 'text-[#00A651]' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-mono-data font-bold text-lg text-[#0a2a5e]">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}
