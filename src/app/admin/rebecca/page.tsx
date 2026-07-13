'use client';

/**
 * /admin/rebecca — Rebecca IA Console (CDC §8.2)
 *
 * Admin console for monitoring the AfriBayit AI assistant Rebecca:
 *   - Conversation metrics (volume, latency, satisfaction)
 *   - Multi-channel deployment status (chat, WhatsApp, voice, USSD)
 *   - Cost tracking (tokens consumed, monthly inference cost)
 *   - Anti-fraud detection alerts (CDC §8.3.3)
 *   - Document analysis pipeline status (CDC §8.3.4)
 *   - Live conversations feed with moderation tools
 *
 * TODO: connect to backend /rebecca/* endpoints when available
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Bot, MessageCircle, Mic, Smartphone, Activity, DollarSign,
  ShieldAlert, FileSearch, Zap, TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminRebeccaPage() {
  const channels = [
    { name: 'Chat web', icon: MessageCircle, status: 'online', conversations24h: 1247, avgLatency: '1.2s' },
    { name: 'WhatsApp', icon: Smartphone, status: 'online', conversations24h: 832, avgLatency: '2.1s' },
    { name: 'Voice (TTS/STT)', icon: Mic, status: 'online', conversations24h: 142, avgLatency: '3.4s' },
    { name: 'USSD (Africa\'s Talking)', icon: Smartphone, status: 'degraded', conversations24h: 89, avgLatency: '5.8s' },
  ];

  const kpis = [
    { label: 'Conversations 24h', value: '2 310', icon: MessageCircle, color: 'text-[#003087]' },
    { label: 'Taux de satisfaction', value: '94.2%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Coût inférence (mois)', value: '47.30 €', icon: DollarSign, color: 'text-[#D4AF37]' },
    { label: 'Tokens consommés', value: '8.4M', icon: Zap, color: 'text-purple-600' },
  ];

  const fraudAlerts = [
    { severity: 'high', title: 'Annonce suspecte détectée', description: 'Villa Cotonou — prix 60% sous le marché', time: 'Il y a 12 min' },
    { severity: 'medium', title: 'Document foncier invalide', description: 'Titre foncier #BJ-2024-8832 — watermark modifié', time: 'Il y a 47 min' },
    { severity: 'low', title: 'Comportement scraping', description: 'User u_8821 — 127 requêtes /min sur /properties', time: 'Il y a 2h' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
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
          Tous les canaux opérationnels
        </Badge>
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
                    <Icon className={`w-8 h-8 ${kpi.color} opacity-30`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

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
              const Icon = ch.icon;
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

        {/* Anti-fraud */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Anti-fraude IA — Alertes (CDC §8.3.3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fraudAlerts.map((alert, idx) => {
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
              return (
                <div key={idx} className={`p-3 rounded-lg border ${colors[alert.severity]}`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Badge className={`${badges[alert.severity]} hover:${badges[alert.severity]} uppercase text-[10px]`}>
                      {alert.severity === 'high' ? 'Critique' : alert.severity === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                    <span className="text-[10px] text-gray-500">{alert.time}</span>
                  </div>
                  <p className="text-sm font-semibold text-[#0a2a5e]">{alert.title}</p>
                  <p className="text-xs text-gray-600">{alert.description}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

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
              <p className="text-3xl font-bold text-[#003087]">847</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Titres fonciers analysés</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-3xl font-bold text-green-600">99.2%</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Taux de précision OCR</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <p className="text-3xl font-bold text-amber-600">23</p>
              <p className="text-xs text-gray-500 uppercase mt-1">Anomalies détectées</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-[#003087]/5 text-sm text-[#003087]">
            💡 Le moteur IA Rebecca analyse automatiquement chaque titre foncier uploadé via GeoTrust
            pour détecter les falsifications (watermarks, signatures, numéros ANDF) et croise les
            données avec la base cadastrale.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
