'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useArtisans, useCreateArtisanQuote } from '@/hooks/useArtisans';
import { useCreateNotification } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, Search, Siren, Wrench } from 'lucide-react';

import {  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

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
  createdAt?: string;
  userId?: string;
}

function mapArtisanFromApi(raw: Record<string, unknown>): Artisan {
  const user = raw.user as Record<string, unknown> | null;
  let specialties: string[] = [];
  try {
    const rawSpec = raw.specialties;
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
    createdAt: raw.createdAt as string | undefined,
    userId: raw.userId as string | undefined,
  };
}

interface ArtisansMarketplaceProps {
  onNavigate: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const trades = ['Tous', 'Électricien', 'Plombier', 'Maçon', 'Peintre', 'Menuisier', 'Architecte d\'intérieur', 'Chauffagiste', 'Couvreur'];

function ArtisanSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border animate-pulse">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-16 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-5 w-16 bg-gray-100 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 rounded-full" />
        <div className="h-5 w-14 bg-gray-100 rounded-full" />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
      <div className="h-10 bg-gray-200 rounded-full" />
    </div>
  );
}

export default function ArtisansMarketplace({ onNavigate }: ArtisansMarketplaceProps) {
  const [selectedTrade, setSelectedTrade] = useState('Tous');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showDevis, setShowDevis] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [emergencyConfirm, setEmergencyConfirm] = useState<Artisan | null>(null);
  const [devisForm, setDevisForm] = useState({ title: '', description: '', estimatedBudget: '' });

  const { user } = useAuthStore();
  const { selectedCountry } = useCountry();

  const { data, isLoading, error } = useArtisans(
    selectedTrade === 'Tous' ? undefined : selectedTrade,
    undefined,
    selectedCountry
  );

  const createQuote = useCreateArtisanQuote();
  const createNotification = useCreateNotification();

  const artisans: Artisan[] = ((data?.artisans as Record<string, unknown>[]) || []).map(mapArtisanFromApi);

  const filtered = selectedTrade === 'Tous'
    ? artisans
    : artisans.filter(a => a.trade === selectedTrade);

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
        description: devisForm.description,
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

  const confirmEmergencyCall = () => {
    if (!emergencyConfirm) return;
    createNotification.mutate(
      {
        type: 'alert',
        message: `Demande d'artisan urgent : ${emergencyConfirm.name} (${emergencyConfirm.trade}) — Intervention d'urgence requise.`,
        userId: user?.id,
      },
      {
        onSuccess: () => {
          toast({ title: 'Appel urgent envoyé', description: `${emergencyConfirm.name} a été notifié de votre urgence.` });
          setEmergencyConfirm(null);
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible d\'envoyer l\'appel urgent.', variant: 'destructive' });
          setEmergencyConfirm(null);
        },
      }
    );
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            <Wrench className="w-4 h-4" /> ProMatch
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Artisans <span className="text-[#D4AF37]">Certifiés</span>
          </h1>
          <p className="text-gray-500 max-w-lg">
            Trouvez les meilleurs artisans pour vos projets immobiliers. Vérifiés, notés, et disponibles.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
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
            <span className="text-xl"><Siren className="w-4 h-4" /></span>
            {emergencyMode ? 'Mode Urgence Activé - Artisans < 10km' : 'Urgence ? Trouvez un artisan près de vous'}
          </button>
        </motion.div>

        {/* Trade Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {trades.map((trade) => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTrade === trade
                  ? 'bg-[#003087] text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {trade}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArtisanSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3"><AlertTriangle className="w-4 h-4" /></span>
            <p className="text-gray-600 font-semibold mb-1">Impossible de charger les artisans</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3"><Search className="w-4 h-4" /></span>
            <p className="text-gray-600 font-semibold mb-1">Aucun artisan trouvé</p>
            <p className="text-sm text-gray-400">Essayez un autre filtre ou revenez plus tard</p>
          </div>
        )}

        {/* Artisan Cards */}
        {!isLoading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((artisan, i) => (
              <motion.div
                key={artisan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl p-5 shadow-sm border"
              >
                <div className="flex items-start gap-3 mb-4">
                  <img
                    src={artisan.avatar}
                    alt={artisan.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#2C2E2F]">{artisan.name}</h3>
                      {artisan.certified && (
                        <svg className="w-4 h-4 text-[#009CDE]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs font-medium text-[#D4AF37]">{artisan.trade}</p>
                    <p className="text-xs text-gray-500">{artisan.city}, {artisan.country}</p>
                    {artisan.createdAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">Publié {timeAgo(artisan.createdAt)}</p>
                    )}
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
                    <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-[#2C2E2F]">{artisan.rating}</span>
                    <span className="text-xs text-gray-400">({artisan.reviews})</span>
                  </div>
                  <span className="text-xs text-gray-500">{artisan.priceRange}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {artisan.emergency && emergencyMode && (
                    <button
                      onClick={() => handleEmergencyCall(artisan)}
                      className="flex-1 py-2.5 bg-[#D93025] text-white rounded-full text-sm font-semibold hover:bg-[#b5251f] transition-colors"
                    >
                      <Siren className="w-4 h-4" /> Appel urgent
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenDevis(artisan)}
                    className="flex-1 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    Demander devis
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Devis Request Modal */}
        {showDevis && selectedArtisan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowDevis(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-1">Demander un devis</h3>
              <p className="text-xs text-gray-500 mb-4">À {selectedArtisan.name} — {selectedArtisan.trade}</p>
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
                    className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitDevis}
                    disabled={createQuote.isPending || !devisForm.title}
                    className="flex-1 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
                  >
                    {createQuote.isPending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Emergency Confirmation Dialog */}
        <AlertDialog open={!!emergencyConfirm} onOpenChange={(open) => !open && setEmergencyConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer l&apos;appel urgent</AlertDialogTitle>
              <AlertDialogDescription>
                Vous êtes sur le point d&apos;envoyer un appel urgent à {emergencyConfirm?.name} ({emergencyConfirm?.trade}).
                L&apos;artisan sera notifié immédiatement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setEmergencyConfirm(null)}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmEmergencyCall}
                disabled={createNotification.isPending}
                className="bg-[#D93025] text-white hover:bg-[#b5251f]"
              >
                {createNotification.isPending ? 'Envoi...' : 'Confirmer l\'appel'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
