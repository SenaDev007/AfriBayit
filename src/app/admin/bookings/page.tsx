'use client';

import React, { useState, useMemo } from 'react';
import {
  Hotel,
  Home,
  CalendarDays,
  Search,
  Plus,
  Users,
  DollarSign,
  TrendingDown,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Edit,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ───────────────────────────────────────────────────────────────────

type BookingStatus =
  | 'Confirmée'
  | 'En attente'
  | 'Check-in'
  | 'Check-out'
  | 'Annulée'
  | 'No-show';

type BookingType = 'hotels' | 'guesthouses' | 'shortterm';

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  establishment: string;
  dateArrival: string;
  dateDeparture: string;
  roomType: string;
  amount: number;
  currency: string;
  status: BookingStatus;
  country: string;
}

// ─── Status Badge Config ─────────────────────────────────────────────────────

const statusConfig: Record<
  BookingStatus,
  { bg: string; text: string; border: string }
> = {
  Confirmée: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  'En attente': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  'Check-in': {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
  'Check-out': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
  },
  Annulée: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  'No-show': {
    bg: 'bg-gray-50',
    text: 'text-gray-600',
    border: 'border-gray-200',
  },
};

// ─── Mock Data ───────────────────────────────────────────────────────────────

const hotelBookings: Booking[] = [
  {
    id: 'HOT-2024-001',
    clientName: 'Amadou Diallo',
    clientEmail: 'amadou.diallo@email.com',
    establishment: 'Hôtel Palm Beach Cotonou',
    dateArrival: '2024-12-15',
    dateDeparture: '2024-12-20',
    roomType: 'Suite Junior',
    amount: 275000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Bénin',
  },
  {
    id: 'HOT-2024-002',
    clientName: 'Fatou Ouattara',
    clientEmail: 'fatou.ouattara@email.com',
    establishment: 'Hôtel Ivoire Abidjan',
    dateArrival: '2024-12-18',
    dateDeparture: '2024-12-22',
    roomType: 'Chambre Deluxe',
    amount: 420000,
    currency: 'FCFA',
    status: 'En attente',
    country: "Côte d'Ivoire",
  },
  {
    id: 'HOT-2024-003',
    clientName: 'Kofi Mensah',
    clientEmail: 'kofi.mensah@email.com',
    establishment: 'Kempinski Gold Coast Accra',
    dateArrival: '2024-12-10',
    dateDeparture: '2024-12-14',
    roomType: 'Suite Présidentielle',
    amount: 1850000,
    currency: 'FCFA',
    status: 'Check-in',
    country: 'Ghana',
  },
  {
    id: 'HOT-2024-004',
    clientName: 'Mariama Sow',
    clientEmail: 'mariama.sow@email.com',
    establishment: 'Terrou-Bi Hôtel Dakar',
    dateArrival: '2024-12-05',
    dateDeparture: '2024-12-08',
    roomType: 'Chambre Standard',
    amount: 195000,
    currency: 'FCFA',
    status: 'Check-out',
    country: 'Sénégal',
  },
  {
    id: 'HOT-2024-005',
    clientName: 'Ibrahim Traoré',
    clientEmail: 'ibrahim.traore@email.com',
    establishment: 'Hôtel Silmandé Ouagadougou',
    dateArrival: '2024-12-01',
    dateDeparture: '2024-12-03',
    roomType: 'Chambre Supérieure',
    amount: 150000,
    currency: 'FCFA',
    status: 'Annulée',
    country: 'Burkina Faso',
  },
  {
    id: 'HOT-2024-006',
    clientName: 'Aïcha Bello',
    clientEmail: 'aicha.bello@email.com',
    establishment: 'Hôtel Palm Beach Cotonou',
    dateArrival: '2024-12-20',
    dateDeparture: '2024-12-25',
    roomType: 'Chambre Double',
    amount: 310000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Bénin',
  },
  {
    id: 'HOT-2024-007',
    clientName: 'Yao Koffi',
    clientEmail: 'yao.koffi@email.com',
    establishment: 'Hôtel Ivoire Abidjan',
    dateArrival: '2024-12-22',
    dateDeparture: '2024-12-24',
    roomType: 'Suite Junior',
    amount: 350000,
    currency: 'FCFA',
    status: 'En attente',
    country: "Côte d'Ivoire",
  },
  {
    id: 'HOT-2024-008',
    clientName: 'Aminata Keïta',
    clientEmail: 'aminata.keita@email.com',
    establishment: 'Kempinski Gold Coast Accra',
    dateArrival: '2024-12-12',
    dateDeparture: '2024-12-15',
    roomType: 'Chambre Deluxe',
    amount: 620000,
    currency: 'FCFA',
    status: 'No-show',
    country: 'Ghana',
  },
  {
    id: 'HOT-2024-009',
    clientName: 'Ousmane Ndiaye',
    clientEmail: 'ousmane.ndiaye@email.com',
    establishment: 'Terrou-Bi Hôtel Dakar',
    dateArrival: '2024-12-25',
    dateDeparture: '2024-12-30',
    roomType: 'Suite Présidentielle',
    amount: 975000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Sénégal',
  },
  {
    id: 'HOT-2024-010',
    clientName: 'Adèle Houénou',
    clientEmail: 'adele.houenou@email.com',
    establishment: 'Hôtel Silmandé Ouagadougou',
    dateArrival: '2024-12-08',
    dateDeparture: '2024-12-10',
    roomType: 'Chambre Standard',
    amount: 110000,
    currency: 'FCFA',
    status: 'Check-in',
    country: 'Burkina Faso',
  },
];

const guesthouseBookings: Booking[] = [
  {
    id: 'GH-2024-001',
    clientName: 'Patrice Lumumba',
    clientEmail: 'patrice.lumumba@email.com',
    establishment: 'Maison d\'Hôte Les Baobabs',
    dateArrival: '2024-12-16',
    dateDeparture: '2024-12-19',
    roomType: 'Chambre Familiale',
    amount: 135000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Bénin',
  },
  {
    id: 'GH-2024-002',
    clientName: 'Sylvie Koné',
    clientEmail: 'sylvie.kone@email.com',
    establishment: 'Résidence Le Hibou Lomé',
    dateArrival: '2024-12-18',
    dateDeparture: '2024-12-21',
    roomType: 'Studio Meublé',
    amount: 95000,
    currency: 'FCFA',
    status: 'En attente',
    country: 'Togo',
  },
  {
    id: 'GH-2024-003',
    clientName: 'Emmanuel Asante',
    clientEmail: 'emmanuel.asante@email.com',
    establishment: 'Guesthouse Cocody Accra',
    dateArrival: '2024-12-11',
    dateDeparture: '2024-12-14',
    roomType: 'Chambre Double',
    amount: 120000,
    currency: 'FCFA',
    status: 'Check-in',
    country: 'Ghana',
  },
  {
    id: 'GH-2024-004',
    clientName: 'Rokia Bah',
    clientEmail: 'rokia.bah@email.com',
    establishment: 'Villa Soleil Dakar',
    dateArrival: '2024-12-06',
    dateDeparture: '2024-12-09',
    roomType: 'Suite',
    amount: 180000,
    currency: 'FCFA',
    status: 'Check-out',
    country: 'Sénégal',
  },
  {
    id: 'GH-2024-005',
    clientName: 'Moussa Sanogo',
    clientEmail: 'moussa.sanogo@email.com',
    establishment: 'Maison d\'Hôte Les Baobabs',
    dateArrival: '2024-12-02',
    dateDeparture: '2024-12-04',
    roomType: 'Chambre Simple',
    amount: 55000,
    currency: 'FCFA',
    status: 'Annulée',
    country: 'Bénin',
  },
  {
    id: 'GH-2024-006',
    clientName: 'Charlotte Adjo',
    clientEmail: 'charlotte.adjo@email.com',
    establishment: 'Résidence Le Hibou Lomé',
    dateArrival: '2024-12-20',
    dateDeparture: '2024-12-23',
    roomType: 'Chambre Double',
    amount: 105000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Togo',
  },
  {
    id: 'GH-2024-007',
    clientName: 'Komlan Dodzi',
    clientEmail: 'komlan.dodzi@email.com',
    establishment: 'Guesthouse Cocody Accra',
    dateArrival: '2024-12-14',
    dateDeparture: '2024-12-17',
    roomType: 'Studio Meublé',
    amount: 88000,
    currency: 'FCFA',
    status: 'No-show',
    country: 'Ghana',
  },
  {
    id: 'GH-2024-008',
    clientName: 'Awa Diop',
    clientEmail: 'awa.diop@email.com',
    establishment: 'Villa Soleil Dakar',
    dateArrival: '2024-12-22',
    dateDeparture: '2024-12-26',
    roomType: 'Chambre Familiale',
    amount: 165000,
    currency: 'FCFA',
    status: 'En attente',
    country: 'Sénégal',
  },
];

const shortTermBookings: Booking[] = [
  {
    id: 'STR-2024-001',
    clientName: 'Jean-Pierre Akakpo',
    clientEmail: 'jp.akakpo@email.com',
    establishment: 'Appartement F3 Cotonou Ganhi',
    dateArrival: '2024-12-14',
    dateDeparture: '2024-12-21',
    roomType: 'Appartement entier',
    amount: 210000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Bénin',
  },
  {
    id: 'STR-2024-002',
    clientName: 'Céline Aka',
    clientEmail: 'celine.aka@email.com',
    establishment: 'Studio Cocody Riviera Abidjan',
    dateArrival: '2024-12-17',
    dateDeparture: '2024-12-24',
    roomType: 'Studio entier',
    amount: 175000,
    currency: 'FCFA',
    status: 'Check-in',
    country: "Côte d'Ivoire",
  },
  {
    id: 'STR-2024-003',
    clientName: 'David Osei',
    clientEmail: 'david.osei@email.com',
    establishment: 'Loft East Legon Accra',
    dateArrival: '2024-12-09',
    dateDeparture: '2024-12-16',
    roomType: 'Loft entier',
    amount: 340000,
    currency: 'FCFA',
    status: 'Check-out',
    country: 'Ghana',
  },
  {
    id: 'STR-2024-004',
    clientName: 'Nafissatou Issaka',
    clientEmail: 'nafissatou.issaka@email.com',
    establishment: 'Villa Médina Ouagadougou',
    dateArrival: '2024-12-03',
    dateDeparture: '2024-12-07',
    roomType: 'Villa entière',
    amount: 285000,
    currency: 'FCFA',
    status: 'Annulée',
    country: 'Burkina Faso',
  },
  {
    id: 'STR-2024-005',
    clientName: 'Essivi Agbo',
    clientEmail: 'essivi.agbo@email.com',
    establishment: 'Appartement F2 Lomé Tokoin',
    dateArrival: '2024-12-19',
    dateDeparture: '2024-12-26',
    roomType: 'Appartement entier',
    amount: 130000,
    currency: 'FCFA',
    status: 'En attente',
    country: 'Togo',
  },
  {
    id: 'STR-2024-006',
    clientName: 'Babacar Fall',
    clientEmail: 'babacar.fall@email.com',
    establishment: 'Penthouse Almadies Dakar',
    dateArrival: '2024-12-21',
    dateDeparture: '2024-12-28',
    roomType: 'Penthouse entier',
    amount: 520000,
    currency: 'FCFA',
    status: 'Confirmée',
    country: 'Sénégal',
  },
  {
    id: 'STR-2024-007',
    clientName: 'Grâce Adéwusi',
    clientEmail: 'grace.adewusi@email.com',
    establishment: 'Studio Cocody Riviera Abidjan',
    dateArrival: '2024-12-24',
    dateDeparture: '2024-12-31',
    roomType: 'Studio entier',
    amount: 190000,
    currency: 'FCFA',
    status: 'En attente',
    country: "Côte d'Ivoire",
  },
  {
    id: 'STR-2024-008',
    clientName: 'Rachidou Barro',
    clientEmail: 'rachidou.barro@email.com',
    establishment: 'Appartement F3 Cotonou Ganhi',
    dateArrival: '2024-12-01',
    dateDeparture: '2024-12-05',
    roomType: 'Appartement entier',
    amount: 145000,
    currency: 'FCFA',
    status: 'No-show',
    country: 'Bénin',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const allBookingsMap: Record<BookingType, Booking[]> = {
  hotels: hotelBookings,
  guesthouses: guesthouseBookings,
  shortterm: shortTermBookings,
};

const countries = [
  'Tous les pays',
  'Bénin',
  'Togo',
  'Ghana',
  "Côte d'Ivoire",
  'Sénégal',
  'Burkina Faso',
];

const statuses: BookingStatus[] = [
  'Confirmée',
  'En attente',
  'Check-in',
  'Check-out',
  'Annulée',
  'No-show',
];

const dateRanges = [
  'Toutes les dates',
  "Aujourd'hui",
  'Cette semaine',
  'Ce mois',
  'Ce trimestre',
  'Cette année',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

// ─── Status Badge Component ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        config.bg,
        config.text,
        config.border
      )}
    >
      {status}
    </span>
  );
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  subLabel,
  accentColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subLabel?: string;
  accentColor: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              accentColor
            )}
          >
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight text-[#003087]">
              {value}
            </p>
            {subLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">{subLabel}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Tab Stats Card ─────────────────────────────────────────────────────────

function TabStats({ bookings }: { bookings: Booking[] }) {
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === 'Confirmée').length;
  const pending = bookings.filter((b) => b.status === 'En attente').length;
  const checkedIn = bookings.filter((b) => b.status === 'Check-in').length;
  const checkedOut = bookings.filter((b) => b.status === 'Check-out').length;
  const cancelled = bookings.filter((b) => b.status === 'Annulée').length;
  const noShow = bookings.filter((b) => b.status === 'No-show').length;
  const totalRevenue = bookings
    .filter((b) => b.status !== 'Annulée' && b.status !== 'No-show')
    .reduce((sum, b) => sum + b.amount, 0);
  const cancellationRate =
    total > 0 ? ((cancelled / total) * 100).toFixed(1) : '0';

  const items = [
    { label: 'Total', value: total, color: 'text-[#003087]' },
    { label: 'Confirmées', value: confirmed, color: 'text-emerald-600' },
    { label: 'En attente', value: pending, color: 'text-amber-600' },
    { label: 'Check-in', value: checkedIn, color: 'text-sky-600' },
    { label: 'Check-out', value: checkedOut, color: 'text-violet-600' },
    { label: 'Annulées', value: cancelled, color: 'text-red-600' },
    { label: 'No-show', value: noShow, color: 'text-gray-500' },
    {
      label: 'Revenus',
      value: formatCurrency(totalRevenue),
      color: 'text-[#00A651]',
    },
    {
      label: 'Taux annulation',
      value: cancellationRate + '%',
      color: 'text-[#D93025]',
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border bg-white px-3 py-2.5 text-center shadow-sm"
        >
          <p className="text-[11px] text-muted-foreground leading-tight">{item.label}</p>
          <p className={cn('text-sm font-bold mt-0.5', item.color)}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ─── Booking Table Component ────────────────────────────────────────────────

function BookingTable({
  bookings,
  currentPage,
  onPageChange,
}: {
  bookings: Booking[];
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(bookings.length / perPage));
  const paginatedBookings = bookings.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  return (
    <div>
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#003087]/[0.03] hover:bg-[#003087]/[0.03]">
              <TableHead className="text-xs font-semibold text-[#003087]">
                ID Réservation
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087]">
                Client
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087]">
                Établissement
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087]">
                Dates
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087]">
                Chambre / Type
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087]">
                Montant
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087]">
                Statut
              </TableHead>
              <TableHead className="text-xs font-semibold text-[#003087] text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  Aucune réservation trouvée.
                </TableCell>
              </TableRow>
            ) : (
              paginatedBookings.map((booking) => (
                <TableRow key={booking.id} className="group">
                  <TableCell className="font-mono text-xs font-medium text-[#009CDE]">
                    {booking.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {booking.clientName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.clientEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm max-w-[180px] truncate">
                    {booking.establishment}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">
                          {formatDate(booking.dateArrival)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          → {formatDate(booking.dateDeparture)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{booking.roomType}</TableCell>
                  <TableCell className="text-sm font-semibold text-[#003087] whitespace-nowrap">
                    {formatCurrency(booking.amount)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="gap-2 cursor-pointer">
                          <Eye className="h-4 w-4 text-[#009CDE]" />
                          <span>Voir détails</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {booking.status === 'En attente' && (
                          <DropdownMenuItem className="gap-2 cursor-pointer">
                            <Check className="h-4 w-4 text-[#00A651]" />
                            <span>Confirmer</span>
                          </DropdownMenuItem>
                        )}
                        {booking.status !== 'Annulée' &&
                          booking.status !== 'Check-out' &&
                          booking.status !== 'No-show' && (
                            <DropdownMenuItem className="gap-2 cursor-pointer">
                              <Edit className="h-4 w-4 text-[#D4AF37]" />
                              <span>Modifier</span>
                            </DropdownMenuItem>
                          )}
                        {booking.status !== 'Annulée' &&
                          booking.status !== 'Check-out' &&
                          booking.status !== 'No-show' && (
                            <DropdownMenuItem className="gap-2 cursor-pointer text-[#D93025] focus:text-[#D93025]">
                              <X className="h-4 w-4" />
                              <span>Annuler</span>
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 px-1">
        <p className="text-sm text-muted-foreground">
          {(currentPage - 1) * perPage + 1}
          {'–'}
          {Math.min(currentPage * perPage, bookings.length)} sur{' '}
          {bookings.length} réservations
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="icon"
              className={cn(
                'h-8 w-8',
                page === currentPage &&
                  'bg-[#003087] hover:bg-[#003087]/90 text-white'
              )}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState<BookingType>('hotels');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('Tous les pays');
  const [statusFilter, setStatusFilter] = useState('Tous les statuts');
  const [dateRangeFilter, setDateRangeFilter] = useState('Toutes les dates');
  const [pages, setPages] = useState<Record<BookingType, number>>({
    hotels: 1,
    guesthouses: 1,
    shortterm: 1,
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value as BookingType);
    setSearchQuery('');
    setCountryFilter('Tous les pays');
    setStatusFilter('Tous les statuts');
    setDateRangeFilter('Toutes les dates');
  };

  const handlePageChange = (page: number) => {
    setPages((prev) => ({ ...prev, [activeTab]: page }));
  };

  const filteredBookings = useMemo(() => {
    let data = allBookingsMap[activeTab];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.clientName.toLowerCase().includes(q) ||
          b.clientEmail.toLowerCase().includes(q) ||
          b.establishment.toLowerCase().includes(q)
      );
    }

    if (countryFilter !== 'Tous les pays') {
      data = data.filter((b) => b.country === countryFilter);
    }

    if (statusFilter !== 'Tous les statuts') {
      data = data.filter((b) => b.status === statusFilter);
    }

    return data;
  }, [activeTab, searchQuery, countryFilter, statusFilter]);

  // Global stats
  const allData = [
    ...hotelBookings,
    ...guesthouseBookings,
    ...shortTermBookings,
  ];
  const totalBookings = allData.length;
  const activeBookings = allData.filter(
    (b) =>
      b.status === 'Confirmée' ||
      b.status === 'En attente' ||
      b.status === 'Check-in'
  ).length;
  const monthlyRevenue = allData
    .filter((b) => b.status !== 'Annulée' && b.status !== 'No-show')
    .reduce((sum, b) => sum + b.amount, 0);
  const cancelledBookings = allData.filter((b) => b.status === 'Annulée').length;
  const cancellationRate = ((cancelledBookings / totalBookings) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003087] tracking-tight">
            Gestion des Réservations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hôtels, guesthouses et locations courte durée
          </p>
        </div>
        <Button
          className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white font-semibold shadow-sm gap-2"
          size="default"
        >
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </Button>
      </div>

      {/* ─── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Réservations totales"
          value={totalBookings.toString()}
          subLabel={`${activeBookings} en cours`}
          accentColor="bg-[#003087]"
        />
        <StatCard
          icon={Users}
          label="En cours"
          value={activeBookings.toString()}
          subLabel="Confirmées, en attente & check-in"
          accentColor="bg-[#009CDE]"
        />
        <StatCard
          icon={DollarSign}
          label="Revenus du mois"
          value={formatCurrency(monthlyRevenue)}
          subLabel="Hors annulées & no-show"
          accentColor="bg-[#00A651]"
        />
        <StatCard
          icon={TrendingDown}
          label="Taux d'annulation"
          value={cancellationRate + '%'}
          subLabel={`${cancelledBookings} annulées sur ${totalBookings}`}
          accentColor="bg-[#D93025]"
        />
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-5"
      >
        <TabsList className="bg-white border shadow-sm h-auto p-1 rounded-lg">
          <TabsTrigger
            value="hotels"
            className="gap-2 data-[state=active]:bg-[#003087] data-[state=active]:text-white rounded-md px-4 py-2 text-sm"
          >
            <Hotel className="h-4 w-4" />
            Hôtels
          </TabsTrigger>
          <TabsTrigger
            value="guesthouses"
            className="gap-2 data-[state=active]:bg-[#003087] data-[state=active]:text-white rounded-md px-4 py-2 text-sm"
          >
            <Home className="h-4 w-4" />
            Guesthouses
          </TabsTrigger>
          <TabsTrigger
            value="shortterm"
            className="gap-2 data-[state=active]:bg-[#003087] data-[state=active]:text-white rounded-md px-4 py-2 text-sm"
          >
            <CalendarDays className="h-4 w-4" />
            Locations courte durée
          </TabsTrigger>
        </TabsList>

        {(['hotels', 'guesthouses', 'shortterm'] as BookingType[]).map(
          (tabKey) => (
            <TabsContent key={tabKey} value={tabKey} className="space-y-5">
              {/* Tab Stats */}
              <TabStats bookings={allBookingsMap[tabKey]} />

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par ID, client, établissement..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPages((prev) => ({ ...prev, [activeTab]: 1 }));
                    }}
                    className="pl-9 h-9 bg-white"
                  />
                </div>

                <Select
                  value={countryFilter}
                  onValueChange={(val) => {
                    setCountryFilter(val);
                    setPages((prev) => ({ ...prev, [activeTab]: 1 }));
                  }}
                >
                  <SelectTrigger className="w-[160px] bg-white h-9">
                    <SelectValue placeholder="Pays" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={dateRangeFilter}
                  onValueChange={setDateRangeFilter}
                >
                  <SelectTrigger className="w-[170px] bg-white h-9">
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRanges.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPages((prev) => ({ ...prev, [activeTab]: 1 }));
                  }}
                >
                  <SelectTrigger className="w-[170px] bg-white h-9">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tous les statuts">
                      Tous les statuts
                    </SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <BookingTable
                bookings={filteredBookings}
                currentPage={pages[tabKey]}
                onPageChange={handlePageChange}
              />
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
