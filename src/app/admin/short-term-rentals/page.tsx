'use client';

import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Search,
  Plus,
  Home,
  Star,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Ban,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Design tokens ──────────────────────────────────────────────────────────
const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';
const GREEN = '#00A651';
const RED = '#D93025';

// ── Countries ──────────────────────────────────────────────────────────────
const COUNTRIES = [
  { value: '', label: 'Tous les pays' },
  { value: 'BJ', label: '\u{1F1E7}\u{1F1EF} Bénin' },
  { value: 'CI', label: "\u{1F1E8}\u{1F1EE} Côte d'Ivoire" },
  { value: 'BF', label: '\u{1F1E7}\u{1F1EB} Burkina Faso' },
  { value: 'TG', label: '\u{1F1F9}\u{1F1EC} Togo' },
  { value: 'SN', label: '\u{1F1F8}\u{1F1F3} Sénégal' },
  { value: 'ML', label: '\u{1F1F2}\u{1F1F1} Mali' },
];

const COUNTRY_LABELS: Record<string, string> = {
  BJ: 'Bénin',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  TG: 'Togo',
  SN: 'Sénégal',
  ML: 'Mali',
};

// ── Status configs ─────────────────────────────────────────────────────────
const ANNONCE_STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'En attente' },
  { value: 'suspended', label: 'Suspendue' },
];

const RESERVATION_STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'pending', label: 'En attente' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'completed', label: 'Terminée' },
];

const annonceStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  active: { label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  suspended: { label: 'Suspendue', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

const reservationStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  confirmed: { label: 'Confirmée', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'En attente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  cancelled: { label: 'Annulée', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  completed: { label: 'Terminée', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const formatXOF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Mock data: Annonces ───────────────────────────────────────────────────
interface Annonce {
  id: string;
  title: string;
  location: string;
  country: string;
  owner: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  status: 'active' | 'pending' | 'suspended';
  image: string;
  featured: boolean;
}

const MOCK_ANNONCES: Annonce[] = [
  {
    id: 'STR-001',
    title: 'Appartement moderne Plateau',
    location: 'Plateau, Cotonou',
    country: 'BJ',
    owner: 'Adjovi Mensah',
    pricePerNight: 35000,
    rating: 4.8,
    reviewCount: 124,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=80&fit=crop',
    featured: true,
  },
  {
    id: 'STR-002',
    title: 'Villa avec piscine Cocody',
    location: 'Cocody, Abidjan',
    country: 'CI',
    owner: 'Koné Ibrahim',
    pricePerNight: 75000,
    rating: 4.9,
    reviewCount: 89,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=80&h=80&fit=crop',
    featured: true,
  },
  {
    id: 'STR-003',
    title: 'Studio meublé Ouaga 2000',
    location: 'Ouaga 2000, Ouagadougou',
    country: 'BF',
    owner: 'Sawadogo Aminata',
    pricePerNight: 18000,
    rating: 4.3,
    reviewCount: 56,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=80&h=80&fit=crop',
    featured: false,
  },
  {
    id: 'STR-004',
    title: 'Loft design Almadies',
    location: 'Almadies, Dakar',
    country: 'SN',
    owner: 'Diop Fatou',
    pricePerNight: 55000,
    rating: 4.7,
    reviewCount: 203,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=80&fit=crop',
    featured: false,
  },
  {
    id: 'STR-005',
    title: 'Maison traditionnelle Lomé',
    location: 'Tokoin, Lomé',
    country: 'TG',
    owner: 'Agbéko Kofi',
    pricePerNight: 15000,
    rating: 4.1,
    reviewCount: 34,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=80&h=80&fit=crop',
    featured: false,
  },
  {
    id: 'STR-006',
    title: 'Penthouse vue lagune',
    location: 'Marcory, Abidjan',
    country: 'CI',
    owner: 'Bamba Moussa',
    pricePerNight: 95000,
    rating: 4.6,
    reviewCount: 67,
    status: 'suspended',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=80&h=80&fit=crop',
    featured: false,
  },
  {
    id: 'STR-007',
    title: 'Chambre d\'hôte Fidjrossè',
    location: 'Fidjrossè, Cotonou',
    country: 'BJ',
    owner: 'Houénou Sylvie',
    pricePerNight: 22000,
    rating: 4.5,
    reviewCount: 91,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=80&h=80&fit=crop',
    featured: true,
  },
  {
    id: 'STR-008',
    title: 'Appartement Bamako Kati',
    location: 'Kati, Bamako',
    country: 'ML',
    owner: 'Traoré Amadou',
    pricePerNight: 12500,
    rating: 3.9,
    reviewCount: 18,
    status: 'pending',
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=80&h=80&fit=crop',
    featured: false,
  },
  {
    id: 'STR-009',
    title: 'Résidence sécurisée Zone 4',
    location: 'Zone 4, Abidjan',
    country: 'CI',
    owner: 'Konan Yao',
    pricePerNight: 42000,
    rating: 4.4,
    reviewCount: 142,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=80&fit=crop',
    featured: false,
  },
  {
    id: 'STR-010',
    title: 'T2 meublé Godomey',
    location: 'Godomey, Cotonou',
    country: 'BJ',
    owner: 'Dossou Patrick',
    pricePerNight: 20000,
    rating: 4.2,
    reviewCount: 47,
    status: 'suspended',
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=80&h=80&fit=crop',
    featured: false,
  },
];

// ── Mock data: Réservations ───────────────────────────────────────────────
interface Reservation {
  id: string;
  tenant: string;
  annonceTitle: string;
  annonceId: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
}

const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-1001',
    tenant: 'Kouassi Marie',
    annonceTitle: 'Appartement moderne Plateau',
    annonceId: 'STR-001',
    checkIn: '2026-06-15',
    checkOut: '2026-06-20',
    amount: 175000,
    status: 'confirmed',
  },
  {
    id: 'RES-1002',
    tenant: 'N\'Guessan Yves',
    annonceTitle: 'Villa avec piscine Cocody',
    annonceId: 'STR-002',
    checkIn: '2026-06-18',
    checkOut: '2026-06-25',
    amount: 525000,
    status: 'confirmed',
  },
  {
    id: 'RES-1003',
    tenant: 'Zongo Pascal',
    annonceTitle: 'Studio meublé Ouaga 2000',
    annonceId: 'STR-003',
    checkIn: '2026-06-20',
    checkOut: '2026-06-22',
    amount: 36000,
    status: 'pending',
  },
  {
    id: 'RES-1004',
    tenant: 'Sow Aïssatou',
    annonceTitle: 'Loft design Almadies',
    annonceId: 'STR-004',
    checkIn: '2026-06-10',
    checkOut: '2026-06-14',
    amount: 220000,
    status: 'completed',
  },
  {
    id: 'RES-1005',
    tenant: 'Amevor Kossi',
    annonceTitle: 'Maison traditionnelle Lomé',
    annonceId: 'STR-005',
    checkIn: '2026-06-22',
    checkOut: '2026-06-28',
    amount: 90000,
    status: 'pending',
  },
  {
    id: 'RES-1006',
    tenant: 'Cissé Fatoumata',
    annonceTitle: 'Penthouse vue lagune',
    annonceId: 'STR-006',
    checkIn: '2026-05-28',
    checkOut: '2026-06-02',
    amount: 475000,
    status: 'cancelled',
  },
  {
    id: 'RES-1007',
    tenant: 'Dossou Gérard',
    annonceTitle: 'Chambre d\'hôte Fidjrossè',
    annonceId: 'STR-007',
    checkIn: '2026-06-12',
    checkOut: '2026-06-15',
    amount: 66000,
    status: 'confirmed',
  },
  {
    id: 'RES-1008',
    tenant: 'Keita Modibo',
    annonceTitle: 'Appartement Bamako Kati',
    annonceId: 'STR-008',
    checkIn: '2026-06-25',
    checkOut: '2026-06-30',
    amount: 62500,
    status: 'pending',
  },
  {
    id: 'RES-1009',
    tenant: 'Konan Aya',
    annonceTitle: 'Résidence sécurisée Zone 4',
    annonceId: 'STR-009',
    checkIn: '2026-06-08',
    checkOut: '2026-06-12',
    amount: 168000,
    status: 'completed',
  },
  {
    id: 'RES-1010',
    tenant: 'Agossou Rachida',
    annonceTitle: 'T2 meublé Godomey',
    annonceId: 'STR-010',
    checkIn: '2026-05-20',
    checkOut: '2026-05-25',
    amount: 100000,
    status: 'completed',
  },
  {
    id: 'RES-1011',
    tenant: 'Ouattara Dramane',
    annonceTitle: 'Villa avec piscine Cocody',
    annonceId: 'STR-002',
    checkIn: '2026-07-01',
    checkOut: '2026-07-10',
    amount: 675000,
    status: 'pending',
  },
  {
    id: 'RES-1012',
    tenant: 'Lawani Bilkiss',
    annonceTitle: 'Appartement moderne Plateau',
    annonceId: 'STR-001',
    checkIn: '2026-06-05',
    checkOut: '2026-06-08',
    amount: 105000,
    status: 'cancelled',
  },
];

// ── Stat card data ────────────────────────────────────────────────────────
const STATS = [
  {
    label: 'Total annonces',
    value: '247',
    change: '+12%',
    icon: Home,
    color: NAVY,
    bgColor: 'bg-[#003087]/8',
    iconColor: 'text-[#003087]',
    borderColor: 'border-[#003087]/15',
  },
  {
    label: 'Réservations actives',
    value: '38',
    change: '+8%',
    icon: CalendarDays,
    color: BLUE,
    bgColor: 'bg-[#009CDE]/8',
    iconColor: 'text-[#009CDE]',
    borderColor: 'border-[#009CDE]/15',
  },
  {
    label: 'Revenus du mois',
    value: '4.2M XOF',
    change: '+23%',
    icon: DollarSign,
    color: GREEN,
    bgColor: 'bg-[#00A651]/8',
    iconColor: 'text-[#00A651]',
    borderColor: 'border-[#00A651]/15',
  },
  {
    label: "Taux d'occupation",
    value: '72%',
    change: '+5%',
    icon: TrendingUp,
    color: GOLD,
    bgColor: 'bg-[#D4AF37]/8',
    iconColor: 'text-[#D4AF37]',
    borderColor: 'border-[#D4AF37]/15',
  },
];

// ── Status badge component ────────────────────────────────────────────────
type StatusConfig = Record<string, { label: string; bg: string; text: string; dot: string }>;

function StatusBadge({ status, config }: { status: string; config: StatusConfig }) {
  const s = config[status];
  if (!s) return null;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', s.bg, s.text)}>
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}

// ── Star rating component ─────────────────────────────────────────────────
function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        <Star className="size-3.5 fill-[#D4AF37] text-[#D4AF37]" />
        <span className="text-sm font-semibold text-gray-900">{rating}</span>
      </div>
      <span className="text-xs text-gray-500">({count})</span>
    </div>
  );
}

// ── Pagination component ──────────────────────────────────────────────────
function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-500">
        Page {page} sur {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="size-4" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
            className={cn(
              'h-8 w-8 p-0',
              p === page && 'bg-[#003087] hover:bg-[#003087]/90'
            )}
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════
export default function ShortTermRentalsPage() {
  const [activeTab, setActiveTab] = useState('annonces');

  // ── Annonce filters ───────────────────────────────────────────────────
  const [annonceSearch, setAnnonceSearch] = useState('');
  const [annonceCountry, setAnnonceCountry] = useState('');
  const [annonceStatus, setAnnonceStatus] = useState('');
  const [annoncePage, setAnnoncePage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // ── Reservation filters ───────────────────────────────────────────────
  const [reservationSearch, setReservationSearch] = useState('');
  const [reservationCountry, setReservationCountry] = useState('');
  const [reservationStatus, setReservationStatus] = useState('');
  const [reservationPage, setReservationPage] = useState(1);

  // ── Filtered annonces ────────────────────────────────────────────────
  const filteredAnnonces = useMemo(() => {
    return MOCK_ANNONCES.filter((a) => {
      const matchSearch =
        !annonceSearch ||
        a.title.toLowerCase().includes(annonceSearch.toLowerCase()) ||
        a.owner.toLowerCase().includes(annonceSearch.toLowerCase()) ||
        a.location.toLowerCase().includes(annonceSearch.toLowerCase());
      const matchCountry = !annonceCountry || a.country === annonceCountry;
      const matchStatus = !annonceStatus || a.status === annonceStatus;
      return matchSearch && matchCountry && matchStatus;
    });
  }, [annonceSearch, annonceCountry, annonceStatus]);

  const annonceTotalPages = Math.max(1, Math.ceil(filteredAnnonces.length / ITEMS_PER_PAGE));
  const paginatedAnnonces = filteredAnnonces.slice(
    (annoncePage - 1) * ITEMS_PER_PAGE,
    annoncePage * ITEMS_PER_PAGE
  );

  // ── Filtered reservations ────────────────────────────────────────────
  const filteredReservations = useMemo(() => {
    return MOCK_RESERVATIONS.filter((r) => {
      const matchSearch =
        !reservationSearch ||
        r.tenant.toLowerCase().includes(reservationSearch.toLowerCase()) ||
        r.annonceTitle.toLowerCase().includes(reservationSearch.toLowerCase()) ||
        r.id.toLowerCase().includes(reservationSearch.toLowerCase());
      const matchCountry =
        !reservationCountry ||
        MOCK_ANNONCES.find((a) => a.id === r.annonceId)?.country === reservationCountry;
      const matchStatus = !reservationStatus || r.status === reservationStatus;
      return matchSearch && matchCountry && matchStatus;
    });
  }, [reservationSearch, reservationCountry, reservationStatus]);

  const reservationTotalPages = Math.max(1, Math.ceil(filteredReservations.length / ITEMS_PER_PAGE));
  const paginatedReservations = filteredReservations.slice(
    (reservationPage - 1) * ITEMS_PER_PAGE,
    reservationPage * ITEMS_PER_PAGE
  );

  // ── Reset page when filters change ───────────────────────────────────
  const handleAnnonceFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setAnnoncePage(1);
  };
  const handleReservationFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setReservationPage(1);
  };

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#003087]">
            Locations Courte Durée
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les annonces de location temporaire et les réservations
          </p>
        </div>
        <Button
          className="gap-2 bg-[#D4AF37] text-white shadow-md hover:bg-[#D4AF37]/90"
          size="default"
        >
          <Plus className="size-4" />
          Ajouter une annonce
        </Button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className={cn(
                'relative overflow-hidden border py-0 shadow-sm transition-shadow hover:shadow-md',
                stat.borderColor
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="size-3.5 text-[#00A651]" />
                      <span className="text-xs font-medium text-[#00A651]">{stat.change}</span>
                      <span className="text-xs text-gray-400">vs mois dernier</span>
                    </div>
                  </div>
                  <div className={cn('flex size-11 items-center justify-center rounded-xl', stat.bgColor)}>
                    <Icon className={cn('size-5', stat.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger
            value="annonces"
            className={cn(
              'data-[state=active]:bg-white data-[state=active]:shadow-sm',
              activeTab === 'annonces' && 'text-[#003087]'
            )}
          >
            <Home className="mr-1.5 size-4" />
            Annonces
          </TabsTrigger>
          <TabsTrigger
            value="reservations"
            className={cn(
              'data-[state=active]:bg-white data-[state=active]:shadow-sm',
              activeTab === 'reservations' && 'text-[#003087]'
            )}
          >
            <CalendarDays className="mr-1.5 size-4" />
            Réservations
          </TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════════════════════════════
            Annonces tab
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="annonces" className="space-y-4">
          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par titre, propriétaire ou lieu..."
                value={annonceSearch}
                onChange={(e) => handleAnnonceFilterChange(setAnnonceSearch)(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>
            <Select value={annonceCountry} onValueChange={handleAnnonceFilterChange(setAnnonceCountry)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white">
                <SelectValue placeholder="Tous les pays" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value || 'all'} value={c.value || 'all'}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={annonceStatus} onValueChange={handleAnnonceFilterChange(setAnnonceStatus)}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 bg-white">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {ANNONCE_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value || 'all'} value={s.value || 'all'}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Annonce
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Propriétaire
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Pays
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Prix/nuit
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Note
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statut
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAnnonces.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <Home className="size-8" />
                          <p>Aucune annonce trouvée</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedAnnonces.map((annonce) => (
                      <TableRow key={annonce.id} className="group transition-colors">
                        {/* Annonce (image + title + location) */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                              <img
                                src={annonce.image}
                                alt={annonce.title}
                                className="size-12 rounded-lg object-cover"
                              />
                              {annonce.featured && (
                                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#D4AF37]">
                                  <Star className="size-2.5 fill-white text-white" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900 max-w-[200px]">
                                {annonce.title}
                              </p>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="size-3 flex-shrink-0" />
                                <span className="truncate">{annonce.location}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Propriétaire */}
                        <TableCell>
                          <span className="text-sm text-gray-700">{annonce.owner}</span>
                        </TableCell>

                        {/* Pays */}
                        <TableCell>
                          <span className="text-sm text-gray-700">
                            {COUNTRY_LABELS[annonce.country] || annonce.country}
                          </span>
                        </TableCell>

                        {/* Prix/nuit */}
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatXOF(annonce.pricePerNight)}
                          </span>
                        </TableCell>

                        {/* Note */}
                        <TableCell>
                          <StarRating rating={annonce.rating} count={annonce.reviewCount} />
                        </TableCell>

                        {/* Statut */}
                        <TableCell>
                          <StatusBadge status={annonce.status} config={annonceStatusConfig} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs text-gray-500">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Eye className="size-4 text-[#009CDE]" />
                                <span>Voir les détails</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Edit className="size-4 text-[#003087]" />
                                <span>Modifier</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Star className="size-4 text-[#D4AF37]" />
                                <span>
                                  {annonce.featured ? 'Retirer la une' : 'Mettre en avant'}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Ban className="size-4 text-amber-500" />
                                <span>
                                  {annonce.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                                </span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer text-[#D93025] focus:text-[#D93025]">
                                <Trash2 className="size-4" />
                                <span>Supprimer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Pagination
            page={annoncePage}
            totalPages={annonceTotalPages}
            onPageChange={setAnnoncePage}
          />
        </TabsContent>

        {/* ════════════════════════════════════════════════════════════════
            Réservations tab
            ════════════════════════════════════════════════════════════════ */}
        <TabsContent value="reservations" className="space-y-4">
          {/* ── Filters ─────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher par locataire, annonce ou ID..."
                value={reservationSearch}
                onChange={(e) => handleReservationFilterChange(setReservationSearch)(e.target.value)}
                className="pl-9 h-9 bg-white"
              />
            </div>
            <Select value={reservationCountry} onValueChange={handleReservationFilterChange(setReservationCountry)}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white">
                <SelectValue placeholder="Tous les pays" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value || 'all'} value={c.value || 'all'}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reservationStatus} onValueChange={handleReservationFilterChange(setReservationStatus)}>
              <SelectTrigger className="w-full sm:w-[170px] h-9 bg-white">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                {RESERVATION_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value || 'all'} value={s.value || 'all'}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Table ───────────────────────────────────────────────────── */}
          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Locataire
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Annonce
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Arrivée
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Départ
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Montant
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Statut
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-500 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReservations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <CalendarDays className="size-8" />
                          <p>Aucune réservation trouvée</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedReservations.map((res) => (
                      <TableRow key={res.id} className="group transition-colors">
                        {/* ID */}
                        <TableCell>
                          <span className="font-mono text-sm font-medium text-[#003087]">
                            {res.id}
                          </span>
                        </TableCell>

                        {/* Locataire */}
                        <TableCell>
                          <span className="text-sm text-gray-700">{res.tenant}</span>
                        </TableCell>

                        {/* Annonce */}
                        <TableCell>
                          <span className="max-w-[180px] truncate text-sm font-medium text-gray-900 block">
                            {res.annonceTitle}
                          </span>
                        </TableCell>

                        {/* Arrivée */}
                        <TableCell>
                          <span className="text-sm text-gray-700">{formatDate(res.checkIn)}</span>
                        </TableCell>

                        {/* Départ */}
                        <TableCell>
                          <span className="text-sm text-gray-700">{formatDate(res.checkOut)}</span>
                        </TableCell>

                        {/* Montant */}
                        <TableCell>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatXOF(res.amount)}
                          </span>
                        </TableCell>

                        {/* Statut */}
                        <TableCell>
                          <StatusBadge status={res.status} config={reservationStatusConfig} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs text-gray-500">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Eye className="size-4 text-[#009CDE]" />
                                <span>Voir les détails</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Edit className="size-4 text-[#003087]" />
                                <span>Modifier</span>
                              </DropdownMenuItem>
                              {res.status === 'pending' && (
                                <DropdownMenuItem className="gap-2 cursor-pointer">
                                  <CalendarDays className="size-4 text-[#00A651]" />
                                  <span>Confirmer</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {(res.status === 'confirmed' || res.status === 'pending') && (
                                <DropdownMenuItem className="gap-2 cursor-pointer text-[#D93025] focus:text-[#D93025]">
                                  <Ban className="size-4" />
                                  <span>Annuler</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="gap-2 cursor-pointer text-[#D93025] focus:text-[#D93025]">
                                <Trash2 className="size-4" />
                                <span>Supprimer</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Pagination
            page={reservationPage}
            totalPages={reservationTotalPages}
            onPageChange={setReservationPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
