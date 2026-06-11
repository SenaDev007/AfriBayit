'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  ArrowLeftRight, Search, Wallet, ChevronLeft, ChevronRight,
} from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };
const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

interface TransactionRow {
  id: string;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  country: string;
  createdAt: string;
  property: { id: string; title: string };
  buyer: { id: string; name: string };
}

const statusLabels: Record<string, string> = {
  CREATED: 'Créée', FUNDED: 'Financée', DOCS_VALIDATED: 'Docs validés',
  GEOTRUST_VALIDATED: 'GeoTrust validé', NOTARY_ASSIGNED: 'Notaire assigné',
  NOTARY_IN_PROGRESS: 'Notaire en cours', DEED_SIGNED: 'Acte signé',
  ANDF_REGISTERED: 'ANDF enregistré', RELEASED: 'Libérée',
  DISPUTED: 'Litige', REFUNDED: 'Remboursée', EXPIRED: 'Expirée',
};
const statusColors: Record<string, string> = {
  CREATED: 'bg-gray-50 text-gray-600', FUNDED: 'bg-blue-50 text-blue-700',
  RELEASED: 'bg-green-50 text-green-700', DISPUTED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-orange-50 text-orange-700',
};

export default function CountryTransactionsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery<{ data: TransactionRow[]; total: number }>({
    queryKey: ['admin-transactions', country, search, statusFilter, page],
    queryFn: () => apiFetch(`/api/admin/transactions?country=${country}&search=${encodeURIComponent(search)}&status=${statusFilter}&skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`),
  });

  const transactions = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatXOF = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-[#003087]" />
            Transactions — {COUNTRY_FLAGS[country]} {COUNTRY_NAMES[country]}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des transactions du {COUNTRY_NAMES[country]}</p>
        </div>
        <Badge variant="outline" className="text-xs bg-[#003087]/5 border-[#003087]/20 text-[#003087]">
          {total} transaction{total !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'CREATED', 'FUNDED', 'RELEASED', 'DISPUTED'].map((s) => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm"
              className={statusFilter === s ? 'bg-[#003087] text-white' : ''}
              onClick={() => { setStatusFilter(s); setPage(0); }}>
              {s === '' ? 'Tous' : statusLabels[s] || s}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune transaction trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres de recherche</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Propriété</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Acheteur</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Montant</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Commission</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900 max-w-[200px] truncate">{tx.property?.title || '—'}</TableCell>
                  <TableCell className="text-gray-600">{tx.buyer?.name || '—'}</TableCell>
                  <TableCell className="text-gray-900 font-medium">{formatXOF(tx.amount)}</TableCell>
                  <TableCell className="text-[#D4AF37] font-medium">{formatXOF(tx.commission)}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[tx.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                      {statusLabels[tx.status] || tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}</p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page === 0} onClick={() => setPage(Math.max(0, page - 1))}><ChevronLeft className="w-4 h-4" /></Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button key={pageNum} variant={pageNum === page + 1 ? 'default' : 'outline'} size="sm"
                  className={cn('h-8 w-8 p-0 text-xs', pageNum === page + 1 && 'bg-[#003087] hover:bg-[#002a70]')}
                  onClick={() => setPage(pageNum - 1)}>
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={page >= totalPages - 1} onClick={() => setPage(Math.min(totalPages - 1, page + 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
