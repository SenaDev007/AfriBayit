'use client';

import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useProperty } from '@/hooks/useProperties';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost, apiDelete } from '@/lib/api-client';
import { formatPrice } from '@/lib/afribayit-utils';
import { useAuthStore } from '@/stores/authStore';
import { useState, useCallback, useEffect } from 'react';
import type {
  PropertyDetailProps,
  ReviewData,
  ReviewsResponse,
  VirtualToursResponse,
} from './types';
import { VirtualTourLoader } from './loaders';
import PropertyGallery from './PropertyGallery';
import PropertyHeader from './PropertyHeader';
import PropertyLocation from './PropertyLocation';
import PropertyReviews from './PropertyReviews';
import PropertySidebar from './PropertySidebar';
import PricePredictionChart from '../PricePredictionChart';
import VRTourPlayer from '../VRTourPlayer';
import DroneViewPlayer from '../DroneViewPlayer';
import NeighborhoodAnalysis from '../NeighborhoodAnalysis';

// Dynamic import for VirtualTourViewer to avoid SSR issues with Three.js
const VirtualTourViewer = dynamic(
  () => import('@/components/afribayit/VirtualTourViewer'),
  { ssr: false, loading: () => <VirtualTourLoader /> }
);

export default function PropertyDetail({ propertyId, onBack, onNavigate: _onNavigate }: PropertyDetailProps) {
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
  const { user: _user, isAuthenticated } = useAuthStore();

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

  // Purchase transaction creation
  const createTransaction = useCreateTransaction();

  const handlePurchase = useCallback(async (propId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    try {
      const result = await createTransaction.mutateAsync({ propertyId: propId });
      // Redirect to escrow page with the new transaction
      window.location.href = result.paymentUrl || '/escrow';
    } catch (err) {
      console.error('Purchase initiation error:', err);
      alert('Erreur lors de l\'initiation de la transaction. Veuillez réessayer.');
    }
  }, [isAuthenticated, createTransaction]);

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

  // favoriteLoading is intentionally tracked but not surfaced in UI (button stays clickable)
  void favoriteLoading;

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
  const reviews: ReviewData[] = reviewsData?.reviews || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

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
            <PropertyGallery
              images={images}
              activeImage={activeImage}
              setActiveImage={setActiveImage}
              title={property.title}
              verified={property.verified}
              geoTrust={property.geoTrust}
              hasVR={hasVR}
              isFavorite={isFavorite}
              isAuthenticated={isAuthenticated}
              onToggleFavorite={toggleFavorite}
              onOpenVRTour={() => setShowVRTour(true)}
            />

            <PropertyHeader
              title={property.title}
              description={property.description}
              features={features}
              quartier={property.quartier}
              city={property.city}
              country={property.country}
              premium={property.premium}
              avgRating={avgRating}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              surface={property.surface}
              views={property.views}
              favorites={property.favorites}
            />

            <PropertyLocation property={property} />

            <PropertyReviews
              reviews={reviews}
              avgRating={avgRating}
              isAuthenticated={isAuthenticated}
              showReviewForm={showReviewForm}
              setShowReviewForm={setShowReviewForm}
              reviewRating={reviewRating}
              setReviewRating={setReviewRating}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              reviewSubmitting={reviewSubmitting}
              onSubmitReview={handleSubmitReview}
            />
          </div>

          {/* Right Column - 35% Sticky */}
          <div className="lg:w-[35%] shrink-0">
            <PropertySidebar
              priceLabel={priceLabel}
              transaction={property.transaction}
              hasVR={hasVR}
              onOpenVRTour={() => setShowVRTour(true)}
              isFavorite={isFavorite}
              isAuthenticated={isAuthenticated}
              onToggleFavorite={toggleFavorite}
              showShareMenu={showShareMenu}
              setShowShareMenu={setShowShareMenu}
              onShare={handleShare}
              copied={copied}
              agent={agent}
              showPhone={showPhone}
              setShowPhone={setShowPhone}
              verified={property.verified}
              geoTrust={property.geoTrust}
              onPurchase={handlePurchase}
              onContactAgent={() => { window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`; }}
              property={property}
            />
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

      {/* ═══ Advanced Features (CDC §5.1.2 compliance) ═══ */}
      <div className="mt-12 space-y-8">
        {/* Price Prediction ML Chart — CDC §5.1.1 "Prédictions de prix par quartier (ML)" */}
        {property.transaction !== 'location' && property.transaction !== 'location_courte_duree' && (
          <PricePredictionChart
            currentPrice={property.price}
            city={property.city}
            country={property.country}
          />
        )}

        {/* VR Tour Player — CDC §5.1.2 "Visite virtuelle 360° réelle (Matterport) + WebXR" */}
        <VRTourPlayer
          propertyTitle={property.title}
          images={images}
          hasVR={hasVR}
        />

        {/* Drone View Player — CDC §5.1.2 "Drone view et time-lapse jour/nuit" */}
        <DroneViewPlayer
          propertyTitle={property.title}
          hasDroneView={property.hasDroneView || false}
        />

        {/* Neighborhood Analysis — CDC §5.1.2 "Analyse de quartier IA" + "Données environnementales temps réel" */}
        {property.lat && property.lng && (
          <NeighborhoodAnalysis
            lat={property.lat}
            lng={property.lng}
            city={property.city}
            propertyId={propertyId}
            agentId={agent?.id}
          />
        )}
      </div>
    </section>
  );
}
