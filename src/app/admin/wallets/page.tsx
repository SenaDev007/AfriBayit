'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wallet, Search, Eye, Lock, Settings2, DollarSign,
  ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
];

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

interface WalletRow {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  country: string | null;
  currency: string;
  walletBalance: number;
  escrowHeld: number;
  pendingPayout: number;
  role: string;
  _count: { walletTxns: number };
}

interface WalletsResponse {
  wallets: WalletRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { totalBalance: number; totalEscrow: number; totalPendingPayout: number };
}

export default function AdminWalletsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: '', country: '', page: 1 });
  const [adjustDialog, setAdjustDialog] = useState<WalletRow | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.country) params.set('country', filters.country);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery<WalletsResponse>({
    queryKey: ['admin-wallets', filters],
    queryFn: () => apiFetch<WalletsResponse>(`/api/admin/wallets?${params.toString()}`),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ userId, amount }: { userId: string; amount: number }) =>
      apiPatch(`/api/admin/users/${userId}`, { walletBalance: amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      setAdjustDialog(null);
      setAdjustAmount('');
      toast({ title: 'Solde ajusté', description: 'Le solde du portefeuille a été mis à jour.' });
    },
  });

  const freezeMutation = useMutation({
    mutationFn: (userId: string) => apiPatch(`/api/admin/users/${userId}`, { walletBalance: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallets'] });
      toast({ title: 'Portefeuille gelé', description: 'Le portefeuille a été gelé.', variant: 'destructive' });
    },
  });

  const s = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portefeuilles</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestion des portefeuilles utilisateurs</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Solde total plateforme', value: formatXOF(s?.totalBalance || 0), icon: Wallet, color: 'bg-[#003087]/10 text-[#003087]' },
          { label: 'Total en escrow', value: formatXOF(s?.totalEscrow || 0), icon: Lock, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
          { label: 'Paiements en attente', value: formatXOF(s?.totalPendingPayout || 0), icon: DollarSign, color: 'bg-[#00A651]/10 text-[#00A651]' },
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
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou email..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
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
        ) : !data?.wallets.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Wallet className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">Aucun portefeuille trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">Utilisateur</TableHead>
                  <TableHead className="text-xs font-semibold">Solde</TableHead>
                  <TableHead className="text-xs font-semibold">Escrow bloqué</TableHead>
                  <TableHead className="text-xs font-semibold">Paiement en attente</TableHead>
                  <TableHead className="text-xs font-semibold">Devise</TableHead>
                  <TableHead className="text-xs font-semibold">Pays</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.wallets.map((w) => (
                  <TableRow key={w.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{w.name}</p>
                        <p className="text-xs text-gray-400">{w.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">{formatXOF(w.walletBalance)}</TableCell>
                    <TableCell className="text-sm text-[#D4AF37]">{formatXOF(w.escrowHeld)}</TableCell>
                    <TableCell className="text-sm text-[#00A651]">{formatXOF(w.pendingPayout)}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{w.currency}</Badge></TableCell>
                    <TableCell className="text-sm">{w.country || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { setAdjustDialog(w); setAdjustAmount(String(w.walletBalance)); }}>
                          <Settings2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => freezeMutation.mutate(w.id)}>
                          <Lock className="w-3.5 h-3.5" />
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

      {/* Adjust Balance Dialog */}
      <Dialog open={!!adjustDialog} onOpenChange={() => setAdjustDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajuster le solde</DialogTitle>
            <DialogDescription>Modifier le solde du portefeuille de {adjustDialog?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Solde actuel: {formatXOF(adjustDialog?.walletBalance || 0)}</p>
              <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} placeholder="Nouveau solde" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustDialog(null)}>Annuler</Button>
            <Button
              className="bg-[#003087] hover:bg-[#002a70] text-white"
              onClick={() => adjustDialog && adjustMutation.mutate({ userId: adjustDialog.id, amount: parseFloat(adjustAmount) || 0 })}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
