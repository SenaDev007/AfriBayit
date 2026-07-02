'use client';

import { motion } from 'framer-motion';
import { Eye, Heart, MapPin, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
import { easeOut } from './types';

interface PropertyHeaderProps {
  title: string;
  description: string;
  features: string[];
  quartier: string;
  city: string;
  country: string;
  premium: boolean;
  avgRating: string | null;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  views: number;
  favorites?: number;
}

export default function PropertyHeader({
  title,
  description,
  features,
  quartier,
  city,
  country,
  premium,
  avgRating,
  bedrooms,
  bathrooms,
  surface,
  views,
  favorites,
}: PropertyHeaderProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Title & Location */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          {premium && (
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
          {title}
        </h1>
        <p className="text-gray-500 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {quartier}, {city}, {country}
        </p>
      </motion.div>

      {/* Key specs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
        className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl mb-6"
      >
        {bedrooms > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-[#2C2E2F]">{bedrooms}</span>
              <span className="text-xs text-gray-500 ml-1">{t('property.bedrooms', 'Chambres')}</span>
            </div>
          </div>
        )}
        {bathrooms > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-[#2C2E2F]">{bathrooms}</span>
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
            <span className="text-lg font-bold text-[#2C2E2F]">{surface}</span>
            <span className="text-xs text-gray-500 ml-1">{t('property.surfaceUnit', 'm²')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
            <Eye className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <span className="text-lg font-bold text-[#2C2E2F]">{views}</span>
            <span className="text-xs text-gray-500 ml-1">Vues</span>
          </div>
        </div>
        {(favorites ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <span className="text-lg font-bold text-[#2C2E2F]">{favorites}</span>
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
        <p className="text-gray-600 leading-relaxed">{description}</p>
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
    </>
  );
}
