'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, TrendingUp, Users, Building2, ArrowLeftRight, Wallet,
} from 'lucide-react';

const PILOT_COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

interface AnalyticsData {
  countryComparison: Array<{
    code: string; users: number; properties: number;
    transactions: number; volume: number; commission: number;
  }>;
  revenueByCountry: Array<{ country: string; revenue: number }>;
  propertiesByType: Array<{ type: string; count: number }>;
  transactionStatusDistribution: Array<{ status: string; count: number }>;
}

const typeLabels: Record<string, string> = {
  villa: 'Villa', appartement: 'Appartement', terrain: 'Terrain',
  bureau: 'Bureau', commerce: 'Commerce', chambre: 'Chambre', guesthouse: 'Guesthouse',
};

const txStatusLabels: Record<string, string> = {
  CREATED: 'Créée', FUNDED: 'Financée', RELEASED: 'Libérée',
  DISPUTED: 'Litige', REFUNDED: 'Remboursée', EXPIRED: 'Expirée',
  DOCS_VALIDATED: 'Docs validés', GEOTRUST_VALIDATED: 'GeoTrust validé',
  NOTARY_ASSIGNED: 'Notaire assigné', NOTARY_IN_PROGRESS: 'Notaire en cours',
  DEED_SIGNED: 'Acte signé', ANDF_REGISTERED: 'ANDF enregistré',
};

function MiniBarChart({ data, labels, colors }: { data: number[]; labels: string[]; colors?: string[] }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-3 h-40">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500 font-medium">
            {v > 0 ? (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v) : '0'}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${Math.max((v / max) * 100, 4)}%`,
              backgroundColor: colors?.[i] || '#003087',
              opacity: 0.85,
            }}
          />
          <span className="text-[10px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: () => apiFetch<AnalyticsData>('/api/admin/analytics'),
    staleTime: 5 * 60 * 1000,
  });

  const comp = analytics?.countryComparison || [];

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-[#003087]" />
          Analytics — Global
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analyse comparative des 4 pays pilotes
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <>
          {/* Country comparison cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {comp.map((c) => {
              const info = PILOT_COUNTRIES.find((p) => p.code === c.code);
              return (
                <Card key={c.code} className="rounded-2xl border border-gray-200">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{info?.flag}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{info?.name}</p>
                        <Badge variant="outline" className="text-[10px] font-mono">{c.code}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Utilisateurs</span>
                        <span className="font-medium">{c.users}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Propriétés</span>
                        <span className="font-medium">{c.properties}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5"><ArrowLeftRight className="w-3.5 h-3.5" /> Transactions</span>
                        <span className="font-medium">{c.transactions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" /> Commissions</span>
                        <span className="font-medium text-[#D4AF37]">{formatXOF(c.commission)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Users by country */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Utilisateurs par pays</h2>
              <MiniBarChart
                data={comp.map((c) => c.users)}
                labels={comp.map((c) => c.code)}
                colors={['#003087', '#009CDE', '#D4AF37', '#00A651']}
              />
            </div>

            {/* Revenue by country */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Commissions par pays</h2>
              <MiniBarChart
                data={comp.map((c) => c.commission)}
                labels={comp.map((c) => c.code)}
                colors={['#003087', '#009CDE', '#D4AF37', '#00A651']}
              />
            </div>
          </div>

          {/* Properties by type + Transaction status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Propriétés par type</h2>
              <div className="space-y-3">
                {(analytics?.propertiesByType || []).map((p) => {
                  const total = (analytics?.propertiesByType || []).reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                  return (
                    <div key={p.type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{typeLabels[p.type] || p.type}</span>
                        <span className="text-gray-500">{p.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#003087] rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Transactions par statut</h2>
              <div className="space-y-3">
                {(analytics?.transactionStatusDistribution || []).map((t) => {
                  const total = (analytics?.transactionStatusDistribution || []).reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? Math.round((t.count / total) * 100) : 0;
                  return (
                    <div key={t.status}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium">{txStatusLabels[t.status] || t.status}</span>
                        <span className="text-gray-500">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#D4AF37] rounded-lg transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
