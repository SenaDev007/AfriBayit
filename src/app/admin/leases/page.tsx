'use client';

/**
 * /admin/leases — Baux & Loyers (CDC §5.1 — location longue durée)
 *
 * Admin view for managing long-term leases:
 *   - Active leases list with tenant/owner info
 *   - Rent payment tracking (paid / late / upcoming)
 *   - Lease documents (bail PDF OHADA)
 *   - Move-in/move-out inspection reports (états des lieux)
 *   - Lease termination workflow
 *
 * TODO: connect to backend /leases endpoints when available
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  KeyRound, Plus, Search, Download, Eye, Check, AlertTriangle,
  Calendar, Building2, User, Coins, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Lease {
  id: string;
  tenantName: string;
  ownerName: string;
  propertyAddress: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'pending_signature' | 'terminated' | 'late_payment';
  lastPaymentDate?: string;
  documentsCount: number;
}

const MOCK_LEASES: Lease[] = [
  {
    id: 'LEASE-001',
    tenantName: 'Pierre Agossou',
    ownerName: 'Hervé Houénou',
    propertyAddress: 'Villa Cadjèhoun, Cotonou',
    monthlyRent: 350000,
    startDate: '2025-01-15',
    endDate: '2026-01-14',
    status: 'active',
    lastPaymentDate: '2025-07-01',
    documentsCount: 3,
  },
  {
    id: 'LEASE-002',
    tenantName: 'Marie Bamba',
    ownerName: 'Fatou Koné',
    propertyAddress: 'Appartement Cocody, Abidjan',
    monthlyRent: 280000,
    startDate: '2025-03-01',
    endDate: '2026-02-28',
    status: 'late_payment',
    lastPaymentDate: '2025-06-01',
    documentsCount: 2,
  },
  {
    id: 'LEASE-003',
    tenantName: 'Aline Kaboré',
    ownerName: 'Ousmane Ouédraogo',
    propertyAddress: 'Studio Zone du Bois, Ouagadougou',
    monthlyRent: 150000,
    startDate: '2025-07-01',
    endDate: '2026-06-30',
    status: 'pending_signature',
    documentsCount: 1,
  },
];

const STATUS_LABELS: Record<Lease['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Actif', variant: 'default' },
  pending_signature: { label: 'En attente signature', variant: 'secondary' },
  terminated: { label: 'Résilié', variant: 'outline' },
  late_payment: { label: 'Loyer en retard', variant: 'destructive' },
};

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export default function AdminLeasesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = MOCK_LEASES.filter((l) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.tenantName.toLowerCase().includes(q) ||
        l.ownerName.toLowerCase().includes(q) ||
        l.propertyAddress.toLowerCase().includes(q) ||
        l.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const active = MOCK_LEASES.filter((l) => l.status === 'active').length;
  const late = MOCK_LEASES.filter((l) => l.status === 'late_payment').length;
  const pending = MOCK_LEASES.filter((l) => l.status === 'pending_signature').length;
  const totalRevenue = MOCK_LEASES
    .filter((l) => l.status === 'active' || l.status === 'late_payment')
    .reduce((sum, l) => sum + l.monthlyRent, 0);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Baux actifs</p>
                <p className="text-2xl font-bold text-[#0a2a5e]">{active}</p>
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
                <p className="text-2xl font-bold text-red-600">{late}</p>
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
                <p className="text-2xl font-bold text-amber-600">{pending}</p>
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
                <p className="text-2xl font-bold text-[#D4AF37]">{fmt(totalRevenue)}</p>
              </div>
              <Coins className="w-8 h-8 text-[#D4AF37]/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher bail, locataire, propriétaire, adresse..."
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
          <option value="active">Actifs</option>
          <option value="pending_signature">En attente signature</option>
          <option value="late_payment">Loyers en retard</option>
          <option value="terminated">Résiliés</option>
        </select>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#0a2a5e]">
            {filtered.length} bail{filtered.length !== 1 ? 'x' : ''}
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
                {filtered.map((lease, idx) => {
                  const status = STATUS_LABELS[lease.status];
                  return (
                    <motion.tr
                      key={lease.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-[#003087]">{lease.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          {lease.tenantName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lease.ownerName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {lease.propertyAddress}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#D4AF37]">
                        {fmt(lease.monthlyRent)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {lease.startDate} → {lease.endDate}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded hover:bg-blue-50 text-[#003087]" title="Voir détails">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded hover:bg-amber-50 text-amber-600" title="Documents">
                            <FileText className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <KeyRound className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun bail trouvé</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
