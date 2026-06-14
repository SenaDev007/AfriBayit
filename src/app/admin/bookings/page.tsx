'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Hotel,
  Home,
  Key,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useAdminBookings } from '@/hooks/useAdmin';

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  no_show: 'Non présenté',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  no_show: 'bg-gray-100 text-gray-600 border-gray-200',
};

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

const TAB_CONFIG = [
  { key: 'hotels', label: 'Hôtels', icon: Hotel },
  { key: 'guesthouses', label: 'Guesthouses', icon: Home },
  { key: 'short_term', label: 'Courte durée', icon: Key },
] as const;

type BookingTab = typeof TAB_CONFIG[number]['key'];

interface BookingRow {
  id: string;
  establishment: { id: string; name: string };
  client: { id: string; name: string; email: string };
  checkIn: string;
  checkOut: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export default function AdminBookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingTab>('hotels');
  const [filters, setFilters] = useState<{
    status?: string;
    country?: string;
    search?: string;
    tab?: string;
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState('');
  const [cancelOpen, setCancelOpen] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [modifyOpen, setModifyOpen] = useState<string | null>(null);
  const [modifyData, setModifyData] = useState({ checkIn: '', checkOut: '' });

  const { data, isLoading } = useAdminBookings({ ...filters, tab: activeTab });
  const bookings = (data?.bookings as BookingRow[]) || [];
  const pagination = data?.pagination as { page: number; limit: number; total: number; pages: number } | undefined;
  const summary = data?.summary as {
    totalHotels: number;
    totalGuesthouses: number;
    totalShortTerm: number;
    pending: number;
  } | undefined;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleTabChange = (tab: BookingTab) => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, tab, page: 1, status: undefined }));
  };

  const handleConfirm = (id: string) => {
    toast.success('Réservation confirmée');
  };

  const handleCancel = () => {
    toast.success('Réservation annulée');
    setCancelOpen(null);
    setCancelReason('');
  };

  const handleModify = () => {
    toast.success('Réservation modifiée');
    setModifyOpen(null);
    setModifyData({ checkIn: '', checkOut: '' });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des réservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérer les réservations hôtels, guesthouses et courte durée
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total hôtels</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalHotels ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Home className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total guesthouses</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalGuesthouses ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Key className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total courte durée</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalShortTerm ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">En attente</p>
            <p className="text-xl font-bold text-gray-900">{summary?.pending ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
              activeTab === tab.key
                ? 'bg-white text-[#003087] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
            onClick={() => handleTabChange(tab.key)}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par établissement, client..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filters.status || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, status: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.country || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({ ...prev, country: v === 'all' ? undefined : v, page: 1 }))
              }
            >
              <SelectTrigger className="w-[130px] h-9 text-xs">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les pays</SelectItem>
                <SelectItem value="BJ">🇧🇯 Bénin</SelectItem>
                <SelectItem value="CI">🇨🇮 Côte d&apos;Ivoire</SelectItem>
                <SelectItem value="BF">🇧🇫 Burkina Faso</SelectItem>
                <SelectItem value="TG">🇹🇬 Togo</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleSearch}>
              <Filter className="w-3.5 h-3.5 mr-1" /> Filtrer
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Hotel className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune réservation trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Établissement</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Client</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Arrivée</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Départ</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Montant</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                        {booking.establishment?.name || '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-[#003087]/10 flex items-center justify-center text-[9px] font-bold text-[#003087]">
                          {booking.client?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">{booking.client?.name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(booking.checkIn)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{formatDate(booking.checkOut)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_COLORS[booking.status] || '')}>
                        {STATUS_LABELS[booking.status] || booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-900">{formatXOF(booking.amount)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4" /> Voir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleConfirm(booking.id)} disabled={booking.status === 'confirmed' || booking.status === 'completed'}>
                            <CheckCircle2 className="w-4 h-4" /> Confirmer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCancelOpen(booking.id)} disabled={booking.status === 'cancelled'}>
                            <XCircle className="w-4 h-4" /> Annuler
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setModifyOpen(booking.id);
                            setModifyData({ checkIn: booking.checkIn?.slice(0, 10) || '', checkOut: booking.checkOut?.slice(0, 10) || '' });
                          }} disabled={booking.status === 'cancelled' || booking.status === 'completed'}>
                            <Pencil className="w-4 h-4" /> Modifier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={pagination.page <= 1}
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page - 1 }))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline" size="sm" className="h-8 w-8 p-0"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilters((prev) => ({ ...prev, page: pagination.page + 1 }))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelOpen} onOpenChange={() => setCancelOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>Indiquez la raison de l&apos;annulation</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison de l'annulation..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleCancel}>Confirmer l&apos;annulation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modify Dialog */}
      <Dialog open={!!modifyOpen} onOpenChange={() => setModifyOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la réservation</DialogTitle>
            <DialogDescription>Modifier les dates de la réservation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Date d&apos;arrivée</label>
              <Input
                type="date"
                value={modifyData.checkIn}
                onChange={(e) => setModifyData((prev) => ({ ...prev, checkIn: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Date de départ</label>
              <Input
                type="date"
                value={modifyData.checkOut}
                onChange={(e) => setModifyData((prev) => ({ ...prev, checkOut: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModifyOpen(null)}>Annuler</Button>
            <Button className="bg-[#003087] hover:bg-[#003087]/90" onClick={handleModify}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
