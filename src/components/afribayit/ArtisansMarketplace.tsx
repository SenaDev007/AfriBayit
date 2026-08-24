'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useArtisans, useArtisanDetail, useCreateArtisanQuote, useProMatch } from '@/hooks/useArtisans';
import { useCreateNotification } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api-client';
import { AlertTriangle, Search, Siren, Wrench, ArrowLeft, Phone, MapPin, Star, CheckCircle, Clock, DollarSign, Briefcase, X, Sparkles } from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

const easeOut = [0.16, 1, 0.3, 1] as const;

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

const trades = ['Tous', ...TRADES_BY_CATEGORY.flatMap(c => c.trades)];

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
    const rawSpec = raw.specialties as any;
    if (typeof rawSpec === 'string') specialties = JSON.parse(rawSpec);
    else if (Array.isArray(rawSpec)) specialties = rawSpec as string[];
  } catch { specialties = []; }
  let portfolio: string[] = [];
  try {
    const rawPort = raw.portfolio as any;
    if (typeof rawPort === 'string') portfolio = JSON.parse(rawPort);
    else if (Array.isArray(rawPort)) portfolio = rawPort as string[];
  } catch { portfolio = []; }
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
    <div className="bg-white rounded-xl p-5 shadow-sm border animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-14 h-14 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-16" />
          <div className="h-3 bg-gray-200 rounded w-20 mt-1" />
        </div>
      </div>
      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
  );
}

export default function ArtisansMarketplace({ onNavigate }: ArtisansMarketplaceProps) {
  const [selectedTrade, setSelectedTrade] = useState('Tous');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showDevis, setShowDevis] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [detailArtisanId, setDetailArtisanId] = useState<string | null>(null);
  const [emergencyConfirm, setEmergencyConfirm] = useState<Artisan | null>(null);
  const [devisForm, setDevisForm] = useState({ title: '', description: '', estimatedBudget: '' });

  // ProMatch IA — CDC §5.5.3: AI-driven matching of artisans to project specs.
  // `promatchResults` holds the matched artisans returned by the backend.
  // `promatchLoading` mirrors the mutation's pending state for button feedback.
  // `promatchBudget` is the optional project budget (FCFA) used as a matching input.
  const [promatchResults, setPromatchResults] = useState<Artisan[] | null>(null);
  const [promatchLoading, setPromatchLoading] = useState(false);
  const [promatchBudget, setPromatchBudget] = useState('');

  const { user, isAuthenticated } = useAuthStore();
  const { selectedCountry } = useCountry();

  const { data, isLoading, error } = useArtisans(
    selectedTrade === 'Tous' ? undefined : selectedTrade,
    undefined,
    selectedCountry
  );

  const { data: detailData, isLoading: detailLoading } = useArtisanDetail(detailArtisanId || '');

  const createQuote = useCreateArtisanQuote();
  const createNotification = useCreateNotification();
  const proMatch = useProMatch();

  const artisans: Artisan[] = ((data?.artisans as Record<string, unknown>[]) || []).map(mapArtisanFromApi);

  const filtered = selectedTrade === 'Tous' ? artisans : artisans.filter(a => a.trade === selectedTrade);

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
      <section className="min-h-screen pb-24 bg-gray-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Back button */}
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>

          {detailLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              {/* Header card */}
              <div className="bg-white rounded-xl p-8 shadow-sm border mb-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#D4AF37] relative">
                    <ImageWithFallback
                      src={detailArtisan.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                      alt={detailArtisan.name}
                      className="absolute inset-0 w-full h-full"
                      fallbackType="avatar"
                      fill
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-[#0a2a5e]" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                        {detailArtisan.name}
                      </h1>
                      {detailArtisan.certified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00A651]/10 text-[#00A651]">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Certifié AfriBayit
                        </span>
                      )}
                    </div>
                    <p className="text-[#D4AF37] font-semibold mb-2">{detailArtisan.trade}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {detailArtisan.city}, {detailArtisan.country}
                      </span>
                      {detailArtisan.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
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
                        detailArtisan.available ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {detailArtisan.available ? 'Disponible' : 'Occupé'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-6">
                  <button
                    onClick={() => handleOpenDevis(detailArtisan)}
                    className="flex items-center gap-2 px-6 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    Demander un devis
                  </button>
                  {detailArtisan.emergency && (
                    <button
                      onClick={() => handleEmergencyCall(detailArtisan)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#D93025] text-white rounded-lg text-sm font-semibold hover:bg-[#b5251f] transition-colors"
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

              {/* Specialties */}
              {detailArtisan.specialties.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                  <h3 className="text-sm font-bold text-[#0a2a5e] mb-3">Spécialités</h3>
                  <div className="flex flex-wrap gap-2">
                    {detailArtisan.specialties.map((spec) => (
                      <span key={spec} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {detailArtisan.services && detailArtisan.services.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                  <h3 className="text-sm font-bold text-[#0a2a5e] mb-4">Services proposés</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {detailArtisan.services.map((service: { id?: string; name?: string; serviceName?: string; description?: string; category?: string; price?: number; basePrice?: number; unit?: string; icon?: string }) => (
                      <div key={service.id} className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-[#0a2a5e] text-sm">{service.serviceName}</h4>
                          {service.basePrice && (
                            <span className="text-[#D4AF37] font-bold text-sm">
                              {new Intl.NumberFormat('fr-FR').format(service.basePrice)} FCFA
                              {service.unit && <span className="text-gray-400 text-xs">/{service.unit}</span>}
                            </span>
                          )}
                        </div>
                        {service.description && <p className="text-xs text-gray-500">{service.description}</p>}
                        {service.category && (
                          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#003087]/5 text-[#003087]">
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
                <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                  <h3 className="text-sm font-bold text-[#0a2a5e] mb-4">Réalisations</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {portfolio.map((img, i) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden relative">
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
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <DollarSign className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Tarif jour</p>
                    <p className="text-sm font-bold text-[#0a2a5e]">{new Intl.NumberFormat('fr-FR').format(detailArtisan.dailyRate)} FCFA</p>
                  </div>
                )}
                {detailArtisan.priceRange && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <DollarSign className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Gamme prix</p>
                    <p className="text-sm font-bold text-[#0a2a5e]">{detailArtisan.priceRange}</p>
                  </div>
                )}
                {detailArtisan.responseTime && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <Clock className="w-5 h-5 text-[#009CDE] mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Réponse</p>
                    <p className="text-sm font-bold text-[#0a2a5e]">~{detailArtisan.responseTime} min</p>
                  </div>
                )}
                {detailArtisan.zone && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <MapPin className="w-5 h-5 text-[#003087] mx-auto mb-1" />
                    <p className="text-xs text-gray-400">Zone</p>
                    <p className="text-sm font-bold text-[#0a2a5e]">{detailArtisan.zone}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Devis modal — shared between list and detail */}
        {showDevis && selectedArtisan && <DevisModal />}
      </section>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────
  return (
    <section className="min-h-screen pb-24 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            <Wrench className="w-4 h-4" /> ProMatch
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0a2a5e] mb-3">
            Artisans <span className="text-[#D4AF37]">Certifiés</span>
          </h1>
          <p className="text-gray-500 max-w-lg">
            Trouvez les meilleurs artisans pour vos projets immobiliers. Vérifiés, notés, et disponibles.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Emergency Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${
              emergencyMode
                ? 'bg-[#D93025] text-white shadow-lg animate-pulse'
                : 'bg-white border-2 border-[#D93025] text-[#D93025] hover:bg-[#D93025]/5'
            }`}
          >
            <Siren className="w-4 h-4" />
            {emergencyMode ? 'Mode Urgence Activé - Artisans < 10km' : 'Urgence ? Trouvez un artisan près de vous'}
          </button>
        </motion.div>

        {/* Trade Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {trades.map((trade) => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedTrade === trade
                  ? 'bg-[#003087] text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {trade}
            </button>
          ))}
        </div>

        {/* ProMatch IA — CDC §5.5.3 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-br from-[#003087]/5 via-white to-[#D4AF37]/5 border border-[#003087]/15 rounded-2xl p-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <h3 className="font-display text-base font-bold text-[#0a2a5e] flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                ProMatch IA
              </h3>
              <p className="text-xs text-gray-500">
                Notre IA trouve les meilleurs artisans pour votre projet selon le métier, le pays et votre budget.
                {selectedTrade !== 'Tous' && (
                  <span className="ml-1 text-[#003087] font-semibold">Métier sélectionné : « {selectedTrade} ».</span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div>
                <label htmlFor="promatch-budget" className="text-[11px] font-semibold text-gray-600 mb-1 block">
                  Budget projet (FCFA, optionnel)
                </label>
                <input
                  id="promatch-budget"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={promatchBudget}
                  onChange={(e) => setPromatchBudget(e.target.value)}
                  placeholder="ex: 500000"
                  className="w-full sm:w-44 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#003087] transition-colors"
                />
              </div>
              <button
                onClick={handleProMatch}
                disabled={promatchLoading || selectedTrade === 'Tous'}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {promatchLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Analyse…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    ProMatch IA
                  </>
                )}
              </button>
              {promatchResults !== null && (
                <button
                  onClick={handleResetProMatch}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ProMatch Results — replaces the regular artisan list when active */}
        {promatchResults !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-[#0a2a5e] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                Résultats ProMatch IA
                <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#B8860B] text-[10px] font-bold">
                  {promatchResults.length} match{promatchResults.length > 1 ? 'es' : ''}
                </span>
              </h3>
            </div>
            {promatchResults.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border text-center">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Aucun artisan ne correspond</p>
                <p className="text-sm text-gray-400">Essayez d&apos;augmenter votre budget ou de changer de métier.</p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-5">
                {promatchResults.map((artisan, i) => (
                  <motion.div
                    key={artisan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                    whileHover={{ y: -4 }}
                    onClick={() => handleViewDetail(artisan)}
                    className="relative bg-white rounded-xl p-5 shadow-sm border-2 border-[#D4AF37]/30 cursor-pointer w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
                  >
                    <span className="absolute -top-2 left-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4AF37] text-white text-[10px] font-bold shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" /> Match #{i + 1}
                    </span>
                    <div className="flex items-start gap-3 mb-4 mt-2">
                      <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] relative">
                        <ImageWithFallback
                          src={artisan.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
                          alt={artisan.name}
                          className="absolute inset-0 w-full h-full"
                          fallbackType="avatar"
                          fill
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#0a2a5e]">{artisan.name}</h3>
                          {artisan.certified && (
                            <CheckCircle className="w-4 h-4 text-[#009CDE]" />
                          )}
                        </div>
                        <p className="text-xs font-medium text-[#D4AF37]">{artisan.trade}</p>
                        <p className="text-xs text-gray-500">{artisan.city}, {artisan.country}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-sm font-semibold text-[#0a2a5e]">{artisan.rating}</span>
                        <span className="text-xs text-gray-400">({artisan.reviews})</span>
                      </div>
                      <span className="text-xs text-gray-500">{artisan.priceRange}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Loading / Error / Empty states */}
        {promatchResults === null && isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <ArtisanSkeleton key={i} />)}
          </div>
        )}
        {promatchResults === null && error && (
          <div className="text-center py-12">
            <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold mb-1">Impossible de charger les artisans</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        )}
        {promatchResults === null && !isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold mb-1">Aucun artisan trouvé</p>
            <p className="text-sm text-gray-400">Essayez un autre filtre ou revenez plus tard</p>
          </div>
        )}

        {/* Artisan Cards */}
        {promatchResults === null && !isLoading && !error && filtered.length > 0 && (
          <div className="flex flex-wrap justify-center gap-5">
            {filtered.map((artisan, i) => (
              <motion.div
                key={artisan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                whileHover={{ y: -4 }}
                onClick={() => handleViewDetail(artisan)}
                className="bg-white rounded-xl p-5 shadow-sm border cursor-pointer w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-[#D4AF37] relative">
                    <ImageWithFallback
                      src={artisan.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'}
                      alt={artisan.name}
                      className="absolute inset-0 w-full h-full"
                      fallbackType="avatar"
                      fill
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#0a2a5e]">{artisan.name}</h3>
                      {artisan.certified && (
                        <CheckCircle className="w-4 h-4 text-[#009CDE]" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#D4AF37]">{artisan.trade}</p>
                    <p className="text-xs text-gray-500">{artisan.city}, {artisan.country}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                    artisan.available ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {artisan.available ? 'Disponible' : 'Occupé'}
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {artisan.specialties.slice(0, 3).map((spec) => (
                    <span key={spec} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>

                {/* Rating & Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-sm font-semibold text-[#0a2a5e]">{artisan.rating}</span>
                    <span className="text-xs text-gray-400">({artisan.reviews})</span>
                  </div>
                  <span className="text-xs text-gray-500">{artisan.priceRange}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {artisan.emergency && emergencyMode && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEmergencyCall(artisan); }}
                      className="flex-1 py-2.5 bg-[#D93025] text-white rounded-lg text-sm font-semibold hover:bg-[#b5251f] transition-colors"
                    >
                      <Siren className="w-4 h-4" /> Urgent
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenDevis(artisan); }}
                    className="flex-1 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    Demander devis
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Devis modal */}
        {showDevis && selectedArtisan && <DevisModal />}

        {/* Emergency call confirmation modal */}
        {emergencyConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setEmergencyConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#D93025]/10 flex items-center justify-center">
                  <Siren className="w-5 h-5 text-[#D93025]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#0a2a5e]">Appel d&apos;urgence</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Vous êtes sur le point d&apos;appeler <strong>{emergencyConfirm.name}</strong> ({emergencyConfirm.trade}) en urgence.
              </p>
              <p className="text-xs text-gray-400 mb-4">
                L&apos;appel sera enregistré sur la plateforme AfriBayit pour suivi et sécurité.
                L&apos;artisan sera notifié immédiatement. Le numéro de téléphone sera lancé via votre appareil.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setEmergencyConfirm(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmEmergencyCall}
                  className="flex-1 py-2.5 bg-[#D93025] text-white rounded-lg text-sm font-semibold hover:bg-[#b5251f] transition-colors flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Appeler maintenant
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );

  // ─── Devis Modal (inline component function) ─────────────────────
  function DevisModal() {
    if (!selectedArtisan) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
        onClick={() => setShowDevis(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold text-[#0a2a5e]">Demander un devis</h3>
              <p className="text-xs text-gray-500">À {selectedArtisan.name} — {selectedArtisan.trade}</p>
            </div>
            <button onClick={() => setShowDevis(false)} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Titre du projet</label>
              <input
                type="text"
                value={devisForm.title}
                onChange={(e) => setDevisForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="ex: Rénovation salle de bain"
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
              <textarea
                rows={3}
                value={devisForm.description}
                onChange={(e) => setDevisForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez vos besoins..."
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Budget estimé</label>
              <input
                type="text"
                value={devisForm.estimatedBudget}
                onChange={(e) => setDevisForm(prev => ({ ...prev, estimatedBudget: e.target.value }))}
                placeholder="ex: 500 000 FCFA"
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDevis(false)}
                className="flex-1 py-3 border rounded-lg text-sm font-semibold text-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitDevis}
                disabled={createQuote.isPending || !devisForm.title}
                className="flex-1 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
              >
                {createQuote.isPending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
}
