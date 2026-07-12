import { MapPin } from 'lucide-react';

// Loading skeleton for the VirtualTourViewer (Three.js)
export function VirtualTourLoader() {
  return (
    <div className="w-full h-[70vh] sm:h-[80vh] bg-black rounded-xl flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-lg border-4 border-[#D4AF37]/30 flex items-center justify-center mb-4">
        <div className="w-10 h-10 rounded-full border-4 border-transparent border-t-[#D4AF37] border-r-[#D4AF37] animate-spin" />
      </div>
      <p className="text-white/60 text-sm">Chargement du lecteur 3D...</p>
    </div>
  );
}

// Loading skeleton for the PropertyMap (Mapbox)
export function MapLoader() {
  return (
    <div className="h-64 rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
      <MapPin className="w-8 h-8 text-gray-300" />
    </div>
  );
}
