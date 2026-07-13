'use client';

/**
 * /admin/leases — Baux & Loyers (CDC §5.1 — location longue durée)
 *
 * Wired to the backend:
 *   - GET /admin/leases         — list (with search + status filter)
 *   - GET /admin/leases/stats   — KPIs (active, late, pending, revenue)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  KeyRound, Plus, Search, Download, Eye, Check, AlertTriangle,
  Calendar, Building2, User, Coins, FileText, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminLeases, useAdminLeaseStats, type Lease } from '@/hooks/useAdminApi';

// Map backend lease statuses (DRAFT, PENDING_SIGNATURE, ACTIVE, EXPIRED,
// TERMINATED, RENEWED, CANCELLED) to display labels
const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  ACTIVE: { label: 'Actif', variant: 'default' },
  PENDING_SIGNATURE: { label: 'En attente signature', variant: 'secondary' },
  DRAFT: { label: 'Brouillon', variant: 'outline' },
  EXPIRED: { label: 'Expiré', variant: 'outline' },
  TERMINATED: { label: 'Résilié', variant: 'outline' },
  RENEWED: { label: 'Renouvelé', variant: 'default' },
  CANCELLED: { label: 'Annulé', variant: 'destructive' },
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function AdminLeasesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounce search input by using a separate state for the query
  const [debouncedSearch, setDebouncedSearch] = useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: stats, isLoading: statsLoading } = useAdminLeaseStats();
  const { data: leases = [], isLoading: leasesLoading } = useAdminLeases({
    status: statusFilter,
    search: debouncedSearch,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0a2a5e] flex items-center gap-2">
            <KeyRound className="w-6 h-6" />
            Baux & Loyers
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestion des baux longue durée, suivi des loyers et documents OHADA
          </p>
        </div>
        <Button className="bg-[#003087] hover:bg-[#001f5c]">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau bail
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          <div className="col-span-2 lg:col-span-4 flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-[#003087]" />
          </div>
        ) : (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Baux actifs</p>
                    <p className="text-2xl font-bold text-[#0a2a5e]">{stats?.active || 0}</p>
                  </div>
                  <Check className="w-8 h-8 text-green-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Loyers en retard</p>
                    <p className="text-2xl font-bold text-red-600">{stats?.latePayment || 0}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">En attente signature</p>
                    <p className="text-2xl font-bold text-amber-600">{stats?.pendingSignature || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-amber-500/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Revenu mensuel</p>
                    <p className="text-2xl font-bold text-[#D4AF37]">{fmt(stats?.monthlyRevenue || 0)}</p>
                  </div>
                  <Coins className="w-8 h-8 text-[#D4AF37]/30" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher bail, locataire, propriétaire, bien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border bg-white text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="ACTIVE">Actifs</option>
          <option value="PENDING_SIGNATURE">En attente signature</option>
          <option value="EXPIRED">Expirés</option>
          <option value="TERMINATED">Résiliés</option>
          <option value="RENEWED">Renouvelés</option>
          <option value="CANCELLED">Annulés</option>
          <option value="DRAFT">Brouillons</option>
        </select>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Leases table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e]">
            {leases.length} bail{leases.length !== 1 ? 'x' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Bail</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Locataire</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Propriétaire</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Bien</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Loyer mensuel</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Échéance</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Statut</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leasesLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-[#003087] mx-auto" />
                    </td>
                  </tr>
                ) : leases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400">
                      <KeyRound className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun bail trouvé</p>
                    </td>
                  </tr>
                ) : (
                  leases.map((lease: Lease, idx) => {
                    const statusInfo = STATUS_LABELS[lease.status] || { label: lease.status, variant: 'outline' as const };
                    return (
                      <motion.tr
                        key={lease.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-[#003087]">
                          {lease.leaseRef || lease.id.slice(-8).toUpperCase()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {lease.tenant?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{lease.owner?.name || 'N/A'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            {lease.property ? `${lease.property.title}, ${lease.property.city}` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#D4AF37]">
                          {fmt(lease.monthlyRent)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {new Date(lease.startDate).toLocaleDateString('fr-FR')} → {new Date(lease.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1.5 rounded hover:bg-blue-50 text-[#003087]" title="Voir détails">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title={`${lease._count?.documents || 0} documents`}>
                              <FileText className="w-4 h-4" />
                              {lease._count?.documents > 0 && (
                                <span className="absolute -mt-3 ml-3 bg-amber-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                  {lease._count.documents}
                                </span>
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
