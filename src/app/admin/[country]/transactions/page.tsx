'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <div className="space-y-6">
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

      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">Propriété</th>
                  <th className="text-left p-4 font-medium text-gray-600">Acheteur</th>
                  <th className="text-left p-4 font-medium text-gray-600">Montant</th>
                  <th className="text-left p-4 font-medium text-gray-600">Commission</th>
                  <th className="text-left p-4 font-medium text-gray-600">Statut</th>
                  <th className="text-left p-4 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Chargement...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune transaction trouvée</td></tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900 max-w-[200px] truncate">{tx.property?.title || '—'}</td>
                      <td className="p-4 text-gray-600">{tx.buyer?.name || '—'}</td>
                      <td className="p-4 text-gray-900 font-medium">{formatXOF(tx.amount)}</td>
                      <td className="p-4 text-[#D4AF37] font-medium">{formatXOF(tx.commission)}</td>
                      <td className="p-4">
                        <Badge className={`${statusColors[tx.status] || 'bg-gray-50 text-gray-600'} text-xs border-0`} variant="outline">
                          {statusLabels[tx.status] || tx.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} sur {total}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
