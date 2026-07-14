'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Percent, Globe, CreditCard, ShieldCheck, Crown,
  Save, RefreshCw, AlertTriangle, Loader2, CheckCircle2, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useAdminCommissions, useAdminSettingsPayments, useAdminSettingsKycLevels,
  useAdminSettingsCountries, useAdminSettingsPremiumTiers,
} from '@/hooks/useAdminApi';

const TABS = [
  { id: 'commissions', label: 'Commissions', icon: Percent },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'kyc', label: 'KYC & Limites', icon: ShieldCheck },
  { id: 'countries', label: 'Pays', icon: Globe },
  { id: 'premium', label: 'Premium', icon: Crown },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('commissions');
  const [saving, setSaving] = useState(false);
  const handleSave = () => { setSaving(true); setTimeout(() => setSaving(false), 1000); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2"><Settings className="w-6 h-6" />Paramètres plateforme</h1>
          <p className="text-sm text-gray-500 mt-1">Configuration globale — commissions, paiements, KYC, pays, Premium</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#003087] hover:bg-[#001f5c]">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="flex gap-1 border-b overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-[#003087] text-[#003087]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{tab.label}
            </button>
          );
        })}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {activeTab === 'commissions' && <CommissionsTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'kyc' && <KycTab />}
        {activeTab === 'countries' && <CountriesTab />}
        {activeTab === 'premium' && <PremiumTab />}
      </motion.div>
    </div>
  );
}

function CommissionsTab() {
  const { data, isLoading } = useAdminCommissions();
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
  if (isLoading) return <Card><CardContent className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></CardContent></Card>;
  const commissions = data?.commissions || [];
  const totals = data?.totals;
  const byCountry = data?.byCountry || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase">Commission totale</p><p className="text-2xl font-bold text-[#D4AF37]">{fmt(totals?.totalCommission || 0)} FCFA</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase">Volume total</p><p className="text-2xl font-bold text-[#003087]">{fmt(totals?.totalVolume || 0)} FCFA</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase">Taux moyen effectif</p><p className="text-2xl font-bold text-green-600">{totals?.avgRate || 0}%</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500 uppercase">Transactions libérées</p><p className="text-2xl font-bold text-[#0a2a5e]">{totals?.transactionCount || 0}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e]">Commissions escrow par type de transaction (CDC §6.2)</CardTitle>
          <p className="text-xs text-gray-500 mt-1">Taux calculés en temps réel depuis les transactions libérées. Si aucune transaction n'existe pour un type, le taux par défaut du CDC est affiché.</p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Taux effectif</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Min (FCFA)</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Max (FCFA)</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Transactions</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Volume</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Commission perçue</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Source</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {commissions.map((c) => (
                  <tr key={c.type} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0a2a5e]">{c.type}</td>
                    <td className="px-4 py-3 text-right"><span className={`font-mono font-bold ${c.isLive ? 'text-green-600' : 'text-gray-500'}`}>{c.rate}%</span></td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(c.min)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">{fmt(c.max)}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.transactionCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(c.totalVolume)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#D4AF37]">{fmt(c.totalCommission)}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={c.isLive ? 'default' : 'secondary'} className={c.isLive ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>{c.isLive ? 'Temps réel' : 'CDC défaut'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      {byCountry.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Commissions par pays</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Pays</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Transactions</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Volume</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Commission</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {byCountry.map((c) => (
                  <tr key={c.country} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#0a2a5e]">{c.country}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{c.count}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(c.volume)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[#D4AF37]">{fmt(c.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PaymentsTab() {
  const { data, isLoading } = useAdminSettingsPayments();
  if (isLoading) return <Card><CardContent className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></CardContent></Card>;
  const providers = data?.providers || [];
  const volumeByType = data?.volumeByType || [];
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Providers de paiement (CDC §7.1)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {providers.map((p) => (
            <div key={p.name} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50/50">
              <div>
                <p className="text-sm font-semibold text-[#0a2a5e]">{p.name}</p>
                <p className="text-xs text-gray-500">{p.type} · {p.envVar}{p.masked ? ` = ${p.masked}` : ''}</p>
              </div>
              <Badge variant={p.status === 'active' ? 'default' : 'secondary'}
                     className={p.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-100'}>
                {p.status === 'active' ? '✓ Configuré' : '✗ Non configuré'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      {volumeByType.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Volume par type de transaction (30 derniers jours)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Type</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-700">Transactions</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-700">Volume</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {volumeByType.map((v) => (
                  <tr key={v.type} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0a2a5e]">{v.type}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{v.count}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{fmt(v.volume)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KycTab() {
  const { data, isLoading } = useAdminSettingsKycLevels();
  if (isLoading) return <Card><CardContent className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></CardContent></Card>;
  const levels = data?.levels || [];
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Niveaux KYC et limites (CDC §4.3)</CardTitle></CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Niveau</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Nom</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Max transaction</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Publier</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Acheter</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Utilisateurs</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {levels.map((l) => (
              <tr key={l.level} className="hover:bg-gray-50">
                <td className="px-4 py-3"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#003087] text-white font-bold text-xs">L{l.level}</span></td>
                <td className="px-4 py-3 font-semibold text-[#0a2a5e]">{l.name}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{l.label}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{l.maxTx > 0 ? fmt(l.maxTx) + ' FCFA' : '—'}</td>
                <td className="px-4 py-3 text-center">{l.canPublish ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" /> : <XCircle className="w-4 h-4 text-gray-300 inline" />}</td>
                <td className="px-4 py-3 text-center">{l.canBuy ? <CheckCircle2 className="w-4 h-4 text-green-600 inline" /> : <XCircle className="w-4 h-4 text-gray-300 inline" />}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-[#003087]">{l.userCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CountriesTab() {
  const { data, isLoading } = useAdminSettingsCountries();
  if (isLoading) return <Card><CardContent className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></CardContent></Card>;
  const countries = data || [];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Pays et sous-domaines (CDC §3.2 + §9)</CardTitle></CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Pays</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Sous-domaine</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Utilisateurs</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Propriétés</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Statut</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {countries.map((c) => (
              <tr key={c.code} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-xl">{c.flag}</span><span className="font-semibold text-[#0a2a5e]">{c.name}</span><span className="text-xs text-gray-400">({c.code})</span></div></td>
                <td className="px-4 py-3"><code className="text-xs bg-gray-100 px-2 py-1 rounded">{c.subdomain}.afribayit.com</code></td>
                <td className="px-4 py-3 text-right text-gray-700">{c.users.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 text-right text-gray-700">{c.properties}</td>
                <td className="px-4 py-3 text-center"><Badge variant={c.status === 'live' ? 'default' : 'secondary'} className={c.status === 'live' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>{c.status === 'live' ? 'En ligne' : 'Planifié'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function PremiumTab() {
  const { data, isLoading } = useAdminSettingsPremiumTiers();
  if (isLoading) return <Card><CardContent className="py-12 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#003087]" /></CardContent></Card>;
  const tiers = data || [];
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base font-semibold text-[#0a2a5e]">Tiers Premium Agent (CDC §5.5b.1 + §11.2)</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {tiers.map((t) => (
            <div key={t.name} className={`p-4 rounded-xl border-2 ${t.name === 'Avancé' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-display font-bold text-[#0a2a5e]">{t.name}</h4>
                {t.name === 'Avancé' && <Badge className="bg-[#D4AF37] text-white hover:bg-[#D4AF37]"><Crown className="w-3 h-3 mr-1" />Populaire</Badge>}
              </div>
              <p className="text-2xl font-bold text-[#003087] mb-3">{t.label}</p>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li className="flex items-start gap-1.5"><span className="text-[#00A651]">✓</span><span>{t.properties === -1 ? 'Annonces illimitées' : `${t.properties} annonces`}</span></li>
                <li className="flex items-start gap-1.5">{t.boost ? <span className="text-[#00A651]">✓</span> : <span className="text-gray-300">×</span>}<span>Boost algorithme</span></li>
                <li className="flex items-start gap-1.5">{t.stats ? <span className="text-[#00A651]">✓</span> : <span className="text-gray-300">×</span>}<span>Statistiques avancées</span></li>
              </ul>
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-gray-500">Abonnés actifs</p>
                <p className="text-xl font-bold text-[#0a2a5e]">{t.activeSubscribers}</p>
                <p className="text-[10px] text-gray-400 mt-1">Revenu: {fmt(t.monthlyRevenue)} FCFA/mois</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800">Les modifications de tarifs seront appliquées uniquement aux nouveaux abonnements. Les abonnements en cours conservent leur tarif jusqu'à expiration.</p>
        </div>
      </CardContent>
    </Card>
  );
}
