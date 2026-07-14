'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { formatPrice, getTransactionLabel } from '@/lib/afribayit-utils';

interface PropertyMapItem {
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
  lat: number | null;
  lng: number | null;
  verified: boolean;
  geoTrust: boolean;
  geoTrustStatus?: 'verified' | 'pending' | 'conflict';
  investmentScore: number | null;
  boundaryPolygon?: number[][];
  address?: string;
}

interface PropertyMapProps {
  properties: PropertyMapItem[];
  onPropertyClick?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  selectedCountry?: string;
  className?: string;
  showGeoTrustOverlay?: boolean;
  selectedPropertyId?: string;
}

const COUNTRY_BOUNDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  BJ: { lat: 9.5, lng: 2.3, zoom: 7 },
  CI: { lat: 7.5, lng: -5.5, zoom: 6 },
  BF: { lat: 12.2, lng: -1.5, zoom: 6 },
  TG: { lat: 8.5, lng: 0.9, zoom: 7 },
  SN: { lat: 14.5, lng: -14.7, zoom: 6 },
};

const TRANSACTION_COLORS: Record<string, string> = {
  achat: '#003087',
  location: '#00A651',
  investissement: '#D4AF37',
  location_courte_duree: '#00A651',
};

const GEOTRUST_COLORS: Record<string, string> = {
  verified: '#00A651',
  pending: '#D4AF37',
  conflict: '#D93025',
};

const GEOTRUST_LABELS: Record<string, string> = {
  verified: 'Vérifié GeoTrust',
  pending: 'Vérification en cours',
  conflict: 'Conflit détecté',
};

// ─── Google Maps loader ───────────────────────────────────────────────────
let googleMapsLoaded = false;
let googleMapsLoading: Promise<boolean> | null = null;

function loadGoogleMapsApi(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (googleMapsLoaded && (window as any).google?.maps) return Promise.resolve(true);
  if (googleMapsLoading) return googleMapsLoading;

  googleMapsLoading = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => { googleMapsLoaded = true; resolve(true); };
    script.onerror = () => { googleMapsLoaded = false; googleMapsLoading = null; resolve(false); };
    document.head.appendChild(script);
  });
  return googleMapsLoading;
}

function priceLabel(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(0)}M`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)}K`;
  return `${price}`;
}

function buildGoogleEmbedUrl(apiKey: string, props: PropertyMapItem[], selId?: string): string {
  const coords = props.filter(p => p.lat != null && p.lng != null);
  if (coords.length === 0) return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=9.5,2.3&zoom=5`;
  const sel = selId ? coords.find(p => p.id === selId) : null;
  if (sel) return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${sel.lat},${sel.lng}&zoom=16`;
  if (coords.length === 1) return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${coords[0].lat},${coords[0].lng}&zoom=15`;
  const cLat = coords.reduce((s, p) => s + p.lat!, 0) / coords.length;
  const cLng = coords.reduce((s, p) => s + p.lng!, 0) / coords.length;
  return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${cLat},${cLng}&zoom=11`;
}

function buildOsmEmbedUrl(props: PropertyMapItem[], selId?: string): string {
  const coords = props.filter(p => p.lat != null && p.lng != null);
  if (coords.length === 0) return 'https://www.openstreetmap.org/export/embed.html?bbox=-8%2C3%2C4%2C12&layer=mapnik';
  const sel = selId ? coords.find(p => p.id === selId) : null;
  let cLat: number, cLng: number, zoom = 13;
  if (sel) { cLat = sel.lat!; cLng = sel.lng!; zoom = 15; }
  else if (coords.length === 1) { cLat = coords[0].lat!; cLng = coords[0].lng!; zoom = 14; }
  else {
    const lats = coords.map(p => p.lat!), lngs = coords.map(p => p.lng!);
    cLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    cLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const span = Math.max(...lats) - Math.min(...lats);
    zoom = span > 1 ? 8 : span > 0.2 ? 11 : 13;
  }
  const d = zoom >= 15 ? 0.005 : zoom >= 12 ? 0.02 : 0.2;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${cLng - d}%2C${cLat - d}%2C${cLng + d}%2C${cLat + d}&marker=${cLat}%2C${cLng}&layer=mapnik`;
}

export default function PropertyMap({
  properties, onPropertyClick, onBoundsChange, selectedCountry,
  className = '', showGeoTrustOverlay = false, selectedPropertyId,
}: PropertyMapProps) {
  const [popupInfo, setPopupInfo] = useState<PropertyMapItem | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiFailed, setApiFailed] = useState(false);

  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const mapProperties = useMemo(
    () => properties.filter(p => p.lat !== null && p.lng !== null),
    [properties]
  );

  const initialView = useMemo(() => {
    if (selectedPropertyId) {
      const sel = mapProperties.find(p => p.id === selectedPropertyId);
      if (sel && sel.lat != null && sel.lng != null) return { lat: sel.lat, lng: sel.lng, zoom: 16 };
    }
    if (mapProperties.length === 1) return { lat: mapProperties[0].lat!, lng: mapProperties[0].lng!, zoom: 15 };
    if (mapProperties.length > 1) {
      const lats = mapProperties.map(p => p.lat!), lngs = mapProperties.map(p => p.lng!);
      return { lat: (Math.min(...lats) + Math.max(...lats)) / 2, lng: (Math.min(...lngs) + Math.max(...lngs)) / 2, zoom: 10 };
    }
    if (selectedCountry && COUNTRY_BOUNDS[selectedCountry]) return COUNTRY_BOUNDS[selectedCountry];
    return { lat: 9.5, lng: 2.3, zoom: 5 };
  }, [mapProperties, selectedCountry, selectedPropertyId]);

  // ─── Google Maps init ──────────────────────────────────────────────────
  useEffect(() => {
    if (!googleApiKey || apiFailed || !mapContainerRef.current) return;
    let cancelled = false;

    loadGoogleMapsApi(googleApiKey).then((loaded) => {
      if (cancelled || !loaded || !mapContainerRef.current) { setApiFailed(true); return; }
      const g = (window as any).google;
      const map = new g.maps.Map(mapContainerRef.current, {
        center: { lat: initialView.lat, lng: initialView.lng },
        zoom: initialView.zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      googleMapRef.current = map;
      infoWindowRef.current = new g.maps.InfoWindow();

      markersRef.current = mapProperties.map((prop) => {
        const color = TRANSACTION_COLORS[prop.transaction] || '#003087';
        const isSel = prop.id === selectedPropertyId;
        const svg = `<svg width="56" height="40" viewBox="0 0 56 40" xmlns="http://www.w3.org/2000/svg"><path d="M28 0C16 0 6 10 6 22c0 14 22 18 22 18s22-4 22-18C50 10 40 0 28 0z" fill="${color}" stroke="white" stroke-width="2"/><text x="28" y="24" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${priceLabel(prop.price)}</text></svg>`;
        const marker = new g.maps.Marker({
          position: { lat: prop.lat!, lng: prop.lng! },
          map,
          icon: { url: 'data:image/svg+xml;base64,' + btoa(svg), scaledSize: new g.maps.Size(56, 40), anchor: new g.maps.Point(28, 40) },
          title: prop.title,
          zIndex: isSel ? 999 : 1,
        });
        marker.addListener('click', () => {
          const img = prop.images?.[0] || '';
          const content = `<div style="min-width:220px;padding:4px;"><div style="display:flex;gap:8px;margin-bottom:8px;"><div style="width:64px;height:64px;border-radius:8px;overflow:hidden;background:#f3f4f6;flex-shrink:0;">${img ? `<img src="${img}" style="width:100%;height:100%;object-fit:cover;" alt="${prop.title}" />` : ''}</div><div style="flex:1;min-width:0;"><h4 style="font-size:12px;font-weight:600;color:#0a2a5e;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${prop.title}</h4><p style="font-size:10px;color:#6b7280;margin:2px 0;">${prop.quartier}, ${prop.city}</p><p style="font-size:13px;font-weight:bold;color:#D4AF37;margin:0;">${formatPrice(prop.price, prop.transaction)}</p></div></div><div style="display:flex;gap:8px;font-size:10px;color:#6b7280;margin-bottom:8px;">${prop.bedrooms > 0 ? `<span>${prop.bedrooms} ch.</span>` : ''}<span>${prop.surface} m²</span>${prop.investmentScore ? `<span style="color:#00A651;font-weight:600;">Score: ${prop.investmentScore}</span>` : ''}</div><a href="/property/${prop.id}" style="display:block;text-align:center;padding:6px;background:#003087;color:white;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">Voir le bien</a></div>`;
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);
          setPopupInfo(prop);
          onPropertyClick?.(prop.id);
        });
        return marker;
      });

      if (mapProperties.length > 1 && !selectedPropertyId) {
        const bounds = new g.maps.LatLngBounds();
        mapProperties.forEach(p => bounds.extend({ lat: p.lat!, lng: p.lng! }));
        map.fitBounds(bounds, 60);
      }
      if (onBoundsChange) {
        map.addListener('idle', () => {
          const b = map.getBounds();
          if (b) onBoundsChange({ north: b.getNorthEast().lat(), south: b.getSouthWest().lat(), east: b.getNorthEast().lng(), west: b.getSouthWest().lng() });
        });
      }
      setMapLoaded(true);
    });
    return () => { cancelled = true; markersRef.current.forEach(m => m?.setMap?.(null)); markersRef.current = []; };
  }, [googleApiKey, mapProperties, selectedPropertyId, initialView, onBoundsChange, onPropertyClick, apiFailed]);

  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;
    if (selectedPropertyId) {
      const sel = mapProperties.find(p => p.id === selectedPropertyId);
      if (sel && sel.lat != null && sel.lng != null) {
        googleMapRef.current.panTo({ lat: sel.lat, lng: sel.lng });
        googleMapRef.current.setZoom(16);
      }
    }
  }, [selectedPropertyId, mapProperties, mapLoaded]);

  // ═══ FALLBACK: Google Embed iframe ═══
  if (apiFailed && googleApiKey) {
    const url = buildGoogleEmbedUrl(googleApiKey, mapProperties, selectedPropertyId);
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-gray-100 ${className}`} style={{ minHeight: 400 }}>
        <iframe title="Carte Google Maps" src={url} className="absolute inset-0 w-full h-full" style={{ border: 0, minHeight: 400 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        <PropertyChips properties={mapProperties} selectedId={selectedPropertyId} onClick={onPropertyClick} source="Google Maps" />
        <MapLegend showGeoTrustOverlay={showGeoTrustOverlay} />
      </div>
    );
  }

  // ═══ FALLBACK: OSM embed (no key at all) ═══
  if (apiFailed && !googleApiKey) {
    const url = buildOsmEmbedUrl(mapProperties, selectedPropertyId);
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-gray-100 ${className}`} style={{ minHeight: 400 }}>
        {mapProperties.length > 0 ? (
          <iframe title="Carte OpenStreetMap" src={url} className="absolute inset-0 w-full h-full" style={{ border: 0, minHeight: 400 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8"><div className="w-16 h-16 rounded-lg bg-[#003087]/10 flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg></div><h3 className="font-display text-lg font-bold text-gray-700 mb-2">Carte Interactive</h3><p className="text-sm text-gray-500 mb-1">Aucun bien avec localisation</p></div>
          </div>
        )}
        <PropertyChips properties={mapProperties} selectedId={selectedPropertyId} onClick={onPropertyClick} source="OpenStreetMap" />
        <MapLegend showGeoTrustOverlay={showGeoTrustOverlay} />
      </div>
    );
  }

  // ═══ MAIN: Google Maps JS API (interactive) ═══
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ minHeight: 400 }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: 400, backgroundColor: '#e5e7eb' }} />
      {!mapLoaded && !apiFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#003087] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-500">Chargement de Google Maps...</p>
          </div>
        </div>
      )}
      <MapLegend showGeoTrustOverlay={showGeoTrustOverlay} />
    </div>
  );
}

function PropertyChips({ properties, selectedId, onClick, source }: { properties: PropertyMapItem[]; selectedId?: string; onClick?: (id: string) => void; source: string }) {
  if (properties.length === 0) return null;
  return (
    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-xl p-2 shadow-lg max-w-[280px] z-10">
      <div className="text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" /></svg>
        {properties.length} bien{properties.length !== 1 ? 's' : ''} · {source}
      </div>
      <div className="space-y-1 max-h-[180px] overflow-y-auto">
        {properties.slice(0, 6).map(p => (
          <button key={p.id} onClick={() => onClick?.(p.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors text-xs ${p.id === selectedId ? 'border-[#003087] bg-[#003087]/5' : 'border-gray-200 hover:border-[#003087]'}`}>
            <span className="font-semibold text-[#D4AF37]">{formatPrice(p.price, p.transaction)}</span>
            <span className="text-gray-400"> · </span>
            <span className="text-gray-600">{p.quartier}, {p.city}</span>
          </button>
        ))}
        {properties.length > 6 && <p className="text-[10px] text-gray-400 pt-0.5">...et {properties.length - 6} autres</p>}
      </div>
    </div>
  );
}

function MapLegend({ showGeoTrustOverlay }: { showGeoTrustOverlay: boolean }) {
  return (
    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
      <div className="text-[10px] font-semibold text-gray-600 mb-1.5">Type de transaction</div>
      <div className="flex gap-3 flex-wrap">
        {Object.entries(TRANSACTION_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} /><span className="text-[10px] text-gray-600">{getTransactionLabel(key)}</span></div>
        ))}
      </div>
      {showGeoTrustOverlay && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-[10px] font-semibold text-gray-600 mb-1.5">GeoTrust</div>
          <div className="flex gap-3">
            {Object.entries(GEOTRUST_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: color }} /><span className="text-[10px] text-gray-600">{GEOTRUST_LABELS[key]}</span></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
