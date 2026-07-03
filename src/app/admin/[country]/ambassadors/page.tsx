'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Award, Search, Loader2, ChevronLeft, ChevronRight, DollarSign,
  Users, TrendingUp,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface AmbassadorRow {
  id: string;
  name: string;
  level: string;
  referrals: number;
  conversions: number;
  commissionEarned: number;
  commissionPending: number;
  joinedAt: string;
}

interface CommissionRow {
  id: string;
  ambassador: string;
  referral: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AmbassadorsResponse {
  ambassadors?: AmbassadorRow[];
  commissions?: CommissionRow[];
  summary: {
    total: number;
    bronze: number;
    silver: number;
    gold: number;
    totalCommissionPaid: number;
    totalCommissionPending: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const levelConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  bronze: { label: 'Bronze', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-300', icon: '🥉' },
  silver: { label: 'Silver', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-400', icon: '🥈' },
  gold: { label: 'Gold', color: 'text-yellow-800', bg: 'bg-yellow-50 border-[#D4AF37]', icon: '🥇' },
};

const commissionStatusLabels: Record<string, string> = {
  pending: 'En attente', paid: 'Payée', cancelled: 'Annulée',
};
const commissionStatusColors: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700', paid: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700',
};

export default function CountryAmbassadorsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [tab, setTab] = useState<'ambassadors' | 'commissions'>('ambassadors');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  queryParams.set('tab', tab);
  if (search) queryParams.set('search', search);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<AmbassadorsResponse>({
    queryKey: ['admin-ambassadors', country, tab, search, page],
    queryFn: () => apiFetch(`/api/admin/ambassadors?${queryParams.toString()}`),
  });

  const ambassadors = data?.ambassadors || [];
  const commissions = data?.commissions || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#D4AF37]" />
            Ambassadeurs — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Programme ambassadeurs du {COUNTRY_NAMES[country]}
          </p>
        </div>
      </div>

      {/* Tab switch */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'ambassadors' ? 'default' : 'outline'}
          onClick={() => { setTab('ambassadors'); setPage(1); }}
          className={tab === 'ambassadors' ? 'bg-[#003087] text-white' : ''}
        >
          <Users className="w-4 h-4 mr-2" /> Ambassadeurs ({summary?.total ?? 0})
        </Button>
        <Button
          variant={tab === 'commissions' ? 'default' : 'outline'}
          onClick={() => { setTab('commissions'); setPage(1); }}
          className={tab === 'commissions' ? 'bg-[#D4AF37] text-white' : ''}
        >
          <DollarSign className="w-4 h-4 mr-2" /> Commissions
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg">
              🥉
            </div>
            <div>
              <p className="text-xl font-bold text-amber-800">{summary?.bronze ?? 0}</p>
              <p className="text-xs text-gray-500">Bronze</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg">
              🥈
            </div>
            <div>
              <p className="text-xl font-bold text-gray-700">{summary?.silver ?? 0}</p>
              <p className="text-xs text-gray-500">Silver</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-lg">
              🥇
            </div>
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{summary?.gold ?? 0}</p>
              <p className="text-xs text-gray-500">Gold</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={tab === 'ambassadors' ? 'Rechercher un ambassadeur...' : 'Rechercher une commission...'}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9"
        />
      </div>

      {/* Content */}
      {tab === 'ambassadors' ? (
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Ambassadeur</th>
                    <th className="text-left p-4 font-medium text-gray-600">Niveau</th>
                    <th className="text-left p-4 font-medium text-gray-600">Parrainages</th>
                    <th className="text-left p-4 font-medium text-gray-600">Conversions</th>
                    <th className="text-left p-4 font-medium text-gray-600">Commission gagnée</th>
                    <th className="text-left p-4 font-medium text-gray-600">En attente</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : ambassadors.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun ambassadeur trouvé</td></tr>
                  ) : (
                    ambassadors.map((amb) => {
                      const lc = levelConfig[amb.level] || levelConfig.bronze;
                      return (
                        <tr key={amb.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                                <Award className="w-4 h-4 text-[#003087]" />
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 block">{amb.name}</span>
                                <span className="text-xs text-gray-500">Depuis {new Date(amb.joinedAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={`${lc.bg} ${lc.color} border text-xs`} variant="outline">
                              {lc.icon} {lc.label}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-900 font-medium">{amb.referrals}</td>
                          <td className="p-4 text-gray-600">{amb.conversions}</td>
                          <td className="p-4 text-[#D4AF37] font-medium">{formatXOF(amb.commissionEarned)}</td>
                          <td className="p-4 text-amber-600 font-medium">{formatXOF(amb.commissionPending)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Ambassadeur</th>
                    <th className="text-left p-4 font-medium text-gray-600">Parrainé</th>
                    <th className="text-left p-4 font-medium text-gray-600">Montant</th>
                    <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                    <th className="text-left p-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : commissions.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucune commission trouvée</td></tr>
                  ) : (
                    commissions.map((c) => (
                      <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{c.ambassador}</td>
                        <td className="p-4 text-gray-600">{c.referral}</td>
                        <td className="p-4 text-[#D4AF37] font-medium">{formatXOF(c.amount)}</td>
                        <td className="p-4">
                          <Badge className={`${commissionStatusColors[c.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                            {commissionStatusLabels[c.status] || c.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {(pagination.page - 1) * LIMIT + 1}–{Math.min(pagination.page * LIMIT, pagination.total)} sur {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{page} / {pagination.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(pagination.totalPages, page + 1))} disabled={page >= pagination.totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
