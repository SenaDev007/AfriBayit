'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard, Search, Eye, XCircle, Clock, RotateCcw,
  TrendingUp, Users, Award, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
];

const PLAN_TYPES = [
  { value: '', label: 'Tous les plans' },
  { value: 'agent_seed', label: 'Agent Seed' },
  { value: 'agent_grow', label: 'Agent Grow' },
  { value: 'agent_lead', label: 'Agent Lead' },
  { value: 'agent_network', label: 'Agent Network' },
  { value: 'artisan_pro', label: 'Artisan Pro' },
  { value: 'geometer_pro', label: 'Géomètre Pro' },
  { value: 'notary_pro', label: 'Notaire Pro' },
  { value: 'academy_pro', label: 'Académie Pro' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Active' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'expired', label: 'Expirée' },
  { value: 'past_due', label: 'En retard' },
];

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-50 text-red-700',
  expired: 'bg-gray-100 text-gray-600',
  past_due: 'bg-amber-50 text-amber-700',
};

const statusLabels: Record<string, string> = {
  active: 'Active', cancelled: 'Annulée', expired: 'Expirée', past_due: 'En retard',
};

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

const planLabels: Record<string, string> = {
  agent_seed: 'Agent Seed', agent_grow: 'Agent Grow', agent_lead: 'Agent Lead',
  agent_network: 'Agent Network', artisan_pro: 'Artisan Pro', geometer_pro: 'Géomètre Pro',
  notary_pro: 'Notaire Pro', academy_pro: 'Académie Pro',
};

interface SubscriptionRow {
  id: string;
  planType: string;
  priceXof: number;
  currency: string;
  country: string | null;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string; avatar: string | null; country: string | null };
}

interface SubscriptionsResponse {
  subscriptions: SubscriptionRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { active: number; mrr: number; churnRate: number; mostPopularPlan: string };
}

export default function AdminSubscriptionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ planType: '', status: '', country: '', page: 1 });

  const params = new URLSearchParams();
  if (filters.planType) params.set('planType', filters.planType);
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery<SubscriptionsResponse>({
    queryKey: ['admin-subscriptions', filters],
    queryFn: () => apiFetch<SubscriptionsResponse>(`/api/admin/subscriptions?${params.toString()}`),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => {
      const updates: Record<string, unknown> = {};
      if (action === 'cancel') updates.status = 'cancelled';
      else if (action === 'extend') updates.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      else if (action === 'refund') { updates.status = 'cancelled'; updates.autoRenew = false; }
      return apiPatch(`/api/subscriptions/${id}`, updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      const msgs: Record<string, string> = { cancel: 'Abonnement annulé', extend: 'Abonnement prolongé de 30 jours', refund: 'Remboursement effectué' };
      toast({ title: msgs[variables.action] || 'Action effectuée' });
    },
  });

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abonnements</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des abonnements et revenus récurrents</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Abonnements actifs', value: s?.active?.toLocaleString('fr-FR') || '0', icon: CreditCard, color: 'bg-[#003087]/10 text-[#003087]' },
          { label: 'MRR', value: formatXOF(s?.mrr || 0), icon: TrendingUp, color: 'bg-[#00A651]/10 text-[#00A651]' },
          { label: 'Taux de churn', value: `${s?.churnRate || 0}%`, icon: AlertTriangle, color: 'bg-red-50 text-red-500' },
          { label: 'Plan le plus populaire', value: planLabels[s?.mostPopularPlan || ''] || s?.mostPopularPlan || '-', icon: Award, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.color)}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filters.planType} onValueChange={(v) => setFilters((f) => ({ ...f, planType: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type de plan" /></SelectTrigger>
            <SelectContent>
              {PLAN_TYPES.map((p) => (
                <SelectItem key={p.value || '__all'} value={p.value || '__all'}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value || '__all'} value={s.value || '__all'}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.country} onValueChange={(v) => setFilters((f) => ({ ...f, country: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.value || '__all'} value={c.value || '__all'}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : !data?.subscriptions.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Aucun abonnement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Utilisateur</TableHead>
                  <TableHead className="text-xs font-semibold">Plan</TableHead>
                  <TableHead className="text-xs font-semibold">Prix</TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold">Début</TableHead>
                  <TableHead className="text-xs font-semibold">Fin</TableHead>
                  <TableHead className="text-xs font-semibold">Auto-renouvel.</TableHead>
                  <TableHead className="text-xs font-semibold">Pays</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{sub.user.name}</p>
                        <p className="text-xs text-gray-400">{sub.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{planLabels[sub.planType] || sub.planType}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">{formatXOF(sub.priceXof)}</TableCell>
                    <TableCell><Badge className={cn('text-[10px]', statusColors[sub.status] || 'bg-gray-100 text-gray-600')}>{statusLabels[sub.status] || sub.status}</Badge></TableCell>
                    <TableCell className="text-xs text-gray-500">{new Date(sub.startDate).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-xs text-gray-500">{sub.endDate ? new Date(sub.endDate).toLocaleDateString('fr-FR') : '-'}</TableCell>
                    <TableCell>{sub.autoRenew ? <Badge className="bg-green-50 text-green-700 text-[10px]">Oui</Badge> : <Badge variant="outline" className="text-[10px]">Non</Badge>}</TableCell>
                    <TableCell className="text-sm">{sub.country || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Annuler" onClick={() => actionMutation.mutate({ id: sub.id, action: 'cancel' })}>
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Prolonger" onClick={() => actionMutation.mutate({ id: sub.id, action: 'extend' })}>
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2" title="Rembourser" onClick={() => actionMutation.mutate({ id: sub.id, action: 'refund' })}>
                          <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{data.pagination.total} résultat(s) — Page {data.pagination.page}/{data.pagination.pages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Suivant</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
