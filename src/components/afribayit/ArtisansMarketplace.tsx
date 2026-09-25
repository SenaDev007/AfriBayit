'use client';

/**
 * ArtisansMarketplace — Hub professionnel « LinkedIn-like » du répertoire
 * des artisans BTP (CDC §5.5).
 *
 * Structure (refonte 2026-09) :
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Barre sticky : titre + recherche + pays + actions          │
 *   ├────────────┬──────────────────────────────┬────────────────┤
 *   │ Facettes   │ Cartes profils vérifiés      │ Insights       │
 *   │ (métiers,  │ (style annuaire LinkedIn :   │ ProMatch IA,   │
 *   │  dispo,    │  identité, stats, actions)   │ chiffres,      │
 *   │  note…)    │ + tri pertinence/note/…      │ escrow, urgence│
 *   └────────────┴──────────────────────────────┴────────────────┘
 * Zéro animation 3D — transitions CSS sobres uniquement.
 */

import React, { useState, useMemo } from 'react';
import { useArtisans, useArtisanDetail, useCreateArtisanQuote, useProMatch } from '@/hooks/useArtisans';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { toast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api-client';
import {
  AlertTriangle, Search, Siren, Wrench, ArrowLeft, Phone, MapPin, Star,
  CheckCircle, Clock, DollarSign, Briefcase, X, Sparkles, ShieldCheck, Filter, ChevronDown,
} from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import HubShell, { HubPanel, HubProfileCard, HubResultsHeader } from '@/components/afribayit/hub/HubShell';

// CDC §5.5.1 — Service category labels (mapping DB IDs to readable French labels)
const SERVICE_CATEGORY_LABELS: Record<string, string> = {
  gros_oeuvre: 'Gros Œuvre',
  second_oeuvre: 'Second Œuvre',
  finition: 'Finition & Décoration',
  genie_technique: 'Génie Technique',
  exterieur: 'Extérieurs',
  renovation: 'Rénovation & Maintenance',
  numerique: 'Numérique & Innovation',
};

// CDC §5.5.1 — Trades grouped by the 7 official service categories.
// 30 trades total (excludes the synthetic "Tous" filter).
const TRADES_BY_CATEGORY: { category: keyof typeof SERVICE_CATEGORY_LABELS; trades: string[] }[] = [
  {
    category: 'gros_oeuvre',
    trades: ['Maçon', 'Coffreur / Bétonnier', 'Tailleur de pierre', 'Constructeur parpaings', 'Fondationniste'],
  },
  {
    category: 'second_oeuvre',
    trades: ['Électricien', 'Plombier', 'Menuisier', 'Charpentier', 'Couvreur'],
  },
  {
    category: 'finition',
    trades: ['Peintre en bâtiment', 'Carreleur / Faïencier', 'Plâtrier', 'Poseur de revêtement sol', 'Architecte d\'intérieur'],
  },
  {
    category: 'genie_technique',
    trades: ['Climaticien / Frigoriste', 'Chauffagiste', 'Installateur solaire photovoltaïque', 'Ascensoriste'],
  },
  {
    category: 'exterieur',
    trades: ['Paysagiste', 'Terrassier', 'Pisciniste', 'Clôturiste'],
  },
  {
    category: 'renovation',
    trades: ['Rénovateur', 'Étanchéiste', 'Technicien de maintenance', 'Traitement humidité'],
  },
  {
    category: 'numerique',
    trades: ['Domotique / Smart Home', 'Topographe BTP', 'Dessinateur 3D BIM'],
  },
];

interface Artisan {
  id: string;
  name: string;
  avatar: string;
  trade: string;
  city: string;
  country: string;
  certified: boolean;
  rating: number;
  reviews: number;
  specialties: string[];
  available: boolean;
  emergency: boolean;
  priceRange: string;
  dailyRate?: number;
  completedMissions?: number;
  responseTime?: number;
  zone?: string;
  createdAt?: string;
  userId?: string;
  services?: Array<{ id?: string; name?: string; serviceName?: string; description?: string; category?: string; price?: number; basePrice?: number; unit?: string; icon?: string }>;
}

function mapArtisanFromApi(raw: Record<string, unknown>): Artisan {
  const user = raw.user as Record<string, unknown> | null;
  let specialties: string[] = [];
  try {
    const rawSpec = raw.specialties as string[];
    if (typeof rawSpec === 'string') specialties = JSON.parse(rawSpec);
    else if (Array.isArray(rawSpec)) specialties = rawSpec as string[];
  } catch { specialties = []; }
  return {
    id: raw.id as string,
    name: (user?.name || raw.name || '') as string,
    avatar: (user?.avatar || raw.avatar || '') as string,
    trade: (raw.trade || '') as string,
    city: (user?.city || raw.city || '') as string,
    country: (user?.country || raw.country || '') as string,
    certified: (raw.certified ?? false) as boolean,
    rating: (raw.rating ?? 0) as number,
    reviews: (raw.reviews ?? 0) as number,
    specialties,
    available: (raw.available ?? true) as boolean,
    emergency: (raw.emergency ?? false) as boolean,
    priceRange: (raw.priceRange || '') as string,
    dailyRate: raw.dailyRate as number | undefined,
    completedMissions: raw.completedMissions as number | undefined,
    responseTime: raw.responseTime as number | undefined,
    zone: raw.zone as string | undefined,
    createdAt: raw.createdAt as string | undefined,
    userId: raw.userId as string | undefined,
    services: (raw.services || []) as Array<{ id?: string; name?: string; serviceName?: string; description?: string; category?: string; price?: number; basePrice?: number; unit?: string; icon?: string }>,
  };
}

interface ArtisansMarketplaceProps {
  onNavigate: (section: string) => void;
}

function ArtisanSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-primary-pale shadow-sm p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-pale shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-primary-pale rounded w-40" />
          <div className="h-3 bg-primary-pale rounded w-24" />
          <div className="h-3 bg-primary-pale rounded w-32" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-primary-pale rounded-full w-16" />
            <div className="h-5 bg-primary-pale rounded-full w-20" />
            <div className="h-5 bg-primary-pale rounded-full w-14" />
          </div>
        </div>
        <div className="hidden sm:flex flex-col gap-2">
          <div className="h-9 w-28 bg-primary-pale rounded-full" />
          <div className="h-9 w-28 bg-primary-pale rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Section facettes « Métiers » du rail gauche (mono-sélection) ── */
function TradeFacet({
  groups,
  selected,
  onSelect,
  counts,
}: {
  groups: typeof TRADES_BY_CATEGORY;
  selected: string;
  onSelect: (trade: string) => void;
  counts: Record<string, number>;
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() => onSelect('Tous')}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
          selected === 'Tous' ? 'bg-primary-pale font-bold text-primary-deep' : 'hover:bg-primary-pale/60 text-gray-text'
        }`}
      >
        <span className="text-xs">Tous les métiers</span>
        <span className="text-[10px] text-gray-400 font-mono-data">
          {Object.values(counts).reduce((s, n) => s + n, 0)}
        </span>
      </button>

      {groups.map((g) => {
        const groupTotal = g.trades.reduce((s, t) => s + (counts[t] ?? 0), 0);
        const isOpen = openCategory === g.category;
        return (
          <div key={g.category} className="mt-0.5">
            <button
              onClick={() => setOpenCategory(isOpen ? null : g.category)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left hover:bg-primary-pale/60 transition-colors group"
            >
              <span className="text-xs font-semibold text-gray-text group-hover:text-primary-deep">
                {SERVICE_CATEGORY_LABELS[g.category]}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] text-gray-400 font-mono-data">{groupTotal}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </span>
            </button>
            {isOpen && (
              <div className="pl-3 pb-1">
                {g.trades.map((trade) => {
                  const active = selected === trade;
                  return (
                    <button
                      key={trade}
                      onClick={() => onSelect(trade)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                        active ? 'bg-primary-pale font-semibold text-primary-deep' : 'hover:bg-primary-pale/60 text-gray-text'
                      }`}
                    >
                      <span className="text-[11px] truncate">{trade}</span>
                      <span className="text-[10px] text-gray-400 font-mono-data shrink-0 ml-2">{counts[trade] ?? 0}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Ligne de filtre à bascule (rail gauche) ── */
function ToggleFacet({
  label,
  checked,
  onToggle,
  count,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-primary-pale/60 transition-colors text-left"
    >
      <span
        className={`shrink-0 w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
          checked ? 'bg-primary-deep border-primary-deep' : 'border-gray-300 bg-white'
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.5L5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={`text-xs ${checked ? 'text-primary-deep font-semibold' : 'text-gray-text'}`}>{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-[10px] text-gray-400 font-mono-data">{count}</span>
      )}
    </button>
  );
}

export default function ArtisansMarketplace({ onNavigate }: ArtisansMarketplaceProps) {
  // Filtres serveur
  const [selectedTrade, setSelectedTrade] = useState('Tous');
  // Filtres clients (facettes LinkedIn)
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyCertified, setOnlyCertified] = useState(false);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [minRating, setMinRating] = useState<'all' | '4' | '4.5'>('all');
  const [sortBy, setSortBy] = useState('pertinence');
  const [emergencyMode, setEmergencyMode] = useState(false);

  const [showDevis, setShowDevis] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [detailArtisanId, setDetailArtisanId] = useState<string | null>(null);
  const [emergencyConfirm, setEmergencyConfirm] = useState<Artisan | null>(null);
  const [devisForm, setDevisForm] = useState({ title: '', description: '', estimatedBudget: '' });

  // ProMatch IA — CDC §5.5.3: AI-driven matching of artisans to project specs.
  const [promatchResults, setPromatchResults] = useState<Artisan[] | null>(null);
  const [promatchLoading, setPromatchLoading] = useState(false);
  const [promatchBudget, setPromatchBudget] = useState('');

  const { isAuthenticated } = useAuthStore();
  const { selectedCountry } = useCountry();

  const { data, isLoading, error } = useArtisans(
    selectedTrade === 'Tous' ? undefined : selectedTrade,
    undefined,
    selectedCountry,
    1,
    48
  );

  const { data: detailData, isLoading: detailLoading } = useArtisanDetail(detailArtisanId ?? '');

  const createQuote = useCreateArtisanQuote();
  const proMatch = useProMatch();

  const artisans = useMemo(
    () => ((data?.artisans as Record<string, unknown>[]) || []).map(mapArtisanFromApi),
    [data]
  );

  /* Compteurs par métier (base = résultats serveur, avant filtres clients) */
  const tradeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    artisans.forEach((a) => {
      if (a.trade) counts[a.trade] = (counts[a.trade] ?? 0) + 1;
    });
    return counts;
  }, [artisans]);

  /* Filtres clients + tri */
  const filtered = useMemo(() => {
    const list = artisans.filter((a) => {
      if (onlyCertified && !a.certified) return false;
      if (onlyAvailable && !a.available) return false;
      if (emergencyMode && !a.emergency) return false;
      if (minRating !== 'all' && a.rating < Number(minRating)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = `${a.name} ${a.trade} ${a.city} ${a.country}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sortBy === 'note') sorted.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'missions') sorted.sort((a, b) => (b.completedMissions ?? 0) - (a.completedMissions ?? 0));
    else if (sortBy === 'avis') sorted.sort((a, b) => b.reviews - a.reviews);
    else
      sorted.sort(
        (a, b) =>
          Number(b.certified) - Number(a.certified) ||
          b.rating - a.rating ||
          (b.completedMissions ?? 0) - (a.completedMissions ?? 0)
      );
    return sorted;
  }, [artisans, onlyCertified, onlyAvailable, emergencyMode, minRating, searchQuery, sortBy]);

  const certifiedCount = artisans.filter((a) => a.certified).length;
  const availableCount = artisans.filter((a) => a.available).length;
  const emergencyCount = artisans.filter((a) => a.emergency).length;
  const avgRating = artisans.length
    ? Math.round((artisans.reduce((s, a) => s + a.rating, 0) / artisans.length) * 10) / 10
    : 0;
  const totalMissions = artisans.reduce((s, a) => s + (a.completedMissions ?? 0), 0);

  const hasActiveFilters =
    onlyCertified || onlyAvailable || emergencyMode || minRating !== 'all' || !!searchQuery || selectedTrade !== 'Tous';

  const resetFilters = () => {
    setOnlyCertified(false);
    setOnlyAvailable(false);
    setEmergencyMode(false);
    setMinRating('all');
    setSearchQuery('');
    setSelectedTrade('Tous');
  };

  const detailArtisan = detailData?.artisan ? mapArtisanFromApi(detailData.artisan as Record<string, unknown>) : null;

  // CDC §5.5.3 — ProMatch IA: ask the backend to find the best artisans for
  // the currently selected trade + country + optional budget. The backend
  // returns a ranked list (best match first).
  const handleProMatch = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour utiliser ProMatch IA.',
      });
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (selectedTrade === 'Tous') {
      toast({
        title: 'Sélectionnez un métier',
        description: 'Choisissez d\'abord un métier pour lancer ProMatch IA.',
        variant: 'destructive',
      });
      return;
    }
    setPromatchLoading(true);
    try {
      const budgetNum = promatchBudget ? Number(promatchBudget) : undefined;
      const result = await proMatch.mutateAsync({
        trade: selectedTrade,
        country: selectedCountry,
        budget: budgetNum && !isNaN(budgetNum) ? budgetNum : undefined,
      });
      // Defensively handle multiple possible response shapes from the backend.
      const rawList: unknown =
        (result as { matches?: Array<{ artisanId: string; score: number; reason: string }> })?.matches ??
        (result as { artisans?: Array<{ id: string }> })?.artisans ??
        (result as { results?: Array<{ id: string }> })?.results ??
        (Array.isArray(result) ? result : []);
      const matched: Artisan[] = ((rawList as Record<string, unknown>[]) || []).map(mapArtisanFromApi);
      setPromatchResults(matched);
      if (matched.length === 0) {
        toast({
          title: 'Aucun artisan trouvé',
          description: 'ProMatch IA n\'a trouvé aucun artisan correspondant. Essayez d\'élargir votre budget ou votre métier.',
        });
      } else {
        toast({
          title: 'ProMatch IA terminé',
          description: `${matched.length} artisan${matched.length > 1 ? 's' : ''} trouvé${matched.length > 1 ? 's' : ''} pour « ${selectedTrade} ».`,
        });
      }
    } catch (err) {
      toast({
        title: 'Erreur ProMatch IA',
        description: err instanceof Error ? err.message : 'Impossible de lancer ProMatch IA. Réessayez plus tard.',
        variant: 'destructive',
      });
      setPromatchResults(null);
    } finally {
      setPromatchLoading(false);
    }
  };

  const handleResetProMatch = () => {
    setPromatchResults(null);
    setPromatchBudget('');
  };

  const handleViewDetail = (artisan: Artisan) => {
    // CDC §5.5 — Only registered users can view artisan details
    if (!isAuthenticated) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour voir les détails d\'un artisan et demander un devis.',
      });
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setDetailArtisanId(artisan.id);
  };

  const handleBackToList = () => {
    setDetailArtisanId(null);
  };

  const handleOpenDevis = (artisan: Artisan) => {
    setSelectedArtisan(artisan);
    setDevisForm({ title: '', description: '', estimatedBudget: '' });
    setShowDevis(true);
  };

  const handleSubmitDevis = () => {
    if (!selectedArtisan) return;
    createQuote.mutate(
      {
        artisanId: selectedArtisan.id,
        title: devisForm.title,
        description: (devisForm.description as string) || '',
        estimatedBudget: devisForm.estimatedBudget,
      },
      {
        onSuccess: () => {
          toast({ title: 'Devis envoyé', description: `Votre demande de devis a été envoyée à ${selectedArtisan.name}.` });
          setShowDevis(false);
          setSelectedArtisan(null);
          setDevisForm({ title: '', description: '', estimatedBudget: '' });
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible d\'envoyer la demande de devis.', variant: 'destructive' });
        },
      }
    );
  };

  const handleEmergencyCall = (artisan: Artisan) => {
    setEmergencyConfirm(artisan);
  };

  const confirmEmergencyCall = async () => {
    if (!emergencyConfirm) return;
    try {
      // Log the emergency call via the API — CDC §5.5.2: everything transits
      // through the platform and is logged. Returns the artisan's phone number.
      const result = await apiPost<{ call: { id: string; status: string; phone?: string }; phone: string | null }>(
        `/api/artisans/${emergencyConfirm.id}/emergency-call`,
        { note: `Appel d'urgence — ${emergencyConfirm.trade}` },
      );

      toast({
        title: 'Appel urgent lancé',
        description: `${emergencyConfirm.name} a été notifié. L'appel est enregistré sur la plateforme.`,
      });

      // Trigger the actual phone call via tel: if we have the number
      if (result.phone) {
        window.location.href = `tel:${result.phone}`;
      } else {
        toast({
          title: 'Numéro non disponible',
          description: 'L\'artisan n\'a pas de numéro de téléphone renseigné. Il a été notifié via la plateforme.',
        });
      }
      setEmergencyConfirm(null);
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d\'initier l\'appel urgent.',
        variant: 'destructive',
      });
      setEmergencyConfirm(null);
    }
  };

  // ─── DETAIL VIEW ──────────────────────────────────────────────────
  if (detailArtisanId && detailArtisan) {
    const portfolio: string[] = (() => {
      try {
        const raw = (detailData?.artisan as { portfolio?: Array<{ title: string; image: string; type: string }> })?.portfolio;
        if (typeof raw === 'string') return JSON.parse(raw);
        if (Array.isArray(raw)) return raw;
      } catch {}
      return [];
    })();

    return (
      <section className="min-h-screen pb-24 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Back button */}
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-gray-text hover:text-primary-deep mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au répertoire
          </button>

          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-primary-deep border-t-transparent rounded-full" />
            </div>
          ) : (
            <div>
              {/* Header card — style profil professionnel */}
              <div className="bg-white rounded-2xl shadow-lg border border-primary-pale mb-6 overflow-hidden">
                {/* Bandeau identité */}
                <div className="h-20 bg-primary-deep" />
                <div className="px-6 sm:px-8 pb-6">
                  <div className="flex flex-col sm:flex-row gap-5 -mt-10">
                    {/* Avatar */}
                    <div className="shrink-0 w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-white">
                      <ImageWithFallback
                        src={detailArtisan.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt={detailArtisan.name}
                        className="absolute inset-0 w-full h-full"
                        fallbackType="avatar"
                        fill
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 sm:pt-10">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h1 className="font-serif text-2xl font-bold text-primary-deep">
                          {detailArtisan.name}
                        </h1>
                        {detailArtisan.certified && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-pale text-primary-deep border border-primary-green/30">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Certifié AfriBayit
                          </span>
                        )}
                      </div>
                      <p className="text-gray-text font-semibold mb-2">{detailArtisan.trade}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-text">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {detailArtisan.city}, {detailArtisan.country}
                        </span>
                        {detailArtisan.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-accent-yellow fill-accent-yellow" />
                            {detailArtisan.rating} ({detailArtisan.reviews} avis)
                          </span>
                        )}
                        {detailArtisan.completedMissions !== undefined && detailArtisan.completedMissions > 0 && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {detailArtisan.completedMissions} missions
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          detailArtisan.available ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {detailArtisan.available ? 'Disponible' : 'Occupé'}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3 mt-5">
                        <button
                          onClick={() => handleOpenDevis(detailArtisan)}
                          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary-deep text-white text-sm font-bold shadow-md hover:bg-primary-green transition-colors"
                        >
                          <Wrench className="w-4 h-4" />
                          Demander un devis
                        </button>
                        {detailArtisan.emergency && (
                          <button
                            onClick={() => handleEmergencyCall(detailArtisan)}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#D93025] text-white text-sm font-bold shadow-md hover:bg-[#b5251f] transition-colors"
                          >
                            <Siren className="w-4 h-4" />
                            Appel d'urgence 24h/7j
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-3 max-w-md">
                        Toute demande de devis et commande de service transite par AfriBayit.
                        Le paiement est sécurisé via escrow (acompte 30%, solde après validation).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              {detailArtisan.specialties.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-pale mb-6">
                  <h3 className="text-sm font-bold text-primary-deep mb-3">Spécialités</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailArtisan.specialties.map((spec) => (
                      <span key={spec} className="px-3 py-1.5 bg-primary-pale text-primary-deep text-xs font-medium rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {detailArtisan.services && detailArtisan.services.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-pale mb-6">
                  <h3 className="text-sm font-bold text-primary-deep mb-4">Services proposés</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detailArtisan.services.map((service: { id?: string; name?: string; serviceName?: string; description?: string; category?: string; price?: number; basePrice?: number; unit?: string; icon?: string }) => (
                      <div key={service.id} className="p-4 rounded-xl bg-primary-pale/40 border border-primary-pale">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-primary-deep text-sm">{service.serviceName}</h4>
                          {service.basePrice && (
                            <span className="text-accent-dark font-bold text-sm">
                              {new Intl.NumberFormat('fr-FR').format(service.basePrice)} FCFA
                              {service.unit && <span className="text-gray-400 text-xs">/{service.unit}</span>}
                            </span>
                          )}
                        </div>
                        {service.description && <p className="text-xs text-gray-text">{service.description}</p>}
                        {service.category && (
                          <span className="inline-block mt-2 px-2 py-1 rounded-full text-[10px] font-bold bg-primary-pale text-primary-deep border border-primary-green/20">
                            {SERVICE_CATEGORY_LABELS[service.category] || service.category}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio */}
              {portfolio.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-primary-pale mb-6">
                  <h3 className="text-sm font-bold text-primary-deep mb-4">Réalisations</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolio.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden relative">
                        <ImageWithFallback
                          src={img}
                          alt={`Réalisation ${i + 1}`}
                          className="absolute inset-0 w-full h-full"
                          fallbackType="property"
                          fill
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {detailArtisan.dailyRate && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-pale text-center">
                    <DollarSign className="w-5 h-5 text-accent-yellow mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Tarif jour</p>
                    <p className="text-sm font-bold text-primary-deep">{new Intl.NumberFormat('fr-FR').format(detailArtisan.dailyRate)} FCFA</p>
                  </div>
                )}
                {detailArtisan.priceRange && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-pale text-center">
                    <DollarSign className="w-5 h-5 text-accent-yellow mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Gamme prix</p>
                    <p className="text-sm font-bold text-primary-deep">{detailArtisan.priceRange}</p>
                  </div>
                )}
                {detailArtisan.responseTime && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-pale text-center">
                    <Clock className="w-5 h-5 text-primary-green mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Réponse</p>
                    <p className="text-sm font-bold text-primary-deep">~{detailArtisan.responseTime} min</p>
                  </div>
                )}
                {detailArtisan.zone && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary-pale text-center">
                    <MapPin className="w-5 h-5 text-primary-deep mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Zone</p>
                    <p className="text-sm font-bold text-primary-deep">{detailArtisan.zone}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Devis modal — shared between list and detail */}
        {showDevis && selectedArtisan && <DevisModal />}
      </section>
    );
  }

  // ─── LIST VIEW — hub professionnel type LinkedIn ──────────────────
  return (
    <HubShell
      title="Répertoire des Artisans"
      subtitle="Annuaire professionnel des artisans BTP vérifiés en Afrique de l'Ouest"
      icon={<Wrench className="w-5 h-5" />}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Rechercher par nom, métier, ville…"
      countryLabel={COUNTRY_NAMES[selectedCountry] || selectedCountry}
      actions={
        <button
          onClick={() => setEmergencyMode(!emergencyMode)}
          className={`hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs transition-colors ${
            emergencyMode
              ? 'bg-[#D93025] text-white shadow-md'
              : 'bg-white border border-[#D93025]/50 text-[#D93025] hover:bg-[#D93025]/5'
          }`}
        >
          <Siren className="w-4 h-4" />
          {emergencyMode ? 'Mode urgence actif' : 'Urgence 24h/7j'}
        </button>
      }
      sidebar={
        <>
          {/* Facettes */}
          <HubPanel title="Filtres" titleIcon={<Filter className="w-3.5 h-3.5" />}>
            <TradeFacet
              groups={TRADES_BY_CATEGORY}
              selected={selectedTrade}
              onSelect={setSelectedTrade}
              counts={tradeCounts}
            />
            <div className="border-t border-primary-pale/70 my-3" />
            <ToggleFacet label="Certifiés AfriBayit" checked={onlyCertified} onToggle={() => setOnlyCertified((v) => !v)} count={certifiedCount} />
            <ToggleFacet label="Disponibles maintenant" checked={onlyAvailable} onToggle={() => setOnlyAvailable((v) => !v)} count={availableCount} />
            <ToggleFacet label="Intervention d'urgence" checked={emergencyMode} onToggle={() => setEmergencyMode((v) => !v)} count={emergencyCount} />
            <div className="border-t border-primary-pale/70 my-3" />
            <p className="text-xs font-bold text-primary-deep mb-2">Note minimale</p>
            <div className="flex gap-1.5">
              {(['all', '4', '4.5'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setMinRating(r)}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-semibold border transition-colors ${
                    minRating === r
                      ? 'bg-primary-deep text-white border-primary-deep'
                      : 'bg-white text-gray-text border-primary-pale hover:bg-primary-pale'
                  }`}
                >
                  {r === 'all' ? 'Toutes' : `≥ ${r}`}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full mt-4 py-2 rounded-full border border-primary-deep/20 text-primary-deep text-xs font-bold hover:bg-primary-pale transition-colors"
              >
                Réinitialiser les filtres
              </button>
            )}
          </HubPanel>
        </>
      }
      aside={
        <>
          {/* ProMatch IA — CDC §5.5.3 */}
          <HubPanel title="ProMatch IA" titleIcon={<Sparkles className="w-3.5 h-3.5 text-accent-dark" />}>
            <p className="text-[11px] text-gray-text leading-relaxed mb-3">
              L'IA AfriBayit sélectionne les meilleurs profils selon votre métier, votre pays et votre budget.
            </p>
            {selectedTrade !== 'Tous' && (
              <p className="text-[11px] text-primary-deep font-semibold mb-2 truncate">
                Métier : « {selectedTrade} »
              </p>
            )}
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={promatchBudget}
              onChange={(e) => setPromatchBudget(e.target.value)}
              placeholder="Budget projet (FCFA)"
              className="w-full px-3 py-2.5 rounded-xl border border-primary-pale bg-white text-xs outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-colors mb-2.5"
            />
            <button
              onClick={handleProMatch}
              disabled={promatchLoading || selectedTrade === 'Tous'}
              className="w-full py-2.5 rounded-full bg-primary-deep text-white text-xs font-bold shadow-md hover:bg-primary-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {promatchLoading ? 'Analyse en cours…' : 'Lancer ProMatch IA'}
            </button>
            {promatchResults !== null && (
              <button
                onClick={handleResetProMatch}
                className="w-full mt-2 py-2 rounded-full border border-primary-deep/20 text-primary-deep text-xs font-bold hover:bg-primary-pale transition-colors"
              >
                Revenir au répertoire
              </button>
            )}
          </HubPanel>

          {/* Chiffres du répertoire */}
          <HubPanel title="L'annuaire en chiffres" titleIcon={<Briefcase className="w-3.5 h-3.5" />}>
            <dl className="space-y-2.5">
              {[
                { label: 'Artisans référencés', value: `${artisans.length}` },
                { label: 'Profils certifiés', value: `${certifiedCount}${artisans.length ? ` (${Math.round((certifiedCount / artisans.length) * 100)}%)` : ''}` },
                { label: 'Missions réalisées', value: `${totalMissions}` },
                { label: 'Note moyenne', value: avgRating ? `${avgRating}/5` : '—' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between text-xs">
                  <dt className="text-gray-text">{row.label}</dt>
                  <dd className="font-bold text-primary-deep font-mono-data">{row.value}</dd>
                </div>
              ))}
            </dl>
          </HubPanel>

          {/* Escrow */}
          <HubPanel title="Paiement sécurisé" titleIcon={<ShieldCheck className="w-3.5 h-3.5" />}>
            <p className="text-[11px] text-gray-text leading-relaxed mb-3">
              Toute commande transite par AfriBayit — les fonds sont bloqués en escrow et libérés seulement après validation du chantier.
            </p>
            <ol className="space-y-2">
              {['Acompte 30 % bloqué en escrow', 'Chantier réalisé et contrôlé', 'Solde 70 % libéré à l\'artisan'].map((step, i) => (
                <li key={step} className="flex items-start gap-2.5 text-[11px] text-gray-text">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-primary-deep text-white text-[9px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </HubPanel>

          {/* Urgence (mobile hidden aside is lg+, keep emergency CTA visible) */}
          <div className="bg-white rounded-2xl border border-[#D93025]/30 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Siren className="w-4 h-4 text-[#D93025]" />
              <h3 className="text-[11px] font-bold text-[#D93025] uppercase tracking-wider">Urgence 24h/7j</h3>
            </div>
            <p className="text-[11px] text-gray-text leading-relaxed mb-3">
              Fuite, panne électrique, serrure bloquée ? Activez le mode urgence pour ne voir que les artisans intervenant sous 24h.
            </p>
            <button
              onClick={() => setEmergencyMode((v) => !v)}
              className={`w-full py-2.5 rounded-full text-xs font-bold transition-colors ${
                emergencyMode ? 'bg-[#D93025] text-white' : 'bg-[#D93025]/10 text-[#D93025] hover:bg-[#D93025]/20'
              }`}
            >
              {emergencyMode ? 'Désactiver le mode urgence' : 'Activer le mode urgence'}
            </button>
          </div>
        </>
      }
    >
      {/* En-tête de résultats */}
      <HubResultsHeader
        count={promatchResults !== null ? promatchResults.length : filtered.length}
        total={artisans.length}
        sort={sortBy}
        onSortChange={setSortBy}
      >
        {emergencyMode && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-[#D93025] border border-red-200 text-[11px] font-bold">
            <Siren className="w-3.5 h-3.5" /> Mode urgence actif
          </span>
        )}
      </HubResultsHeader>

      {/* Résultats ProMatch IA — remplacent la liste quand actifs */}
      {promatchResults !== null && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-bold text-primary-deep flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-dark" />
              Résultats ProMatch IA
              <span className="px-2 py-0.5 rounded-full bg-accent-pale text-accent-dark border border-accent-yellow/40 text-[10px] font-bold">
                {promatchResults.length} match{promatchResults.length > 1 ? 'es' : ''}
              </span>
            </h2>
          </div>
          {promatchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-primary-pale text-center">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-text font-semibold mb-1">Aucun artisan ne correspond</p>
              <p className="text-sm text-gray-400">Essayez d&apos;augmenter votre budget ou de changer de métier.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promatchResults.map((artisan, i) => (
                <ArtisanProfileCard
                  key={artisan.id}
                  artisan={artisan}
                  rank={i + 1}
                  emergencyMode={false}
                  onView={handleViewDetail}
                  onDevis={handleOpenDevis}
                  onEmergency={handleEmergencyCall}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading / Error / Empty states */}
      {promatchResults === null && isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ArtisanSkeleton key={i} />)}
        </div>
      )}
      {promatchResults === null && error && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-primary-pale text-center">
          <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-text font-semibold mb-1">Impossible de charger les artisans</p>
          <p className="text-sm text-gray-400">{error.message}</p>
        </div>
      )}
      {promatchResults === null && !isLoading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-10 shadow-sm border border-primary-pale text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-text font-semibold mb-1">Aucun artisan ne correspond à ces critères</p>
          <p className="text-sm text-gray-400 mb-4">Élargissez vos filtres ou réinitialisez la recherche.</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-full bg-primary-deep text-white text-xs font-bold hover:bg-primary-green transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Cartes profils */}
      {promatchResults === null && !isLoading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((artisan) => (
            <ArtisanProfileCard
              key={artisan.id}
              artisan={artisan}
              emergencyMode={emergencyMode}
              onView={handleViewDetail}
              onDevis={handleOpenDevis}
              onEmergency={handleEmergencyCall}
            />
          ))}
        </div>
      )}

      {/* Devis modal */}
      {showDevis && selectedArtisan && <DevisModal />}

      {/* Emergency call confirmation modal */}
      {emergencyConfirm && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
          onClick={() => setEmergencyConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-primary-pale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D93025]/10 flex items-center justify-center">
                <Siren className="w-5 h-5 text-[#D93025]" />
              </div>
              <h3 className="font-serif text-lg font-bold text-primary-deep">Appel d&apos;urgence</h3>
            </div>
            <p className="text-sm text-gray-text mb-2">
              Vous êtes sur le point d&apos;appeler <strong>{emergencyConfirm.name}</strong> ({emergencyConfirm.trade}) en urgence.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              L&apos;appel sera enregistré sur la plateforme AfriBayit pour suivi et sécurité.
              L&apos;artisan sera notifié immédiatement. Le numéro de téléphone sera lancé via votre appareil.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setEmergencyConfirm(null)}
                className="flex-1 py-2.5 rounded-full border border-primary-deep/20 text-primary-deep bg-white text-sm font-bold hover:bg-primary-pale transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmEmergencyCall}
                className="flex-1 py-2.5 rounded-full bg-[#D93025] text-white text-sm font-bold hover:bg-[#b5251f] transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Appeler maintenant
              </button>
            </div>
          </div>
        </div>
      )}
    </HubShell>
  );

  /* ── Carte profil artisan — style annuaire professionnel ── */
  function ArtisanProfileCard({
    artisan,
    rank,
    emergencyMode: urgency,
    onView,
    onDevis,
    onEmergency,
  }: {
    artisan: Artisan;
    rank?: number;
    emergencyMode: boolean;
    onView: (a: Artisan) => void;
    onDevis: (a: Artisan) => void;
    onEmergency: (a: Artisan) => void;
  }) {
    return (
      <HubProfileCard
        onClick={() => onView(artisan)}
        badge={
          rank !== undefined ? (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-yellow text-primary-deep text-[10px] font-bold shadow-sm">
              <Sparkles className="w-3 h-3" /> Match #{rank}
            </span>
          ) : undefined
        }
        avatar={
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-pale relative bg-gray-100">
            <ImageWithFallback
              src={artisan.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
              alt={artisan.name}
              className="absolute inset-0 w-full h-full"
              fallbackType="avatar"
              fill
            />
          </div>
        }
        name={artisan.name}
        verified={artisan.certified}
        verifiedLabel="Certifié"
        headline={artisan.trade}
        location={
          <>
            <MapPin className="w-3.5 h-3.5" />
            {artisan.city}, {artisan.country}
            {artisan.zone && <span className="text-gray-300">· {artisan.zone}</span>}
          </>
        }
        chips={[
          ...(artisan.specialties || []).map((s) => ({ label: s })),
          ...(artisan.emergency ? [{ label: 'Urgence 24h/7j', tone: 'red' as const }] : []),
        ]}
        stats={[
          ...(artisan.rating > 0
            ? [{ label: `/5 · ${artisan.reviews} avis`, value: artisan.rating.toFixed(1), icon: <Star className="w-3.5 h-3.5 text-accent-yellow fill-accent-yellow" /> }]
            : []),
          ...(artisan.completedMissions !== undefined && artisan.completedMissions > 0
            ? [{ label: 'missions', value: String(artisan.completedMissions), icon: <Briefcase className="w-3.5 h-3.5" /> }]
            : []),
          ...(artisan.responseTime
            ? [{ label: 'min de réponse', value: `~${artisan.responseTime}`, icon: <Clock className="w-3.5 h-3.5" /> }]
            : []),
          ...(artisan.priceRange ? [{ label: artisan.priceRange, value: '', icon: <DollarSign className="w-3.5 h-3.5" /> }] : []),
        ]}
        actions={
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onDevis(artisan); }}
              className="px-4 py-2.5 rounded-full bg-primary-deep text-white text-xs font-bold shadow-sm hover:bg-primary-green transition-colors whitespace-nowrap"
            >
              Demander un devis
            </button>
            {urgency && artisan.emergency && (
              <button
                onClick={(e) => { e.stopPropagation(); onEmergency(artisan); }}
                className="px-4 py-2.5 rounded-full bg-[#D93025] text-white text-xs font-bold hover:bg-[#b5251f] transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Siren className="w-3.5 h-3.5" /> Urgent
              </button>
            )}
          </>
        }
      >
        <div className="mt-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
              artisan.available ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${artisan.available ? 'bg-green-500' : 'bg-gray-400'}`} />
            {artisan.available ? 'Disponible maintenant' : 'Actuellement occupé'}
          </span>
        </div>
      </HubProfileCard>
    );
  }

  // ─── Devis Modal (inline component function) ─────────────────────
  function DevisModal() {
    if (!selectedArtisan) return null;
    return (
      <div
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
        onClick={() => setShowDevis(false)}
      >
        <div
          className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-primary-pale"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary-deep">Demander un devis</h3>
              <p className="text-xs text-gray-text">À {selectedArtisan.name} — {selectedArtisan.trade}</p>
            </div>
            <button onClick={() => setShowDevis(false)} className="p-2 rounded-full hover:bg-primary-pale transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Titre du projet</label>
              <input
                type="text"
                value={devisForm.title}
                onChange={(e) => setDevisForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ex: Rénovation salle de bain"
                className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea
                rows={3}
                value={devisForm.description}
                onChange={(e) => setDevisForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez vos besoins..."
                className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none resize-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">Budget estimé</label>
              <input
                type="text"
                value={devisForm.estimatedBudget}
                onChange={(e) => setDevisForm(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                placeholder="ex: 500 000 FCFA"
                className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDevis(false)}
                className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitDevis}
                disabled={createQuote.isPending || !devisForm.title}
                className="flex-1 py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {createQuote.isPending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

