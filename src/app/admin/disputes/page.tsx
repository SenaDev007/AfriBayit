'use client';

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Scale,
  FileText,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  ArrowRight,
  MessageSquare,
  Shield,
  Upload,
  ChevronLeft,
  ChevronRight,
  Gavel,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// ─── Types ───────────────────────────────────────────────────────────────────

type DisputeType = 'Immobilier' | 'Location courte durée' | 'Artisan' | 'Hôtel' | 'GeoTrust';
type DisputeStatus = 'OUVERT' | 'PREUVES_COLLECTEES' | 'MEDIATION' | 'ARBITRAGE' | 'RESOLU' | 'REMBOURSE';
type Priority = 'Haute' | 'Moyenne' | 'Basse';

interface Evidence {
  id: string;
  name: string;
  type: 'photo' | 'document';
  uploadedBy: 'acheteur' | 'vendeur';
  uploadedAt: string;
}

interface ConversationMessage {
  id: string;
  sender: 'acheteur' | 'vendeur' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
}

interface Dispute {
  id: string;
  transactionId: string;
  amount: number;
  type: DisputeType;
  status: DisputeStatus;
  priority: Priority;
  reason: string;
  description: string;
  acheteur: { name: string; initials: string };
  vendeur: { name: string; initials: string };
  openedAt: string;
  evidenceCount: number;
  lastEvidenceDate: string;
  evidence: Evidence[];
  conversation: ConversationMessage[];
  country: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DISPUTE_TYPES: DisputeType[] = ['Immobilier', 'Location courte durée', 'Artisan', 'Hôtel', 'GeoTrust'];
const DISPUTE_STATUSES: DisputeStatus[] = ['OUVERT', 'PREUVES_COLLECTEES', 'MEDIATION', 'ARBITRAGE', 'RESOLU', 'REMBOURSE'];
const PRIORITIES: Priority[] = ['Haute', 'Moyenne', 'Basse'];

const STATUS_LABELS: Record<DisputeStatus, string> = {
  OUVERT: 'Ouvert',
  PREUVES_COLLECTEES: 'Preuves collectées',
  MEDIATION: 'Médiation',
  ARBITRAGE: 'Arbitrage',
  RESOLU: 'Résolu',
  REMBOURSE: 'Remboursé',
};

const STATUS_STEPS: DisputeStatus[] = ['OUVERT', 'PREUVES_COLLECTEES', 'MEDIATION', 'ARBITRAGE', 'RESOLU'];

const COUNTRY_FLAGS: Record<string, string> = { BJ: '🇧🇯', CI: '🇨🇮', BF: '🇧🇫', TG: '🇹🇬' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatXOF(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' XOF';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function daysSince(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getStatusStepIndex(status: DisputeStatus): number {
  if (status === 'REMBOURSE') return 4;
  return STATUS_STEPS.indexOf(status);
}

function getStatusColor(status: DisputeStatus): string {
  switch (status) {
    case 'OUVERT': return 'bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20';
    case 'PREUVES_COLLECTEES': return 'bg-[#D4AF37]/10 text-[#B8960E] border-[#D4AF37]/20';
    case 'MEDIATION': return 'bg-[#009CDE]/10 text-[#0077A8] border-[#009CDE]/20';
    case 'ARBITRAGE': return 'bg-[#003087]/10 text-[#003087] border-[#003087]/20';
    case 'RESOLU': return 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20';
    case 'REMBOURSE': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

function getPriorityConfig(priority: Priority) {
  switch (priority) {
    case 'Haute': return { color: 'bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20', dot: 'bg-[#D93025]' };
    case 'Moyenne': return { color: 'bg-[#D4AF37]/10 text-[#B8960E] border-[#D4AF37]/20', dot: 'bg-[#D4AF37]' };
    case 'Basse': return { color: 'bg-[#009CDE]/10 text-[#0077A8] border-[#009CDE]/20', dot: 'bg-[#009CDE]' };
  }
}

function getTypeIcon(type: DisputeType) {
  switch (type) {
    case 'Immobilier': return '🏠';
    case 'Location courte durée': return '🛏️';
    case 'Artisan': return '🔧';
    case 'Hôtel': return '🏨';
    case 'GeoTrust': return '🛡️';
  }
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_DISPUTES: Dispute[] = [
  {
    id: 'DIS-001',
    transactionId: 'TX-2024-0847',
    amount: 4500000,
    type: 'Immobilier',
    status: 'MEDIATION',
    priority: 'Haute',
    reason: 'Vice de construction - fissures structurelles',
    description: 'L\'acheteur signale des fissures importantes apparues sur les murs porteurs 3 semaines après la prise de possession. L\'expert géotechnique confirme un défaut de fondation. Le vendeur conteste la date d\'apparition des fissures.',
    acheteur: { name: 'Amadou Diallo', initials: 'AD' },
    vendeur: { name: 'Promo Bati SARL', initials: 'PB' },
    openedAt: '2026-05-15T09:30:00Z',
    evidenceCount: 7,
    lastEvidenceDate: '2026-06-08T14:22:00Z',
    country: 'BJ',
    evidence: [
      { id: 'EV-1', name: 'photo_fissures_1.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-16T10:00:00Z' },
      { id: 'EV-2', name: 'rapport_geotechnique.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-20T11:30:00Z' },
      { id: 'EV-3', name: 'photo_fissures_2.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-16T10:05:00Z' },
      { id: 'EV-4', name: 'contrat_vente.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-05-22T09:00:00Z' },
      { id: 'EV-5', name: 'certificat_conformite.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-05-22T09:15:00Z' },
      { id: 'EV-6', name: 'photo_etat_initial.jpg', type: 'photo', uploadedBy: 'vendeur', uploadedAt: '2026-05-25T16:00:00Z' },
      { id: 'EV-7', name: 'devis_reparation.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-08T14:22:00Z' },
    ],
    conversation: [
      { id: 'MSG-1', sender: 'acheteur', senderName: 'Amadou Diallo', message: 'Des fissures sont apparues sur les murs porteurs de la maison que j\'ai achetée. C\'est inacceptable pour un bien neuf.', timestamp: '2026-05-15T09:30:00Z' },
      { id: 'MSG-2', sender: 'vendeur', senderName: 'Promo Bati SARL', message: 'Nous contestons ces allégations. Les fissures n\'étaient pas présentes lors de la remise des clés. Elles pourraient être dues à un usage inapproprié.', timestamp: '2026-05-15T14:20:00Z' },
      { id: 'MSG-3', sender: 'acheteur', senderName: 'Amadou Diallo', message: 'J\'ai fait venir un expert géotechnique qui confirme un défaut de fondation. Le rapport est en pièce jointe.', timestamp: '2026-05-20T11:30:00Z' },
      { id: 'MSG-4', sender: 'vendeur', senderName: 'Promo Bati SARL', message: 'Nous avons fourni le certificat de conformité délivré par les autorités. La construction respecte les normes en vigueur.', timestamp: '2026-05-22T09:15:00Z' },
      { id: 'MSG-5', sender: 'admin', senderName: 'Conciliateur AfriBayit', message: 'Merci pour les éléments fournis. Un expert indépendant sera désigné pour évaluer la situation. Veuillez patienter.', timestamp: '2026-05-28T10:00:00Z' },
    ],
  },
  {
    id: 'DIS-002',
    transactionId: 'TX-2024-1123',
    amount: 175000,
    type: 'Location courte durée',
    status: 'OUVERT',
    priority: 'Moyenne',
    reason: 'Logement non conforme à l\'annonce',
    description: 'Le locataire signale que l\'appartement ne correspond pas aux photos de l\'annonce : manque de mobilier, piscine non fonctionnelle, et bruit de construction voisin.',
    acheteur: { name: 'Fatou Mensah', initials: 'FM' },
    vendeur: { name: 'Hôtel du Lac', initials: 'HL' },
    openedAt: '2026-06-05T16:45:00Z',
    evidenceCount: 4,
    lastEvidenceDate: '2026-06-07T09:30:00Z',
    country: 'BJ',
    evidence: [
      { id: 'EV-8', name: 'photo_annonce_originale.png', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-05T17:00:00Z' },
      { id: 'EV-9', name: 'photo_logement_actuel.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-05T17:05:00Z' },
      { id: 'EV-10', name: 'photo_piscine.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-06T08:30:00Z' },
      { id: 'EV-11', name: 'confirmation_reservation.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-07T09:30:00Z' },
    ],
    conversation: [
      { id: 'MSG-6', sender: 'acheteur', senderName: 'Fatou Mensah', message: 'L\'appartement ne ressemble en rien aux photos. Il manque des meubles et la piscine est fermée!', timestamp: '2026-06-05T16:45:00Z' },
      { id: 'MSG-7', sender: 'vendeur', senderName: 'Hôtel du Lac', message: 'Les photos sont récentes. La piscine est en maintenance, ce qui est indiqué dans les conditions.', timestamp: '2026-06-06T10:00:00Z' },
    ],
  },
  {
    id: 'DIS-003',
    transactionId: 'TX-2024-0592',
    amount: 850000,
    type: 'Artisan',
    status: 'PREUVES_COLLECTEES',
    priority: 'Haute',
    reason: 'Travaux incomplets et malfaçon',
    description: 'L\'artisan a abandonné le chantier après avoir reçu 70% du paiement. Les travaux réalisés présentent des malfaçons : plomberie défectueuse, carrelage mal posé, installations électriques non aux normes.',
    acheteur: { name: 'Kofi Asante', initials: 'KA' },
    vendeur: { name: 'Plomberie Pro Express', initials: 'PP' },
    openedAt: '2026-05-28T08:15:00Z',
    evidenceCount: 9,
    lastEvidenceDate: '2026-06-09T11:00:00Z',
    country: 'TG',
    evidence: [
      { id: 'EV-12', name: 'photo_malfacon_1.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-28T09:00:00Z' },
      { id: 'EV-13', name: 'photo_malfacon_2.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-28T09:05:00Z' },
      { id: 'EV-14', name: 'devis_initial.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-28T09:10:00Z' },
      { id: 'EV-15', name: 'photo_plomberie.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-30T14:00:00Z' },
      { id: 'EV-16', name: 'contrat_artisan.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-01T10:00:00Z' },
      { id: 'EV-17', name: 'rapport_avancement.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-01T10:30:00Z' },
      { id: 'EV-18', name: 'photo_carrelage.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-03T16:00:00Z' },
      { id: 'EV-19', name: 'certificat_electricien.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-05T09:00:00Z' },
      { id: 'EV-20', name: 'devis_reparation.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-09T11:00:00Z' },
    ],
    conversation: [
      { id: 'MSG-8', sender: 'acheteur', senderName: 'Kofi Asante', message: 'L\'artisan a quitté le chantier sans terminer. Les travaux sont mal faits et dangereux.', timestamp: '2026-05-28T08:15:00Z' },
      { id: 'MSG-9', sender: 'vendeur', senderName: 'Plomberie Pro Express', message: 'Le client a modifié les spécifications en cours de route. J\'ai besoin d\'un complément pour terminer.', timestamp: '2026-05-29T11:00:00Z' },
      { id: 'MSG-10', sender: 'acheteur', senderName: 'Kofi Asante', message: 'Je n\'ai jamais modifié les spécifications! Le devis initial est clair.', timestamp: '2026-05-29T15:30:00Z' },
    ],
  },
  {
    id: 'DIS-004',
    transactionId: 'TX-2024-0934',
    amount: 3200000,
    type: 'Immobilier',
    status: 'ARBITRAGE',
    priority: 'Haute',
    reason: 'Titre foncier contesté - double vente',
    description: 'Le terrain vendu fait l\'objet d\'un double titre foncier. Un tiers a produit un acte notarié antérieur. L\'acheteur demande l\'annulation et le remboursement intégral.',
    acheteur: { name: 'Ibrahim Ouédraogo', initials: 'IO' },
    vendeur: { name: 'Agence Immobilière Sahel', initials: 'AI' },
    openedAt: '2026-04-20T10:00:00Z',
    evidenceCount: 12,
    lastEvidenceDate: '2026-06-06T16:45:00Z',
    country: 'BF',
    evidence: [
      { id: 'EV-21', name: 'titre_foncier_1.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-04-21T09:00:00Z' },
      { id: 'EV-22', name: 'titre_foncier_2.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-04-21T09:05:00Z' },
      { id: 'EV-23', name: 'acte_vente.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-04-21T09:10:00Z' },
      { id: 'EV-24', name: 'certificat_cadastral.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-04-25T14:00:00Z' },
      { id: 'EV-25', name: 'attestation_notaire.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-04-25T14:30:00Z' },
      { id: 'EV-26', name: 'recepisse_demande.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-02T10:00:00Z' },
      { id: 'EV-27', name: 'lettre_maire.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-10T11:00:00Z' },
      { id: 'EV-28', name: 'plan_cadastral.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-05-15T09:00:00Z' },
      { id: 'EV-29', name: 'jugement_tribunal.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-28T16:00:00Z' },
      { id: 'EV-30', name: 'rapport_expert_foncier.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-03T10:30:00Z' },
      { id: 'EV-31', name: 'memoire_defense.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-05T14:00:00Z' },
      { id: 'EV-32', name: 'conclusions_acheteur.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-06T16:45:00Z' },
    ],
    conversation: [
      { id: 'MSG-11', sender: 'acheteur', senderName: 'Ibrahim Ouédraogo', message: 'J\'ai découvert qu\'un autre titre foncier existe pour le même terrain. C\'est une double vente!', timestamp: '2026-04-20T10:00:00Z' },
      { id: 'MSG-12', sender: 'vendeur', senderName: 'Agence Immobilière Sahel', message: 'Notre titre est légitime. Nous avons tous les documents cadastraux en règle.', timestamp: '2026-04-22T09:00:00Z' },
      { id: 'MSG-13', sender: 'acheteur', senderName: 'Ibrahim Ouédraogo', message: 'Le tribunal a déjà reconnu l\'antériorité de l\'autre titre. Je demande l\'annulation.', timestamp: '2026-05-28T16:00:00Z' },
      { id: 'MSG-14', sender: 'admin', senderName: 'Arbitre AfriBayit', message: 'L\'affaire est renvoyée en arbitrage. Les deux parties doivent soumettre leurs mémoires avant le 10 juin.', timestamp: '2026-06-01T10:00:00Z' },
    ],
  },
  {
    id: 'DIS-005',
    transactionId: 'TX-2024-1456',
    amount: 350000,
    type: 'Hôtel',
    status: 'RESOLU',
    priority: 'Basse',
    reason: 'Surcharge - chambre non disponible',
    description: 'Réservation confirmée mais chambre non disponible à l\'arrivée. L\'hôtel a proposé un hébergement alternatif que le client refuse (sous-qualitatif). Remboursement partiel accordé.',
    acheteur: { name: 'Marie Koné', initials: 'MK' },
    vendeur: { name: 'Hôtel Étoile d\'Or', initials: 'HE' },
    openedAt: '2026-05-10T18:30:00Z',
    evidenceCount: 3,
    lastEvidenceDate: '2026-05-18T10:00:00Z',
    country: 'CI',
    evidence: [
      { id: 'EV-33', name: 'confirmation_reservation.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-10T19:00:00Z' },
      { id: 'EV-34', name: 'photo_chambre_alt.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-11T08:00:00Z' },
      { id: 'EV-35', name: 'reponse_hotel.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-05-18T10:00:00Z' },
    ],
    conversation: [
      { id: 'MSG-15', sender: 'acheteur', senderName: 'Marie Koné', message: 'Pas de chambre à mon arrivée alors que j\'avais une confirmation! L\'alternative proposée est minable.', timestamp: '2026-05-10T18:30:00Z' },
      { id: 'MSG-16', sender: 'vendeur', senderName: 'Hôtel Étoile d\'Or', message: 'Erreur de surbooking. Nous avons proposé une alternative et un avoir de 50%.', timestamp: '2026-05-12T09:00:00Z' },
      { id: 'MSG-17', sender: 'admin', senderName: 'Conciliateur AfriBayit', message: 'Résolution acceptée : remboursement de 70% du montant au client, 30% libéré à l\'hôtel.', timestamp: '2026-05-25T14:00:00Z' },
    ],
  },
  {
    id: 'DIS-006',
    transactionId: 'TX-2024-0789',
    amount: 1250000,
    type: 'GeoTrust',
    status: 'PREUVES_COLLECTEES',
    priority: 'Moyenne',
    reason: 'Rapport d\'inspection contradictoire',
    description: 'Le rapport GeoTrust indique des défauts mineurs, mais l\'acheteur affirme que des défauts majeurs ont été ignorés. L\'inspecteur est accusé de partialité par l\'acheteur.',
    acheteur: { name: 'Yao Aka', initials: 'YA' },
    vendeur: { name: 'Construction Moderne CI', initials: 'CM' },
    openedAt: '2026-06-01T07:45:00Z',
    evidenceCount: 5,
    lastEvidenceDate: '2026-06-09T15:30:00Z',
    country: 'CI',
    evidence: [
      { id: 'EV-36', name: 'rapport_geotrust.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-01T10:00:00Z' },
      { id: 'EV-37', name: 'photo_defauts_1.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-02T08:00:00Z' },
      { id: 'EV-38', name: 'photo_defauts_2.jpg', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-02T08:05:00Z' },
      { id: 'EV-39', name: 'devis_reparation_2.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-05T11:00:00Z' },
      { id: 'EV-40', name: 'contre_rapport_technique.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-09T15:30:00Z' },
    ],
    conversation: [
      { id: 'MSG-18', sender: 'acheteur', senderName: 'Yao Aka', message: 'Le rapport GeoTrust est incomplet. Des défauts majeurs n\'ont pas été signalés!', timestamp: '2026-06-01T07:45:00Z' },
      { id: 'MSG-19', sender: 'vendeur', senderName: 'Construction Moderne CI', message: 'Le rapport a été réalisé par un inspecteur certifié. Tout est en ordre.', timestamp: '2026-06-01T16:00:00Z' },
      { id: 'MSG-20', sender: 'acheteur', senderName: 'Yao Aka', message: 'J\'ai fait faire un contre-rapport qui confirme mes dires. L\'inspecteur était de mèche avec le vendeur.', timestamp: '2026-06-09T15:30:00Z' },
    ],
  },
  {
    id: 'DIS-007',
    transactionId: 'TX-2024-1302',
    amount: 420000,
    type: 'Location courte durée',
    status: 'REMBOURSE',
    priority: 'Haute',
    reason: 'Annulation tardive par le propriétaire',
    description: 'Le propriétaire a annulé la réservation 2 jours avant l\'arrivée sans motif légitime. Le locataire avait déjà organisé son voyage. Remboursement intégral en cours de traitement.',
    acheteur: { name: 'Aïcha Bello', initials: 'AB' },
    vendeur: { name: 'Appart Cotonou', initials: 'AC' },
    openedAt: '2026-05-25T20:00:00Z',
    evidenceCount: 2,
    lastEvidenceDate: '2026-05-26T09:00:00Z',
    country: 'BJ',
    evidence: [
      { id: 'EV-41', name: 'notification_annulation.png', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-05-25T20:30:00Z' },
      { id: 'EV-42', name: 'confirmation_paiement.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-26T09:00:00Z' },
    ],
    conversation: [
      { id: 'MSG-21', sender: 'acheteur', senderName: 'Aïcha Bello', message: 'Annulation 2 jours avant! J\'ai tout organisé. Je demande un remboursement intégral.', timestamp: '2026-05-25T20:00:00Z' },
      { id: 'MSG-22', sender: 'vendeur', senderName: 'Appart Cotonou', message: 'Problème technique urgent. Je ne pouvais pas faire autrement.', timestamp: '2026-05-26T10:00:00Z' },
      { id: 'MSG-23', sender: 'admin', senderName: 'Conciliateur AfriBayit', message: 'Décision : remboursement intégral à l\'acheteur. Le propriétaire est en tort selon nos CGU.', timestamp: '2026-06-01T11:00:00Z' },
    ],
  },
  {
    id: 'DIS-008',
    transactionId: 'TX-2024-1567',
    amount: 675000,
    type: 'Artisan',
    status: 'OUVERT',
    priority: 'Basse',
    reason: 'Retard de livraison important',
    description: 'L\'artisan a 3 semaines de retard sur la date de livraison prévue. Le client demande soit l\'achèvement immédiat soit le remboursement partiel des avances versées.',
    acheteur: { name: 'Essohana Batcho', initials: 'EB' },
    vendeur: { name: 'Électricité Plus', initials: 'EP' },
    openedAt: '2026-06-07T11:20:00Z',
    evidenceCount: 2,
    lastEvidenceDate: '2026-06-08T16:00:00Z',
    country: 'TG',
    evidence: [
      { id: 'EV-43', name: 'devis_signe.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-07T11:30:00Z' },
      { id: 'EV-44', name: 'echange_whatsapp.png', type: 'photo', uploadedBy: 'acheteur', uploadedAt: '2026-06-08T16:00:00Z' },
    ],
    conversation: [
      { id: 'MSG-24', sender: 'acheteur', senderName: 'Essohana Batcho', message: '3 semaines de retard et aucune nouvelle. Je veux soit la fin des travaux soit mon argent.', timestamp: '2026-06-07T11:20:00Z' },
    ],
  },
  {
    id: 'DIS-009',
    transactionId: 'TX-2024-1245',
    amount: 5800000,
    type: 'Immobilier',
    status: 'MEDIATION',
    priority: 'Moyenne',
    reason: 'Surface réelle inférieure à l\'annonce',
    description: 'L\'appartement fait 85m² au lieu des 110m² annoncés. L\'acheteur demande une réduction proportionnelle au prix au m². Le vendeur invoque la surface carrez qui inclut les balcons.',
    acheteur: { name: 'Adama Traoré', initials: 'AT' },
    vendeur: { name: 'ImmoPro Abidjan', initials: 'IA' },
    openedAt: '2026-05-20T14:00:00Z',
    evidenceCount: 6,
    lastEvidenceDate: '2026-06-07T11:30:00Z',
    country: 'CI',
    evidence: [
      { id: 'EV-45', name: 'annonce_originale.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-20T15:00:00Z' },
      { id: 'EV-46', name: 'plan_appartement.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-22T10:00:00Z' },
      { id: 'EV-47', name: 'rapport_mesurage.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-05-25T09:00:00Z' },
      { id: 'EV-48', name: 'plan_cadastral.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-05-28T11:00:00Z' },
      { id: 'EV-49', name: 'acte_vente.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-05-30T14:00:00Z' },
      { id: 'EV-50', name: 'reponse_geometre.pdf', type: 'document', uploadedBy: 'vendeur', uploadedAt: '2026-06-07T11:30:00Z' },
    ],
    conversation: [
      { id: 'MSG-25', sender: 'acheteur', senderName: 'Adama Traoré', message: 'L\'appartement fait 25m² de moins que ce qui était annoncé. Je veux une réduction.', timestamp: '2026-05-20T14:00:00Z' },
      { id: 'MSG-26', sender: 'vendeur', senderName: 'ImmoPro Abidjan', message: 'La surface annoncée inclut les balcons et terrasses selon la loi. C\'est la surface Carrez.', timestamp: '2026-05-22T09:00:00Z' },
      { id: 'MSG-27', sender: 'acheteur', senderName: 'Adama Traoré', message: 'La loi Carrez n\'inclut PAS les balcons! Le géomètre confirme 85m² de surface habitable.', timestamp: '2026-05-25T09:30:00Z' },
      { id: 'MSG-28', sender: 'admin', senderName: 'Conciliateur AfriBayit', message: 'Proposition de médiation : réduction de 20% du prix de vente basée sur la différence de surface constatée.', timestamp: '2026-06-05T10:00:00Z' },
    ],
  },
  {
    id: 'DIS-010',
    transactionId: 'TX-2024-1678',
    amount: 285000,
    type: 'Hôtel',
    status: 'OUVERT',
    priority: 'Moyenne',
    reason: 'Facturation abusive - frais cachés',
    description: 'Le client a été facturé de frais supplémentaires non mentionnés lors de la réservation : taxe de séjour gonflée, frais de ménage exorbitants, et surtaxe "haute saison" non stipulée.',
    acheteur: { name: 'Céline Hounsou', initials: 'CH' },
    vendeur: { name: 'Résidence Palm Beach', initials: 'RP' },
    openedAt: '2026-06-09T09:00:00Z',
    evidenceCount: 1,
    lastEvidenceDate: '2026-06-09T12:00:00Z',
    country: 'BJ',
    evidence: [
      { id: 'EV-51', name: 'facture_detaillee.pdf', type: 'document', uploadedBy: 'acheteur', uploadedAt: '2026-06-09T12:00:00Z' },
    ],
    conversation: [
      { id: 'MSG-29', sender: 'acheteur', senderName: 'Céline Hounsou', message: 'On m\'a facturé 75 000 XOF de frais non mentionnés! C\'est de l\'escroquerie.', timestamp: '2026-06-09T09:00:00Z' },
    ],
  },
];

// ─── Status Timeline Badge Component ─────────────────────────────────────────

function StatusTimelineBadge({ status }: { status: DisputeStatus }) {
  const currentIndex = getStatusStepIndex(status);
  const isRefunded = status === 'REMBOURSE';

  return (
    <div className="flex items-center gap-0.5">
      {STATUS_STEPS.map((step, i) => {
        const isCompleted = isRefunded ? (i === 0 || i === 4) : i <= currentIndex;
        const isCurrent = isRefunded ? i === 4 : i === currentIndex;
        return (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all',
                isCompleted
                  ? isCurrent ? 'w-4 bg-[#003087]' : 'w-2.5 bg-[#00A651]'
                  : 'w-2.5 bg-gray-200'
              )}
              title={STATUS_LABELS[step]}
            />
            {i < STATUS_STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 w-1',
                i < currentIndex ? 'bg-[#00A651]' : 'bg-gray-200'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Stats Card Component ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', color)}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Evidence Gallery Component ──────────────────────────────────────────────

function EvidenceGallery({ evidence }: { evidence: Evidence[] }) {
  const photos = evidence.filter((e) => e.type === 'photo');
  const docs = evidence.filter((e) => e.type === 'document');

  return (
    <div className="space-y-3">
      {photos.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            <Upload className="size-3 inline mr-1" />
            Photos ({photos.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((ev) => (
              <div
                key={ev.id}
                className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center p-2 hover:border-[#009CDE] transition-colors cursor-pointer"
              >
                <div className="size-8 bg-[#009CDE]/10 rounded flex items-center justify-center mb-1">
                  <FileText className="size-4 text-[#009CDE]" />
                </div>
                <p className="text-[10px] text-gray-500 truncate w-full text-center">{ev.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {docs.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            <FileText className="size-3 inline mr-1" />
            Documents ({docs.length})
          </p>
          <div className="space-y-1.5">
            {docs.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100 hover:border-[#003087]/20 transition-colors cursor-pointer"
              >
                <div className="size-8 bg-[#D93025]/10 rounded flex items-center justify-center shrink-0">
                  <FileText className="size-4 text-[#D93025]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">{ev.name}</p>
                  <p className="text-xs text-gray-400">
                    {ev.uploadedBy === 'acheteur' ? 'Acheteur' : 'Vendeur'} • {formatDate(ev.uploadedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Conversation Timeline Component ─────────────────────────────────────────

function ConversationTimeline({ messages }: { messages: ConversationMessage[] }) {
  return (
    <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-3">
          <div className="shrink-0 mt-1">
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center text-xs font-bold text-white',
                msg.sender === 'acheteur'
                  ? 'bg-[#009CDE]'
                  : msg.sender === 'vendeur'
                  ? 'bg-[#D4AF37]'
                  : 'bg-[#003087]'
              )}
            >
              {msg.sender === 'admin'
                ? 'A'
                : msg.senderName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={cn(
                  'text-sm font-semibold',
                  msg.sender === 'admin' ? 'text-[#003087]' : 'text-gray-800'
                )}
              >
                {msg.senderName}
              </span>
              <span className="text-xs text-gray-400">{formatDateTime(msg.timestamp)}</span>
              {msg.sender === 'admin' && (
                <Badge className="bg-[#003087]/10 text-[#003087] border-[#003087]/20 text-[10px] px-1.5 py-0">
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{msg.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dispute Card Component ──────────────────────────────────────────────────

function DisputeCard({
  dispute,
  onViewDetails,
}: {
  dispute: Dispute;
  onViewDetails: (d: Dispute) => void;
}) {
  const days = daysSince(dispute.openedAt);
  const priorityConfig = getPriorityConfig(dispute.priority);
  const isOverdue = days > 7 && dispute.status !== 'RESOLU' && dispute.status !== 'REMBOURSE';

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-4 sm:p-5',
        isOverdue ? 'border-[#D93025]/30 hover:border-[#D93025]/50' : 'border-gray-100 hover:border-gray-200'
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-semibold text-[#003087]">{dispute.transactionId}</span>
          <span className="text-sm font-bold text-gray-900">{formatXOF(dispute.amount)}</span>
          <Badge className={cn('text-[10px]', getStatusColor(dispute.status))} variant="outline">
            {STATUS_LABELS[dispute.status]}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn('text-[10px]', priorityConfig.color)} variant="outline">
            <span className={cn('size-1.5 rounded-full mr-1', priorityConfig.dot)} />
            {dispute.priority}
          </Badge>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            {COUNTRY_FLAGS[dispute.country] || ''} {dispute.country}
          </span>
        </div>
      </div>

      {/* Type & Reason */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{getTypeIcon(dispute.type)}</span>
          <span className="text-xs font-medium text-gray-500">{dispute.type}</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-800 mb-0.5">{dispute.reason}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{dispute.description}</p>
      </div>

      {/* Parties */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="bg-[#009CDE]/10 text-[#009CDE] text-[10px] font-bold">
              {dispute.acheteur.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-600">{dispute.acheteur.name}</span>
        </div>
        <ArrowRight className="size-3 text-gray-300" />
        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="bg-[#D4AF37]/10 text-[#B8960E] text-[10px] font-bold">
              {dispute.vendeur.initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-gray-600">{dispute.vendeur.name}</span>
        </div>
      </div>

      {/* Status timeline + Meta info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <StatusTimelineBadge status={dispute.status} />
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <FileText className="size-3" />
            {dispute.evidenceCount} preuve{dispute.evidenceCount > 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            <span className={cn(isOverdue && 'text-[#D93025] font-semibold')}>
              {days}j
            </span>
          </span>
        </div>
      </div>

      {/* Footer: Evidence date + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-gray-400">
          Dernière preuve : {formatDate(dispute.lastEvidenceDate)}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-[#003087] hover:bg-[#003087]/5"
            onClick={() => onViewDetails(dispute)}
          >
            <Eye className="size-3 mr-1" />
            Détails
          </Button>
          {dispute.status === 'OUVERT' || dispute.status === 'PREUVES_COLLECTEES' ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-[#009CDE] hover:bg-[#009CDE]/5"
            >
              <MessageSquare className="size-3 mr-1" />
              Médiation
            </Button>
          ) : null}
          {dispute.status === 'MEDIATION' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-[#00A651] hover:bg-[#00A651]/5"
            >
              <CheckCircle className="size-3 mr-1" />
              Libérer fonds
            </Button>
          )}
          {dispute.status !== 'RESOLU' && dispute.status !== 'REMBOURSE' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#D93025] hover:bg-[#D93025]/5"
              >
                <XCircle className="size-3 mr-1" />
                Rembourser
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#D4AF37] hover:bg-[#D4AF37]/5"
              >
                <AlertTriangle className="size-3 mr-1" />
                Escalader
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal Component ──────────────────────────────────────────────────

function DisputeDetailModal({
  dispute,
  open,
  onClose,
}: {
  dispute: Dispute | null;
  open: boolean;
  onClose: () => void;
}) {
  const [mediationNote, setMediationNote] = useState('');
  const [decisionType, setDecisionType] = useState<string>('');
  const [decisionNote, setDecisionNote] = useState('');
  const [partialAmount, setPartialAmount] = useState('');

  if (!dispute) return null;

  const days = daysSince(dispute.openedAt);
  const isOverdue = days > 7 && dispute.status !== 'RESOLU' && dispute.status !== 'REMBOURSE';
  const priorityConfig = getPriorityConfig(dispute.priority);
  const currentStep = getStatusStepIndex(dispute.status);
  const progressValue = dispute.status === 'REMBOURSE' ? 100 : ((currentStep / (STATUS_STEPS.length - 1)) * 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-lg font-bold text-[#003087]">
              Litige {dispute.id}
            </DialogTitle>
            <Badge className={cn('text-xs', getStatusColor(dispute.status))} variant="outline">
              {STATUS_LABELS[dispute.status]}
            </Badge>
            <Badge className={cn('text-xs', priorityConfig.color)} variant="outline">
              <span className={cn('size-1.5 rounded-full mr-1', priorityConfig.dot)} />
              {dispute.priority}
            </Badge>
            {isOverdue && (
              <Badge className="bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20 text-xs" variant="outline">
                <AlertTriangle className="size-3 mr-1" />
                Urgent ({days}j)
              </Badge>
            )}
          </div>
          <DialogDescription className="text-sm text-gray-500">
            {dispute.reason}
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Info */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Transaction</p>
              <p className="text-sm font-mono font-semibold text-[#003087]">{dispute.transactionId}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">Montant</p>
              <p className="text-lg font-bold text-gray-900">{formatXOF(dispute.amount)}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-400">Type</p>
              <p className="text-sm font-medium">{getTypeIcon(dispute.type)} {dispute.type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Pays</p>
              <p className="text-sm font-medium">{COUNTRY_FLAGS[dispute.country]} {dispute.country}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Ouvert le</p>
              <p className="text-sm font-medium">{formatDate(dispute.openedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Durée</p>
              <p className={cn('text-sm font-medium', isOverdue && 'text-[#D93025]')}>{days} jours</p>
            </div>
          </div>

          {/* Parties */}
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="size-9">
                <AvatarFallback className="bg-[#009CDE]/10 text-[#009CDE] text-xs font-bold">
                  {dispute.acheteur.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-gray-400">Acheteur</p>
                <p className="text-sm font-medium text-gray-800">{dispute.acheteur.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="size-4 text-gray-300" />
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs text-gray-400">Vendeur</p>
                <p className="text-sm font-medium text-gray-800">{dispute.vendeur.name}</p>
              </div>
              <Avatar className="size-9">
                <AvatarFallback className="bg-[#D4AF37]/10 text-[#B8960E] text-xs font-bold">
                  {dispute.vendeur.initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Progress Bar */}
          <Separator />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-gray-500 font-medium">Progression du litige</p>
              <p className="text-xs text-gray-400">{Math.round(progressValue)}%</p>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between mt-1">
              {STATUS_STEPS.map((step, i) => (
                <span
                  key={step}
                  className={cn(
                    'text-[10px]',
                    i <= currentStep ? 'text-[#003087] font-medium' : 'text-gray-300'
                  )}
                >
                  {step === 'OUVERT' ? 'Ouvert' : step === 'PREUVES_COLLECTEES' ? 'Preuves' : step === 'MEDIATION' ? 'Médiation' : step === 'ARBITRAGE' ? 'Arbitrage' : 'Résolu'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="evidence" className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="evidence" className="flex-1 text-xs">
              <FileText className="size-3 mr-1" />
              Preuves ({dispute.evidenceCount})
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex-1 text-xs">
              <MessageSquare className="size-3 mr-1" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="mediation" className="flex-1 text-xs">
              <Scale className="size-3 mr-1" />
              Médiation
            </TabsTrigger>
            <TabsTrigger value="decision" className="flex-1 text-xs">
              <Gavel className="size-3 mr-1" />
              Décision
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evidence" className="mt-4">
            <EvidenceGallery evidence={dispute.evidence} />
          </TabsContent>

          <TabsContent value="conversation" className="mt-4">
            <ConversationTimeline messages={dispute.conversation} />
          </TabsContent>

          <TabsContent value="mediation" className="mt-4 space-y-4">
            <div className="bg-[#003087]/5 rounded-lg p-4 border border-[#003087]/10">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="size-4 text-[#003087]" />
                <h4 className="text-sm font-semibold text-[#003087]">Proposer une médiation</h4>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Rédigez une proposition de médiation qui sera envoyée aux deux parties. Celles-ci auront 48h pour accepter ou refuser.
              </p>
              <Textarea
                placeholder="Décrivez votre proposition de médiation : montant suggéré, conditions, délai..."
                value={mediationNote}
                onChange={(e) => setMediationNote(e.target.value)}
                className="min-h-24 resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button className="bg-[#003087] hover:bg-[#002670] text-white">
                  <MessageSquare className="size-4 mr-2" />
                  Envoyer la proposition
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="decision" className="mt-4 space-y-4">
            <div className="bg-[#D4AF37]/5 rounded-lg p-4 border border-[#D4AF37]/10">
              <div className="flex items-center gap-2 mb-3">
                <Gavel className="size-4 text-[#D4AF37]" />
                <h4 className="text-sm font-semibold text-[#B8960E]">Rendre une décision</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Cette action est irréversible. La décision sera exécutée immédiatement sur le compte séquestre.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Type de décision</label>
                  <Select value={decisionType} onValueChange={setDecisionType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner une décision" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_release">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="size-4 text-[#00A651]" />
                          Libération totale — Funds libérés au vendeur
                        </div>
                      </SelectItem>
                      <SelectItem value="partial_release">
                        <div className="flex items-center gap-2">
                          <Scale className="size-4 text-[#D4AF37]" />
                          Libération partielle — Répartition entre les parties
                        </div>
                      </SelectItem>
                      <SelectItem value="full_refund">
                        <div className="flex items-center gap-2">
                          <XCircle className="size-4 text-[#D93025]" />
                          Remboursement intégral — Funds retournés à l&apos;acheteur
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {decisionType === 'partial_release' && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                      Montant libéré au vendeur (XOF)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      max={dispute.amount}
                    />
                    {partialAmount && (
                      <p className="text-xs text-gray-400 mt-1">
                        Acheteur : {formatXOF(dispute.amount - Number(partialAmount))} | Vendeur : {formatXOF(Number(partialAmount))}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Motif de la décision</label>
                  <Textarea
                    placeholder="Expliquez les motifs de votre décision. Ce texte sera visible par les deux parties."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    className="min-h-20 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={onClose}>
                    Annuler
                  </Button>
                  <Button
                    className={cn(
                      decisionType === 'full_release' && 'bg-[#00A651] hover:bg-[#008542] text-white',
                      decisionType === 'partial_release' && 'bg-[#D4AF37] hover:bg-[#B8960E] text-white',
                      decisionType === 'full_refund' && 'bg-[#D93025] hover:bg-[#B5251E] text-white',
                      !decisionType && 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    )}
                    disabled={!decisionType || !decisionNote}
                  >
                    <Gavel className="size-4 mr-2" />
                    Confirmer la décision
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function DisputesAdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter disputes
  const filteredDisputes = useMemo(() => {
    return MOCK_DISPUTES.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.transactionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.acheteur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.vendeur.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || d.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || d.priority === priorityFilter;
      return matchesSearch && matchesType && matchesStatus && matchesPriority;
    });
  }, [searchQuery, typeFilter, statusFilter, priorityFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredDisputes.length / itemsPerPage);
  const paginatedDisputes = filteredDisputes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const stats = useMemo(() => {
    return {
      total: MOCK_DISPUTES.length,
      enCours: MOCK_DISPUTES.filter(
        (d) => !['RESOLU', 'REMBOURSE'].includes(d.status)
      ).length,
      resolves: MOCK_DISPUTES.filter((d) => d.status === 'RESOLU').length,
      remboursementsEnAttente: MOCK_DISPUTES.filter((d) => d.status === 'REMBOURSE').length,
    };
  }, []);

  const handleViewDetails = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => setSelectedDispute(null), 200);
  };

  return (
    <div className="min-h-screen space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-[#003087] rounded-lg">
            <Scale className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Gestion des Litiges
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Arbitrage des conflits et résolution des transactions disputées
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total litiges"
          value={stats.total}
          icon={AlertTriangle}
          color="bg-[#003087]/10 text-[#003087]"
          subtext="Tous les dossiers"
        />
        <StatCard
          label="En cours"
          value={stats.enCours}
          icon={Clock}
          color="bg-[#009CDE]/10 text-[#009CDE]"
          subtext="Non résolus"
        />
        <StatCard
          label="Résolus"
          value={stats.resolves}
          icon={CheckCircle}
          color="bg-[#00A651]/10 text-[#00A651]"
          subtext="Ce mois"
        />
        <StatCard
          label="Remboursements en attente"
          value={stats.remboursementsEnAttente}
          icon={XCircle}
          color="bg-[#D93025]/10 text-[#D93025]"
          subtext="À traiter"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Input
              placeholder="Rechercher (ID, nom, raison...)"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {DISPUTE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {getTypeIcon(t)} {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {DISPUTE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(v) => {
              setPriorityFilter(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full h-9 text-sm">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{filteredDisputes.length}</span> litige{filteredDisputes.length > 1 ? 's' : ''} trouvé{filteredDisputes.length > 1 ? 's' : ''}
        </p>
        {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all' || priorityFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#003087] hover:bg-[#003087]/5"
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('all');
              setStatusFilter('all');
              setPriorityFilter('all');
              setCurrentPage(1);
            }}
          >
            Réinitialiser les filtres
          </Button>
        )}
      </div>

      {/* Dispute Cards Queue */}
      {paginatedDisputes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paginatedDisputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center shadow-sm">
          <AlertTriangle className="size-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucun litige trouvé</h3>
          <p className="text-sm text-gray-400">Essayez de modifier vos critères de recherche</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'h-8 w-8 p-0',
                page === currentPage && 'bg-[#003087] hover:bg-[#002670]'
              )}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      <DisputeDetailModal
        dispute={selectedDispute}
        open={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
