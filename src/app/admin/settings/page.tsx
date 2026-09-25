'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Percent, Globe, CreditCard, ShieldCheck, Crown, DatabaseZap,
  Save, RefreshCw, AlertTriangle, Loader2, CheckCircle2, XCircle, Radio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useAdminCommissions, useAdminSettingsPayments, useAdminSettingsKycLevels,
  useAdminSettingsCountries, useAdminSettingsPremiumTiers,
} from '@/hooks/useAdminApi';
import { apiFetch } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n/use-translate';
import { CountryFlag } from '@/components/ui/CountryFlag';

const TABS = [
  { id: 'commissions', label: 'Commissions', icon: Percent },
  { id: 'payments', label: 'Paiements', icon: CreditCard },
  { id: 'kyc', label: 'KYC & Limites', icon: ShieldCheck },
  { id: 'countries', label: 'Pays', icon: Globe },
  { id: 'premium', label: 'Premium', icon: Crown },
  { id: 'realtime', label: 'Temps réel', icon: Radio },
  { id: 'maintenance', label: 'Maintenance', icon: DatabaseZap },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminSettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>('commissions');
  const [saving, setSaving] = useState(false);
  const handleSave = () => { setSaving(true); setTimeout(() => setSaving(false), 1000); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2"><Settings className="w-6 h-6" />{t('adminSettings.pageTitle', 'Paramètres')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('adminSettings.pageSubtitle', 'Configuration de la plateforme')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#003087] hover:bg-[#001f5c]">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? t('adminSettings.saving', 'Sauvegarde...') : t('adminSettings.btnSave', 'Sauvegarder')}
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
        {activeTab === 'realtime' && <RealtimeTab />}
        {activeTab === 'maintenance' && <MaintenanceTab />}
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
                <td className="px-4 py-3"><div className="flex items-center gap-2"><span className="text-xl"><CountryFlag code={c.flag} /></span><span className="font-semibold text-[#0a2a5e]">{c.name}</span><span className="text-xs text-gray-400">({c.code})</span></div></td>
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

// ─────────────────────────────────────────────────────────────────────────
// Maintenance — migration idempotente des données (audit Manus P0/P1)
// ─────────────────────────────────────────────────────────────────────────

interface MigratePreview {
  mode: 'preview';
  scope: string;
  current: { artisans: number; notaries: number };
  pending: { directoryUsers: number; artisans: number; notaries: number; recordsDedup: string[] };
}

interface MigrateApplied {
  mode: 'applied';
  durationMs: number;
  scope: string;
  directory: { usersUpserted: number; artisansUpserted: number; notariesUpserted: number; before: { artisans: number; notaries: number }; after: { artisans: number; notaries: number } } | null;
  images: { imagesScanned: number; duplicatesRemoved: number; recordsUpdated: number } | null;
  records: { model: string; scanned: number; duplicatesSoftDeleted: number; hardDeleted?: number }[] | null;
  cachesInvalidated: boolean;
  message?: string;
}

function MaintenanceTab() {
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<MigratePreview | null>(null);
  const [result, setResult] = useState<MigrateApplied | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Charger l'aperçu (lecture seule) à l'ouverture de l'onglet
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<MigratePreview>('/api/admin/migrate', { auth: true });
        if (!cancelled) setPreview(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Aperçu indisponible');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshPreview = async () => {
    setError(null);
    try {
      const data = await apiFetch<MigratePreview>('/api/admin/migrate', { auth: true });
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Aperçu indisponible');
    }
  };

  const apply = async () => {
    setApplying(true);
    setError(null);
    setResult(null);
    try {
      const data = await apiFetch<MigrateApplied>('/api/admin/migrate', {
        method: 'POST',
        body: JSON.stringify({ directory: true, images: true, records: true }),
        headers: { 'Content-Type': 'application/json' },
        auth: true,
      });
      setResult(data);
      // rafraîchir l'aperçu après application
      void refreshPreview();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la migration');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e] flex items-center gap-2">
            <DatabaseZap className="w-4 h-4 text-[#D4AF37]" />
            Migration des données (audit P0/P1 — annuaires &amp; déduplication)
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Patch idempotent et non destructif : alimente les annuaires Artisans/Notaires (upserts),
            déduplique les tableaux d&apos;images et soft-supprime les enregistrements dupliqués
            (annonces, hôtels, guesthouses, communauté, avis). Rejouable sans risque — appliqué
            automatiquement à chaque déploiement.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {preview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-[10px] uppercase text-gray-500">Artisans en base</p>
                <p className="text-xl font-bold text-[#003087]">{preview.current.artisans}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 border">
                <p className="text-[10px] uppercase text-gray-500">Notaires en base</p>
                <p className="text-xl font-bold text-[#003087]">{preview.current.notaries}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-[10px] uppercase text-gray-500">Artisans à importer</p>
                <p className="text-xl font-bold text-[#D4AF37]">+{preview.pending.artisans}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-[10px] uppercase text-gray-500">Notaires à importer</p>
                <p className="text-xl font-bold text-[#D4AF37]">+{preview.pending.notaries}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={apply} disabled={applying} className="bg-[#003087] hover:bg-[#001f5c]">
              {applying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DatabaseZap className="w-4 h-4 mr-2" />}
              {applying ? 'Application en cours…' : 'Appliquer la migration'}
            </Button>
            <Button variant="outline" onClick={refreshPreview} disabled={applying}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Rafraîchir l&apos;aperçu
            </Button>
            <span className="text-xs text-gray-400">Portée : {preview?.scope ?? '—'}</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
              <XCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-800">
                <CheckCircle2 className="w-4 h-4" />
                {result.message ?? 'Migration appliquée'} ({Math.round(result.durationMs / 100) / 10}s)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {result.directory && (
                  <>
                    <div><span className="text-gray-500">Artisans :</span> <b>{result.directory.before.artisans} → {result.directory.after.artisans}</b></div>
                    <div><span className="text-gray-500">Notaires :</span> <b>{result.directory.before.notaries} → {result.directory.after.notaries}</b></div>
                  </>
                )}
                {result.images && (
                  <div><span className="text-gray-500">Images dupliquées retirées :</span> <b>{result.images.duplicatesRemoved}</b></div>
                )}
                {result.directory && (
                  <div><span className="text-gray-500">Comptes annuaire :</span> <b>{result.directory.usersUpserted}</b></div>
                )}
              </div>
              {result.records && result.records.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b"><tr>
                      <th className="text-left py-1.5 pr-3 font-semibold text-gray-600">Modèle</th>
                      <th className="text-right py-1.5 pr-3 font-semibold text-gray-600">Lignes vivantes</th>
                      <th className="text-right py-1.5 font-semibold text-gray-600">Doublons retirés</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.records.map((r) => (
                        <tr key={r.model}>
                          <td className="py-1.5 pr-3 font-mono text-gray-700">{r.model}</td>
                          <td className="py-1.5 pr-3 text-right text-gray-600">{r.scanned}</td>
                          <td className="py-1.5 text-right font-semibold text-green-700">{r.hardDeleted ?? r.duplicatesSoftDeleted}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Badge variant={result.cachesInvalidated ? 'default' : 'secondary'} className={result.cachesInvalidated ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                  {result.cachesInvalidated ? 'Caches invalidés' : 'Caches non invalidés'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">Idempotent — rejouable</Badge>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2 text-xs text-blue-800">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <p>
              Aucune donnée n&apos;est physiquement supprimée (hors avis strictement identiques) :
              les doublons sont marqués <code className="px-1 py-0.5 bg-blue-100 rounded">deletedAt</code> et
              disparaissent des pages publiques. Cette migration s&apos;exécute aussi automatiquement à la
              fin de chaque build de production — ce bouton sert de re-déclencheur manuel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Temps réel & Communications — état de configuration des providers
   (LiveKit / Agora / Daily / Pusher / WebSocket API dédiée).
   Aucun secret n'est exposé : la route ne renvoie que des booléens.
   ═══════════════════════════════════════════════════════════════════════════ */
interface RealtimeProvider {
  configured: boolean;
  label: string;
  envVars: string[];
  activeUse: string;
}
interface RealtimeStatus {
  providers: Record<string, RealtimeProvider>;
  chatTransport: string;
  generatedAt: string;
}

function RealtimeTab() {
  const [status, setStatus] = useState<RealtimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch<RealtimeStatus>('/api/admin/realtime/status', { auth: true });
        if (!cancelled) setStatus(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'État indisponible');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#8b9cb8] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transport actif */}
      <Card className="bg-admin-panel/50 border-primary-green/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary-green" />
            Messages temps réel — Communauté
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white">Chat des canaux actif</p>
              <p className="text-xs text-gray-400 mt-0.5">{status?.chatTransport}</p>
              <p className="text-xs text-gray-500 mt-1">
                Les messages apparaissent en direct (≤ 2,5 s), avec envoi optimiste, notifications
                par canal et salons vocaux LiveKit — aucun providers externe requis pour le texte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Providers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(status?.providers ?? {}).map(([key, p]) => (
          <Card key={key} className={`bg-admin-panel/50 ${p.configured ? 'border-green-500/25' : 'border-white/10'}`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-white">{p.label}</p>
                {p.configured ? (
                  <Badge className="bg-green-500/15 text-green-400 border-green-500/30 border hover:bg-green-500/25">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Configuré
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10">
                    <XCircle className="w-3 h-3 mr-1" /> Non configuré
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-3">{p.activeUse}</p>
              <div className="space-y-1">
                {p.envVars.map((v) => (
                  <p key={v} className="font-mono text-[11px] text-gray-500 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.configured ? 'bg-green-400' : 'bg-gray-600'}`} />
                    {v}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-gray-500">
        Ajoutez les variables dans Vercel (Settings → Environment Variables) puis redéployez.
        La table <code className="px-1 py-0.5 bg-white/10 rounded text-gray-300">channel_messages</code> du
        chat est créée automatiquement à chaque déploiement (DDL idempotent).
      </p>
    </div>
  );
}
