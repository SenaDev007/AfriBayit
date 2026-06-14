'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPatch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Scale, Search, CheckCircle2, Clock, FileSignature, MapPin,
  Loader2, ChevronLeft, ChevronRight, Ban, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface NotaryRow {
  id: string;
  name: string;
  licence: string;
  city: string;
  convention: string;
  transactions: number;
  status: string;
}

interface NotariesResponse {
  notaries: NotaryRow[];
  summary: {
    total: number;
    conventionSigned: number;
    pending: number;
    transactions: number;
  };
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const conventionLabels: Record<string, string> = {
  signed: 'Signée', pending: 'En attente', none: 'Non signée', expired: 'Expirée',
};
const conventionColors: Record<string, string> = {
  signed: 'bg-green-50 text-green-700', pending: 'bg-amber-50 text-amber-700',
  none: 'bg-gray-50 text-gray-600', expired: 'bg-red-50 text-red-700',
};

export default function CountryNotariesPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const queryParams = new URLSearchParams();
  queryParams.set('country', country);
  if (search) queryParams.set('search', search);
  if (statusFilter) queryParams.set('status', statusFilter);
  queryParams.set('page', String(page));
  queryParams.set('limit', String(LIMIT));

  const { data, isLoading } = useQuery<NotariesResponse>({
    queryKey: ['admin-notaries', country, search, statusFilter, page],
    queryFn: () => apiFetch(`/api/admin/notaries?${queryParams.toString()}`),
  });

  const notaries = data?.notaries || [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return apiPatch(`/api/notaries/${id}`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notaries', country] });
      toast.success('Action effectuée avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de l'action");
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-[#003087]" />
            Notaires — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gestion des notaires du {COUNTRY_NAMES[country]}
          </p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {summary?.total ?? '—'} notaires
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <Scale className="w-5 h-5 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{summary?.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total notaires</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <FileSignature className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{summary?.conventionSigned ?? 0}</p>
              <p className="text-xs text-gray-500">Convention signée</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{summary?.pending ?? 0}</p>
              <p className="text-xs text-gray-500">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{summary?.transactions ?? 0}</p>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom, licence..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'active', 'pending', 'suspended'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
              className={statusFilter === s ? 'bg-[#003087] text-white' : ''}
              onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s === '' ? 'Tous' : s === 'active' ? 'Actifs' : s === 'pending' ? 'En attente' : 'Suspendus'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Notaire</th>
                  <th className="text-left p-4 font-medium text-gray-600">Licence</th>
                  <th className="text-left p-4 font-medium text-gray-600">Ville</th>
                  <th className="text-left p-4 font-medium text-gray-600">Convention</th>
                  <th className="text-left p-4 font-medium text-gray-600">Transactions</th>
                  <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin mx-auto" />
                      <p className="text-gray-400 mt-2">Chargement...</p>
                    </td>
                  </tr>
                ) : notaries.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun notaire trouvé</td></tr>
                ) : (
                  notaries.map((notary) => (
                    <tr key={notary.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4 text-[#003087]" />
                          </div>
                          <span className="font-medium text-gray-900">{notary.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 font-mono text-xs">{notary.licence}</td>
                      <td className="p-4 text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {notary.city}
                        </span>
                      </td>
                      <td className="p-4">
                        <Badge className={`${conventionColors[notary.convention] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                          {conventionLabels[notary.convention] || notary.convention}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-900 font-medium">{notary.transactions}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {notary.convention === 'pending' && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8"
                              onClick={() => actionMutation.mutate({ id: notary.id, action: 'verify' })}
                              disabled={actionMutation.isPending}
                            >
                              <ShieldCheck className="w-4 h-4 mr-1" /> Valider
                            </Button>
                          )}
                          {notary.status !== 'suspended' && (
                            <Button
                              variant="ghost" size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                              onClick={() => actionMutation.mutate({ id: notary.id, action: 'suspend' })}
                              disabled={actionMutation.isPending}
                            >
                              <Ban className="w-4 h-4 mr-1" /> Suspendre
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
