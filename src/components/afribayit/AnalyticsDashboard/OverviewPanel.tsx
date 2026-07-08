'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowDownRight,
  ArrowUpRight,
  Heart,
  Lightbulb,
  MessageSquare,
  Bookmark,
  Minus,
  Share2,
  UserPlus,
} from 'lucide-react';
import {
  AGENT_ANALYTICS,
  CONNECTIONS_GROWTH,
  CONTENT_ENGAGEMENT,
  DEMO_COMPARISON,
  DEMO_COMPLETENESS,
  easeOut,
} from './demoData';
import { formatPrice } from './utils';
import type { KPI, ChartDataPoint, BarDataPoint, ConnectionsRow, EngagementRow } from './types';

interface OverviewPanelProps {
  isLoading: boolean;
  hasError: boolean;
  kpis: KPI[];
  chartData: ChartDataPoint[];
  hasChartData: boolean;
  barData: BarDataPoint[];
  connectionsData: ConnectionsRow;
  engagementData: EngagementRow;
  totalRevenue: number;
}

export default function OverviewPanel({
  isLoading,
  hasError,
  kpis,
  chartData,
  hasChartData,
  barData,
  connectionsData,
  engagementData,
  totalRevenue,
}: OverviewPanelProps) {
  return (
    <>
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
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }} className="bg-white rounded-2xl p-4 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
                <span className="text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">{kpi.change}</span>
              </div>
              <p className="font-mono text-lg sm:text-xl font-bold text-[#2C2E2F]">{kpi.value}</p>
              <p className="text-xs text-gray-500">{kpi.label}</p>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3, ease: easeOut }} className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Revenus mensuels</h3>
          {!hasChartData ? (
            <div className="h-64 flex items-center justify-center"><p className="text-sm text-gray-500">Aucune donnée de revenu disponible</p></div>
          ) : (
            <div className="h-64 flex items-end gap-2">
              {chartData.map((item, i) => {
                const maxVal = Math.max(...chartData.map(d => d.value));
                const height = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(height, 4)}%` }} transition={{ duration: 0.6, delay: i * 0.05, ease: easeOut }} className="w-full rounded-t-lg bg-gradient-to-t from-[#003087] to-[#009CDE] min-h-[4px]" />
                    <span className="text-[9px] text-gray-400">{item.month}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Par ville</h3>
          {barData.length === 0 ? (
            <div className="flex items-center justify-center h-32"><p className="text-sm text-gray-500">Aucune donnée par ville</p></div>
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
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / maxVal) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-full rounded-full" style={{ backgroundColor: item.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Connections & Followers Growth + Content Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.42, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-[#003087]" /> Connexions & Abonnés</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-[#003087]/5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Connexions</span>
                <span className="text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">+{connectionsData.connGrowth}%</span>
              </div>
              <p className="font-mono text-2xl font-bold text-[#003087]">{connectionsData.connections}</p>
              <p className="text-xs text-gray-400 mt-1">sur la période</p>
            </div>
            <div className="p-4 bg-[#D4AF37]/5 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Abonnés</span>
                <span className="text-[10px] font-semibold text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full">+{connectionsData.followGrowth}%</span>
              </div>
              <p className="font-mono text-2xl font-bold text-[#D4AF37]">{connectionsData.followers}</p>
              <p className="text-xs text-gray-400 mt-1">sur la période</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.44, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Heart className="w-5 h-5 text-[#D93025]" /> Engagement contenu</h3>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'J\'aime', value: engagementData.likes, icon: <Heart className="w-4 h-4" />, color: '#D93025' },
              { label: 'Commentaires', value: engagementData.comments, icon: <MessageSquare className="w-4 h-4" />, color: '#003087' },
              { label: 'Partages', value: engagementData.shares, icon: <Share2 className="w-4 h-4" />, color: '#00A651' },
              { label: 'Enregistrés', value: engagementData.saves, icon: <Bookmark className="w-4 h-4" />, color: '#D4AF37' },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl">
                <span className="inline-flex items-center justify-center mb-1" style={{ color: item.color }}>{item.icon}</span>
                <p className="font-mono text-lg font-bold text-[#2C2E2F]">{item.value}</p>
                <p className="text-[10px] text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Profile Completeness & Market Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-sm border">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Comparaison marché</h3>
          <div className="space-y-3">
            {DEMO_COMPARISON.metrics.map(metric => {
              return (
                <div key={metric.labelFr} className="flex items-center gap-3">
                  <div className="w-32 shrink-0"><p className="text-xs text-gray-600 truncate">{metric.labelFr}</p></div>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#003087] w-12 text-right">{metric.user}{metric.unit}</span>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div className={`h-full rounded-full ${metric.status === 'above' ? 'bg-[#00A651]' : metric.status === 'below' ? 'bg-[#D93025]' : 'bg-[#D4AF37]'}`} style={{ width: `${Math.min(100, (metric.user / metric.market) * 60)}%` }} />
                      </div>
                      <div className="absolute top-0 h-full w-0.5 bg-gray-400" style={{ left: '60%' }} />
                    </div>
                    <span className="text-xs text-gray-400 w-14">marché: {metric.market}{metric.unit}</span>
                  </div>
                  {metric.status === 'above' ? <ArrowUpRight className="w-3.5 h-3.5 text-[#00A651]" /> : metric.status === 'below' ? <ArrowDownRight className="w-3.5 h-3.5 text-[#D93025]" /> : <Minus className="w-3.5 h-3.5 text-[#D4AF37]" />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-[#00A651]/5 rounded-xl border border-[#00A651]/10">
            <p className="text-xs text-[#2C2E2F]">
              <span className="font-semibold text-[#00A651]">Votre taux de conversion est 18% supérieur</span> à la moyenne des agents de {AGENT_ANALYTICS.localRanking.city}.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Rebecca Mini Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: easeOut }} className="mt-6 bg-gradient-to-r from-[#003087] to-[#003087]/90 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009CDE] to-[#D4AF37] flex items-center justify-center"><Lightbulb className="w-5 h-5 text-white" /></div>
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
  );
}
