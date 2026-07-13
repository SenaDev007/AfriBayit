'use client';

/**
 * /admin/investments — Investissements (CDC §5.1 + §8.3.1)
 *
 * Admin view for monitoring the investment module:
 *   - Active investor portfolios
 *   - Score IA d'investissement (0-100) stats
 *   - Alertes prix déclenchées
 *   - ROI calculator usage analytics
 *   - Top performing properties (investor perspective)
 *
 * TODO: connect to backend /investment/* endpoints when available
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Coins, Target, BarChart3, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminInvestmentsPage() {
  const kpis = [
    { label: 'Investisseurs actifs', value: 47, icon: TrendingUp, color: 'text-[#003087]', bg: 'bg-[#003087]/10' },
    { label: 'Capital total investi', value: '2.4 Mrd FCFA', icon: Coins, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { label: 'ROI moyen', value: '+18.3%', icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Alertes prix actives', value: 12, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const topProperties = [
    { title: 'Villa Cadjèhoun, Cotonou', score: 92, investorCount: 8, totalInvested: 85000000, roi: '+24%' },
    { title: 'Immeuble Cocody, Abidjan', score: 88, investorCount: 12, totalInvested: 145000000, roi: '+21%' },
    { title: 'Terrain Lomé-Ganvié', score: 85, investorCount: 5, totalInvested: 32000000, roi: '+31%' },
    { title: 'Appartement Ouaga', score: 81, investorCount: 6, totalInvested: 28000000, roi: '+15%' },
  ];

  const recentAlerts = [
    { property: 'Villa Cotonou', type: 'Baisse de prix -8%', date: 'Il y a 2h', severity: 'info' },
    { property: 'Terrain Abidjan', type: 'Hausse +15% en 30j', date: 'Il y a 5h', severity: 'success' },
    { property: 'Appartement Lomé', type: 'Score IA réévalué +5pts', date: 'Hier', severity: 'info' },
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
        {kpis.map((kpi, idx) => {
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
                    <th className="text-center px-4 py-2 font-semibold text-gray-700">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProperties.map((p) => (
                    <tr key={p.title} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.title}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                          <span className="font-bold text-[#D4AF37]">{p.score}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{p.investorCount}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-700">
                        {new Intl.NumberFormat('fr-FR').format(p.totalInvested)} FCFA
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          {p.roi}
                        </Badge>
                      </td>
                    </tr>
                  ))}
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
            {recentAlerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-gray-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#0a2a5e]">{alert.property}</p>
                    <p className="text-xs text-gray-600">{alert.type}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{alert.date}</span>
                </div>
              </div>
            ))}
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
                correspond à leurs critères.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
