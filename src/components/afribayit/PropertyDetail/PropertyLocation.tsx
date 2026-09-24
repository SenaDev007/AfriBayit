'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
import { easeOut } from './types';
import { MapLoader } from './loaders';

// Dynamic import for PropertyMap to avoid SSR issues with Mapbox
const PropertyMap = dynamic(
  () => import('@/components/afribayit/PropertyMap'),
  { ssr: false, loading: () => <MapLoader /> }
);

interface MapPropertyItem {
  id: string;
  title: string;
  price: number;
  transaction: string;
  type: string;
  city: string;
  quartier: string;
  bedrooms: number;
  surface: number;
  images: string[];
  lat: number;
  lng: number;
  verified: boolean;
  geoTrust: boolean;
  investmentScore: null;
  address: string;
}

interface PropertyLocationProps {
  property: {
    id: string;
    title: string;
    price: number;
    transaction: string;
    type: string;
    city: string;
    quartier: string;
    bedrooms: number;
    surface: number;
    images: string[];
    lat?: number | null;
    lng?: number | null;
    verified: boolean;
    geoTrust: boolean;
    country: string;
  };
}

export default function PropertyLocation({ property }: PropertyLocationProps) {
  const { t } = useTranslation();

  // Map properties for PropertyMap component
  const mapProperties: MapPropertyItem[] = property.lat && property.lng ? [{
    id: property.id,
    title: property.title,
    price: property.price,
    transaction: property.transaction,
    type: property.type,
    city: property.city,
    quartier: property.quartier,
    bedrooms: property.bedrooms,
    surface: property.surface,
    images: property.images as string[],
    lat: property.lat,
    lng: property.lng,
    verified: property.verified,
    geoTrust: property.geoTrust,
    investmentScore: null,
    address: `${property.quartier}, ${property.city}`,
  }] : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
      className="mb-6"
    >
      <h2 className="font-serif text-xl font-bold text-primary-deep mb-3 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-primary-green" />
        {t('property.locationTitle', 'Localisation')}
      </h2>
      {property.lat && property.lng ? (
        <div className="h-80 rounded-3xl overflow-hidden border border-primary-pale shadow-lg">
          <PropertyMap
            properties={mapProperties}
            selectedCountry={property.country}
            selectedPropertyId={property.id}
            className="w-full h-full"
          />
        </div>
      ) : (
        <div className="relative h-64 rounded-3xl overflow-hidden border border-primary-pale">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-pale via-white to-primary-pale/60">
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="absolute top-1/4 left-0 right-0 h-px bg-primary-deep" />
              <div className="absolute top-2/4 left-0 right-0 h-px bg-primary-deep" />
              <div className="absolute top-3/4 left-0 right-0 h-px bg-primary-deep" />
              <div className="absolute left-1/4 top-0 bottom-0 w-px bg-primary-deep" />
              <div className="absolute left-2/4 top-0 bottom-0 w-px bg-primary-deep" />
              <div className="absolute left-3/4 top-0 bottom-0 w-px bg-primary-deep" />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center mb-2">
              <MapPin className="w-6 h-6 text-primary-deep" />
            </div>
            <p className="text-sm font-bold text-primary-deep mt-2">{property.quartier}, {property.city}</p>
            <p className="text-xs text-gray-text/60 mt-1">{t('propertyDetail.location.gpsUnavailable', 'Coordonnées GPS non disponibles')}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
