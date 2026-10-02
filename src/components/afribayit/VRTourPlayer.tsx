'use client';

/**
 * VRTourPlayer — CDC §5.1.2 "Visite virtuelle 360° réelle + WebXR"
 *
 * RETOUR CLIENT 02/10 : « le VR 360° n'est pas fonctionnel ». L'ancienne
 * version simulait une rotation 360° en transformant CSS une image PLATE —
 * cosmétique et mensonger. Désormais :
 *   - hasVR + onLaunch → bouton « Lancer la visite immersive » qui ouvre le
 *     VRAI viewer Three.js (VirtualTourViewer — sphère équirectangulaire,
 *     panoramas réels servis depuis /panoramas/).
 *   - !hasVR → état honnête : « Visite 360° non disponible pour ce bien »
 *     + galerie photos simple, sans faux badge 360°.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Smartphone, Play, Box, ImageOff, RotateCw } from 'lucide-react';

const NAVY = '#003087';
const GOLD = '#D4AF37';

interface VRTourPlayerProps {
  /** Property title for display */
  propertyTitle: string;
  /** VR tour URL (equirectangular panorama) — optionnel, le lancement réel passe par la modale */
  tourUrl?: string;
  /** Fallback images if no VR tour */
  images?: string[];
  /** Whether VR is available */
  hasVR?: boolean;
  /** Ouvre le vrai viewer 360° (modale VirtualTourViewer Three.js) */
  onLaunch?: () => void;
  onClose?: () => void;
}

export default function VRTourPlayer({
  propertyTitle,
  images = [],
  hasVR = false,
  onLaunch,
  onClose,
}: VRTourPlayerProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [webxrSupported, setWebxrSupported] = useState(false);

  // Check WebXR support (casques VR)
  useEffect(() => {
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    if (xr) {
      xr.isSessionSupported('immersive-vr')
        .then((supported: boolean) => setWebxrSupported(supported))
        .catch(() => setWebxrSupported(false));
    }
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  // ─── Cas 1 : VR disponible → vrai lancement immersif ───
  if (hasVR && onLaunch) {
    return (
      <div ref={containerRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${NAVY}10` }}>
              <Box className="w-4 h-4" style={{ color: NAVY }} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Visite virtuelle 360°</h3>
              <p className="text-xs text-gray-400">{propertyTitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Plein écran"
            >
              <Maximize2 className="w-4 h-4 text-gray-500" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Fermer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Carte de lancement immersif */}
        <div className="relative aspect-video bg-gray-900 overflow-hidden">
          {/* Aperçu : première photo du bien en fond, voile navy */}
          {images[0] && (
            <img
              src={images[0]}
              alt={`${propertyTitle} — aperçu`}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
              draggable={false}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl" style={{ background: NAVY }}>
              <RotateCw className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">Immersion 360° disponible</p>
              <p className="text-white/70 text-xs mt-1 max-w-sm">
                Explorez ce bien à 360° : glissez pour pivoter, zoomez pour les détails.
                Compatible casques VR via WebXR.
              </p>
            </div>
            <button
              onClick={onLaunch}
              className="px-8 py-3.5 rounded-full text-white font-bold text-sm shadow-xl transition-transform hover:scale-105 flex items-center gap-2"
              style={{ background: NAVY }}
            >
              <Play className="w-4 h-4" style={{ color: GOLD }} />
              Lancer la visite immersive
            </button>
            {webxrSupported && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                <Smartphone className="w-3.5 h-3.5" />
                Casque VR détecté — WebXR prêt
              </span>
            )}
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'rgba(0, 48, 135, 0.8)' }}>
            <Box className="w-3.5 h-3.5" />
            360° réel
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50/50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Play className="w-3 h-3" />
            <span>Panorama équirectangulaire — rendu WebGL</span>
          </div>
          {webxrSupported && (
            <span className="text-xs font-semibold" style={{ color: '#00A651' }}>
              ✓ VR Ready
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─── Cas 2 : pas de VR → état honnête + galerie photos ───
  const displayImage = images[currentImage] || images[0];

  return (
    <div ref={containerRef} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100">
            <ImageOff className="w-4 h-4 text-gray-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Visite virtuelle 360°</h3>
            <p className="text-xs text-gray-400">{propertyTitle}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Fermer"
          >
            ✕
          </button>
        )}
      </div>

      {displayImage ? (
        <>
          <div className="relative aspect-video bg-gray-100 overflow-hidden">
            <img
              src={displayImage}
              alt={`${propertyTitle} — photo ${currentImage + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Photo précédente"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Photo suivante"
                >
                  ›
                </button>
                <div className="absolute bottom-3 right-3 flex gap-1.5">
                  {images.slice(0, 10).map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImage(i);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === currentImage ? 'w-6' : 'bg-white/50'
                      }`}
                      style={i === currentImage ? { background: GOLD } : {}}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
              Photos HD du bien
            </div>
          </div>
          <div className="p-3 bg-gray-50/50 text-xs text-gray-400 text-center">
            Visite 360° non encore disponible pour ce bien — les photos haute définition
            restent consultables. La capture panorama est réalisée par nos agents certifiés
            GeoTrust à la mise en ligne.
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-sm text-gray-400">
          Aucun média visuel disponible pour ce bien.
        </div>
      )}
    </div>
  );
}
