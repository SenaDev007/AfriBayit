'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  MapPin,
  Plane,
  Crosshair,
  FileWarning,
  MoreHorizontal,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  ClipboardList,
  AlertTriangle,
  FileCheck,
  Star,
  Filter,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type GeometreStatus = 'actif' | 'en_mission' | 'suspendu' | 'inactif';
type MissionType = 'GPS' | 'Drone' | '3D' | 'Inspection terrain';
type MissionStatus = 'Planifiée' | 'En cours' | 'Terminée' | 'Annulée';

interface Geometre {
  id: string;
  nom: string;
  prenom: string;
  specialite: string;
  pays: string;
  codePays: string;
  licence: string;
  missions: number;
  note: number;
  statut: GeometreStatus;
}

interface Mission {
  id: string;
  propriete: string;
  geometre: string;
  type: MissionType;
  statut: MissionStatus;
  conflits: number;
  date: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const GEOMETRES: Geometre[] = [
  {
    id: 'GEO-001',
    nom: 'Diallo',
    prenom: 'Amadou',
    specialite: 'Topographie foncière',
    pays: 'Guinée',
    codePays: 'GN',
    licence: 'L-GUI-2024-0142',
    missions: 28,
    note: 4.8,
    statut: 'actif',
  },
  {
    id: 'GEO-002',
    nom: 'Koné',
    prenom: 'Fatoumata',
    specialite: 'Levé GPS & SIG',
    pays: 'Côte d\'Ivoire',
    codePays: 'CI',
    licence: 'L-CIV-2024-0087',
    missions: 35,
    note: 4.9,
    statut: 'en_mission',
  },
  {
    id: 'GEO-003',
    nom: 'Okafor',
    prenom: 'Chukwuemeka',
    specialite: 'Photogrammétrie drone',
    pays: 'Nigeria',
    codePays: 'NG',
    licence: 'L-NIG-2024-0315',
    missions: 19,
    note: 4.5,
    statut: 'actif',
  },
  {
    id: 'GEO-004',
    nom: 'Mensah',
    prenom: 'Kofi',
    specialite: 'Arpentage cadastral',
    pays: 'Ghana',
    codePays: 'GH',
    licence: 'L-GHA-2024-0098',
    missions: 42,
    note: 4.7,
    statut: 'actif',
  },
  {
    id: 'GEO-005',
    nom: 'Traoré',
    prenom: 'Seydou',
    specialite: 'Scanning 3D laser',
    pays: 'Mali',
    codePays: 'ML',
    licence: 'L-MLI-2024-0054',
    missions: 15,
    note: 4.3,
    statut: 'suspendu',
  },
  {
    id: 'GEO-006',
    nom: 'Ndiaye',
    prenom: 'Aïssatou',
    specialite: 'Inspection terrain',
    pays: 'Sénégal',
    codePays: 'SN',
    licence: 'L-SEN-2024-0211',
    missions: 31,
    note: 4.6,
    statut: 'en_mission',
  },
  {
    id: 'GEO-007',
    nom: 'Agossou',
    prenom: 'Hervé',
    specialite: 'Géodésie & nivellement',
    pays: 'Bénin',
    codePays: 'BJ',
    licence: 'L-BEN-2024-0076',
    missions: 22,
    note: 4.4,
    statut: 'actif',
  },
  {
    id: 'GEO-008',
    nom: 'Ouédraogo',
    prenom: 'Paul',
    specialite: 'Cartographie numérique',
    pays: 'Burkina Faso',
    codePays: 'BF',
    licence: 'L-BFA-2024-0129',
    missions: 17,
    note: 4.1,
    statut: 'inactif',
  },
  {
    id: 'GEO-009',
    nom: 'Adjo',
    prenom: 'Kodjo',
    specialite: 'Topographie foncière',
    pays: 'Togo',
    codePays: 'TG',
    licence: 'L-TGO-2024-0043',
    missions: 26,
    note: 4.6,
    statut: 'actif',
  },
  {
    id: 'GEO-010',
    nom: 'Keita',
    prenom: 'Mariam',
    specialite: 'Levé GPS & SIG',
    pays: 'Mali',
    codePays: 'ML',
    licence: 'L-MLI-2024-0088',
    missions: 12,
    note: 4.2,
    statut: 'en_mission',
  },
];

const MISSIONS: Mission[] = [
  {
    id: 'MIS-2024-0401',
    propriete: 'Lot 17, Cocody Riviera',
    geometre: 'Koné Fatoumata',
    type: 'GPS',
    statut: 'En cours',
    conflits: 1,
    date: '2024-12-15',
  },
  {
    id: 'MIS-2024-0402',
    propriete: 'Parcelle A-224, Almadies',
    geometre: 'Diallo Amadou',
    type: 'Drone',
    statut: 'Planifiée',
    conflits: 0,
    date: '2024-12-18',
  },
  {
    id: 'MIS-2024-0403',
    propriete: 'Terrain 45, Osu RE',
    geometre: 'Mensah Kofi',
    type: 'Inspection terrain',
    statut: 'Terminée',
    conflits: 2,
    date: '2024-12-10',
  },
  {
    id: 'MIS-2024-0404',
    propriete: 'Villa Les Palmiers, Lomé',
    geometre: 'Adjo Kodjo',
    type: '3D',
    statut: 'En cours',
    conflits: 0,
    date: '2024-12-14',
  },
  {
    id: 'MIS-2024-0405',
    propriete: 'Prop. Doumassè, Cotonou',
    geometre: 'Agossou Hervé',
    type: 'GPS',
    statut: 'Planifiée',
    conflits: 0,
    date: '2024-12-20',
  },
  {
    id: 'MIS-2024-0406',
    propriete: 'Lot 8 Zone Rés., Bamako',
    geometre: 'Keita Mariam',
    type: 'Inspection terrain',
    statut: 'Annulée',
    conflits: 3,
    date: '2024-12-08',
  },
  {
    id: 'MIS-2024-0407',
    propriete: 'Terrain IFAN, Dakar-Fann',
    geometre: 'Ndiaye Aïssatou',
    type: 'Drone',
    statut: 'En cours',
    conflits: 1,
    date: '2024-12-16',
  },
  {
    id: 'MIS-2024-0408',
    propriete: 'Parcelle 339, Victoria Is.',
    geometre: 'Okafor Chukwuemeka',
    type: '3D',
    statut: 'Terminée',
    conflits: 0,
    date: '2024-12-05',
  },
  {
    id: 'MIS-2024-0409',
    propriete: 'Lot 12, Ouagadougou 2000',
    geometre: 'Ouédraogo Paul',
    type: 'GPS',
    statut: 'Planifiée',
    conflits: 0,
    date: '2024-12-22',
  },
  {
    id: 'MIS-2024-0410',
    propriete: 'Prop. Hamdallaye, Conakry',
    geometre: 'Diallo Amadou',
    type: 'Inspection terrain',
    statut: 'En cours',
    conflits: 2,
    date: '2024-12-13',
  },
];

const COUNTRIES = [
  { value: 'ALL', label: 'Tous les pays' },
  { value: 'BJ', label: 'Bénin' },
  { value: 'BF', label: 'Burkina Faso' },
  { value: 'CI', label: 'Côte d\'Ivoire' },
  { value: 'GH', label: 'Ghana' },
  { value: 'GN', label: 'Guinée' },
  { value: 'ML', label: 'Mali' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'SN', label: 'Sénégal' },
  { value: 'TG', label: 'Togo' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GEOMETRE_STATUS_CONFIG: Record<
  GeometreStatus,
  { label: string; color: string; dotColor: string }
> = {
  actif: {
    label: 'Actif',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  en_mission: {
    label: 'En mission',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  suspendu: {
    label: 'Suspendu',
    color: 'bg-red-50 text-red-700 border-red-200',
    dotColor: 'bg-red-500',
  },
  inactif: {
    label: 'Inactif',
    color: 'bg-gray-50 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
  },
};

const MISSION_STATUS_CONFIG: Record<
  MissionStatus,
  { label: string; color: string; dotColor: string }
> = {
  Planifiée: {
    label: 'Planifiée',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
  },
  'En cours': {
    label: 'En cours',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
  Terminée: {
    label: 'Terminée',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
  },
  Annulée: {
    label: 'Annulée',
    color: 'bg-red-50 text-red-600 border-red-200',
    dotColor: 'bg-red-500',
  },
};

const MISSION_TYPE_CONFIG: Record<MissionType, { icon: React.ReactNode; color: string }> = {
  GPS: {
    icon: <Crosshair className="size-3.5" />,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  Drone: {
    icon: <Plane className="size-3.5" />,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  '3D': {
    icon: <MapPin className="size-3.5" />,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  'Inspection terrain': {
    icon: <ShieldCheck className="size-3.5" />,
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

function getInitials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function renderStars(note: number) {
  return (
    <div className="flex items-center gap-1">
      <Star className="size-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-medium text-gray-700">{note.toFixed(1)}</span>
    </div>
  );
}

// ─── Stat Card Component ─────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  borderColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}) {
  return (
    <Card className={cn('py-4 border-t-2', borderColor)}>
      <CardContent className="flex items-center gap-4 px-5">
        <div
          className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-lg',
            iconBg
          )}
        >
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500 truncate">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GeoTrustPage() {
  const [activeTab, setActiveTab] = useState('geometres');
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [geometreStatusFilter, setGeometreStatusFilter] = useState('ALL');
  const [missionStatusFilter, setMissionStatusFilter] = useState('ALL');
  const [missionTypeFilter, setMissionTypeFilter] = useState('ALL');

  // ─── Computed Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const actifs = GEOMETRES.filter(
      (g) => g.statut === 'actif' || g.statut === 'en_mission'
    ).length;
    const enCours = MISSIONS.filter((m) => m.statut === 'En cours').length;
    const conflits = MISSIONS.reduce((sum, m) => sum + m.conflits, 0);
    const validees = MISSIONS.filter((m) => m.statut === 'Terminée').length;
    return { actifs, enCours, conflits, validees };
  }, []);

  // ─── Filtered Data ──────────────────────────────────────────────────────

  const filteredGeometres = useMemo(() => {
    return GEOMETRES.filter((g) => {
      const matchesSearch =
        searchQuery === '' ||
        `${g.prenom} ${g.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.specialite.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.licence.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry =
        countryFilter === 'ALL' || g.codePays === countryFilter;
      const matchesStatus =
        geometreStatusFilter === 'ALL' || g.statut === geometreStatusFilter;
      return matchesSearch && matchesCountry && matchesStatus;
    });
  }, [searchQuery, countryFilter, geometreStatusFilter]);

  const filteredMissions = useMemo(() => {
    return MISSIONS.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.propriete.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.geometre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        missionStatusFilter === 'ALL' || m.statut === missionStatusFilter;
      const matchesType =
        missionTypeFilter === 'ALL' || m.type === missionTypeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, missionStatusFilter, missionTypeFilter]);

  return (
    <div className="space-y-6">
      {/* ─── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[#003087]">
              <ShieldCheck className="size-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              GeoTrust — Géomètres &amp; Inspections
            </h1>
          </div>
          <p className="text-sm text-gray-500 max-w-2xl">
            Supervisez les missions de vérification géolocalisée et la détection de conflits
          </p>
        </div>
        <Button
          className="bg-[#D4AF37] hover:bg-[#C4A030] text-white font-medium shadow-sm shrink-0"
          size="default"
        >
          <Plus className="size-4" />
          Nouvelle mission
        </Button>
      </div>

      {/* ─── Stats Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-5" />}
          label="Géomètres actifs"
          value={stats.actifs}
          iconBg="bg-blue-50"
          iconColor="text-[#009CDE]"
          borderColor="border-t-[#009CDE]"
        />
        <StatCard
          icon={<ClipboardList className="size-5" />}
          label="Missions en cours"
          value={stats.enCours}
          iconBg="bg-amber-50"
          iconColor="text-[#D4AF37]"
          borderColor="border-t-[#D4AF37]"
        />
        <StatCard
          icon={<AlertTriangle className="size-5" />}
          label="Conflits détectés"
          value={stats.conflits}
          iconBg="bg-red-50"
          iconColor="text-[#D93025]"
          borderColor="border-t-[#D93025]"
        />
        <StatCard
          icon={<FileCheck className="size-5" />}
          label="Rapports validés"
          value={stats.validees}
          iconBg="bg-emerald-50"
          iconColor="text-[#00A651]"
          borderColor="border-t-[#00A651]"
        />
      </div>

      {/* ─── Tabs ─────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-gray-100/80 p-1 h-auto">
            <TabsTrigger
              value="geometres"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
            >
              <Users className="size-4 mr-1.5" />
              Géomètres
            </TabsTrigger>
            <TabsTrigger
              value="missions"
              className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2 text-sm font-medium"
            >
              <ClipboardList className="size-4 mr-1.5" />
              Missions &amp; Inspections
            </TabsTrigger>
          </TabsList>

          {/* ─── Search & Filters ──────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                className="pl-9 h-9 w-[200px] bg-white text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="h-9 w-[150px] bg-white text-sm">
                <MapPin className="size-3.5 mr-1 text-gray-400" />
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeTab === 'geometres' && (
              <Select
                value={geometreStatusFilter}
                onValueChange={setGeometreStatusFilter}
              >
                <SelectTrigger className="h-9 w-[140px] bg-white text-sm">
                  <Filter className="size-3.5 mr-1 text-gray-400" />
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="en_mission">En mission</SelectItem>
                  <SelectItem value="suspendu">Suspendu</SelectItem>
                  <SelectItem value="inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            )}

            {activeTab === 'missions' && (
              <>
                <Select
                  value={missionStatusFilter}
                  onValueChange={setMissionStatusFilter}
                >
                  <SelectTrigger className="h-9 w-[140px] bg-white text-sm">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="Planifiée">Planifiée</SelectItem>
                    <SelectItem value="En cours">En cours</SelectItem>
                    <SelectItem value="Terminée">Terminée</SelectItem>
                    <SelectItem value="Annulée">Annulée</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={missionTypeFilter}
                  onValueChange={setMissionTypeFilter}
                >
                  <SelectTrigger className="h-9 w-[140px] bg-white text-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les types</SelectItem>
                    <SelectItem value="GPS">GPS</SelectItem>
                    <SelectItem value="Drone">Drone</SelectItem>
                    <SelectItem value="3D">3D</SelectItem>
                    <SelectItem value="Inspection terrain">
                      Inspection terrain
                    </SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* ─── Géomètres Tab ──────────────────────────────────────────────── */}
        <TabsContent value="geometres" className="mt-4">
          <Card className="py-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Géomètre
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Pays
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Licence
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                        Missions
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Note
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Statut
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGeometres.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-32 text-center text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Search className="size-8 text-gray-300" />
                            <p>Aucun géomètre trouvé</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredGeometres.map((geo) => {
                        const statusCfg = GEOMETRE_STATUS_CONFIG[geo.statut];
                        return (
                          <TableRow key={geo.id} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9 border border-gray-200">
                                  <AvatarFallback className="bg-[#003087]/5 text-[#003087] text-xs font-semibold">
                                    {getInitials(geo.prenom, geo.nom)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">
                                    {geo.prenom} {geo.nom}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {geo.specialite}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-700">
                                {geo.pays}
                              </span>
                            </TableCell>
                            <TableCell>
                              <code className="rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                                {geo.licence}
                              </code>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex size-7 items-center justify-center rounded-full bg-[#003087]/5 text-sm font-semibold text-[#003087]">
                                {geo.missions}
                              </span>
                            </TableCell>
                            <TableCell>{renderStars(geo.note)}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'gap-1.5 font-medium text-xs',
                                  statusCfg.color
                                )}
                              >
                                <span
                                  className={cn(
                                    'size-1.5 rounded-full',
                                    statusCfg.dotColor
                                  )}
                                />
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="size-4" />
                                    Voir le profil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <ClipboardList className="size-4" />
                                    Voir les missions
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <ShieldCheck className="size-4" />
                                    Valider la licence
                                  </DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive">
                                    <FileWarning className="size-4" />
                                    Suspendre
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Pagination ─────────────────────────────────────────────── */}
              <div className="flex items-center justify-between border-t bg-gray-50/50 px-4 py-3">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {filteredGeometres.length}
                  </span>{' '}
                  géomètre{filteredGeometres.length > 1 ? 's' : ''} trouvé
                  {filteredGeometres.length > 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="size-8" disabled>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="size-8 bg-[#003087] hover:bg-[#002a75]"
                  >
                    1
                  </Button>
                  <Button variant="outline" size="icon" className="size-8" disabled>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Missions Tab ───────────────────────────────────────────────── */}
        <TabsContent value="missions" className="mt-4">
          <Card className="py-0 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Mission ID
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Propriété
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Géomètre
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Statut
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                        Conflits
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMissions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-32 text-center text-gray-400"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Search className="size-8 text-gray-300" />
                            <p>Aucune mission trouvée</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMissions.map((mission) => {
                        const statusCfg = MISSION_STATUS_CONFIG[mission.statut];
                        const typeCfg = MISSION_TYPE_CONFIG[mission.type];
                        return (
                          <TableRow key={mission.id} className="group">
                            <TableCell>
                              <code className="rounded bg-[#003087]/5 px-2 py-0.5 text-xs font-mono font-semibold text-[#003087]">
                                {mission.id}
                              </code>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[200px] block">
                                {mission.propriete}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-700">
                                {mission.geometre}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'gap-1 font-medium text-xs',
                                  typeCfg.color
                                )}
                              >
                                {typeCfg.icon}
                                {mission.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'gap-1.5 font-medium text-xs',
                                  statusCfg.color
                                )}
                              >
                                <span
                                  className={cn(
                                    'size-1.5 rounded-full',
                                    statusCfg.dotColor
                                  )}
                                />
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {mission.conflits > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#D93025]/10 px-2 py-0.5 text-xs font-semibold text-[#D93025]">
                                  <FileWarning className="size-3" />
                                  {mission.conflits}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">
                                {formatDate(mission.date)}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="size-4" />
                                    Voir les détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <FileCheck className="size-4" />
                                    Voir le rapport
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <Crosshair className="size-4" />
                                    Relancer l&apos;inspection
                                  </DropdownMenuItem>
                                  <DropdownMenuItem variant="destructive">
                                    <FileWarning className="size-4" />
                                    Annuler la mission
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Pagination ─────────────────────────────────────────────── */}
              <div className="flex items-center justify-between border-t bg-gray-50/50 px-4 py-3">
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">
                    {filteredMissions.length}
                  </span>{' '}
                  mission{filteredMissions.length > 1 ? 's' : ''} trouvé
                  {filteredMissions.length > 1 ? 'es' : 'e'}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="size-8" disabled>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    className="size-8 bg-[#003087] hover:bg-[#002a75]"
                  >
                    1
                  </Button>
                  <Button variant="outline" size="icon" className="size-8" disabled>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
