'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Landmark,
  Search,
  Plus,
  Filter,
  FileCheck,
  MoreHorizontal,
  Star,
  MapPin,
  Phone,
  ShieldCheck,
  Ban,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Users,
  FileSignature,
  Clock,
  ArrowLeftRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────────────────────

type NotaryStatus = 'actif' | 'en_attente' | 'suspendu';
type ConventionStatus = 'signee' | 'non_signee';

interface Notary {
  id: string;
  name: string;
  cabinet: string;
  country: string;
  licence: string;
  convention: ConventionStatus;
  transactions: number;
  note: number;
  status: NotaryStatus;
  avatar: string | null;
  phone: string;
  email: string;
  joinedAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
};

const COUNTRY_NAMES: Record<string, string> = {
  BJ: 'Bénin',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  TG: 'Togo',
};

const STATUS_CONFIG: Record<NotaryStatus, { label: string; color: string; icon: React.ElementType }> = {
  actif: {
    label: 'Actif',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: ShieldCheck,
  },
  en_attente: {
    label: 'En attente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  suspendu: {
    label: 'Suspendu',
    color: 'bg-red-50 text-red-600 border-red-200',
    icon: Ban,
  },
};

const CONVENTION_CONFIG: Record<ConventionStatus, { label: string; color: string; icon: React.ElementType }> = {
  signee: {
    label: 'Signée',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: FileCheck,
  },
  non_signee: {
    label: 'Non signée',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: AlertTriangle,
  },
};

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_NOTARIES: Notary[] = [
  {
    id: 'not-001',
    name: 'Maître Kofi Akakpo',
    cabinet: 'Cabinet Akakpo & Associés',
    country: 'BJ',
    licence: 'NOT-BJ-2019-0142',
    convention: 'signee',
    transactions: 187,
    note: 4.8,
    status: 'actif',
    avatar: null,
    phone: '+229 97 00 11 22',
    email: 'k.akakpo@cabinet-bj.com',
    joinedAt: '2019-03-15',
  },
  {
    id: 'not-002',
    name: 'Maître Aïssatou Ba',
    cabinet: 'Étude Ba & Frères',
    country: 'CI',
    licence: 'NOT-CI-2020-0891',
    convention: 'signee',
    transactions: 234,
    note: 4.9,
    status: 'actif',
    avatar: null,
    phone: '+225 07 12 34 56',
    email: 'a.ba@etude-ci.com',
    joinedAt: '2020-06-22',
  },
  {
    id: 'not-003',
    name: 'MaîtreIssouf Ouédraogo',
    cabinet: 'Office Notarial Ouédraogo',
    country: 'BF',
    licence: 'NOT-BF-2018-0055',
    convention: 'non_signee',
    transactions: 45,
    note: 3.7,
    status: 'en_attente',
    avatar: null,
    phone: '+226 70 44 55 66',
    email: 'i.ouedraogo@on-bf.com',
    joinedAt: '2023-11-08',
  },
  {
    id: 'not-004',
    name: 'Maître Adélaïde Dossou',
    cabinet: 'Dossou Notaires',
    country: 'BJ',
    licence: 'NOT-BJ-2021-0298',
    convention: 'signee',
    transactions: 156,
    note: 4.6,
    status: 'actif',
    avatar: null,
    phone: '+229 96 77 88 99',
    email: 'a.dossou@dossou-notaires.com',
    joinedAt: '2021-01-10',
  },
  {
    id: 'not-005',
    name: 'Maître Yao Koné',
    cabinet: 'Koné & Partners',
    country: 'CI',
    licence: 'NOT-CI-2017-0433',
    convention: 'signee',
    transactions: 312,
    note: 4.9,
    status: 'actif',
    avatar: null,
    phone: '+225 01 23 45 67',
    email: 'y.kone@konepartners-ci.com',
    joinedAt: '2017-09-01',
  },
  {
    id: 'not-006',
    name: 'Maître Blandine Tapsoba',
    cabinet: 'Étude Tapsoba',
    country: 'BF',
    licence: 'NOT-BF-2022-0110',
    convention: 'non_signee',
    transactions: 12,
    note: 3.2,
    status: 'en_attente',
    avatar: null,
    phone: '+226 55 66 77 88',
    email: 'b.tapsoba@etude-tapsoba.bf',
    joinedAt: '2024-02-14',
  },
  {
    id: 'not-007',
    name: 'Maître Kodjo Agbéko',
    cabinet: 'Office Notarial du Togo',
    country: 'TG',
    licence: 'NOT-TG-2019-0078',
    convention: 'signee',
    transactions: 198,
    note: 4.5,
    status: 'actif',
    avatar: null,
    phone: '+228 90 11 22 33',
    email: 'k.agbeko@ont-tg.com',
    joinedAt: '2019-07-20',
  },
  {
    id: 'not-008',
    name: 'Maître Rachida Moussa',
    cabinet: 'Moussa Notaires Associés',
    country: 'BJ',
    licence: 'NOT-BJ-2020-0199',
    convention: 'signee',
    transactions: 89,
    note: 4.1,
    status: 'suspendu',
    avatar: null,
    phone: '+229 95 33 44 55',
    email: 'r.moussa@moussa-notaires.bj',
    joinedAt: '2020-11-03',
  },
  {
    id: 'not-009',
    name: 'Maître Aminata Sow',
    cabinet: 'Sow & Associés',
    country: 'CI',
    licence: 'NOT-CI-2023-1204',
    convention: 'non_signee',
    transactions: 8,
    note: 2.9,
    status: 'en_attente',
    avatar: null,
    phone: '+225 05 66 77 88',
    email: 'a.sow@sow-associes.ci',
    joinedAt: '2025-01-15',
  },
  {
    id: 'not-010',
    name: 'Maître Essozimna Gnakadja',
    cabinet: 'Gnakadja Legal',
    country: 'TG',
    licence: 'NOT-TG-2021-0145',
    convention: 'signee',
    transactions: 143,
    note: 4.4,
    status: 'actif',
    avatar: null,
    phone: '+228 91 22 33 44',
    email: 'e.gnakadja@gnakadja-legal.tg',
    joinedAt: '2021-05-18',
  },
];

const PAGE_SIZE = 5;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.replace('Maître ', '').split(' ');
  return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

function renderStars(note: number) {
  const full = Math.floor(note);
  const hasHalf = note - full >= 0.3;
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < full
              ? 'text-[#D4AF37] fill-[#D4AF37]'
              : i === full && hasHalf
                ? 'text-[#D4AF37] fill-[#D4AF37]/50'
                : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
      <span className="text-xs font-medium text-gray-600 ml-1">{note.toFixed(1)}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NotariesManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [conventionFilter, setConventionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [selectedNotary, setSelectedNotary] = useState<Notary | null>(null);

  // Filter notaries
  const filteredNotaries = useMemo(() => {
    return MOCK_NOTARIES.filter((n) => {
      const matchSearch =
        !searchQuery ||
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.cabinet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.licence.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCountry = countryFilter === 'all' || n.country === countryFilter;
      const matchStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchConvention = conventionFilter === 'all' || n.convention === conventionFilter;
      return matchSearch && matchCountry && matchStatus && matchConvention;
    });
  }, [searchQuery, countryFilter, statusFilter, conventionFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredNotaries.length / PAGE_SIZE));
  const paginatedNotaries = filteredNotaries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setCountryFilter('all');
    setStatusFilter('all');
    setConventionFilter('all');
    setCurrentPage(1);
  }, []);

  // Stats
  const stats = useMemo(() => {
    const total = MOCK_NOTARIES.length;
    const conventionsSignees = MOCK_NOTARIES.filter((n) => n.convention === 'signee').length;
    const enAttente = MOCK_NOTARIES.filter((n) => n.status === 'en_attente').length;
    const transactionsEnCours = MOCK_NOTARIES.reduce((sum, n) => sum + n.transactions, 0);
    return { total, conventionsSignees, enAttente, transactionsEnCours };
  }, []);

  const handleVerifyConvention = useCallback((notary: Notary) => {
    toast.success(`Convention de ${notary.name} vérifiée avec succès`);
  }, []);

  const handleSuspend = useCallback(() => {
    if (selectedNotary) {
      toast.success(`${selectedNotary.name} a été suspendu(e)`);
      setSuspendDialogOpen(false);
      setSelectedNotary(null);
    }
  }, [selectedNotary]);

  const handleDelete = useCallback(() => {
    if (selectedNotary) {
      toast.success(`${selectedNotary.name} a été supprimé(e)`);
      setDeleteDialogOpen(false);
      setSelectedNotary(null);
    }
  }, [selectedNotary]);

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37] mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#003087]" />
            Gestion des Notaires
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez les profils notariaux et les conventions
          </p>
        </div>
        <Button className="bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un notaire
        </Button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#003087]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Total notaires</p>
            <p className="text-2xl font-bold text-gray-900 font-display">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <FileSignature className="w-5 h-5 text-[#00A651]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Convention signée</p>
            <p className="text-2xl font-bold text-[#00A651] font-display">{stats.conventionsSignees}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">En attente</p>
            <p className="text-2xl font-bold text-amber-600 font-display">{stats.enAttente}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-[#009CDE]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Transactions en cours</p>
            <p className="text-2xl font-bold text-[#009CDE] font-display">{stats.transactionsEnCours}</p>
          </div>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, cabinet ou licence..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-9 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <Select
              value={countryFilter}
              onValueChange={(v) => {
                setCountryFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs">
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
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={conventionFilter}
              onValueChange={(v) => {
                setConventionFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Convention" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les conventions</SelectItem>
                <SelectItem value="signee">Signée</SelectItem>
                <SelectItem value="non_signee">Non signée</SelectItem>
              </SelectContent>
            </Select>
            {(searchQuery || countryFilter !== 'all' || statusFilter !== 'all' || conventionFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs text-gray-500 hover:text-gray-700"
                onClick={resetFilters}
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Notaire</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Pays</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Licence</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Convention</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Transactions</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Note</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500">Statut</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNotaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <Landmark className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900">Aucun notaire trouvé</p>
                      <p className="text-sm text-gray-500 mt-1">Modifiez vos filtres de recherche</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={resetFilters}
                      >
                        Réinitialiser les filtres
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedNotaries.map((notary) => (
                  <NotaryRow
                    key={notary.id}
                    notary={notary}
                    onVerifyConvention={handleVerifyConvention}
                    onSuspend={(n) => {
                      setSelectedNotary(n);
                      setSuspendDialogOpen(true);
                    }}
                    onDelete={(n) => {
                      setSelectedNotary(n);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredNotaries.length)} sur{' '}
              {filteredNotaries.length} notaire{filteredNotaries.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0 text-xs',
                    page === currentPage && 'bg-[#003087] hover:bg-[#002a70]'
                  )}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Suspend Dialog ── */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-[#D93025]" />
              Suspendre le notaire
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir suspendre {selectedNotary?.name} ? Cette action désactivera
              son accès à la plateforme.
            </DialogDescription>
          </DialogHeader>
          {selectedNotary && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-sm font-bold">
                    {getInitials(selectedNotary.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedNotary.name}</p>
                  <p className="text-xs text-gray-500">{selectedNotary.cabinet}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleSuspend}>
              <Ban className="w-4 h-4 mr-2" />
              Confirmer la suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-[#D93025]" />
              Supprimer le notaire
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données de {selectedNotary?.name} seront
              définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          {selectedNotary && (
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-sm font-bold">
                    {getInitials(selectedNotary.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedNotary.name}</p>
                  <p className="text-xs text-gray-500">
                    {selectedNotary.licence} — {COUNTRY_FLAGS[selectedNotary.country]}{' '}
                    {COUNTRY_NAMES[selectedNotary.country]}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Notary Row Component ───────────────────────────────────────────────────

function NotaryRow({
  notary,
  onVerifyConvention,
  onSuspend,
  onDelete,
}: {
  notary: Notary;
  onVerifyConvention: (n: Notary) => void;
  onSuspend: (n: Notary) => void;
  onDelete: (n: Notary) => void;
}) {
  const statusConfig = STATUS_CONFIG[notary.status];
  const conventionConfig = CONVENTION_CONFIG[notary.convention];
  const StatusIcon = statusConfig.icon;
  const ConventionIcon = conventionConfig.icon;

  return (
    <TableRow className="hover:bg-gray-50/50 transition-colors">
      {/* Notaire (avatar + name + cabinet) */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={notary.avatar || undefined} />
            <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-xs font-bold">
              {getInitials(notary.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{notary.name}</p>
            <p className="text-[11px] text-gray-400 truncate">{notary.cabinet}</p>
          </div>
        </div>
      </TableCell>

      {/* Pays */}
      <TableCell>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-sm">{COUNTRY_FLAGS[notary.country]}</span>
          <span className="text-sm text-gray-700">{COUNTRY_NAMES[notary.country]}</span>
        </div>
      </TableCell>

      {/* Licence */}
      <TableCell>
        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {notary.licence}
        </span>
      </TableCell>

      {/* Convention */}
      <TableCell>
        <Badge variant="outline" className={cn('text-[10px]', conventionConfig.color)}>
          <ConventionIcon className="w-3 h-3" />
          {conventionConfig.label}
        </Badge>
      </TableCell>

      {/* Transactions */}
      <TableCell>
        <span className="text-sm font-medium text-gray-900">{notary.transactions}</span>
      </TableCell>

      {/* Note */}
      <TableCell>{renderStars(notary.note)}</TableCell>

      {/* Statut */}
      <TableCell>
        <Badge variant="outline" className={cn('text-[10px]', statusConfig.color)}>
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={() => toast.info(`Visualisation du profil de ${notary.name}`)}
            >
              <Eye className="w-4 h-4 mr-2 text-gray-500" />
              Voir le profil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs cursor-pointer"
              onClick={() => toast.info(`Modification de ${notary.name}`)}
            >
              <Edit className="w-4 h-4 mr-2 text-gray-500" />
              Modifier
            </DropdownMenuItem>
            {notary.convention === 'non_signee' && (
              <DropdownMenuItem
                className="text-xs cursor-pointer"
                onClick={() => onVerifyConvention(notary)}
              >
                <FileCheck className="w-4 h-4 mr-2 text-green-600" />
                Vérifier la convention
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {notary.status !== 'suspendu' && (
              <DropdownMenuItem
                className="text-xs cursor-pointer text-amber-600 focus:text-amber-700"
                onClick={() => onSuspend(notary)}
              >
                <Ban className="w-4 h-4 mr-2" />
                Suspendre
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-xs cursor-pointer text-red-600 focus:text-red-700"
              onClick={() => onDelete(notary)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
