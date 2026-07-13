'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, Layer, Source } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { ErrorEvent } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { formatPrice, getTransactionLabel } from '@/lib/afribayit-utils';

/**
 * Detect Mapbox access tokens that are obviously invalid.
 * Catches placeholder values committed by mistake, tokens that are clearly
 * fake, and tokens missing the standard `pk.` prefix.
 */
function isTokenInvalid(token: string | undefined): boolean {
  if (!token) return true;
  if (token === 'pk.placeholder_mapbox_token') return true;
  // Real Mapbox public tokens start with "pk." and are at least 60 chars long
  if (!token.startsWith('pk.')) return true;
  if (token.length < 60) return true;
  // Common placeholder patterns
  if (/^(pk\.(test|invalid|placeholder|your|demo|example|xxxx))/i.test(token)) return true;
  return false;
}

/**
 * Compute a small OpenStreetMap embed URL for a list of properties.
 * Free, no token required. Used as a graceful fallback when Mapbox fails.
 */
function buildOsmEmbedUrl(properties: PropertyMapItem[], selectedPropertyId?: string): string {
  const withCoords = properties.filter(p => p.lat != null && p.lng != null);
  if (withCoords.length === 0) {
    // Default to a West Africa overview
    return 'https://www.openstreetmap.org/export/embed.html?bbox=-8%2C3%2C4%2C12&layer=mapnik';
  }

  let centerLat: number;
  let centerLng: number;
  let zoom = 13;

  const selected = selectedPropertyId
    ? withCoords.find(p => p.id === selectedPropertyId)
    : null;

  if (selected) {
    centerLat = selected.lat!;
    centerLng = selected.lng!;
    zoom = 15;
  } else if (withCoords.length === 1) {
    centerLat = withCoords[0].lat!;
    centerLng = withCoords[0].lng!;
    zoom = 14;
  } else {
    const lats = withCoords.map(p => p.lat!);
    const lngs = withCoords.map(p => p.lng!);
    centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lngSpan = Math.max(...lngs) - Math.min(...lngs);
    zoom = latSpan > 1 || lngSpan > 1 ? 8 : latSpan > 0.2 || lngSpan > 0.2 ? 11 : 13;
  }

  const delta = zoom >= 15 ? 0.005 : zoom >= 12 ? 0.02 : zoom >= 9 ? 0.2 : 1.5;
  const bbox = `${centerLng - delta}%2C${centerLat - delta}%2C${centerLng + delta}%2C${centerLat + delta}`;
  const marker = `marker=${centerLat}%2C${centerLng}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&${marker}&layer=mapnik`;
}

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
  boundaryPolygon?: number[][]; // GeoJSON coordinates for parcel boundary
  address?: string; // Full address for geocoding fallback
}

interface PropertyMapProps {
  properties: PropertyMapItem[];
  onPropertyClick?: (id: string) => void;
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  selectedCountry?: string;
  className?: string;
  showGeoTrustOverlay?: boolean;
  /** If provided, the map will zoom precisely to this single property */
  selectedPropertyId?: string;
}

const COUNTRY_BOUNDS: Record<string, { longitude: number; latitude: number; zoom: number }> = {
  BJ: { longitude: 2.3, latitude: 9.5, zoom: 7 },
  CI: { longitude: -5.5, latitude: 7.5, zoom: 6 },
  BF: { longitude: -1.5, latitude: 12.2, zoom: 6 },
  TG: { longitude: 0.9, latitude: 8.5, zoom: 7 },
  SN: { longitude: -14.7, latitude: 14.5, zoom: 6 },
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

export default function PropertyMap({
  properties,
  onPropertyClick,
  onBoundsChange,
  selectedCountry,
  className = '',
  showGeoTrustOverlay = false,
  selectedPropertyId,
}: PropertyMapProps) {
  const [popupInfo, setPopupInfo] = useState<PropertyMapItem | null>(null);
  const mapRef = React.useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  // Set to true when Mapbox emits an error event (invalid token, network failure,
  // style load failure, etc.). When true, we fall back to OpenStreetMap embed.
  const [mapError, setMapError] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Only show properties with valid coordinates
  const mapProperties = useMemo(
    () => properties.filter(p => p.lat !== null && p.lng !== null),
    [properties]
  );

  // Handle errors emitted by Mapbox GL JS (invalid token, tile load failures,
  // style load failures, etc.). We capture the FIRST error and switch to the
  // OSM fallback so users never see a blank white map.
  const handleMapError = useCallback((e: ErrorEvent) => {
    const msg = e?.error?.message || e?.type || '';
    // eslint-disable-next-line no-console
    console.warn('[PropertyMap] Mapbox error, falling back to OpenStreetMap:', msg);
    setMapError(true);
  }, []);

  // Effective token validity: empty / placeholder / obviously fake → treat as
  // missing. Real Mapbox tokens start with "pk." and are long.
  const tokenIsValid = !isTokenInvalid(mapboxToken);

  // Compute initial view state: zoom to properties if available, otherwise country default
  const initialViewState = useMemo(() => {
    // If a single property is selected, zoom precisely to it
    if (selectedPropertyId) {
      const selected = mapProperties.find(p => p.id === selectedPropertyId);
      if (selected && selected.lat != null && selected.lng != null) {
        return {
          longitude: selected.lng,
          latitude: selected.lat,
          zoom: 16, // Street-level zoom for precise location
        };
      }
    }

    // If we have properties with coords, fit bounds around them
    if (mapProperties.length === 1) {
      return {
        longitude: mapProperties[0].lng!,
        latitude: mapProperties[0].lat!,
        zoom: 15, // Neighborhood-level zoom for single property
      };
    }

    if (mapProperties.length > 1) {
      const lats = mapProperties.map(p => p.lat!);
      const lngs = mapProperties.map(p => p.lng!);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return {
        longitude: (minLng + maxLng) / 2,
        latitude: (minLat + maxLat) / 2,
        zoom: 10,
      };
    }

    // Fallback: country-level
    if (selectedCountry && COUNTRY_BOUNDS[selectedCountry]) {
      return COUNTRY_BOUNDS[selectedCountry];
    }

    return { longitude: 2.3, latitude: 9.5, zoom: 5 };
  }, [mapProperties, selectedCountry, selectedPropertyId]);

  // Auto-fly to selected property when it changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (selectedPropertyId) {
      const selected = mapProperties.find(p => p.id === selectedPropertyId);
      if (selected && selected.lat != null && selected.lng != null) {
        mapRef.current.flyTo({
          center: [selected.lng, selected.lat],
          zoom: 16,
          duration: 1500,
          essential: true,
        });
      }
    }
  }, [selectedPropertyId, mapProperties, mapLoaded]);

  // Fit bounds when map loads with multiple properties
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || mapProperties.length <= 1) return;
    if (selectedPropertyId) return; // Don't override if a specific property is selected

    const lats = mapProperties.map(p => p.lat!);
    const lngs = mapProperties.map(p => p.lng!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Add padding around the bounds
    const latPadding = (maxLat - minLat) * 0.15 || 0.01;
    const lngPadding = (maxLng - minLng) * 0.15 || 0.01;

    mapRef.current.fitBounds(
      [
        [minLng - lngPadding, minLat - latPadding],
        [maxLng + lngPadding, maxLat + latPadding],
      ],
      { padding: 60, duration: 1000 }
    );
  }, [mapLoaded, mapProperties, selectedPropertyId]);

  // Geocoding: try to refine coordinates using Mapbox Geocoding API
  const geocodeAddress = useCallback(async (address: string, city: string, country: string): Promise<{ lat: number; lng: number } | null> => {
    if (!mapboxToken) return null;
    try {
      const query = encodeURIComponent(`${address}, ${city}, ${country}`);
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&limit=1&types=address,place,locality,neighborhood`
      );
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    } catch {
      // Silently fail — fall back to stored coordinates
    }
    return null;
  }, [mapboxToken]);

  const handleBoundsChange = useCallback(() => {
    if (mapRef.current && onBoundsChange) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      if (!bounds) return;
      onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
  }, [onBoundsChange]);

  // Build GeoJSON features for GeoTrust parcel overlay
  const parcelGeoJSON = useMemo(() => {
    if (!showGeoTrustOverlay) return null;
    const features = mapProperties
      .filter(p => p.boundaryPolygon && p.boundaryPolygon.length > 2)
      .map(p => ({
        type: 'Feature' as const,
        properties: {
          id: p.id,
          title: p.title,
          geoTrustStatus: p.geoTrustStatus || (p.geoTrust ? 'verified' : 'pending'),
          price: p.price,
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [p.boundaryPolygon!],
        },
      }));
    return { type: 'FeatureCollection' as const, features };
  }, [mapProperties, showGeoTrustOverlay]);

  // ─── Fallback UI ─────────────────────────────────────────────────────────
  // Used when:
  //   1. No valid Mapbox token (empty / placeholder / obviously fake)
  //   2. Mapbox emitted an error at runtime (token rejected, tiles failed to
  //      load, style failed to load, etc.)
  // In both cases, we render an OpenStreetMap embed (free, no token required)
  // alongside a property list so users still get a useful map experience.
  const showFallback = !tokenIsValid || mapError;

  if (showFallback) {
    const osmEmbedUrl = buildOsmEmbedUrl(mapProperties, selectedPropertyId);
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-gray-100 ${className}`} style={{ minHeight: 400 }}>
        {/* OpenStreetMap embed — free, no token required */}
        {mapProperties.length > 0 ? (
          <iframe
            title="Carte OpenStreetMap"
            src={osmEmbedUrl}
            className="absolute inset-0 w-full h-full"
            style={{ border: 0, minHeight: 400 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-lg bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-gray-700 mb-2">Carte Interactive</h3>
              <p className="text-sm text-gray-500 mb-1">Aucun bien avec localisation</p>
            </div>
          </div>
        )}

        {/* Property chips overlay (top-left) */}
        {mapProperties.length > 0 && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur rounded-xl p-2 shadow-lg max-w-[280px] z-10">
            <div className="text-[10px] font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              {mapProperties.length} bien{mapProperties.length !== 1 ? 's' : ''} · OpenStreetMap
            </div>
            <div className="space-y-1 max-h-[180px] overflow-y-auto">
              {mapProperties.slice(0, 6).map(p => (
                <button
                  key={p.id}
                  onClick={() => onPropertyClick?.(p.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-colors text-xs ${
                    p.id === selectedPropertyId
                      ? 'border-[#003087] bg-[#003087]/5'
                      : 'border-gray-200 hover:border-[#003087]'
                  }`}
                >
                  <span className="font-semibold text-[#D4AF37]">{formatPrice(p.price, p.transaction)}</span>
                  <span className="text-gray-400"> · </span>
                  <span className="text-gray-600">{p.quartier}, {p.city}</span>
                </button>
              ))}
              {mapProperties.length > 6 && (
                <p className="text-[10px] text-gray-400 pt-0.5">...et {mapProperties.length - 6} autres</p>
              )}
            </div>
          </div>
        )}

        {/* "Open larger map" link (bottom-right) */}
        {mapProperties.length > 0 && (
          <a
            href={osmEmbedUrl.replace('/export/embed.html', '/?mlat=' + (mapProperties.find(p => p.id === selectedPropertyId)?.lat ?? mapProperties[0].lat) + '&mlon=' + (mapProperties.find(p => p.id === selectedPropertyId)?.lng ?? mapProperties[0].lng) + '#map=15/' + (mapProperties.find(p => p.id === selectedPropertyId)?.lat ?? mapProperties[0].lat) + '/' + (mapProperties.find(p => p.id === selectedPropertyId)?.lng ?? mapProperties[0].lng))}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-white/95 backdrop-blur text-[#003087] text-xs font-medium px-2.5 py-1.5 rounded-lg shadow hover:bg-white transition-colors z-10"
          >
            Ouvrir la carte ↗
          </a>
        )}

        {/* Map Legend (bottom-left) — same as Mapbox version */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
          <div className="text-[10px] font-semibold text-gray-600 mb-1.5">Type de transaction</div>
          <div className="flex gap-3 flex-wrap">
            {Object.entries(TRANSACTION_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-gray-600">{getTransactionLabel(key)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`} style={{ minHeight: 400 }}>
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        onMoveEnd={handleBoundsChange}
        onLoad={() => {
          setMapLoaded(true);
          handleBoundsChange();
        }}
        onError={handleMapError}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: '100%', height: '100%', minHeight: 400, backgroundColor: '#e5e7eb' }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* GeoTrust Parcel Overlay */}
        {showGeoTrustOverlay && parcelGeoJSON && parcelGeoJSON.features.length > 0 && (
          <Source id="geotrust-parcels" type="geojson" data={parcelGeoJSON}>
            <Layer
              id="parcel-fill"
              type="fill"
              paint={{
                'fill-color': [
                  'match',
                  ['get', 'geoTrustStatus'],
                  'verified', '#00A651',
                  'pending', '#D4AF37',
                  'conflict', '#D93025',
                  '#6b7280'
                ],
                'fill-opacity': 0.15,
              }}
            />
            <Layer
              id="parcel-border"
              type="line"
              paint={{
                'line-color': [
                  'match',
                  ['get', 'geoTrustStatus'],
                  'verified', '#00A651',
                  'pending', '#D4AF37',
                  'conflict', '#D93025',
                  '#6b7280'
                ],
                'line-width': 2,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {mapProperties.map(property => {
          const color = TRANSACTION_COLORS[property.transaction] || '#003087';
          const isSelected = property.id === selectedPropertyId;

          return (
            <Marker
              key={property.id}
              longitude={property.lng!}
              latitude={property.lat!}
              anchor="bottom"
            >
              <button
                className="relative group"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupInfo(property);
                  onPropertyClick?.(property.id);
                }}
              >
                {/* Pulsing ring for selected/precise location */}
                {isSelected && (
                  <span className="absolute -inset-2 rounded-lg border-2 animate-ping"
                    style={{ borderColor: color, opacity: 0.5 }} />
                )}

                {/* Price marker */}
                <div
                  className={`px-2.5 py-1.5 rounded-full text-white text-[11px] font-bold shadow-lg border-2 border-white transition-all group-hover:scale-110 ${isSelected ? 'scale-110 ring-2 ring-offset-1' : ''}`}
                  style={{ backgroundColor: color }}
                >
                  {property.price >= 1000000
                    ? `${(property.price / 1000000).toFixed(0)}M`
                    : property.price >= 1000
                    ? `${(property.price / 1000).toFixed(0)}K`
                    : `${property.price}`}
                </div>

                {/* Pin point */}
                <div
                  className="w-3 h-3 rounded-full mx-auto -mt-1 shadow"
                  style={{ backgroundColor: color }}
                />

                {/* Address label for selected property */}
                {isSelected && property.address && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
                    <span className="text-[10px] bg-white text-gray-800 px-2 py-0.5 rounded shadow-sm font-medium">
                      {property.address}
                    </span>
                  </div>
                )}
              </button>
            </Marker>
          );
        })}

        {popupInfo && (
          <Popup
            longitude={popupInfo.lng!}
            latitude={popupInfo.lat!}
            anchor="bottom"
            offset={[0, -10] as [number, number]}
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            className="property-popup"
          >
            <div className="p-2 min-w-[220px]">
              <div className="flex gap-2 mb-2">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                  {popupInfo.images?.[0] ? (
                    <img
                      src={popupInfo.images[0]}
                      alt={popupInfo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-gray-800 truncate">{popupInfo.title}</h4>
                  <p className="text-[10px] text-gray-500">{popupInfo.quartier}, {popupInfo.city}</p>
                  <p className="text-sm font-bold text-[#D4AF37]">{formatPrice(popupInfo.price, popupInfo.transaction)}</p>
                </div>
              </div>
              <div className="flex gap-2 text-[10px] text-gray-500 mb-2">
                {popupInfo.bedrooms > 0 && <span>{popupInfo.bedrooms} ch.</span>}
                <span>{popupInfo.surface} m²</span>
                {popupInfo.investmentScore && (
                  <span className="text-[#00A651] font-semibold">Score: {popupInfo.investmentScore}</span>
                )}
              </div>

              {/* Coordinates display */}
              <div className="flex items-center gap-1 text-[9px] text-gray-400 mb-2">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
                </svg>
                <span>{popupInfo.lat?.toFixed(4)}, {popupInfo.lng?.toFixed(4)}</span>
                {popupInfo.address && (
                  <>
                    <span>·</span>
                    <span className="truncate">{popupInfo.address}</span>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  onPropertyClick?.(popupInfo.id);
                  setPopupInfo(null);
                }}
                className="w-full py-1.5 bg-[#003087] text-white text-xs font-semibold rounded-lg hover:bg-[#0047b3] transition-colors"
              >
                Voir le bien
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-xl p-3 shadow-lg">
        <div className="text-[10px] font-semibold text-gray-600 mb-1.5">Type de transaction</div>
        <div className="flex gap-3">
          {Object.entries(TRANSACTION_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-600">{getTransactionLabel(key)}</span>
            </div>
          ))}
        </div>
        {showGeoTrustOverlay && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-[10px] font-semibold text-gray-600 mb-1.5">GeoTrust</div>
            <div className="flex gap-3">
              {Object.entries(GEOTRUST_COLORS).map(([key, color]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: color }} />
                  <span className="text-[10px] text-gray-600">{GEOTRUST_LABELS[key]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
