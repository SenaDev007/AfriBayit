'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeftRight, Wallet, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const COUNTRY_NAMES: Record<string, string> = { BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo' };

const statusLabels: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Créée', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  FUNDED: { label: 'Financée', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  DOCS_VALIDATED: { label: 'Docs validés', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  GEOTRUST_VALIDATED: { label: 'GeoTrust validé', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  NOTARY_ASSIGNED: { label: 'Notaire assigné', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  NOTARY_IN_PROGRESS: { label: 'Notaire en cours', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  DEED_SIGNED: { label: 'Acte signé', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ANDF_REGISTERED: { label: 'ANDF enregistré', color: 'bg-green-50 text-green-700 border-green-200' },
  RELEASED: { label: 'Libérée', color: 'bg-green-100 text-green-800 border-green-300' },
  DISPUTED: { label: 'Litige', color: 'bg-red-50 text-red-700 border-red-200' },
  REFUNDED: { label: 'Remboursée', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  EXPIRED: { label: 'Expirée', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

export default function CountryTransactionsPage() {
  const params = useParams();
  const country = (params.country as string) || 'BJ';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', country, searchQuery, statusFilter, page],
    queryFn: () => {
      const p = new URLSearchParams({ country, limit: '25', page: String(page) });
      if (searchQuery) p.set('search', searchQuery);
      if (statusFilter) p.set('status', statusFilter);
      return apiFetch<{
        transactions: Array<{
          id: string;
          amount: number;
          commission: number;
          status: string;
          currency: string;
          createdAt: string;
          property?: { title: string; city: string };
          buyer?: { name: string };
          seller?: { name: string };
        }>;
        pagination: { total: number; pages: number };
      }>(`/api/admin/transactions?${p.toString()}`);
    },
  });

  const transactions = data?.transactions || [];
  const pagination = data?.pagination || { total: 0, pages: 0 };
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCommission = transactions.reduce((sum, t) => sum + t.commission, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions — {COUNTRY_NAMES[country]}</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination.total} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">Tous les statuts</option>
            <option value="CREATED">Créée</option>
            <option value="FUNDED">Financée</option>
            <option value="RELEASED">Libérée</option>
            <option value="DISPUTED">Litige</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#003087]">{totalAmount.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-gray-500">Volume total (FCFA)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-[#003087]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#003087]">{pagination.total}</p>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-green-600">{totalCommission.toLocaleString('fr-FR')}</p>
              <p className="text-xs text-gray-500">Commissions (FCFA)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions table */}
      <Card className="rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-600">ID</th>
                  <th className="text-left p-4 font-medium text-gray-600">Propriété</th>
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
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune transaction</td></tr>
                ) : (
                  transactions.map((tx) => {
                    const st = statusLabels[tx.status] || { label: tx.status, color: 'bg-gray-50 text-gray-600 border-gray-200' };
                    return (
                      <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-mono text-xs text-gray-500">{tx.id.slice(0, 12)}...</td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900 truncate max-w-[200px]">
                              {tx.property?.title || '—'}
                            </p>
                            {tx.property?.city && (
                              <p className="text-xs text-gray-400">{tx.property.city}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-[#003087]">{tx.amount.toLocaleString('fr-FR')} {tx.currency}</td>
                        <td className="p-4 text-[#D4AF37] font-semibold">{tx.commission.toLocaleString('fr-FR')} {tx.currency}</td>
                        <td className="p-4"><Badge className={`${st.color} border text-xs`} variant="outline">{st.label}</Badge></td>
                        <td className="p-4 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600">Page {page} / {pagination.pages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
