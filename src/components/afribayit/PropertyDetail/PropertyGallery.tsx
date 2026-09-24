'use client';

import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Check, Eye, Map } from 'lucide-react';
import { easeOut } from './types';
import { useTranslation } from '@/lib/i18n/use-translate';

interface PropertyGalleryProps {
  images: string[];
  activeImage: number;
  setActiveImage: (i: number) => void;
  title: string;
  verified: boolean;
  geoTrust: boolean;
  hasVR: boolean;
  isFavorite: boolean;
  isAuthenticated: boolean;
  onToggleFavorite: () => void;
  onOpenVRTour: () => void;
}

export default function PropertyGallery({
  images,
  activeImage,
  setActiveImage,
  title,
  verified,
  geoTrust,
  hasVR,
  isFavorite,
  isAuthenticated,
  onToggleFavorite,
  onOpenVRTour,
}: PropertyGalleryProps) {
  const { t } = useTranslation();
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className="mb-6"
      >
        <div className="relative rounded-3xl overflow-hidden aspect-[4/3] bg-primary-pale shadow-lg border border-primary-pale">
          <ImageWithFallback
            src={images[activeImage]}
            alt={title}
            className="absolute inset-0 w-full h-full"
            fallbackType="property"
            fill
          />
          {/* Badges */}
          <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
            {verified && (
              <span className="px-3 py-1.5 bg-white/95 text-green-700 border border-green-200 backdrop-blur-sm text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                <Check className="w-3.5 h-3.5" />
                {t('propertyDetail.gallery.verifiedDocs', 'Documents vérifiés')}
              </span>
            )}
            {geoTrust && (
              <span className="px-3 py-1.5 bg-primary-green text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                <Map className="w-3.5 h-3.5" />
                GeoTrust
              </span>
            )}
            {/* VR 360° Badge — clickable to open virtual tour */}
            {hasVR ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOpenVRTour}
                className="px-3 py-1.5 bg-primary-deep text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg hover:bg-primary-green transition-colors cursor-pointer"
                aria-label={t('propertyDetail.gallery.openVrAria', 'Ouvrir la visite virtuelle 360°')}
              >
                <Eye className="w-3.5 h-3.5 text-accent-yellow" />
                {t('propertyDetail.gallery.vrAvailable', 'Visite VR disponible')}
              </motion.button>
            ) : (
              <span className="px-3 py-1.5 bg-white/90 backdrop-blur text-xs font-bold rounded-full text-gray-text flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> VR 360°
              </span>
            )}
          </div>

          {/* Favorite Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={isAuthenticated ? onToggleFavorite : undefined}
            className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
              isFavorite
                ? 'bg-red-500 text-white'
                : 'bg-white/90 backdrop-blur text-gray-text/60 hover:text-red-400 border border-primary-pale/60'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isFavorite ? t('propertyDetail.gallery.removeFavorite', 'Retirer des favoris') : t('propertyDetail.gallery.addFavorite', 'Ajouter aux favoris')}
            title={!isAuthenticated ? t('propertyDetail.gallery.loginForFavorite', 'Connectez-vous pour ajouter aux favoris') : ''}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </motion.button>

          {/* Nav arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white text-primary-deep"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setActiveImage((activeImage + 1) % images.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white text-primary-deep"
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
                className={`relative w-20 h-14 rounded-2xl overflow-hidden border-2 transition-colors ${
                  i === activeImage ? 'border-primary-deep' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <ImageWithFallback src={img} alt="" className="absolute inset-0 w-full h-full" fallbackType="property" fill />
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
            onClick={onOpenVRTour}
            className="w-full flex items-center gap-4 p-4 sm:p-5 bg-gradient-to-r from-primary-deep to-primary-green rounded-3xl text-left group hover:shadow-xl transition-all duration-300"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-accent-yellow/20 flex items-center justify-center shrink-0 group-hover:bg-accent-yellow/30 transition-colors">
              <Eye className="w-6 h-6 sm:w-7 sm:h-7 text-accent-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-white font-bold text-sm sm:text-base">{t('propertyDetail.gallery.vrTourTitle', 'Visite virtuelle 360°')}</h3>
                <span className="px-2 py-0.5 bg-accent-yellow text-primary-deep text-[9px] font-bold rounded-full shrink-0">VR</span>
              </div>
              <p className="text-white/70 text-xs sm:text-sm">{t('propertyDetail.gallery.vrTourDesc', 'Explorez ce bien en réalité virtuelle — naviguez de pièce en pièce')}</p>
            </div>
            <div className="shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
          </button>
        </motion.div>
      )}
    </>
  );
}

// Import Heart inline to avoid circular deps (kept here for locality)
import { Heart } from 'lucide-react';
