'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Star,
  Search,
  Filter,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Check,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Flag,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Separator } from '@/components/ui/separator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReviewStatus = 'publie' | 'signale' | 'masque' | 'en_attente';
type ReviewType = 'propriete' | 'agent' | 'artisan' | 'hotel' | 'guesthouse' | 'location_courte_duree';

interface Review {
  id: string;
  authorName: string;
  authorAvatar?: string;
  targetType: ReviewType;
  targetName: string;
  rating: number;
  comment: string;
  date: string;
  status: ReviewStatus;
  reports: number;
  reportReasons?: string[];
}

// ---------------------------------------------------------------------------
// Constants & Mappers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<ReviewStatus, string> = {
  publie: 'Publié',
  signale: 'Signalé',
  masque: 'Masqué',
  en_attente: 'En attente',
};

const STATUS_STYLES: Record<ReviewStatus, string> = {
  publie: 'bg-[#00A651]/10 text-[#00A651] border-[#00A651]/20',
  signale: 'bg-[#D93025]/10 text-[#D93025] border-[#D93025]/20',
  masque: 'bg-gray-100 text-gray-500 border-gray-200',
  en_attente: 'bg-[#D4AF37]/10 text-[#B8962E] border-[#D4AF37]/20',
};

const TYPE_LABELS: Record<ReviewType, string> = {
  propriete: 'Propriété',
  agent: 'Agent',
  artisan: 'Artisan',
  hotel: 'Hôtel',
  guesthouse: 'Guesthouse',
  location_courte_duree: 'Location courte durée',
};

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    authorName: 'Amadou Diallo',
    authorAvatar: undefined,
    targetType: 'propriete',
    targetName: 'Villa Les Palmiers — Cotonou',
    rating: 5,
    comment:
      'Excellente propriété, exactement comme décrite dans l\'annonce. Le jardin est magnifique et la piscine impeccable. Le quartier est calme et sécurisé. Je recommande vivement cette villa pour toute famille cherchant un cadre paisible à Cotonou.',
    date: '2026-06-09',
    status: 'publie',
    reports: 0,
  },
  {
    id: '2',
    authorName: 'Fatou Ouédraogo',
    authorAvatar: undefined,
    targetType: 'agent',
    targetName: 'Kofi Mensah — Agent immobilier',
    rating: 2,
    comment:
      'Très déçue par le service. L\'agent n\'a pas respecté les délais promis et les informations fournies étaient inexactes. J\'ai dû relancer plusieurs fois pour obtenir des réponses. À éviter.',
    date: '2026-06-08',
    status: 'signale',
    reports: 3,
    reportReasons: ['Langage diffamatoire', 'Informations non vérifiées'],
  },
  {
    id: '3',
    authorName: 'Yao Koffi',
    authorAvatar: undefined,
    targetType: 'artisan',
    targetName: 'Atelier Bois Noble — Menuisier',
    rating: 4,
    comment:
      'Bon travail de menuiserie dans l\'ensemble. Les finitions sont soignées et le délai a été respecté. Petit bémol sur la communication pendant les premiers jours du chantier.',
    date: '2026-06-07',
    status: 'en_attente',
    reports: 0,
  },
  {
    id: '4',
    authorName: 'Marie Tossou',
    authorAvatar: undefined,
    targetType: 'hotel',
    targetName: 'Hôtel du Lac — Cotonou',
    rating: 1,
    comment:
      'HORRIBLE !!! Chambre sale, personnel irrespectueux, climatisation en panne. Cet hôtel est une ARNAQUE totale. Ne venez JAMAIS ici !!! ZÉRO ÉTOILES mérité !!!',
    date: '2026-06-07',
    status: 'signale',
    reports: 5,
    reportReasons: ['Langage abusif', 'Faux avis suspecté', 'Spam'],
  },
  {
    id: '5',
    authorName: 'Ibrahim Sanoussi',
    authorAvatar: undefined,
    targetType: 'guesthouse',
    targetName: 'Maison d\'Hôte Baobab — Ouidah',
    rating: 4,
    comment:
      'Très belle guesthouse avec un charme authentique. Le petit-déjeuner est copieux et délicieux. Le personnel est accueillant. Seul regret : le Wi-Fi est parfois instable.',
    date: '2026-06-06',
    status: 'publie',
    reports: 0,
  },
  {
    id: '6',
    authorName: 'Adèle Houénou',
    authorAvatar: undefined,
    targetType: 'location_courte_duree',
    targetName: 'Appartement Plage — Grand-Popo',
    rating: 3,
    comment:
      'Appartement correct pour une courte durée. L\'emplacement près de la plage est un plus. Cependant, l\'appartement manque d\'entretien et quelques équipements sont vétustes.',
    date: '2026-06-05',
    status: 'en_attente',
    reports: 0,
  },
  {
    id: '7',
    authorName: 'Kodjo Amegee',
    authorAvatar: undefined,
    targetType: 'propriete',
    targetName: 'Terrain Lot 14 — Parakou',
    rating: 5,
    comment:
      'Transaction impeccable grâce à AfriBayit. Le terrain correspond parfaitement à la description. Le processus GeoTrust a été très rassurant. Merci pour la transparence !',
    date: '2026-06-04',
    status: 'publie',
    reports: 0,
  },
  {
    id: '8',
    authorName: 'Rachida Bello',
    authorAvatar: undefined,
    targetType: 'agent',
    targetName: 'Aminata Dossou — Agence Horizon',
    rating: 1,
    comment:
      'Arnaque ! Cette agence m\'a fait payer des frais cachés et n\'a jamais fourni le service promis. J\'ai porté plainte. Attention !!!',
    date: '2026-06-03',
    status: 'signale',
    reports: 2,
    reportReasons: ['Accusations non prouvées'],
  },
  {
    id: '9',
    authorName: 'Patrice Agossou',
    authorAvatar: undefined,
    targetType: 'artisan',
    targetName: 'Plomberie Pro Express — Cotonou',
    rating: 3,
    comment:
      'Service de plomberie moyen. Le problème a été résolu mais l\'artisan est arrivé avec 2 heures de retard et a facturé plus que le devis initial sans explication claire.',
    date: '2026-06-02',
    status: 'masque',
    reports: 1,
  },
  {
    id: '10',
    authorName: 'Clarisse Dossou',
    authorAvatar: undefined,
    targetType: 'hotel',
    targetName: 'Résidence Palm Beach — Lomé',
    rating: 5,
    comment:
      'Séjour exceptionnel ! Chambres spacieuses et propres, vue sur l\'océan magnifique. Le restaurant de l\'hôtel propose une cuisine locale raffinée. Je reviendrai sans hésiter.',
    date: '2026-06-01',
    status: 'en_attente',
    reports: 0,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const iconSize = size === 'md' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconSize,
            star <= rating
              ? 'fill-[#D4AF37] text-[#D4AF37]'
              : 'fill-gray-100 text-gray-300'
          )}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn('text-[11px] font-medium gap-1', STATUS_STYLES[status])}
    >
      {status === 'signale' && <Flag className="w-3 h-3" />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function TypeBadge({ type }: { type: ReviewType }) {
  return (
    <Badge variant="secondary" className="text-[11px] font-medium bg-[#003087]/5 text-[#003087]">
      {TYPE_LABELS[type]}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function ReviewsModerationPage() {
  // --- State ---
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [detailReview, setDetailReview] = useState<Review | null>(null);
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);
  const pageSize = 6;

  // --- Computed Stats ---
  const stats = useMemo(() => {
    const total = reviews.length;
    const avgRating =
      total > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
        : '0.0';
    const signale = reviews.filter((r) => r.status === 'signale').length;
    const enAttente = reviews.filter((r) => r.status === 'en_attente').length;
    return { total, avgRating, signale, enAttente };
  }, [reviews]);

  // --- Filtered & Paginated ---
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        !search ||
        r.authorName.toLowerCase().includes(search.toLowerCase()) ||
        r.targetName.toLowerCase().includes(search.toLowerCase()) ||
        r.comment.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || r.targetType === typeFilter;
      const matchesRating = ratingFilter === 'all' || r.rating === Number(ratingFilter);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesType && matchesRating && matchesStatus;
    });
  }, [reviews, search, typeFilter, ratingFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedReviews = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  const handleFilterChange = useCallback((setter: (v: string) => void) => {
    return (v: string) => {
      setter(v);
      setCurrentPage(1);
    };
  }, []);

  // --- Actions ---
  const handleApprove = useCallback((id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'publie' as ReviewStatus } : r))
    );
  }, []);

  const handleHide = useCallback((id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'masque' as ReviewStatus } : r))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleteReview(null);
  }, []);

  // --- Render ---
  return (
    <div className="space-y-5">
      {/* ===== Page Header ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Modération des Avis</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gérez et modérez les avis sur la plateforme
          </p>
        </div>
        <Button variant="outline" size="sm" className="text-xs w-fit">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exporter
        </Button>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total avis"
          value={stats.total}
          icon={<Star className="w-4 h-4" />}
          color="#003087"
        />
        <StatCard
          label="Note moyenne"
          value={stats.avgRating}
          icon={<Star className="w-4 h-4" />}
          color="#D4AF37"
          isRating
        />
        <StatCard
          label="Avis signalés"
          value={stats.signale}
          icon={<Flag className="w-4 h-4" />}
          color="#D93025"
        />
        <StatCard
          label="En attente de modération"
          value={stats.enAttente}
          icon={<AlertTriangle className="w-4 h-4" />}
          color="#D4AF37"
        />
      </div>

      {/* ===== Filters ===== */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher par auteur, cible ou commentaire..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 h-9 text-sm"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
              <SelectTrigger className="w-[170px] h-9 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="propriete">Propriété</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="artisan">Artisan</SelectItem>
                <SelectItem value="hotel">Hôtel</SelectItem>
                <SelectItem value="guesthouse">Guesthouse</SelectItem>
                <SelectItem value="location_courte_duree">Location courte durée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={handleFilterChange(setRatingFilter)}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Note" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les notes</SelectItem>
                <SelectItem value="5">5 étoiles</SelectItem>
                <SelectItem value="4">4 étoiles</SelectItem>
                <SelectItem value="3">3 étoiles</SelectItem>
                <SelectItem value="2">2 étoiles</SelectItem>
                <SelectItem value="1">1 étoile</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="publie">Publié</SelectItem>
                <SelectItem value="signale">Signalé</SelectItem>
                <SelectItem value="masque">Masqué</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={() => setCurrentPage(1)}>
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filtrer
            </Button>
          </div>
        </div>
      </div>

      {/* ===== Review Cards ===== */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">Aucun avis trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Essayez de modifier vos filtres de recherche
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onApprove={handleApprove}
              onHide={handleHide}
              onDelete={setDeleteReview}
              onViewDetail={setDetailReview}
            />
          ))}
        </div>
      )}

      {/* ===== Pagination ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">
            {filtered.length} avis — Affichage{' '}
            {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, filtered.length)}
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-8 w-8 p-0 text-xs',
                  page === currentPage && 'bg-[#003087] hover:bg-[#002a70]'
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
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ===== Detail Dialog ===== */}
      <Dialog open={!!detailReview} onOpenChange={(open) => !open && setDetailReview(null)}>
        <DialogContent className="sm:max-w-lg">
          {detailReview && (
            <>
              <DialogHeader>
                <DialogTitle>Détail de l&apos;avis</DialogTitle>
                <DialogDescription>
                  Avis de {detailReview.authorName} sur {detailReview.targetName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Author & Target */}
                <div className="flex items-start gap-3">
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={detailReview.authorAvatar || undefined} />
                    <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-sm font-bold">
                      {detailReview.authorName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{detailReview.authorName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TypeBadge type={detailReview.targetType} />
                      <span className="text-xs text-gray-500">{detailReview.targetName}</span>
                    </div>
                  </div>
                  <StatusBadge status={detailReview.status} />
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <StarRating rating={detailReview.rating} size="md" />
                  <span className="text-sm font-semibold text-gray-700">{detailReview.rating}/5</span>
                </div>

                <Separator />

                {/* Comment */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                    Commentaire
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{detailReview.comment}</p>
                </div>

                {/* Reports */}
                {detailReview.reports > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
                        Signalements ({detailReview.reports})
                      </p>
                      {detailReview.reportReasons && detailReview.reportReasons.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {detailReview.reportReasons.map((reason, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-[11px] bg-[#D93025]/5 text-[#D93025] border-[#D93025]/20"
                            >
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Aucune raison spécifiée</p>
                      )}
                    </div>
                  </>
                )}

                {/* Date */}
                <p className="text-xs text-gray-400">
                  Publié le{' '}
                  {new Date(detailReview.date).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                {detailReview.status !== 'publie' && (
                  <Button
                    size="sm"
                    className="bg-[#00A651] hover:bg-[#008f46] text-xs"
                    onClick={() => {
                      handleApprove(detailReview.id);
                      setDetailReview(null);
                    }}
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Approuver
                  </Button>
                )}
                {detailReview.status !== 'masque' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      handleHide(detailReview.id);
                      setDetailReview(null);
                    }}
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1" />
                    Masquer
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Delete Confirmation Dialog ===== */}
      <Dialog open={!!deleteReview} onOpenChange={(open) => !open && setDeleteReview(null)}>
        <DialogContent className="sm:max-w-md">
          {deleteReview && (
            <>
              <DialogHeader>
                <DialogTitle>Supprimer cet avis ?</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. L&apos;avis de {deleteReview.authorName} sera
                  définitivement supprimé de la plateforme.
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg bg-[#D93025]/5 border border-[#D93025]/10 p-3">
                <p className="text-xs text-[#D93025] font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                  Attention : cette suppression est permanente.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setDeleteReview(null)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(deleteReview.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Supprimer
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  color,
  isRating,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  isRating?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}10` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <div className="flex items-center gap-1.5">
          <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
          {isRating && (
            <Star className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Card
// ---------------------------------------------------------------------------

function ReviewCard({
  review,
  onApprove,
  onHide,
  onDelete,
  onViewDetail,
}: {
  review: Review;
  onApprove: (id: string) => void;
  onHide: (id: string) => void;
  onDelete: (review: Review) => void;
  onViewDetail: (review: Review) => void;
}) {
  const initials = review.authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const truncatedComment =
    review.comment.length > 160
      ? review.comment.slice(0, 160) + '...'
      : review.comment;

  const formattedDate = new Date(review.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4 transition-all hover:shadow-md',
        review.status === 'signale' && 'border-[#D93025]/30 bg-[#D93025]/[0.02]',
        review.status === 'en_attente' && 'border-[#D4AF37]/30',
        review.status === 'masque' && 'opacity-60',
        review.status === 'publie' && 'border-gray-200'
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left: Author info */}
        <div className="flex items-start gap-3 sm:w-[200px] shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.authorAvatar || undefined} />
            <AvatarFallback className="bg-[#003087]/10 text-[#003087] text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{review.authorName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{formattedDate}</p>
          </div>
        </div>

        {/* Center: Review content */}
        <div className="flex-1 min-w-0">
          {/* Target + Rating row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <TypeBadge type={review.targetType} />
            <span className="text-xs text-gray-500 truncate">{review.targetName}</span>
            <span className="hidden sm:inline text-gray-300">·</span>
            <StarRating rating={review.rating} />
            <span className="text-xs font-medium text-gray-600">{review.rating}/5</span>
          </div>

          {/* Comment */}
          <p className="text-sm text-gray-700 leading-relaxed">{truncatedComment}</p>

          {/* Reports + Status row */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <StatusBadge status={review.status} />
            {review.reports > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#D93025] font-medium">
                <Flag className="w-3 h-3" />
                {review.reports} signalement{review.reports > 1 ? 's' : ''}
              </span>
            )}
            {review.reportReasons && review.reportReasons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {review.reportReasons.map((reason, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#D93025]/5 text-[#D93025] border border-[#D93025]/10"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex sm:flex-col items-center gap-1.5 sm:items-end shrink-0">
          {review.status !== 'publie' && (
            <Button
              size="sm"
              className="h-8 text-[11px] bg-[#00A651] hover:bg-[#008f46] px-3"
              onClick={() => onApprove(review.id)}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Approuver
            </Button>
          )}
          {review.status === 'publie' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] px-3"
              onClick={() => onHide(review.id)}
            >
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              Masquer
            </Button>
          )}
          {review.status === 'signale' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] px-3"
              onClick={() => onHide(review.id)}
            >
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              Masquer
            </Button>
          )}
          {review.status === 'masque' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] px-3"
              onClick={() => onApprove(review.id)}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Rétablir
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetail(review)}>
                <Eye className="w-4 h-4" />
                Voir le détail
              </DropdownMenuItem>
              {review.status !== 'publie' && (
                <DropdownMenuItem onClick={() => onApprove(review.id)}>
                  <Check className="w-4 h-4" />
                  Approuver
                </DropdownMenuItem>
              )}
              {review.status !== 'masque' && (
                <DropdownMenuItem onClick={() => onHide(review.id)}>
                  <EyeOff className="w-4 h-4" />
                  Masquer
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(review)}
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
