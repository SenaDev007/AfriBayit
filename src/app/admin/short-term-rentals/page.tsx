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
  Clock,
  Home,
  CalendarCheck,
  EyeOff,
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
import { useAdminShortTermRentals } from '@/hooks/useAdmin';

const LISTING_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  published: 'Publiée',
  hidden: 'Masquée',
  rejected: 'Rejetée',
};

const LISTING_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-green-50 text-green-700 border-green-200',
  hidden: 'bg-orange-50 text-orange-700 border-orange-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
};

const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  no_show: 'Non présenté',
};

const BOOKING_STATUS_COLORS: Record<string, string> = {
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

interface ShortTermRentalRow {
  id: string;
  title: string;
  host: { id: string; name: string; email: string };
  country: string;
  city: string;
  pricePerNight: number;
  currency: string;
  status: string;
  bookingsCount: number;
  createdAt: string;
}

interface BookingRow {
  id: string;
  rental: { id: string; title: string };
  guest: { id: string; name: string; email: string };
  checkIn: string;
  checkOut: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export default function AdminShortTermRentalsPage() {
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings'>('listings');
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
    tab: 'listings',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useAdminShortTermRentals({ ...filters, tab: activeTab });
  const listings = (data?.listings as ShortTermRentalRow[]) || [];
  const bookings = (data?.bookings as BookingRow[]) || [];
  const pagination = data?.pagination as { page: number; limit: number; total: number; pages: number } | undefined;
  const summary = data?.summary as {
    totalListings: number;
    totalBookings: number;
    activeListings: number;
    pendingBookings: number;
  } | undefined;

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const handleTabChange = (tab: 'listings' | 'bookings') => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, tab, page: 1, status: undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations courte durée</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérer les annonces et réservations de locations courte durée
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Home className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total annonces</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalListings ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Total réservations</p>
            <p className="text-xl font-bold text-gray-900">{summary?.totalBookings ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Annonces actives</p>
            <p className="text-xl font-bold text-gray-900">{summary?.activeListings ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase">Réservations en attente</p>
            <p className="text-xl font-bold text-gray-900">{summary?.pendingBookings ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'listings'
              ? 'bg-white text-[#003087] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
          onClick={() => handleTabChange('listings')}
        >
          Annonces
        </button>
        <button
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-colors',
            activeTab === 'bookings'
              ? 'bg-white text-[#003087] shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
          onClick={() => handleTabChange('bookings')}
        >
          Réservations
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={activeTab === 'listings' ? 'Rechercher par titre, ville...' : 'Rechercher par location, client...'}
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
                {activeTab === 'listings' ? (
                  <>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="published">Publiée</SelectItem>
                    <SelectItem value="hidden">Masquée</SelectItem>
                    <SelectItem value="rejected">Rejetée</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                    <SelectItem value="completed">Terminée</SelectItem>
                  </>
                )}
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
        ) : activeTab === 'listings' ? (
          listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Home className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-900">Aucune annonce trouvée</p>
              <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Annonce</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hôte</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pays</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ville</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Prix/nuit</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Réservations</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((rental) => (
                    <RentalListingRow key={rental.id} rental={rental} />
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
          )
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CalendarCheck className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucune réservation trouvée</p>
            <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">Location</TableHead>
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
                  <BookingRowComponent key={booking.id} booking={booking} />
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
    </div>
  );
}

function RentalListingRow({ rental }: { rental: ShortTermRentalRow }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleApprove = () => {
    toast.success('Annonce approuvée');
  };

  const handleReject = () => {
    toast.success('Annonce rejetée');
    setRejectOpen(false);
    setRejectReason('');
  };

  const handleHide = () => {
    toast.success('Annonce masquée');
  };

  return (
    <>
      <TableRow className="hover:bg-gray-50/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center shrink-0">
              <Home className="w-5 h-5 text-[#003087]" />
            </div>
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{rental.title}</p>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[9px] font-bold text-[#D4AF37]">
              {rental.host?.name?.charAt(0) || '?'}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[80px]">{rental.host?.name || '—'}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm">
          {rental.country ? `${COUNTRY_FLAGS[rental.country] || ''} ${rental.country}` : '—'}
        </TableCell>
        <TableCell className="text-sm text-gray-600">{rental.city || '—'}</TableCell>
        <TableCell className="text-sm font-mono text-gray-900">{formatXOF(rental.pricePerNight)}</TableCell>
        <TableCell>
          <Badge variant="outline" className={cn('text-[10px]', LISTING_STATUS_COLORS[rental.status] || '')}>
            {LISTING_STATUS_LABELS[rental.status] || rental.status}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-gray-600">{rental.bookingsCount}</TableCell>
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
              <DropdownMenuItem onClick={handleApprove} disabled={rental.status === 'published'}>
                <CheckCircle2 className="w-4 h-4" /> Approuver
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRejectOpen(true)} disabled={rental.status === 'rejected'}>
                <XCircle className="w-4 h-4" /> Rejeter
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHide} disabled={rental.status === 'hidden'}>
                <EyeOff className="w-4 h-4" /> Masquer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l&apos;annonce</DialogTitle>
            <DialogDescription>Indiquez la raison du rejet</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison du rejet..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleReject}>Rejeter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BookingRowComponent({ booking }: { booking: BookingRow }) {
  const handleConfirm = () => {
    toast.success('Réservation confirmée');
  };

  const handleCancel = () => {
    toast.success('Réservation annulée');
  };

  return (
    <TableRow className="hover:bg-gray-50/50">
      <TableCell>
        <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{booking.rental?.title || '—'}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#003087]/10 flex items-center justify-center text-[9px] font-bold text-[#003087]">
            {booking.guest?.name?.charAt(0) || '?'}
          </div>
          <span className="text-xs text-gray-600 truncate max-w-[80px]">{booking.guest?.name || '—'}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">{formatDate(booking.checkIn)}</TableCell>
      <TableCell className="text-sm text-gray-600">{formatDate(booking.checkOut)}</TableCell>
      <TableCell>
        <Badge variant="outline" className={cn('text-[10px]', BOOKING_STATUS_COLORS[booking.status] || '')}>
          {BOOKING_STATUS_LABELS[booking.status] || booking.status}
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
            <DropdownMenuItem onClick={handleConfirm} disabled={booking.status === 'confirmed' || booking.status === 'completed'}>
              <CheckCircle2 className="w-4 h-4" /> Confirmer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCancel} disabled={booking.status === 'cancelled'}>
              <XCircle className="w-4 h-4" /> Annuler
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
