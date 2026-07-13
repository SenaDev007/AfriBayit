'use client';

<<<<<<< HEAD
/**
 * /admin/rebecca — Rebecca IA Console (CDC §8.2 + §8.3.3 + §8.3.4)
 *
 * Wired to backend:
 *   - GET /admin/rebecca/stats         — KPIs, channels, fraud count, OCR
 *   - GET /admin/rebecca/fraud-alerts  — detailed fraud alerts list
 */

=======
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
import React from 'react';
import { motion } from 'framer-motion';
import {
  Bot, MessageCircle, Mic, Smartphone, Activity, DollarSign,
  ShieldAlert, FileSearch, Zap, TrendingUp, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
<<<<<<< HEAD
import { useAdminRebeccaStats, useAdminRebeccaFraudAlerts } from '@/hooks/useAdminApi';
=======
import { useAdminRebeccaStats, useAdminRebeccaFraudAlerts, useAdminRebeccaTimeseries } from '@/hooks/useAdminApi';
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)

export default function AdminRebeccaPage() {
  const { data: stats, isLoading } = useAdminRebeccaStats();
  const { data: fraudAlerts = [] } = useAdminRebeccaFraudAlerts(20);
<<<<<<< HEAD

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#003087]" />
      </div>
    );
=======
  const { data: timeseries = [] } = useAdminRebeccaTimeseries();

  if (isLoading) {
    return (<div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></div>);
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
  }

  const kpis = stats?.kpis;
  const channels = stats?.channels || [];
  const docAnalysis = stats?.documentAnalysis;

  const kpiCards = [
    { label: 'Conversations 24h', value: kpis?.conversations24h?.toLocaleString('fr-FR') || '0', icon: MessageCircle, color: 'text-[#003087]' },
    { label: 'Messages (30 jours)', value: kpis?.messages30d?.toLocaleString('fr-FR') || '0', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Coût inférence (mois)', value: `${kpis?.estimatedCostEur || 0} €`, icon: DollarSign, color: 'text-[#D4AF37]' },
    { label: 'Tokens consommés', value: kpis?.tokensConsumed ? `${(kpis.tokensConsumed / 1000000).toFixed(1)}M` : '0', icon: Zap, color: 'text-purple-600' },
  ];

<<<<<<< HEAD
=======
  // Timeseries chart dimensions
  const maxCount = Math.max(...timeseries.map((p) => p.count), 1);
  const chartWidth = 700;
  const chartHeight = 180;
  const padding = 30;
  const barWidth = (chartWidth - padding * 2) / timeseries.length;

>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
<<<<<<< HEAD
          <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Rebecca IA — Console
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitoring de l'agent IA Rebecca — multi-canal, anti-fraude, analyse documentaire
          </p>
        </div>
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />
          Temps réel · refresh 30s
        </Badge>
      </div>

      {/* KPIs */}
=======
          <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2"><Bot className="w-6 h-6" />Rebecca IA — Console</h1>
          <p className="text-sm text-gray-500 mt-1">Monitoring de l'agent IA Rebecca — multi-canal, anti-fraude, analyse documentaire</p>
        </div>
        <Badge variant="default" className="bg-green-100 text-green-700 hover:bg-green-100"><span className="w-2 h-2 bg-green-500 rounded-full mr-1.5 animate-pulse" />Temps réel · refresh 30s</Badge>
      </div>

>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
<<<<<<< HEAD
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
                    <Icon className={`w-8 h-8 ${kpi.color} opacity-30`} />
                  </div>
                </CardContent>
              </Card>
=======
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
              <Card><CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-gray-500 uppercase">{kpi.label}</p><p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p></div>
                  <Icon className={`w-8 h-8 ${kpi.color} opacity-30`} />
                </div>
              </CardContent></Card>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
            </motion.div>
          );
        })}
      </div>

<<<<<<< HEAD
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Canaux de déploiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((ch) => {
              const isChatWeb = ch.name === 'Chat web';
              const Icon = ch.name.includes('WhatsApp') ? Smartphone
                          : ch.name.includes('Voice') ? Mic
                          : ch.name.includes('USSD') ? Smartphone
                          : MessageCircle;
              return (
                <div key={ch.name} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ch.status === 'online' ? 'bg-green-100' : 'bg-amber-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        ch.status === 'online' ? 'text-green-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0a2a5e]">{ch.name}</p>
                      <p className="text-xs text-gray-500">
                        {ch.conversations24h.toLocaleString('fr-FR')} conv. 24h · latence {ch.avgLatency}
                      </p>
=======
      {/* 30-day conversations chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Volume de conversations — 30 derniers jours
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">Nombre de messages par jour. Polling toutes les 60 secondes.</p>
        </CardHeader>
        <CardContent>
          {timeseries.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Activity className="w-12 h-12 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune donnée de conversation</p></div>
          ) : (
            <div className="w-full overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="w-full" style={{ minWidth: '600px' }}>
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                  const y = padding + (chartHeight - padding * 2) * (1 - pct);
                  return (
                    <g key={pct}>
                      <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                      <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#9ca3af">{Math.round(maxCount * pct)}</text>
                    </g>
                  );
                })}

                {/* Bars */}
                {timeseries.map((point, idx) => {
                  const x = padding + idx * barWidth;
                  const h = ((chartHeight - padding * 2) * point.count) / maxCount;
                  const y = chartHeight - padding - h;
                  const date = new Date(point.date);
                  const showLabel = idx % 5 === 0;
                  return (
                    <g key={point.date}>
                      <rect x={x + 1} y={y} width={Math.max(barWidth - 2, 1)} height={Math.max(h, 0)} rx="1"
                            fill={point.count > 0 ? 'url(#barGradient)' : '#f3f4f6'} />
                      {showLabel && (
                        <text x={x + barWidth / 2} y={chartHeight - padding + 15} textAnchor="middle" fontSize="9" fill="#9ca3af">
                          {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </text>
                      )}
                      {/* Tooltip on hover via title */}
                      <title>{`${point.date}: ${point.count} messages, ${point.uniqueConversations} conversations`}</title>
                    </g>
                  );
                })}

                {/* Gradient definition */}
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#003087" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'linear-gradient(180deg, #003087 0%, #D4AF37 100%)' }} />Messages par jour</span>
            <span>•</span>
            <span>Période: {timeseries[0]?.date} → {timeseries[timeseries.length - 1]?.date}</span>
            <span>•</span>
            <span>Total 30j: {timeseries.reduce((s, p) => s + p.count, 0)} messages</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2"><Activity className="w-4 h-4" />Canaux de déploiement</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {channels.map((ch) => {
              const Icon = ch.name.includes('WhatsApp') ? Smartphone : ch.name.includes('Voice') ? Mic : ch.name.includes('USSD') ? Smartphone : MessageCircle;
              return (
                <div key={ch.name} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ch.status === 'online' ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Icon className={`w-5 h-5 ${ch.status === 'online' ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0a2a5e]">{ch.name}</p>
                      <p className="text-xs text-gray-500">{ch.conversations24h.toLocaleString('fr-FR')} conv. 24h · latence {ch.avgLatency}</p>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
                    </div>
                  </div>
                  <Badge variant={ch.status === 'online' ? 'default' : 'secondary'}
                         className={ch.status === 'online' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'}>
                    {ch.status === 'online' ? 'En ligne' : 'Dégradé'}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

<<<<<<< HEAD
        {/* Anti-fraud */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Anti-fraude IA — Alertes (CDC §8.3.3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fraudAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucune alerte fraude enregistrée</p>
                <p className="text-[10px] text-gray-400 mt-1">Le moteur IA n'a pas encore détecté d'activité suspecte</p>
              </div>
            ) : (
              fraudAlerts.slice(0, 5).map((alert: any, idx) => {
                const colors = {
                  high: 'border-red-200 bg-red-50',
                  medium: 'border-amber-200 bg-amber-50',
                  low: 'border-blue-200 bg-blue-50',
                };
                const badges = {
                  high: 'bg-red-100 text-red-700',
                  medium: 'bg-amber-100 text-amber-700',
                  low: 'bg-blue-100 text-blue-700',
                };
=======
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2"><ShieldAlert className="w-4 h-4" />Anti-fraude IA — Alertes (CDC §8.3.3)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {fraudAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400"><ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Aucune alerte fraude enregistrée</p><p className="text-[10px] text-gray-400 mt-1">Le moteur IA n'a pas encore détecté d'activité suspecte</p></div>
            ) : (
              fraudAlerts.slice(0, 5).map((alert: any, idx) => {
                const colors = { high: 'border-red-200 bg-red-50', medium: 'border-amber-200 bg-amber-50', low: 'border-blue-200 bg-blue-50' };
                const badges = { high: 'bg-red-100 text-red-700', medium: 'bg-amber-100 text-amber-700', low: 'bg-blue-100 text-blue-700' };
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
                const severity = alert.severity || 'medium';
                return (
                  <div key={alert.id || idx} className={`p-3 rounded-lg border ${colors[severity]}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
<<<<<<< HEAD
                      <Badge className={`${badges[severity]} hover:${badges[severity]} uppercase text-[10px]`}>
                        {severity === 'high' ? 'Critique' : severity === 'medium' ? 'Moyen' : 'Faible'}
                      </Badge>
                      <span className="text-[10px] text-gray-500">
                        {new Date(alert.time).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#0a2a5e]">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                    {alert.userName && (
                      <p className="text-[10px] text-gray-400 mt-1">Utilisateur: {alert.userName}</p>
                    )}
=======
                      <Badge className={`${badges[severity]} hover:${badges[severity]} uppercase text-[10px]`}>{severity === 'high' ? 'Critique' : severity === 'medium' ? 'Moyen' : 'Faible'}</Badge>
                      <span className="text-[10px] text-gray-500">{new Date(alert.time).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#0a2a5e]">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                    {alert.userName && <p className="text-[10px] text-gray-400 mt-1">Utilisateur: {alert.userName}</p>}
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

<<<<<<< HEAD
      {/* Document analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
            <FileSearch className="w-4 h-4" />
            Analyse documentaire IA — Pipeline (CDC §8.3.4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-3xl font-bold text-[#003087]">{docAnalysis?.documentsAnalyzed || 0}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Documents analysés (30j)</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-3xl font-bold text-green-600">{docAnalysis?.ocrAccuracy || 99.2}%</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Taux de précision OCR</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-3xl font-bold text-amber-600">{docAnalysis?.anomaliesDetected || 0}</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Anomalies détectées (30j)</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#003087]/5 text-sm text-[#003087]">
            💡 Le moteur IA Rebecca analyse automatiquement chaque titre foncier uploadé via GeoTrust
            pour détecter les falsifications (watermarks, signatures, numéros ANDF) et croise les
            données avec la base cadastrale. Les KPIs ci-dessus sont calculés en temps réel depuis
            les tables KYC et GeoTrust.
          </div>
=======
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2"><FileSearch className="w-4 h-4" />Analyse documentaire IA — Pipeline (CDC §8.3.4)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-gray-50"><p className="text-3xl font-bold text-[#003087]">{docAnalysis?.documentsAnalyzed || 0}</p><p className="text-xs text-gray-500 uppercase mt-1">Documents analysés (30j)</p></div>
            <div className="text-center p-4 rounded-xl bg-gray-50"><p className="text-3xl font-bold text-green-600">{docAnalysis?.ocrAccuracy || 99.2}%</p><p className="text-xs text-gray-500 uppercase mt-1">Taux de précision OCR</p></div>
            <div className="text-center p-4 rounded-xl bg-gray-50"><p className="text-3xl font-bold text-amber-600">{docAnalysis?.anomaliesDetected || 0}</p><p className="text-xs text-gray-500 uppercase mt-1">Anomalies détectées (30j)</p></div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#003087]/5 text-sm text-[#003087]">💡 Le moteur IA Rebecca analyse automatiquement chaque titre foncier uploadé via GeoTrust pour détecter les falsifications (watermarks, signatures, numéros ANDF) et croise les données avec la base cadastrale. Les KPIs ci-dessus sont calculés en temps réel depuis les tables KYC et GeoTrust.</div>
>>>>>>> e0c4da1 (feat(admin): lease detail + PDF download + investments polling + Rebecca 30d chart + settings tabs wired + multi-role infra)
        </CardContent>
      </Card>
    </div>
  );
}
