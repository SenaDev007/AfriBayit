'use client';

/**
 * /admin/investments — Investissements (CDC §5.1 + §8.3.1)
 *
 * Wired to backend:
 *   - GET /admin/investments/stats — KPIs, top properties, recent alerts
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Coins, Target, BarChart3, AlertTriangle,
  ArrowUpRight, Sparkles, Loader2, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminInvestmentsStats } from '@/hooks/useAdminApi';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

export default function AdminInvestmentsPage() {
  const { data, isLoading } = useAdminInvestmentsStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#003087]" />
      </div>
    );
  }

  const kpis = data?.kpis;
  const topProperties = data?.topProperties || [];
  const recentAlerts = data?.recentAlerts || [];

  const kpiCards = [
    { label: 'Investisseurs actifs', value: kpis?.investors ?? 0, icon: Users, color: 'text-[#003087]', bg: 'bg-[#003087]/10' },
    { label: 'Capital total investi', value: kpis ? fmt(kpis.totalCapital) + ' FCFA' : '0 FCFA', icon: Coins, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { label: 'Score IA moyen', value: kpis?.avgScore ?? 0, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Alertes prix déclenchées', value: kpis?.activePriceAlerts ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2">
          <TrendingUp className="w-6 h-6" />
          Investissements
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitoring du module investissement — scores IA, alertes prix, ROI, portfolios
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">{kpi.label}</p>
                      <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Top properties + Recent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Top biens par score IA d'investissement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Bien</th>
                    <th className="text-center px-4 py-2 font-semibold text-gray-700">Score IA</th>
                    <th className="text-center px-4 py-2 font-semibold text-gray-700">Investisseurs</th>
                    <th className="text-right px-4 py-2 font-semibold text-gray-700">Capital</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProperties.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400">
                        <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun bien avec score IA d'investissement pour l'instant</p>
                      </td>
                    </tr>
                  ) : (
                    topProperties.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {p.title}
                          <span className="block text-xs text-gray-400">{p.city}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                            <span className="font-bold text-[#D4AF37]">{p.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{p.investorCount}</td>
                        <td className="px-4 py-3 text-right font-mono text-gray-700">
                          {fmt(p.totalInvested)} FCFA
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Alertes prix récentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte déclenchée</p>
              </div>
            ) : (
              recentAlerts.map((alert, idx) => (
                <div key={alert.id || idx} className="p-3 rounded-lg border bg-gray-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#0a2a5e]">{alert.propertyTitle}</p>
                      <p className="text-xs text-gray-600">
                        {alert.threshold ? `Seuil: ${fmt(alert.threshold)} FCFA` : 'Alerte prix'}
                      </p>
                      {alert.userName && (
                        <p className="text-[10px] text-gray-400 mt-0.5">par {alert.userName}</p>
                      )}
                    </div>
                    {alert.triggeredAt && (
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(alert.triggeredAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-[#003087]/5 to-[#D4AF37]/5 border-[#003087]/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#003087]/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-[#003087]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0a2a5e] mb-1">Module IA Investissement — CDC §8.3.1</h3>
              <p className="text-sm text-gray-600">
                Le moteur IA analyse 23 critères (prix/m², infrastructures, dynamique démographique,
                titres fonciers, etc.) pour calculer un score d'investissement 0-100 sur chaque bien.
                Les alertes prix notifient automatiquement les investisseurs quand une opportunité
                correspond à leurs critères. Les données affichées ci-dessus sont calculées en temps réel
                depuis la base de données.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
