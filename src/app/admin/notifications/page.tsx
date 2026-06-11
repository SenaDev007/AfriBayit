'use client';

import React, { useState, useMemo } from 'react';
import {
  Bell,
  Send,
  Mail,
  MessageSquare,
  Smartphone,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─── Types ──────────────────────────────────────────────────────────────────

type Canal = 'Push' | 'Email' | 'SMS' | 'WhatsApp';
type Priorite = 'normale' | 'haute' | 'urgente';
type Planification = 'immediate' | 'programmee';
type Statut = 'Envoyée' | 'Planifiée' | 'Échouée';

interface NotificationHistory {
  id: string;
  titre: string;
  canaux: Canal[];
  destinataires: string;
  date: string;
  statut: Statut;
  tauxOuverture: number;
  priorite: Priorite;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: NotificationHistory[] = [
  {
    id: 'NOTIF-001',
    titre: 'Mise à jour des conditions d\'utilisation',
    canaux: ['Push', 'Email'],
    destinataires: 'Tous — 12 450 utilisateurs',
    date: '2026-03-04 14:30',
    statut: 'Envoyée',
    tauxOuverture: 68,
    priorite: 'normale',
  },
  {
    id: 'NOTIF-002',
    titre: 'Nouveau bien disponible à Cotonou',
    canaux: ['Push'],
    destinataires: 'BJ — Agents & Propriétaires',
    date: '2026-03-04 10:15',
    statut: 'Envoyée',
    tauxOuverture: 82,
    priorite: 'haute',
  },
  {
    id: 'NOTIF-003',
    titre: 'Maintenance prévue le 8 mars',
    canaux: ['Email', 'SMS'],
    destinataires: 'Tous — 12 450 utilisateurs',
    date: '2026-03-05 09:00',
    statut: 'Planifiée',
    tauxOuverture: 0,
    priorite: 'urgente',
  },
  {
    id: 'NOTIF-004',
    titre: 'Promotion Artisans : -20% sur les services',
    canaux: ['WhatsApp', 'Push'],
    destinataires: 'Artisans — 1 230 utilisateurs',
    date: '2026-03-03 16:45',
    statut: 'Envoyée',
    tauxOuverture: 54,
    priorite: 'normale',
  },
  {
    id: 'NOTIF-005',
    titre: 'Rappel KYC en attente',
    canaux: ['SMS', 'Email'],
    destinataires: 'CI — Propriétaires non vérifiés',
    date: '2026-03-03 08:00',
    statut: 'Échouée',
    tauxOuverture: 0,
    priorite: 'haute',
  },
  {
    id: 'NOTIF-006',
    titre: 'Nouvelle fonctionnalité : Comparateur de biens',
    canaux: ['Push', 'Email'],
    destinataires: 'Tous — 12 450 utilisateurs',
    date: '2026-03-02 11:30',
    statut: 'Envoyée',
    tauxOuverture: 73,
    priorite: 'normale',
  },
  {
    id: 'NOTIF-007',
    titre: 'Alerte sécurité : Tentative de connexion suspecte',
    canaux: ['SMS'],
    destinataires: 'BF — Admin & Agents',
    date: '2026-03-02 03:22',
    statut: 'Envoyée',
    tauxOuverture: 95,
    priorite: 'urgente',
  },
  {
    id: 'NOTIF-008',
    titre: 'Webinaire Notaire : Cadre juridique FCFA',
    canaux: ['Email', 'WhatsApp'],
    destinataires: 'Notaires — 87 utilisateurs',
    date: '2026-03-06 14:00',
    statut: 'Planifiée',
    tauxOuverture: 0,
    priorite: 'normale',
  },
  {
    id: 'NOTIF-009',
    titre: 'Confirmation Escrow — Transaction #ESC-4521',
    canaux: ['Push', 'SMS', 'Email'],
    destinataires: 'BJ — Acheteur & Vendeur',
    date: '2026-03-01 17:55',
    statut: 'Envoyée',
    tauxOuverture: 89,
    priorite: 'haute',
  },
  {
    id: 'NOTIF-010',
    titre: 'Clôture inscriptions Academy — Module 3',
    canaux: ['Email'],
    destinataires: 'TG — Apprenants',
    date: '2026-03-01 09:00',
    statut: 'Échouée',
    tauxOuverture: 0,
    priorite: 'normale',
  },
];

const CANAL_OPTIONS: { value: Canal; label: string; icon: React.ElementType }[] = [
  { value: 'Push', label: 'Push', icon: Smartphone },
  { value: 'Email', label: 'Email', icon: Mail },
  { value: 'SMS', label: 'SMS', icon: MessageSquare },
  { value: 'WhatsApp', label: 'WhatsApp', icon: MessageSquare },
];

const PAYS_OPTIONS = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

const ROLE_OPTIONS = [
  'Agent',
  'Propriétaire',
  'Artisan',
  'Notaire',
  'Apprenant',
  'Admin',
];

// ─── Canal Badge Helper ─────────────────────────────────────────────────────

function CanalBadge({ canal }: { canal: Canal }) {
  const config: Record<Canal, { bg: string; text: string; icon: React.ElementType }> = {
    Push: { bg: 'bg-[#009CDE]/10', text: 'text-[#009CDE]', icon: Smartphone },
    Email: { bg: 'bg-[#003087]/10', text: 'text-[#003087]', icon: Mail },
    SMS: { bg: 'bg-[#00A651]/10', text: 'text-[#00A651]', icon: MessageSquare },
    WhatsApp: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: MessageSquare },
  };
  const c = config[canal];
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      <Icon className="w-3 h-3" />
      {canal}
    </span>
  );
}

// ─── Statut Badge Helper ────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: Statut }) {
  const config: Record<Statut, { bg: string; text: string; icon: React.ElementType }> = {
    'Envoyée': { bg: 'bg-[#00A651]/10', text: 'text-[#00A651]', icon: CheckCircle },
    'Planifiée': { bg: 'bg-[#009CDE]/10', text: 'text-[#009CDE]', icon: Clock },
    'Échouée': { bg: 'bg-[#D93025]/10', text: 'text-[#D93025]', icon: XCircle },
  };
  const c = config[statut];
  const Icon = c.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', c.bg, c.text)}>
      <Icon className="w-3 h-3" />
      {statut}
    </span>
  );
}

// ─── Priorité Dot Helper ────────────────────────────────────────────────────

function PrioriteDot({ priorite }: { priorite: Priorite }) {
  const colors: Record<Priorite, string> = {
    normale: 'bg-gray-400',
    haute: 'bg-[#D4AF37]',
    urgente: 'bg-[#D93025]',
  };
  return <span className={cn('inline-block w-2 h-2 rounded-full', colors[priorite])} title={priorite} />;
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: 'navy' | 'blue' | 'gold' | 'green' | 'red';
}) {
  const iconBgMap = {
    navy: 'bg-[#003087]/10 text-[#003087]',
    blue: 'bg-[#009CDE]/10 text-[#009CDE]',
    gold: 'bg-[#D4AF37]/10 text-[#D4AF37]',
    green: 'bg-[#00A651]/10 text-[#00A651]',
    red: 'bg-[#D93025]/10 text-[#D93025]',
  };

  return (
    <Card className="rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
            <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
          </div>
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconBgMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function NotificationsPage() {
  // Form state
  const [selectedCanaux, setSelectedCanaux] = useState<Canal[]>(['Push']);
  const [destinataireType, setDestinataireType] = useState<'tous' | 'pays' | 'role'>('tous');
  const [selectedPays, setSelectedPays] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [titre, setTitre] = useState('');
  const [message, setMessage] = useState('');
  const [priorite, setPriorite] = useState<Priorite>('normale');
  const [planification, setPlanification] = useState<Planification>('immediate');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sending, setSending] = useState(false);

  // History filters
  const [filterCanal, setFilterCanal] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState('envoyer');

  // ─── Canal toggle ───────────────────────────────────────────────────────

  const toggleCanal = (canal: Canal) => {
    setSelectedCanaux((prev) =>
      prev.includes(canal) ? prev.filter((c) => c !== canal) : [...prev, canal]
    );
  };

  // ─── Pays toggle ────────────────────────────────────────────────────────

  const togglePays = (code: string) => {
    setSelectedPays((prev) =>
      prev.includes(code) ? prev.filter((p) => p !== code) : [...prev, code]
    );
  };

  // ─── Role toggle ────────────────────────────────────────────────────────

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // ─── Send handler ───────────────────────────────────────────────────────

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setTitre('');
      setMessage('');
      setSelectedCanaux(['Push']);
      setDestinataireType('tous');
      setSelectedPays([]);
      setSelectedRoles([]);
      setPriorite('normale');
      setPlanification('immediate');
      setScheduledDate(undefined);
    }, 1500);
  };

  // ─── Filtered history ───────────────────────────────────────────────────

  const filteredNotifications = useMemo(() => {
    return MOCK_NOTIFICATIONS.filter((n) => {
      // Canal filter
      if (filterCanal !== 'all' && !n.canaux.includes(filterCanal as Canal)) return false;
      // Statut filter
      if (filterStatut !== 'all' && n.statut !== filterStatut) return false;
      // Search filter
      if (filterSearch && !n.titre.toLowerCase().includes(filterSearch.toLowerCase()) && !n.id.toLowerCase().includes(filterSearch.toLowerCase())) return false;
      // Date from filter
      if (filterDateFrom) {
        const notifDate = new Date(n.date);
        if (notifDate < filterDateFrom) return false;
      }
      // Date to filter
      if (filterDateTo) {
        const notifDate = new Date(n.date);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (notifDate > toDate) return false;
      }
      return true;
    });
  }, [filterCanal, filterStatut, filterSearch, filterDateFrom, filterDateTo]);

  // ─── Stats computed ─────────────────────────────────────────────────────

  const sentToday = MOCK_NOTIFICATIONS.filter(
    (n) => n.statut === 'Envoyée' && n.date.startsWith('2026-03-04')
  ).length;

  const avgOpenRate = Math.round(
    MOCK_NOTIFICATIONS.filter((n) => n.tauxOuverture > 0).reduce((a, b) => a + b.tauxOuverture, 0) /
    MOCK_NOTIFICATIONS.filter((n) => n.tauxOuverture > 0).length
  );

  const pushCount = MOCK_NOTIFICATIONS.filter((n) => n.canaux.includes('Push')).length;
  const smsCount = MOCK_NOTIFICATIONS.filter((n) => n.canaux.includes('SMS')).length;

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Navy gradient accent line */}
      <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#003087] to-[#D4AF37]" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#003087]" />
            Centre de Notifications
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Envoyez et gérez les notifications plateforme
          </p>
        </div>
        <Button
          className="bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white font-semibold shadow-sm"
          onClick={() => setActiveTab('envoyer')}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nouvelle notification
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Envoyées aujourd'hui"
          value={sentToday}
          subtitle="Dernières 24h"
          icon={Send}
          color="navy"
        />
        <StatCard
          title="Taux d'ouverture"
          value={`${avgOpenRate}%`}
          subtitle="Moyenne globale"
          icon={Eye}
          color="green"
        />
        <StatCard
          title="Push"
          value={pushCount}
          subtitle="Notifications push"
          icon={Smartphone}
          color="blue"
        />
        <StatCard
          title="SMS"
          value={smsCount}
          subtitle="Messages SMS"
          icon={MessageSquare}
          color="gold"
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-gray-200 shadow-sm">
          <TabsTrigger
            value="envoyer"
            className={cn(
              'data-[state=active]:bg-[#003087] data-[state=active]:text-white data-[state=active]:shadow-sm',
              'px-4'
            )}
          >
            <Send className="w-4 h-4 mr-1.5" />
            Envoyer
          </TabsTrigger>
          <TabsTrigger
            value="historique"
            className={cn(
              'data-[state=active]:bg-[#003087] data-[state=active]:text-white data-[state=active]:shadow-sm',
              'px-4'
            )}
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* ─── Envoyer Tab ──────────────────────────────────────────────── */}
        <TabsContent value="envoyer">
          <Card className="rounded-xl border border-gray-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Canal */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Canal de diffusion</Label>
                    <p className="text-xs text-gray-400">Sélectionnez un ou plusieurs canaux</p>
                    <div className="grid grid-cols-2 gap-3">
                      {CANAL_OPTIONS.map((canal) => {
                        const isSelected = selectedCanaux.includes(canal.value);
                        const Icon = canal.icon;
                        return (
                          <button
                            key={canal.value}
                            type="button"
                            onClick={() => toggleCanal(canal.value)}
                            className={cn(
                              'flex items-center gap-2.5 px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium',
                              isSelected
                                ? 'border-[#003087] bg-[#003087]/5 text-[#003087]'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {canal.label}
                            {isSelected && <CheckCircle className="w-4 h-4 ml-auto text-[#003087]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Destinataires */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Destinataires</Label>
                    <RadioGroup
                      value={destinataireType}
                      onValueChange={(v) => setDestinataireType(v as 'tous' | 'pays' | 'role')}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="tous" id="dest-tous" />
                        <Label htmlFor="dest-tous" className="text-sm font-normal text-gray-700 cursor-pointer">
                          Tous les utilisateurs
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="pays" id="dest-pays" />
                        <Label htmlFor="dest-pays" className="text-sm font-normal text-gray-700 cursor-pointer">
                          Par pays
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="role" id="dest-role" />
                        <Label htmlFor="dest-role" className="text-sm font-normal text-gray-700 cursor-pointer">
                          Par rôle
                        </Label>
                      </div>
                    </RadioGroup>

                    {/* Pays checkboxes */}
                    {destinataireType === 'pays' && (
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        {PAYS_OPTIONS.map((pays) => (
                          <div key={pays.code} className="flex items-center gap-2">
                            <Checkbox
                              id={`pays-${pays.code}`}
                              checked={selectedPays.includes(pays.code)}
                              onCheckedChange={() => togglePays(pays.code)}
                            />
                            <Label htmlFor={`pays-${pays.code}`} className="text-sm font-normal text-gray-700 cursor-pointer">
                              {pays.flag} {pays.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Role checkboxes */}
                    {destinataireType === 'role' && (
                      <div className="ml-6 grid grid-cols-2 gap-2">
                        {ROLE_OPTIONS.map((role) => (
                          <div key={role} className="flex items-center gap-2">
                            <Checkbox
                              id={`role-${role}`}
                              checked={selectedRoles.includes(role)}
                              onCheckedChange={() => toggleRole(role)}
                            />
                            <Label htmlFor={`role-${role}`} className="text-sm font-normal text-gray-700 cursor-pointer">
                              {role}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Titre */}
                  <div className="space-y-2">
                    <Label htmlFor="notif-titre" className="text-sm font-semibold text-gray-700">
                      Titre
                    </Label>
                    <Input
                      id="notif-titre"
                      placeholder="Titre de la notification"
                      value={titre}
                      onChange={(e) => setTitre(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="notif-message" className="text-sm font-semibold text-gray-700">
                      Message
                    </Label>
                    <Textarea
                      id="notif-message"
                      placeholder="Rédigez le contenu de la notification..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="w-full resize-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Priorité */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Priorité</Label>
                    <RadioGroup
                      value={priorite}
                      onValueChange={(v) => setPriorite(v as Priorite)}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="normale" id="prio-normale" />
                        <Label htmlFor="prio-normale" className="text-sm font-normal text-gray-700 cursor-pointer flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gray-400" />
                          Normale
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="haute" id="prio-haute" />
                        <Label htmlFor="prio-haute" className="text-sm font-normal text-gray-700 cursor-pointer flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                          Haute
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="urgente" id="prio-urgente" />
                        <Label htmlFor="prio-urgente" className="text-sm font-normal text-gray-700 cursor-pointer flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#D93025]" />
                          Urgente
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Planification */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700">Planification</Label>
                    <RadioGroup
                      value={planification}
                      onValueChange={(v) => setPlanification(v as Planification)}
                      className="flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="immediate" id="plan-immediate" />
                        <Label htmlFor="plan-immediate" className="text-sm font-normal text-gray-700 cursor-pointer">
                          Immédiate
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="programmee" id="plan-programmee" />
                        <Label htmlFor="plan-programmee" className="text-sm font-normal text-gray-700 cursor-pointer">
                          Programmée
                        </Label>
                      </div>
                    </RadioGroup>

                    {planification === 'programmee' && (
                      <div className="ml-6">
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !scheduledDate && 'text-muted-foreground'
                              )}
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              {scheduledDate
                                ? scheduledDate.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : 'Sélectionner une date'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduledDate}
                              onSelect={(date) => {
                                setScheduledDate(date);
                                setCalendarOpen(false);
                              }}
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* Preview / Summary Card */}
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#003087]" />
                      Aperçu de la notification
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-20">Canal :</span>
                        <div className="flex gap-1.5">
                          {selectedCanaux.length > 0 ? (
                            selectedCanaux.map((c) => <CanalBadge key={c} canal={c} />)
                          ) : (
                            <span className="text-gray-400 italic">Aucun canal sélectionné</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-20">Dest. :</span>
                        <span className="text-gray-700">
                          {destinataireType === 'tous'
                            ? 'Tous les utilisateurs'
                            : destinataireType === 'pays'
                              ? selectedPays.length > 0
                                ? selectedPays.map((p) => PAYS_OPTIONS.find((po) => po.code === p)?.flag + ' ' + p).join(', ')
                                : 'Aucun pays sélectionné'
                              : selectedRoles.length > 0
                                ? selectedRoles.join(', ')
                                : 'Aucun rôle sélectionné'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-20">Priorité :</span>
                        <span className="flex items-center gap-1.5 text-gray-700">
                          <PrioriteDot priorite={priorite} />
                          {priorite.charAt(0).toUpperCase() + priorite.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-20">Envoi :</span>
                        <span className="text-gray-700">
                          {planification === 'immediate'
                            ? 'Immédiat'
                            : scheduledDate
                              ? scheduledDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                              : 'Date non définie'}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <p className="font-semibold text-gray-800">{titre || 'Sans titre'}</p>
                        <p className="text-gray-500 mt-1 text-xs line-clamp-3">{message || 'Aucun message'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Send Button */}
                  <Button
                    className="w-full bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-white font-semibold shadow-sm h-11 text-sm"
                    onClick={handleSend}
                    disabled={sending || !titre || !message || selectedCanaux.length === 0}
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Envoi en cours...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        {planification === 'immediate' ? 'Envoyer maintenant' : 'Programmer l\'envoi'}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Historique Tab ───────────────────────────────────────────── */}
        <TabsContent value="historique">
          {/* Filters Bar */}
          <Card className="rounded-xl border border-gray-200 mb-4">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filtres</span>
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par titre ou ID..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                {/* Canal filter */}
                <Select value={filterCanal} onValueChange={setFilterCanal}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les canaux</SelectItem>
                    <SelectItem value="Push">Push</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>

                {/* Statut filter */}
                <Select value={filterStatut} onValueChange={setFilterStatut}>
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="Envoyée">Envoyée</SelectItem>
                    <SelectItem value="Planifiée">Planifiée</SelectItem>
                    <SelectItem value="Échouée">Échouée</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date from */}
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 text-xs font-normal">
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      {filterDateFrom
                        ? filterDateFrom.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                        : 'Du'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateFrom}
                      onSelect={(date) => {
                        setFilterDateFrom(date);
                        setDateFromOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* Date to */}
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-9 text-xs font-normal">
                      <Clock className="mr-1.5 h-3.5 w-3.5" />
                      {filterDateTo
                        ? filterDateTo.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                        : 'Au'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateTo}
                      onSelect={(date) => {
                        setFilterDateTo(date);
                        setDateToOpen(false);
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* Clear filters */}
                {(filterCanal !== 'all' || filterStatut !== 'all' || filterSearch || filterDateFrom || filterDateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs text-gray-500 hover:text-[#D93025]"
                    onClick={() => {
                      setFilterCanal('all');
                      setFilterStatut('all');
                      setFilterSearch('');
                      setFilterDateFrom(undefined);
                      setFilterDateTo(undefined);
                    }}
                  >
                    Réinitialiser
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{filteredNotifications.length}</span>{' '}
              notification{filteredNotifications.length !== 1 ? 's' : ''} trouvée{filteredNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Table */}
          <Card className="rounded-xl border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Titre</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Canal</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Destinataires</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Taux ouverture</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Aucune notification trouvée</p>
                      <p className="text-xs mt-1">Modifiez vos filtres pour voir plus de résultats</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNotifications.map((notif) => (
                    <TableRow key={notif.id} className="group hover:bg-[#003087]/[0.02]">
                      <TableCell className="font-mono text-xs text-gray-500">{notif.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PrioriteDot priorite={notif.priorite} />
                          <span className="text-sm font-medium text-gray-800 max-w-[200px] truncate">
                            {notif.titre}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {notif.canaux.map((c) => (
                            <CanalBadge key={c} canal={c} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[180px] truncate">
                        {notif.destinataires}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(notif.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <StatutBadge statut={notif.statut} />
                      </TableCell>
                      <TableCell>
                        {notif.tauxOuverture > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  notif.tauxOuverture >= 70
                                    ? 'bg-[#00A651]'
                                    : notif.tauxOuverture >= 40
                                      ? 'bg-[#D4AF37]'
                                      : 'bg-[#D93025]'
                                )}
                                style={{ width: `${notif.tauxOuverture}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{notif.tauxOuverture}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-xs">
                              <Eye className="w-3.5 h-3.5 mr-2" />
                              Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs">
                              <Send className="w-3.5 h-3.5 mr-2" />
                              Renvoyer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-[#D93025] focus:text-[#D93025]">
                              <XCircle className="w-3.5 h-3.5 mr-2" />
                              Annuler
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {/* Summary Footer */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-[#00A651]" />
                {MOCK_NOTIFICATIONS.filter((n) => n.statut === 'Envoyée').length} envoyées
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#009CDE]" />
                {MOCK_NOTIFICATIONS.filter((n) => n.statut === 'Planifiée').length} planifiées
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-[#D93025]" />
                {MOCK_NOTIFICATIONS.filter((n) => n.statut === 'Échouée').length} échouées
              </span>
            </div>
            <p>Dernière mise à jour : 4 mars 2026, 14:45</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
