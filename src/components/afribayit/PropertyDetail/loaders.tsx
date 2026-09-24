'use client';

import { MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

// Loading skeleton for the VirtualTourViewer (Three.js)
export function VirtualTourLoader() {
  const { t } = useTranslation();
  return (
    <div className="w-full h-[70vh] sm:h-[80vh] bg-black rounded-3xl flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full border-4 border-accent-yellow/30 flex items-center justify-center mb-4">
        <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-accent-yellow border-r-accent-yellow animate-spin" />
      </div>
      <p className="text-white/60 text-sm">
        {t('propertyDetailLoaders.virtualTour', 'Chargement du lecteur 3D...')}
      </p>
    </div>
  );
}

// Loading skeleton for the PropertyMap (Mapbox)
export function MapLoader() {
  return (
    <div className="h-64 rounded-3xl bg-primary-pale/50 animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-primary-green/50" />
    </div>
  );
}
