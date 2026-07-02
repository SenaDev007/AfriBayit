'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProperty } from '@/hooks/useProperties';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiDelete } from '@/lib/api';
import { formatPrice } from '@/lib/afribayit-utils';
import { Skeleton } from '@/components/ui/skeleton';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import dynamic from 'next/dynamic';
import { Check, ClipboardList, Eye, Heart, Lock, Map, MapPin, MessageCircle, Share2, Star, ThumbsUp, Copy, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

// Dynamic import for VirtualTourViewer to avoid SSR issues with Three.js
const VirtualTourViewer = dynamic(
  () => import('@/components/afribayit/VirtualTourViewer'),
  { ssr: false, loading: () => <VirtualTourLoader /> }
);

// Dynamic import for PropertyMap to avoid SSR issues with Mapbox
const PropertyMap = dynamic(
  () => import('@/components/afribayit/PropertyMap'),
  { ssr: false, loading: () => <MapLoader /> }
);

function VirtualTourLoader() {
  return (
    <div className="w-full h-[70vh] sm:h-[80vh] bg-black rounded-xl flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full border-4 border-[#D4AF37]/30 flex items-center justify-center mb-4">
        <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-[#D4AF37] border-r-[#D4AF37] animate-spin" />
      </div>
      <p className="text-white/60 text-sm">Chargement du lecteur 3D...</p>
    </div>
  );
}

function MapLoader() {
  return (
    <div className="h-64 rounded-3xl bg-gray-100 animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-gray-300" />
    </div>
  );
}

// ============ Types ============
interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
  onNavigate: (section: string) => void;
}

interface ReviewData {
  id: string;
  reviewerId: string;
  targetId: string;
  targetType: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ReviewsResponse {
  reviews: ReviewData[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

interface VirtualTourData {
  id: string;
  tourType: string;
  url: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
}

interface VirtualToursResponse {
  data: {
    propertyId: string;
    hasVR: boolean;
    hasDroneView: boolean;
    tours: VirtualTourData[];
  };
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function PropertyDetail({ propertyId, onBack, onNavigate: _onNavigate }: PropertyDetailProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useProperty(propertyId);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showVRTour, setShowVRTour] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();

  const property = data?.property;

  // Fetch reviews for this property
  const { data: reviewsData } = useQuery<ReviewsResponse>({
    queryKey: ['reviews', 'property', propertyId],
    queryFn: () => apiFetch<ReviewsResponse>(`/api/reviews?targetId=${propertyId}&targetType=property&limit=10`),
    enabled: !!propertyId,
  });

  // Fetch virtual tours from API
  const { data: toursData } = useQuery<VirtualToursResponse>({
    queryKey: ['virtualTours', propertyId],
    queryFn: () => apiFetch<VirtualToursResponse>(`/api/properties/${propertyId}/virtual-tours`),
    enabled: !!propertyId,
  });

  // Check if property is in favorites
  useEffect(() => {
    if (!isAuthenticated || !propertyId) return;
    fetch(`/api/favorites`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : [])
      .then((favs: { propertyId: string }[]) => {
        setIsFavorite(favs.some((f) => f.propertyId === propertyId));
      })
      .catch(() => {});
  }, [isAuthenticated, propertyId]);

  // Toggle favorite
  const toggleFavorite = useCallback(async () => {
    if (!isAuthenticated) return;
    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await apiDelete(`/api/favorites?propertyId=${propertyId}`);
        setIsFavorite(false);
      } else {
        await apiPost('/api/favorites', { propertyId });
        setIsFavorite(true);
      }
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    } catch (err) {
      console.error('Favorite toggle error:', err);
    } finally {
      setFavoriteLoading(false);
    }
  }, [isAuthenticated, isFavorite, propertyId, queryClient]);

  // Share functionality
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/property/${propertyId}` : '';
  const shareTitle = property?.title || 'Bien immobilier sur AfriBayit';

  const handleShare = useCallback(async (platform: string) => {
    const text = `${shareTitle} - ${shareUrl}`;

    switch (platform) {
      case 'WhatsApp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        break;
      case 'Facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'Twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
        break;
      case 'Telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
        break;
      case 'Lien':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Fallback for older browsers
          const input = document.createElement('input');
          input.value = shareUrl;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        break;
      case 'Native':
        try {
          if (navigator.share) {
            await navigator.share({ title: shareTitle, url: shareUrl });
          }
        } catch {
          // User cancelled or not supported
        }
        break;
    }
    setShowShareMenu(false);
  }, [shareTitle, shareUrl]);

  // Submit review
  const handleSubmitReview = useCallback(async () => {
    if (!isAuthenticated || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      await apiPost('/api/reviews', {
        targetId: propertyId,
        targetType: 'property',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      queryClient.invalidateQueries({ queryKey: ['reviews', 'property', propertyId] });
    } catch (err) {
      console.error('Review submission error:', err);
    } finally {
      setReviewSubmitting(false);
    }
  }, [isAuthenticated, propertyId, reviewRating, reviewComment, queryClient]);

  // Loading state
  if (isLoading) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-4 w-40 mb-6" />
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 lg:max-w-[65%]">
              <Skeleton className="aspect-[16/10] rounded-3xl mb-6" />
              <Skeleton className="h-8 w-3/4 mb-3" />
              <Skeleton className="h-5 w-1/2 mb-6" />
              <Skeleton className="h-24 rounded-2xl mb-6" />
              <Skeleton className="h-40 rounded-2xl mb-6" />
            </div>
            <div className="lg:w-[35%]">
              <Skeleton className="h-72 rounded-3xl mb-4" />
              <Skeleton className="h-48 rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-400">Erreur de chargement</h2>
          <p className="text-sm text-gray-400 mt-2">Impossible de charger les détails du bien.</p>
          <button onClick={onBack} className="mt-4 text-[#003087] font-semibold text-sm">Retour</button>
        </div>
      </div>
    );
  }

  // Not found state
  if (!property) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-400">Bien non trouvé</h2>
          <p className="text-sm text-gray-400 mt-2">Ce bien n&apos;existe pas ou a été retiré.</p>
          <button onClick={onBack} className="mt-4 text-[#003087] font-semibold text-sm hover:underline">Retour</button>
        </div>
      </div>
    );
  }

  const agent = property.agent;
  const priceLabel = formatPrice(property.price, property.transaction);
  const images = property.images?.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop'];
  const features = property.features || [];
  const hasVR = property.hasVR || false;
  const tours = toursData?.data?.tours || [];
  const reviews = reviewsData?.reviews || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Map properties for PropertyMap component
  const mapProperties = property.lat && property.lng ? [{
    id: property.id,
    title: property.title,
    price: property.price,
    transaction: property.transaction,
    type: property.type,
    city: property.city,
    quartier: property.quartier,
    bedrooms: property.bedrooms,
    surface: property.surface,
    images: property.images,
    lat: property.lat,
    lng: property.lng,
    verified: property.verified,
    geoTrust: property.geoTrust,
    investmentScore: null,
    address: (property as any).address || `${property.quartier}, ${property.city}`,
  }] : [];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux résultats
        </motion.button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - 65% */}
          <div className="flex-1 lg:max-w-[65%]">
            {/* Photo Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="mb-6"
            >
              <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-gray-100">
                <ImageWithFallback
                  src={images[activeImage]}
                  alt={property.title}
                  className="w-full h-full"
                  fallbackType="property"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  {property.verified && (
                    <span className="px-3 py-1.5 bg-[#00A651] text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Documents vérifiés
                    </span>
                  )}
                  {property.geoTrust && (
                    <span className="px-3 py-1.5 bg-[#009CDE] text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5" />
                      GeoTrust
                    </span>
                  )}
                  {/* VR 360° Badge — clickable to open virtual tour */}
                  {hasVR ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowVRTour(true)}
                      className="px-3 py-1.5 bg-[#003087] text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg hover:bg-[#0047b3] transition-colors cursor-pointer"
                      aria-label="Ouvrir la visite virtuelle 360°"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Visite VR disponible
                    </motion.button>
                  ) : (
                    <span className="px-3 py-1.5 bg-white/90 backdrop-blur text-xs font-bold rounded-full text-gray-700 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" /> VR 360°
                    </span>
                  )}
                </div>

                {/* Favorite Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={isAuthenticated ? toggleFavorite : undefined}
                  className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isFavorite
                      ? 'bg-red-500 text-white'
                      : 'bg-white/90 backdrop-blur text-gray-400 hover:text-red-400'
                  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  title={!isAuthenticated ? 'Connectez-vous pour ajouter aux favoris' : ''}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur">
                  {activeImage + 1} / {images.length}
                </div>
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-colors ${
                        i === activeImage ? 'border-[#003087]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <ImageWithFallback src={img} alt="" className="w-full h-full" fallbackType="property" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Visite VR Prominent Banner — only shown if hasVR */}
            {hasVR && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08, ease: easeOut }}
                className="mb-6"
              >
                <button
                  onClick={() => setShowVRTour(true)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-r from-[#003087] to-[#0047b3] rounded-2xl text-left group hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#D4AF37]/20 flex items-center justify-center shrink-0 group-hover:bg-[#D4AF37]/30 transition-colors">
                    <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-[#D4AF37]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm sm:text-base">Visite virtuelle 360°</h3>
                      <span className="px-2 py-0.5 bg-[#D4AF37] text-white text-[9px] font-bold rounded-full shrink-0">VR</span>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm">Explorez ce bien en réalité virtuelle — naviguez de pièce en pièce</p>
                  </div>
                  <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                  </div>
                </button>
              </motion.div>
            )}

            {/* Title & Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                {property.premium && (
                  <span className="px-2.5 py-0.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">Premium</span>
                )}
                {avgRating && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded-full">
                    <Star className="w-3 h-3 fill-current" />
                    {avgRating}
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-2">
                {property.title}
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {property.quartier}, {property.city}, {property.country}
              </p>
            </motion.div>

            {/* Key specs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
              className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl mb-6"
            >
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-[#2C2E2F]">{property.bedrooms}</span>
                    <span className="text-xs text-gray-500 ml-1">{t('property.bedrooms', 'Chambres')}</span>
                  </div>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-[#2C2E2F]">{property.bathrooms}</span>
                    <span className="text-xs text-gray-500 ml-1">{t('property.bathroomsShort', 'SdB')}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-[#2C2E2F]">{property.surface}</span>
                  <span className="text-xs text-gray-500 ml-1">{t('property.surfaceUnit', 'm²')}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                  <Eye className="w-5 h-5 text-[#003087]" />
                </div>
                <div>
                  <span className="text-lg font-bold text-[#2C2E2F]">{property.views}</span>
                  <span className="text-xs text-gray-500 ml-1">Vues</span>
                </div>
              </div>
              {(property.favorites ?? 0) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <Heart className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-[#2C2E2F]">{property.favorites}</span>
                    <span className="text-xs text-gray-500 ml-1">Favoris</span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
              className="mb-6"
            >
              <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-3">{t('property.descriptionTitle', 'Description')}</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </motion.div>

            {/* Features */}
            {features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease: easeOut }}
                className="mb-6"
              >
                <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-3">{t('property.featuresTitle', 'Équipements')}</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature) => (
                    <span key={feature} className="px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Interactive Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
              className="mb-6"
            >
              <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#003087]" />
                {t('property.locationTitle', 'Localisation')}
              </h2>
              {property.lat && property.lng ? (
                <div className="h-80 rounded-3xl overflow-hidden">
                  <PropertyMap
                    properties={mapProperties}
                    selectedCountry={property.country}
                    selectedPropertyId={property.id}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="relative h-64 rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-[#003087]/5">
                    <div className="absolute inset-0 opacity-[0.07]">
                      <div className="absolute top-1/4 left-0 right-0 h-px bg-[#003087]" />
                      <div className="absolute top-2/4 left-0 right-0 h-px bg-[#003087]" />
                      <div className="absolute top-3/4 left-0 right-0 h-px bg-[#003087]" />
                      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-[#003087]" />
                      <div className="absolute left-2/4 top-0 bottom-0 w-px bg-[#003087]" />
                      <div className="absolute left-3/4 top-0 bottom-0 w-px bg-[#003087]" />
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-[#003087]/10 flex items-center justify-center mb-2">
                      <MapPin className="w-6 h-6 text-[#003087]" />
                    </div>
                    <p className="text-sm font-semibold text-[#2C2E2F] mt-2">{property.quartier}, {property.city}</p>
                    <p className="text-xs text-gray-400 mt-1">Coordonnées GPS non disponibles</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Reviews / Avis Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold text-[#2C2E2F] flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[#003087]" />
                  Avis ({reviews.length})
                </h2>
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="text-sm font-semibold text-[#003087] hover:underline flex items-center gap-1"
                  >
                    <Star className="w-4 h-4" />
                    {showReviewForm ? 'Annuler' : 'Donner un avis'}
                  </button>
                )}
              </div>

              {/* Rating Summary */}
              {avgRating && (
                <div className="flex items-center gap-3 p-4 bg-[#D4AF37]/5 rounded-2xl mb-4">
                  <div className="text-3xl font-bold text-[#D4AF37]">{avgRating}</div>
                  <div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(Number(avgRating))
                              ? 'text-[#D4AF37] fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{reviews.length} avis vérifiés</p>
                  </div>
                </div>
              )}

              {/* Review Form */}
              <AnimatePresence>
                {showReviewForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4"
                  >
                    <div className="p-4 bg-gray-50 rounded-2xl border">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium text-gray-700">Votre note :</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-6 h-6 transition-colors ${
                                  star <= reviewRating
                                    ? 'text-[#D4AF37] fill-current'
                                    : 'text-gray-300 hover:text-[#D4AF37]/50'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Partagez votre expérience avec ce bien..."
                        className="w-full p-3 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
                        rows={3}
                      />
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handleSubmitReview}
                          disabled={reviewSubmitting || !reviewComment.trim()}
                          className="px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-full hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {reviewSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <ThumbsUp className="w-4 h-4" />
                          )}
                          Publier l&apos;avis
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-white rounded-2xl border">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full bg-[#003087]/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-[#003087]">
                            {review.reviewer.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#2C2E2F]">{review.reviewer.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${
                                    star <= review.rating
                                      ? 'text-[#D4AF37] fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            {review.verified && (
                              <span className="text-[9px] text-[#00A651] font-medium">Vérifié</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 ml-12">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                  <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun avis pour le moment</p>
                  {isAuthenticated && (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="mt-2 text-sm font-semibold text-[#003087] hover:underline"
                    >
                      Soyez le premier à donner votre avis
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column - 35% Sticky */}
          <div className="lg:w-[35%] shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
              className="lg:sticky lg:top-24"
            >
              {/* Price Box */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-4">
                <div className="mb-4">
                  <p className="font-mono-data text-3xl sm:text-4xl font-bold text-[#D4AF37] mb-1">
                    {priceLabel}
                  </p>
                  {property.transaction === 'location' && (
                    <p className="text-xs text-gray-400">Charges comprises si indiqué</p>
                  )}
                </div>

                {/* Escrow Badge */}
                <div className="flex items-center gap-2 p-3 bg-[#00A651]/5 rounded-2xl mb-5">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#00A651]">Escrow Sécurisé</p>
                    <p className="text-[10px] text-gray-500">Fonds protégés jusqu&apos;à signature</p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  {/* VR Tour Button — prominent if hasVR */}
                  {hasVR && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setShowVRTour(true)}
                      className="w-full py-3.5 bg-[#003087] hover:bg-[#0047b3] text-white rounded-full font-semibold text-sm shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-[#D4AF37]" />
                      Visite virtuelle 360°
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg transition-colors"
                  >
                    Demander une visite
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-transparent border-2 border-[#003087] text-[#003087] rounded-full font-semibold text-sm hover:bg-[#003087] hover:text-white transition-colors"
                  >
                    Contacter l&apos;agent
                  </motion.button>
                </div>

                {/* Share & Favorite Row */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  {/* Favorite Button */}
                  <button
                    onClick={isAuthenticated ? toggleFavorite : undefined}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors ${
                      isFavorite
                        ? 'bg-red-50 text-red-500 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isAuthenticated ? 'Connectez-vous' : isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Enregistré' : 'Enregistrer'}
                  </button>

                  {/* Share Button */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Partager
                    </button>

                    {/* Share Dropdown */}
                    <AnimatePresence>
                      {showShareMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border p-2 z-50"
                        >
                          {/* Native Share (mobile) */}
                          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                            <button
                              onClick={() => handleShare('Native')}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700">Partager...</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleShare('WhatsApp')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-green-50 rounded-xl transition-colors text-left"
                          >
                            {/* WhatsApp official icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-sm text-gray-700">WhatsApp</span>
                          </button>
                          <button
                            onClick={() => handleShare('Facebook')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 rounded-xl transition-colors text-left"
                          >
                            {/* Facebook official icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-sm text-gray-700">Facebook</span>
                          </button>
                          <button
                            onClick={() => handleShare('Twitter')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 rounded-xl transition-colors text-left"
                          >
                            {/* X (Twitter) official icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            <span className="text-sm text-gray-700">X (Twitter)</span>
                          </button>
                          <button
                            onClick={() => handleShare('Telegram')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sky-50 rounded-xl transition-colors text-left"
                          >
                            {/* Telegram official icon */}
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0088cc">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            <span className="text-sm text-gray-700">Telegram</span>
                          </button>
                          <button
                            onClick={() => handleShare('Lien')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-[#00A651]" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-700">
                              {copied ? 'Lien copié !' : 'Copier le lien'}
                            </span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Agent Card */}
              {agent && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <ImageWithFallback
                      src={agent.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                      alt={agent.name}
                      className="w-12 h-12 rounded-full border-2 border-[#D4AF37]"
                      fallbackType="avatar"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[#2C2E2F]">{agent.name}</h3>
                        {agent.certified && (
                          <span className="px-1.5 py-0.5 bg-[#009CDE]/10 text-[#009CDE] text-[9px] font-bold rounded-full">Certifié</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{agent.company || 'Agent immobilier'}</p>
                    </div>
                  </div>
                  {(agent.rating !== undefined && agent.rating > 0) && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-current" />
                        {agent.rating} ({agent.reviews})
                      </span>
                      {agent.listings !== undefined && <span>{agent.listings} annonces</span>}
                    </div>
                  )}
                  {agent.phone && (
                    <button
                      onClick={() => setShowPhone(!showPhone)}
                      className="w-full py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                    >
                      {showPhone ? agent.phone : 'Voir le numéro'}
                    </button>
                  )}
                </div>
              )}

              {/* Trust Badges */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="text-sm font-semibold text-[#2C2E2F] mb-3">Garanties AfriBayit</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: <Check className="w-4 h-4" />, text: 'Documents vérifiés', active: property.verified },
                    { icon: <Map className="w-4 h-4" />, text: 'GeoTrust certifié', active: property.geoTrust },
                    { icon: <Eye className="w-4 h-4" />, text: 'Visite VR disponible', active: hasVR },
                    { icon: <Lock className="w-4 h-4" />, text: 'Escrow sécurisé', active: true },
                    { icon: <ClipboardList className="w-4 h-4" />, text: 'Assistance notariale', active: true },
                  ].map((badge) => (
                    <div key={badge.text} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        badge.active ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {badge.icon}
                      </span>
                      <span className={`text-xs ${badge.active ? 'text-gray-700' : 'text-gray-400'}`}>{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Virtual Tour Modal */}
      <Dialog open={showVRTour} onOpenChange={setShowVRTour}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[95vw] lg:max-w-[90vw] h-[85vh] sm:h-[90vh] p-0 gap-0 bg-black border-white/10 overflow-hidden rounded-2xl"
        >
          <DialogTitle className="sr-only">Visite virtuelle 360° — {property.title}</DialogTitle>
          <AnimatePresence>
            {showVRTour && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full"
              >
                <VirtualTourViewer
                  tours={tours.length > 0 ? tours : []}
                  propertyId={propertyId}
                  hasVR={hasVR}
                  onClose={() => setShowVRTour(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </section>
  );
}
