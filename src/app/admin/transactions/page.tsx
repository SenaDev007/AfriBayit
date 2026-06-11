'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight, Download, Eye, Flag, Filter, Search,
  TrendingUp, DollarSign, Hash, AlertTriangle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch, apiPatch } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '🇧🇯 Bénin' },
  { value: 'CI', label: "🇨🇮 Côte d'Ivoire" },
  { value: 'BF', label: '🇧🇫 Burkina Faso' },
  { value: 'TG', label: '🇹🇬 Togo' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'CREATED', label: 'Créée' },
  { value: 'FUNDED', label: 'Financée' },
  { value: 'NOTARY_ASSIGNED', label: 'Notaire assigné' },
  { value: 'DEED_SIGNED', label: 'Acte signé' },
  { value: 'RELEASED', label: 'Libérée' },
  { value: 'DISPUTED', label: 'Litige' },
  { value: 'REFUNDED', label: 'Remboursée' },
];

const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-100 text-gray-700',
  FUNDED: 'bg-blue-50 text-blue-700',
  DOCS_VALIDATED: 'bg-blue-50 text-blue-700',
  GEOTRUST_VALIDATED: 'bg-cyan-50 text-cyan-700',
  NOTARY_ASSIGNED: 'bg-purple-50 text-purple-700',
  NOTARY_IN_PROGRESS: 'bg-purple-50 text-purple-700',
  DEED_SIGNED: 'bg-amber-50 text-amber-700',
  ANDF_REGISTERED: 'bg-green-50 text-green-700',
  RELEASED: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-orange-50 text-orange-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<string, string> = {
  CREATED: 'Créée', FUNDED: 'Financée', DOCS_VALIDATED: 'Docs validés',
  GEOTRUST_VALIDATED: 'GeoTrust validé', NOTARY_ASSIGNED: 'Notaire assigné',
  NOTARY_IN_PROGRESS: 'Notaire en cours', DEED_SIGNED: 'Acte signé',
  ANDF_REGISTERED: 'ANDF enregistré', RELEASED: 'Libérée',
  DISPUTED: 'Litige', REFUNDED: 'Remboursée', EXPIRED: 'Expirée',
};

const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

interface TransactionRow {
  id: string;
  amount: number;
  commission: number;
  currency: string;
  country: string;
  status: string;
  createdAt: string;
  property: { id: string; title: string; city: string };
  buyer: { id: string; name: string; email: string };
  escrowAccount?: { id: string; status: string; balance: number; heldAmount: number };
}

interface TransactionsResponse {
  transactions: TransactionRow[];
  pagination: { page: number; limit: number; total: number; pages: number };
  financialOverview: { totalAmount: number; totalCommission: number; totalTransactions: number; byStatus: Record<string, number> };
}

export default function AdminTransactionsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', country: '', search: '', page: 1 });
  const [selectedTx, setSelectedTx] = useState<TransactionRow | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.country) params.set('country', filters.country);
  if (filters.search) params.set('search', filters.search);
  params.set('page', String(filters.page));
  params.set('limit', '25');

  const { data, isLoading } = useQuery<TransactionsResponse>({
    queryKey: ['admin-transactions', filters],
    queryFn: () => apiFetch<TransactionsResponse>(`/api/admin/transactions?${params.toString()}`),
  });

  const flagMutation = useMutation({
    mutationFn: (txId: string) => apiPatch(`/api/admin/transactions/${txId}`, { status: 'DISPUTED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      toast({ title: 'Transaction signalée', description: 'La transaction a été marquée pour révision.' });
    },
  });

  const exportCSV = useCallback(() => {
    if (!data?.transactions.length) return;
    const headers = ['ID', 'Propriété', 'Acheteur', 'Montant', 'Commission', 'Statut', 'Pays', 'Date'];
    const rows = data.transactions.map((tx) => [
      tx.id, tx.property.title, tx.buyer.name, tx.amount, tx.commission, tx.status, tx.country, tx.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export CSV', description: 'Le fichier a été téléchargé.' });
  }, [data, toast]);

  const fo = data?.financialOverview;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#003087]" />
            Transactions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Suivi financier et supervision des transactions</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" /> Exporter CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Volume (30j)', value: formatXOF(fo?.totalAmount || 0), icon: DollarSign, color: 'bg-[#003087]/10 text-[#003087]' },
          { label: 'Commissions (30j)', value: formatXOF(fo?.totalCommission || 0), icon: TrendingUp, color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
          { label: 'Montant moyen', value: fo?.totalTransactions ? formatXOF(Math.round((fo.totalAmount || 0) / fo.totalTransactions)) : '0 XOF', icon: Hash, color: 'bg-[#009CDE]/10 text-[#009CDE]' },
          { label: 'Nombre de transactions', value: fo?.totalTransactions?.toLocaleString('fr-FR') || '0', icon: ArrowLeftRight, color: 'bg-[#00A651]/10 text-[#00A651]' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.color)}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 font-display">{card.value}</p>
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
              placeholder="Rechercher référence, paiement..."
              className="pl-10 h-9 text-sm"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>
          <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === '__all' ? '' : v, page: 1 }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Statut" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value || '__all'} value={o.value || '__all'}>{o.label}</SelectItem>
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

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : !data?.transactions.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune transaction trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-xs font-semibold">ID</TableHead>
                  <TableHead className="text-xs font-semibold">Propriété</TableHead>
                  <TableHead className="text-xs font-semibold">Acheteur</TableHead>
                  <TableHead className="text-xs font-semibold">Montant</TableHead>
                  <TableHead className="text-xs font-semibold">Commission</TableHead>
                  <TableHead className="text-xs font-semibold">Statut</TableHead>
                  <TableHead className="text-xs font-semibold">Pays</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs font-mono text-gray-500">{tx.id.slice(-8)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{tx.property.title}</p>
                        <p className="text-xs text-gray-400">{tx.property.city}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{tx.buyer.name}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900">{formatXOF(tx.amount)}</TableCell>
                    <TableCell className="text-sm text-[#D4AF37] font-medium">{formatXOF(tx.commission)}</TableCell>
                    <TableCell>
                      <Badge className={cn('text-[10px] font-medium', statusColors[tx.status] || 'bg-gray-100 text-gray-700')}>
                        {statusLabels[tx.status] || tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{tx.country}</TableCell>
                    <TableCell className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost" size="sm" className="h-7 px-2"
                          onClick={() => { setSelectedTx(tx); setShowDetail(true); }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {tx.status !== 'DISPUTED' && tx.status !== 'RELEASED' && tx.status !== 'REFUNDED' && (
                          <Button
                            variant="ghost" size="sm" className="h-7 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            onClick={() => flagMutation.mutate(tx.id)}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {(data.pagination.page - 1) * data.pagination.limit + 1}–
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} sur {data.pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: data.pagination.pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === data.pagination.pages || Math.abs(p - filters.page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showDots = prev && p - prev > 1;
                  return (
                    <React.Fragment key={p}>
                      {showDots && <span className="px-1 text-xs text-gray-400">...</span>}
                      <Button
                        variant={p === filters.page ? 'default' : 'outline'}
                        size="sm"
                        className={cn('h-8 w-8 p-0 text-xs', p === filters.page && 'bg-[#003087] hover:bg-[#002a70]')}
                        onClick={() => setFilters((f) => ({ ...f, page: p }))}
                      >
                        {p}
                      </Button>
                    </React.Fragment>
                  );
                })}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={filters.page >= data.pagination.pages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détail de la transaction</DialogTitle>
            <DialogDescription>Informations complètes sur la transaction</DialogDescription>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">ID:</span><p className="font-mono text-xs">{selectedTx.id}</p></div>
                <div><span className="text-gray-500">Statut:</span><p><Badge className={statusColors[selectedTx.status]}>{statusLabels[selectedTx.status]}</Badge></p></div>
                <div><span className="text-gray-500">Propriété:</span><p className="font-medium">{selectedTx.property.title}</p></div>
                <div><span className="text-gray-500">Acheteur:</span><p>{selectedTx.buyer.name}</p></div>
                <div><span className="text-gray-500">Montant:</span><p className="font-bold text-lg">{formatXOF(selectedTx.amount)}</p></div>
                <div><span className="text-gray-500">Commission:</span><p className="text-[#D4AF37] font-medium">{formatXOF(selectedTx.commission)}</p></div>
                <div><span className="text-gray-500">Pays:</span><p>{selectedTx.country}</p></div>
                <div><span className="text-gray-500">Date:</span><p>{new Date(selectedTx.createdAt).toLocaleDateString('fr-FR')}</p></div>
              </div>
              {selectedTx.escrowAccount && (
                <div className="border-t pt-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-700 uppercase">Compte Escrow</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><span className="text-gray-500">Statut:</span><p>{selectedTx.escrowAccount.status}</p></div>
                    <div><span className="text-gray-500">Solde:</span><p>{formatXOF(selectedTx.escrowAccount.balance)}</p></div>
                    <div><span className="text-gray-500">Bloqué:</span><p>{formatXOF(selectedTx.escrowAccount.heldAmount)}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
