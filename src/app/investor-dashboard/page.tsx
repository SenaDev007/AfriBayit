'use client';

/**
 * /investor-dashboard — Investor portfolio dashboard (CDC §5.9.2)
 *
 * Shows the investor's real estate portfolio acquired via AfriBayit:
 *   - KPIs: portfolio value, total invested, plus-value latente,
 *     rental income, avg ROI
 *   - Portfolio list with current estimated value + plus-value per property
 *   - Rental income chart (6 months) + active leases generating income
 *   - Empty state with CTA to browse opportunities
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInvestorDashboard } from '@/hooks/useInvestment';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, TrendingUp, Coins, Wallet, ArrowUpRight, ChevronRight,
  MapPin, Calendar, Percent, Home, KeyRound,
} from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import RoleContextBanner from '@/components/afribayit/RoleContextBanner';

export default function InvestorDashboardPage() {
  const { data, isLoading } = useInvestorDashboard();

  if (isLoading) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl mb-6" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </section>
    );
  }

  const kpis = data?.kpis;
  const portfolio = data?.portfolio || [];
  const rentalIncome = data?.rentalIncome || [];
  const incomeSeries = data?.incomeSeries || [];

  // Empty state — no investments yet
  if (kpis && kpis.propertyCount === 0) {
    return (
      <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl p-12 border text-center">
            <div className="w-16 h-16 rounded-lg bg-[#D4AF37]/5 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-700 mb-2">
              Aucun investissement pour le moment
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Vous n&apos;avez pas encore acquis de bien immobilier via AfriBayit.
              Découvrez les meilleures opportunités d&apos;investissement, notées 0-100
              par notre algorithme IA.
            </p>
            <Link
              href="/investir"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Voir les opportunités
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
  const maxIncome = Math.max(...incomeSeries.map(s => s.amount), 1);

  return (
    <section className="min-h-screen pt-24 pb-16 bg-gray-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <RoleContextBanner />
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/dashboard" className="hover:text-[#003087]">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#003087] font-semibold">Portfolio investisseur</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[#003087] mb-1">
            Mon portfolio immobilier
          </h1>
          <p className="text-sm text-gray-500">
            Suivez la valeur de votre portefeuille, votre plus-value latente et vos revenus locatifs.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KpiCard
            label="Valeur du portefeuille"
            value={kpis ? `${fmt(kpis.portfolioValue)} FCFA` : '—'}
            sub={kpis ? `${kpis.propertyCount} bien${kpis.propertyCount > 1 ? 's' : ''}` : ''}
            icon={<Building2 className="w-5 h-5" />}
            color="#003087"
          />
          <KpiCard
            label="Plus-value latente"
            value={kpis ? `+${fmt(kpis.totalPlusValue)} FCFA` : '—'}
            sub={kpis ? `+${kpis.totalPlusValuePct}% depuis l'achat` : ''}
            icon={<TrendingUp className="w-5 h-5" />}
            color="#00A651"
            trend="up"
          />
          <KpiCard
            label="Revenus locatifs /mois"
            value={kpis ? `${fmt(kpis.monthlyRentalIncome)} FCFA` : '—'}
            sub={kpis ? `${kpis.activeLeaseCount} bail${kpis.activeLeaseCount > 1 ? 's' : ''} actif${kpis.activeLeaseCount > 1 ? 's' : ''}` : ''}
            icon={<Coins className="w-5 h-5" />}
            color="#D4AF37"
          />
          <KpiCard
            label="ROI moyen"
            value={kpis ? `${kpis.avgRoi}%` : '—'}
            sub="Rendement brut estimé"
            icon={<Percent className="w-5 h-5" />}
            color="#009CDE"
          />
        </div>

        {/* Income chart + Investment summary */}
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {/* Income bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white rounded-xl p-6 border"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2 mb-4">
              <Coins className="w-5 h-5" />
              Revenus locatifs (6 derniers mois)
            </h2>
            {incomeSeries.length === 0 || incomeSeries.every(s => s.amount === 0) ? (
              <div className="text-center py-12 text-sm text-gray-400">
                Aucun revenu locatif encaissé pour le moment.
                {kpis?.activeLeaseCount === 0 && ' Vos baux actifs apparaîtront ici dès que vos locataires paieront leur premier loyer.'}
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 h-48 mb-2">
                {incomeSeries.map((s, i) => {
                  const heightPct = (s.amount / maxIncome) * 100;
                  return (
                    <div key={s.month} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[10px] font-mono-data text-gray-500">
                        {s.amount > 0 ? `${(s.amount / 1000).toFixed(0)}k` : ''}
                      </div>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="w-full rounded-t-lg"
                        style={{
                          background: s.amount > 0
                            ? 'linear-gradient(180deg, #D4AF37 0%, #003087 100%)'
                            : '#f3f4f6',
                          minHeight: '4px',
                        }}
                      />
                      <div className="text-[10px] text-gray-400">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">Total encaissé (6 mois)</span>
              <span className="font-mono-data font-bold text-[#D4AF37]">
                {fmt(incomeSeries.reduce((s, r) => s + r.amount, 0))} FCFA
              </span>
            </div>
          </motion.div>

          {/* Investment summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 border flex flex-col"
          >
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5" />
              Synthèse
            </h2>
            <div className="space-y-3 flex-1">
              <SummaryRow label="Investi au total" value={`${fmt(kpis?.totalInvested || 0)} FCFA`} />
              <SummaryRow label="Valeur actuelle" value={`${fmt(kpis?.portfolioValue || 0)} FCFA`} color="#003087" />
              <SummaryRow label="Plus-value" value={`+${fmt(kpis?.totalPlusValue || 0)} FCFA`} color="#00A651" />
              <SummaryRow label="Plus-value %" value={`+${kpis?.totalPlusValuePct || 0}%`} color="#00A651" />
              <SummaryRow label="Revenus locatifs (total)" value={`${fmt(kpis?.totalRentalIncome || 0)} FCFA`} color="#D4AF37" />
              <SummaryRow label="Favoris" value={`${kpis?.favoritesCount || 0}`} />
            </div>
            <Link
              href="/investir"
              className="mt-4 w-full py-2.5 bg-[#003087]/5 text-[#003087] rounded-lg text-xs font-semibold hover:bg-[#003087]/10 transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Voir les opportunités
            </Link>
          </motion.div>
        </div>

        {/* Portfolio list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl p-6 border mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Mon portefeuille ({portfolio.length})
            </h2>
          </div>
          {portfolio.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">
              Aucun bien dans votre portefeuille.
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.map((item) => (
                <Link
                  key={item.transactionId}
                  href={`/property/${item.propertyId}`}
                  className="flex items-center gap-4 p-3 bg-gray-50/50 rounded-2xl hover:bg-gray-100/80 transition-colors"
                >
                  {/* Image */}
                  <div className="shrink-0 w-20 h-20 rounded-xl overflow-hidden relative bg-gray-100">
                    <ImageWithFallback
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=200&fit=crop'}
                      alt={item.title}
                      fill
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display font-bold text-sm text-[#0a2a5e] truncate">{item.title}</h3>
                      <span className="px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[9px] font-bold rounded-full shrink-0">
                        Score {item.investmentScore}/100
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      {item.city}, {item.country} · {item.surface} m² · {item.bedrooms} ch.
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Acheté le {new Date(item.purchaseDate).toLocaleDateString('fr-FR')} · {item.yearsHeld} an{item.yearsHeld > 1 ? 's' : ''}
                    </p>
                  </div>
                  {/* Values */}
                  <div className="text-right shrink-0">
                    <p className="font-mono-data font-bold text-sm text-[#003087]">{fmt(item.currentValue)} FCFA</p>
                    <p className="text-[10px] text-gray-400 line-through">{fmt(item.purchasePrice)}</p>
                    <p className="text-xs font-bold text-[#00A651] flex items-center justify-end gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      +{item.plusValuePct}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Active leases generating rental income */}
        {rentalIncome.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 border"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-[#003087] flex items-center gap-2">
                <KeyRound className="w-5 h-5" />
                Baux locatifs actifs ({rentalIncome.length})
              </h2>
              <Link href="/leases?role=owner" className="text-xs font-semibold text-[#003087] hover:underline">
                Voir tous mes baux →
              </Link>
            </div>
            <div className="space-y-2">
              {rentalIncome.map((lease) => (
                <Link
                  key={lease.leaseId}
                  href={`/leases/${lease.leaseId}`}
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
                    <p className="text-sm font-semibold text-[#0a2a5e] truncate">{lease.property?.title}</p>
                    <p className="text-xs text-gray-400">
                      {lease.tenant?.name} · depuis {new Date(lease.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono-data font-bold text-sm text-[#D4AF37]">{fmt(lease.monthlyRent)} {lease.currency}/mois</p>
                    <p className="text-[10px] text-gray-400">Encaissé: {fmt(lease.collectedTotal)} {lease.currency}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
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
            <ArrowUpRight className="w-3 h-3" />
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-mono-data font-bold text-lg text-[#0a2a5e]">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function SummaryRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-mono-data font-bold text-sm" style={{ color: color || '#2C2E2F' }}>{value}</span>
    </div>
  );
}
