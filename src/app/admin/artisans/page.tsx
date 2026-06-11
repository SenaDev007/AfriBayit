'use client';

import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Filter,
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
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/* ──────────────────── Types ──────────────────── */

type ArtisanStatus = 'actif' | 'en_attente' | 'suspendu';

type Speciality =
  | 'Maçonnerie'
  | 'Plomberie'
  | 'Électricité'
  | 'Menuiserie'
  | 'Peinture'
  | 'Carrelage'
  | 'Couverture'
  | 'Autre';

interface Artisan {
  id: string;
  name: string;
  speciality: Speciality;
  country: 'BJ' | 'CI' | 'BF' | 'TG';
  city: string;
  phone: string;
  status: ArtisanStatus;
  rating: number;
  missions: number;
  verified: boolean;
  joinedAt: string;
}

/* ──────────────────── Constants ──────────────────── */

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

const STATUS_CONFIG: Record<
  ArtisanStatus,
  { label: string; className: string }
> = {
  actif: {
    label: 'Actif',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  en_attente: {
    label: 'En attente',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  suspendu: {
    label: 'Suspendu',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

const SPECIALITIES: Speciality[] = [
  'Maçonnerie',
  'Plomberie',
  'Électricité',
  'Menuiserie',
  'Peinture',
  'Carrelage',
  'Couverture',
  'Autre',
];

const SPECIALITY_ICONS: Record<Speciality, string> = {
  Maçonnerie: '🧱',
  Plomberie: '🔧',
  Électricité: '⚡',
  Menuiserie: '🪚',
  Peinture: '🎨',
  Carrelage: '🔲',
  Couverture: '🏠',
  Autre: '🛠️',
};

const ITEMS_PER_PAGE = 8;

/* ──────────────────── Mock Data ──────────────────── */

const MOCK_ARTISANS: Artisan[] = [
  {
    id: 'art-001',
    name: 'Kofi Mensah',
    speciality: 'Maçonnerie',
    country: 'BJ',
    city: 'Cotonou',
    phone: '+229 97 12 34 56',
    status: 'actif',
    rating: 4.8,
    missions: 34,
    verified: true,
    joinedAt: '2024-03-15',
  },
  {
    id: 'art-002',
    name: 'Aminata Diallo',
    speciality: 'Plomberie',
    country: 'CI',
    city: 'Abidjan',
    phone: '+225 07 89 12 34',
    status: 'actif',
    rating: 4.6,
    missions: 28,
    verified: true,
    joinedAt: '2024-01-22',
  },
  {
    id: 'art-003',
    name: 'Ibrahim Ouédraogo',
    speciality: 'Électricité',
    country: 'BF',
    city: 'Ouagadougou',
    phone: '+226 70 23 45 67',
    status: 'en_attente',
    rating: 4.2,
    missions: 12,
    verified: false,
    joinedAt: '2024-11-05',
  },
  {
    id: 'art-004',
    name: 'Adjo Amegah',
    speciality: 'Menuiserie',
    country: 'TG',
    city: 'Lomé',
    phone: '+228 90 34 56 78',
    status: 'actif',
    rating: 4.9,
    missions: 41,
    verified: true,
    joinedAt: '2023-08-10',
  },
  {
    id: 'art-005',
    name: 'Moussa Konaté',
    speciality: 'Peinture',
    country: 'CI',
    city: 'Bouaké',
    phone: '+225 01 45 67 89',
    status: 'suspendu',
    rating: 3.1,
    missions: 8,
    verified: false,
    joinedAt: '2024-06-18',
  },
  {
    id: 'art-006',
    name: 'Fatoumata Bamba',
    speciality: 'Carrelage',
    country: 'CI',
    city: 'San-Pédro',
    phone: '+225 05 56 78 90',
    status: 'actif',
    rating: 4.7,
    missions: 22,
    verified: true,
    joinedAt: '2024-02-28',
  },
  {
    id: 'art-007',
    name: 'Seydou Traoré',
    speciality: 'Couverture',
    country: 'BF',
    city: 'Bobo-Dioulasso',
    phone: '+226 72 67 89 01',
    status: 'en_attente',
    rating: 4.0,
    missions: 5,
    verified: false,
    joinedAt: '2025-01-12',
  },
  {
    id: 'art-008',
    name: 'Essozimna Agbéko',
    speciality: 'Maçonnerie',
    country: 'TG',
    city: 'Kara',
    phone: '+228 91 78 90 12',
    status: 'actif',
    rating: 4.5,
    missions: 19,
    verified: true,
    joinedAt: '2024-04-03',
  },
  {
    id: 'art-009',
    name: 'Rachida Sow',
    speciality: 'Électricité',
    country: 'BJ',
    city: 'Parakou',
    phone: '+229 96 89 01 23',
    status: 'actif',
    rating: 4.3,
    missions: 16,
    verified: true,
    joinedAt: '2024-07-20',
  },
  {
    id: 'art-010',
    name: 'Komlan Dodji',
    speciality: 'Plomberie',
    country: 'TG',
    city: 'Sokodé',
    phone: '+228 92 90 12 34',
    status: 'en_attente',
    rating: 3.8,
    missions: 3,
    verified: false,
    joinedAt: '2025-02-01',
  },
];

/* ──────────────────── Stat Card ──────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div
        className={cn(
          'w-11 h-11 rounded-lg flex items-center justify-center shrink-0',
          color
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ──────────────────── Star Rating ──────────────────── */

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.3;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < full
              ? 'text-amber-400 fill-amber-400'
              : i === full && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-gray-200 fill-gray-200'
          )}
        />
      ))}
      <span className="text-xs font-medium text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

/* ──────────────────── Artisan Row ──────────────────── */

function ArtisanRow({ artisan, onAction }: { artisan: Artisan; onAction: (id: string, action: string) => void }) {
  const initials = artisan.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusCfg = STATUS_CONFIG[artisan.status];

  return (
    <TableRow className="hover:bg-gray-50/50 transition-colors">
      {/* Artisan info */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-9 h-9">
              <AvatarFallback
                className={cn(
                  'text-xs font-bold',
                  artisan.status === 'suspendu'
                    ? 'bg-red-50 text-red-600'
                    : artisan.verified
                      ? 'bg-[#003087]/10 text-[#003087]'
                      : 'bg-gray-100 text-gray-600'
                )}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {artisan.verified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00A651] border-2 border-white flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{artisan.name}</p>
            <p className="text-xs text-gray-400 truncate flex items-center gap-1">
              <span>{SPECIALITY_ICONS[artisan.speciality]}</span>
              <span>{artisan.speciality}</span>
            </p>
          </div>
        </div>
      </TableCell>

      {/* Pays */}
      <TableCell>
        <span className="text-sm inline-flex items-center gap-1.5">
          <span>{COUNTRY_FLAGS[artisan.country]}</span>
          <span className="text-gray-700">{artisan.country}</span>
        </span>
      </TableCell>

      {/* Ville */}
      <TableCell>
        <span className="text-sm text-gray-700 inline-flex items-center gap-1">
          <MapPin className="w-3 h-3 text-gray-400" />
          {artisan.city}
        </span>
      </TableCell>

      {/* Téléphone */}
      <TableCell>
        <span className="text-sm text-gray-600 inline-flex items-center gap-1">
          <Phone className="w-3 h-3 text-gray-400" />
          {artisan.phone}
        </span>
      </TableCell>

      {/* Statut */}
      <TableCell>
        <Badge variant="outline" className={cn('text-[11px] font-medium', statusCfg.className)}>
          {statusCfg.label}
        </Badge>
      </TableCell>

      {/* Note moyenne */}
      <TableCell>
        <StarRating rating={artisan.rating} />
      </TableCell>

      {/* Missions */}
      <TableCell>
        <span className="text-sm font-semibold text-gray-700">{artisan.missions}</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onAction(artisan.id, 'view')}>
              <Eye className="w-4 h-4 mr-2" />
              Voir le profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction(artisan.id, 'edit')}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            {!artisan.verified && artisan.status !== 'suspendu' && (
              <DropdownMenuItem onClick={() => onAction(artisan.id, 'verify')}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Vérifier
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {artisan.status === 'suspendu' ? (
              <DropdownMenuItem onClick={() => onAction(artisan.id, 'reactivate')} className="text-green-600">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Réactiver
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onAction(artisan.id, 'suspend')} className="text-amber-600">
                <Ban className="w-4 h-4 mr-2" />
                Suspendre
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction(artisan.id, 'delete')} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

/* ──────────────────── Main Page ──────────────────── */

export default function ArtisansAdminPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [specialityFilter, setSpecialityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog state
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; artisan: Artisan | null }>({
    open: false,
    artisan: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; artisan: Artisan | null }>({
    open: false,
    artisan: null,
  });
  const [suspendReason, setSuspendReason] = useState('');

  // Filter artisans
  const filteredArtisans = useMemo(() => {
    return MOCK_ARTISANS.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.phone.includes(searchQuery) ||
        a.speciality.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry = countryFilter === 'all' || a.country === countryFilter;
      const matchesSpeciality = specialityFilter === 'all' || a.speciality === specialityFilter;
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;

      return matchesSearch && matchesCountry && matchesSpeciality && matchesStatus;
    });
  }, [searchQuery, countryFilter, specialityFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredArtisans.length / ITEMS_PER_PAGE));
  const paginatedArtisans = filteredArtisans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const stats = useMemo(
    () => ({
      total: MOCK_ARTISANS.length,
      verified: MOCK_ARTISANS.filter((a) => a.verified).length,
      enAttente: MOCK_ARTISANS.filter((a) => a.status === 'en_attente').length,
      servicesActifs: MOCK_ARTISANS.reduce((sum, a) => sum + a.missions, 0),
    }),
    []
  );

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleAction = (id: string, action: string) => {
    const artisan = MOCK_ARTISANS.find((a) => a.id === id);
    if (!artisan) return;

    switch (action) {
      case 'view':
        // Would navigate to detail page
        break;
      case 'edit':
        // Would open edit dialog
        break;
      case 'verify':
        // Would call API to verify artisan
        break;
      case 'suspend':
        setSuspendDialog({ open: true, artisan });
        break;
      case 'reactivate':
        // Would call API to reactivate
        break;
      case 'delete':
        setDeleteDialog({ open: true, artisan });
        break;
    }
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setCountryFilter('all');
    setSpecialityFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' || countryFilter !== 'all' || specialityFilter !== 'all' || statusFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#003087] flex items-center justify-center">
              <Wrench className="w-4.5 h-4.5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Gestion des Artisans BTP
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1 ml-[46px]">
            Gérez les artisans du bâtiment et des travaux publics
          </p>
        </div>
        <Button
          size="sm"
          className="text-xs bg-[#D4AF37] hover:bg-[#C4A030] text-white shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Ajouter un artisan
        </Button>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total artisans"
          value={stats.total}
          color="bg-[#003087]/10 text-[#003087]"
        />
        <StatCard
          icon={CheckCircle2}
          label="Artisans vérifiés"
          value={stats.verified}
          color="bg-[#00A651]/10 text-[#00A651]"
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats.enAttente}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={Briefcase}
          label="Services actifs"
          value={stats.servicesActifs}
          color="bg-[#009CDE]/10 text-[#009CDE]"
        />
      </div>

      {/* ─── Filters Bar ─── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, ville, spécialité, téléphone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setCurrentPage(1); }}>
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

            <Select value={specialityFilter} onValueChange={(v) => { setSpecialityFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes spécialités</SelectItem>
                {SPECIALITIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SPECIALITY_ICONS[s]} {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
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

            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleSearch}>
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filtrer
            </Button>

            {hasActiveFilters && (
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

      {/* ─── Data Table ─── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filteredArtisans.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun artisan trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Essayez de modifier vos filtres de recherche
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 text-xs"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Artisan
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Pays
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Ville
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Téléphone
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statut
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Note moyenne
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Missions
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedArtisans.map((artisan) => (
                    <ArtisanRow key={artisan.id} artisan={artisan} onAction={handleAction} />
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredArtisans.length)}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredArtisans.length)} sur{' '}
                  {filteredArtisans.length} artisan{filteredArtisans.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-8 w-8 p-0 text-xs',
                        pageNum === currentPage && 'bg-[#003087] hover:bg-[#002a70]'
                      )}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Suspend Dialog ─── */}
      <Dialog
        open={suspendDialog.open}
        onOpenChange={(open) => setSuspendDialog({ open, artisan: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspendre {suspendDialog.artisan?.name}</DialogTitle>
            <DialogDescription>
              Cette action suspendra le compte de cet artisan. Il ne pourra plus recevoir de missions.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Raison de la suspension (optionnel)"
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendDialog({ open: false, artisan: null });
                setSuspendReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSuspendDialog({ open: false, artisan: null });
                setSuspendReason('');
              }}
            >
              Suspendre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Dialog ─── */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, artisan: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer {deleteDialog.artisan?.name}</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Toutes les données de cet artisan seront définitivement supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, artisan: null })}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialog({ open: false, artisan: null })}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
