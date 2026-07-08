'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import VoiceSearchButton from '@/components/afribayit/VoiceSearchButton';
import { useTranslation } from '@/lib/i18n/use-translate';
import {
  Building2, Home, Hotel, MapPin, Key, TrendingUp,
  ShieldCheck, BedDouble, Landmark, Wrench,
  Castle, DoorOpen, Trees, Bath, ChefHat,
  Warehouse, Store, Tent, Building,
} from 'lucide-react';

interface HeroSectionProps {
  onNavigate: (section: string) => void;
  onOpenRebecca: () => void;
}

interface StatsData {
  properties: number;
  verifiedProperties?: number;
  premiumProperties?: number;
  geoTrustProperties?: number;
  transactions: number;
  countries: number;
  countriesList?: string[];
  agents: number;
  artisans?: number;
  notaries?: number;
  users?: number;
  satisfaction: number;
  reviewsCount?: number;
  courses?: number;
  communityPosts?: number;
  hotels: number;
  guesthouses: number;
  shortTermRentals?: number;
  bookings: number;
  byCountry?: Record<string, { properties: number; hotels: number; guesthouses: number }>;
}

interface FeaturedProperty {
  id: string;
  title: string;
  slug: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  city: string;
  country: string;
  quartier: string;
  image: string | null;
  verified: boolean;
  premium: boolean;
  bedrooms: number | null;
  surface: number | null;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Animated counter component
function AnimatedCounter({ target, suffix = '', duration = 2 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || target === 0) return;

    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(timer);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {target > 0 ? (
        <>
          {new Intl.NumberFormat('fr-FR').format(count)}
          {suffix}
        </>
      ) : (
        '—'
      )}
    </span>
  );
}

// Real estate & hospitality icons — embedded into the 3D spinning background layers
const BACKGROUND_ICONS_LAYER_1 = [
  { Icon: Building2, color: '#009CDE', size: 28 },
  { Icon: Home, color: '#D4AF37', size: 24 },
  { Icon: Hotel, color: '#003087', size: 26 },
  { Icon: Key, color: '#D4AF37', size: 22 },
  { Icon: BedDouble, color: '#00A651', size: 24 },
  { Icon: Landmark, color: '#009CDE', size: 22 },
  { Icon: Wrench, color: '#D4AF37', size: 20 },
  { Icon: Store, color: '#009CDE', size: 22 },
  { Icon: Warehouse, color: '#003087', size: 24 },
  { Icon: DoorOpen, color: '#D4AF37', size: 22 },
  { Icon: Trees, color: '#00A651', size: 26 },
  { Icon: Bath, color: '#009CDE', size: 20 },
];

const BACKGROUND_ICONS_LAYER_2 = [
  { Icon: Castle, color: '#D4AF37', size: 30 },
  { Icon: TrendingUp, color: '#009CDE', size: 22 },
  { Icon: ShieldCheck, color: '#003087', size: 24 },
  { Icon: MapPin, color: '#00A651', size: 22 },
  { Icon: ChefHat, color: '#D4AF37', size: 24 },
  { Icon: Building, color: '#009CDE', size: 26 },
  { Icon: Tent, color: '#00A651', size: 22 },
  { Icon: Home, color: '#D4AF37', size: 28 },
  { Icon: Hotel, color: '#003087', size: 22 },
  { Icon: Key, color: '#D4AF37', size: 20 },
  { Icon: BedDouble, color: '#009CDE', size: 22 },
  { Icon: Landmark, color: '#00A651', size: 24 },
];

const BACKGROUND_ICONS_LAYER_3 = [
  { Icon: Building2, color: '#D4AF37', size: 24 },
  { Icon: Home, color: '#009CDE', size: 22 },
  { Icon: Warehouse, color: '#00A651', size: 26 },
  { Icon: ShieldCheck, color: '#003087', size: 20 },
  { Icon: Hotel, color: '#D4AF37', size: 22 },
  { Icon: Trees, color: '#00A651', size: 24 },
  { Icon: DoorOpen, color: '#009CDE', size: 22 },
  { Icon: Castle, color: '#D4AF37', size: 28 },
  { Icon: MapPin, color: '#003087', size: 20 },
  { Icon: Key, color: '#00A651', size: 22 },
  { Icon: ChefHat, color: '#D4AF37', size: 24 },
  { Icon: Building, color: '#009CDE', size: 22 },
];

// Property type label mapping
const TYPE_LABELS: Record<string, string> = {
  villa: 'Villa',
  appartement: 'Appart.',
  terrain: 'Terrain',
  bureau: 'Bureau',
  commerce: 'Commerce',
  chambre: 'Chambre',
  guesthouse: 'Séjour',
  hotel: 'Hôtel',
};

const TRANSACTION_LABELS: Record<string, string> = {
  achat: 'Achat',
  location: 'Location',
  investissement: 'Invest.',
  location_courte_duree: 'Nuitée',
};

// Format price for mini cards — compact display
function formatMiniPrice(price: number, currency: string, transaction: string): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    const suffix = transaction === 'location_courte_duree' ? '/nuit' : transaction === 'location' ? '/mois' : '';
    return `${formatted}M ${currency}${suffix}`;
  }
  if (price >= 1_000) {
    const thousands = price / 1_000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    const suffix = transaction === 'location_courte_duree' ? '/nuit' : transaction === 'location' ? '/mois' : '';
    return `${formatted}K ${currency}${suffix}`;
  }
  const suffix = transaction === 'location_courte_duree' ? '/nuit' : transaction === 'location' ? '/mois' : '';
  return `${new Intl.NumberFormat('fr-FR').format(price)} ${currency}${suffix}`;
}

export default function HeroSection({ onNavigate, onOpenRebecca }: HeroSectionProps) {
  const { t } = useTranslation();
  const [searchType, setSearchType] = useState('achat');
  const [searchCountry, setSearchCountry] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile viewport for responsive ring radii
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch real stats from backend /stats endpoint (aggregated live from DB)
  const { data: stats } = useQuery<StatsData>({
    queryKey: ['platform-stats'],
    queryFn: () => apiFetch<StatsData>('/stats'),
    staleTime: 5 * 60 * 1000, // 5 min — matches backend cache
    retry: 2,
  });

  // Fetch featured properties from database
  const { data: featuredProperties = [] } = useQuery<FeaturedProperty[]>({
    queryKey: ['featured-properties'],
    queryFn: () => apiFetch<FeaturedProperty[]>('/api/properties/featured?limit=8'),
    staleTime: 5 * 60 * 1000,
  });

  const statsItems = [
    { value: stats?.properties ?? 0, suffix: '+', label: 'Biens listés' },
    { value: stats?.transactions ?? 0, suffix: '+', label: 'Transactions' },
    { value: (stats?.hotels ?? 0) + (stats?.guesthouses ?? 0), suffix: '+', label: 'Hôtels & Séjours' },
    { value: stats?.countries ?? 0, suffix: '', label: 'Pays couverts' },
    { value: stats?.bookings ?? 0, suffix: '+', label: 'Réservations' },
    { value: stats?.satisfaction ?? 0, suffix: '%', label: 'Avis positifs' },
  ];

  // Distribute featured properties into the 3 spinning layers
  // On mobile, use fewer properties to reduce DOM load
  const propsLayer1 = useMemo(() => featuredProperties.slice(0, isMobile ? 2 : 3), [featuredProperties, isMobile]);
  const propsLayer2 = useMemo(() => featuredProperties.slice(3, isMobile ? 4 : 5), [featuredProperties, isMobile]);
  const propsLayer3 = useMemo(() => isMobile ? [] : featuredProperties.slice(5, 8), [featuredProperties, isMobile]);

  // Responsive ring radii — scale down for mobile/tablet
  const scaleFactor = isMobile ? 0.42 : isTablet ? 0.65 : 1;
  const iconScale = isMobile ? 0.65 : isTablet ? 0.8 : 1;

  // Layer radii (icons)
  const layer1IconRadius = Math.round(240 * scaleFactor);
  const layer2IconRadius = Math.round(380 * scaleFactor);
  const layer3IconRadius = Math.round(700 * scaleFactor);

  // Layer radii (property cards)
  const layer1PropRadius = Math.round(340 * scaleFactor);
  const layer2PropRadius = Math.round(500 * scaleFactor);
  const layer3PropRadius = Math.round(900 * scaleFactor);

  // Ring image sizes
  const ring1Size = Math.round(800 * scaleFactor);
  const ring2Size = Math.round(1000 * scaleFactor);
  const ring3Size = Math.round(2000 * scaleFactor);

  // Number of icons per layer (fewer on mobile for performance)
  const iconsLayer1 = isMobile ? BACKGROUND_ICONS_LAYER_1.slice(0, 6) : BACKGROUND_ICONS_LAYER_1;
  const iconsLayer2 = isMobile ? BACKGROUND_ICONS_LAYER_2.slice(0, 6) : BACKGROUND_ICONS_LAYER_2;
  const iconsLayer3 = isMobile ? [] : BACKGROUND_ICONS_LAYER_3;

  // Generate icon positions on a circular ring for each layer
  function getIconPositions(count: number, radius: number) {
    const positions: Array<{ x: number; y: number; angle: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 360;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      positions.push({ x, y, angle });
    }
    return positions;
  }

  // Generate property card positions on a circular ring
  function getPropertyPositions(count: number, radius: number, offsetAngle: number = 0) {
    const positions: Array<{ x: number; y: number; angle: number }> = [];
    for (let i = 0; i < count; i++) {
      const angle = offsetAngle + (i / count) * 360;
      const rad = (angle * Math.PI) / 180;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      positions.push({ x, y, angle });
    }
    return positions;
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden" style={{ backgroundColor: '#003366' }}>
      {/* ═══════════════════════════════════════════════════════════
          3D ANIMATED BACKGROUND — Spinning Layers with Icons & Property Cards
          Fully responsive: scales down on mobile/tablet
      ═══════════════════════════════════════════════════════════ */}
      <style>{`
        @keyframes hero-spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hero-spin-slow-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        .hero-spin-slow {
          animation: hero-spin-slow 90s linear infinite;
        }
        .hero-spin-slow-reverse {
          animation: hero-spin-slow-reverse 75s linear infinite;
        }
        .hero-spin-medium {
          animation: hero-spin-slow 60s linear infinite;
        }
        /* Faster spinning on mobile for visual appeal despite smaller scale */
        @media (max-width: 639px) {
          .hero-spin-slow {
            animation-duration: 70s;
          }
          .hero-spin-slow-reverse {
            animation-duration: 55s;
          }
          .hero-spin-medium {
            animation-duration: 45s;
          }
        }
        @media (min-width: 640px) and (max-width: 1023px) {
          .hero-spin-slow {
            animation-duration: 80s;
          }
          .hero-spin-slow-reverse {
            animation-duration: 65s;
          }
          .hero-spin-medium {
            animation-duration: 52s;
          }
        }
        @keyframes hero-float-gentle {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes hero-pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.05); opacity: 0.7; }
          100% { transform: scale(1); opacity: 0.4; }
        }
        .hero-pulse-ring {
          animation: hero-pulse-ring 4s ease-in-out infinite;
        }
        @keyframes hero-icon-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        .hero-icon-pulse {
          animation: hero-icon-pulse 4s ease-in-out infinite;
        }
        @keyframes hero-card-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(212, 175, 55, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3); }
          50% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4); }
        }
        .hero-card-glow {
          animation: hero-card-glow 5s ease-in-out infinite;
        }
        /* Accessibility: respect reduced motion preference */
        @media (prefers-reduced-motion: reduce) {
          .hero-spin-slow,
          .hero-spin-slow-reverse,
          .hero-spin-medium,
          .hero-icon-pulse,
          .hero-card-glow,
          .hero-pulse-ring {
            animation: none !important;
          }
        }
      `}</style>

      {/* Background Decorative Layer — 3D perspective with spinning layers */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          perspective: isMobile ? "800px" : "1200px",
          transform: `perspective(${isMobile ? '800' : '1200'}px) rotateX(${isMobile ? 8 : 15}deg)`,
          transformOrigin: "center bottom",
        }}
      >
        {/* ══ Layer 3 (Back) — Large outer ring: Geometric shape + Icons + Property cards ══ */}
        {/* Hidden entirely on mobile for performance — outermost layer is least visible anyway */}
        {!isMobile && (
          <div className="absolute inset-0 hero-spin-slow">
            {/* Original geometric ring image */}
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                width: `${ring3Size}px`,
                height: `${ring3Size}px`,
                transform: "translate(-50%, -50%) rotate(279.05deg)",
                zIndex: 0,
              }}
            >
              <img
                src="https://framerusercontent.com/images/oqZEqzDEgSLygmUDuZAYNh2XQ9U.png?scale-down-to=2048"
                alt=""
                className="w-full h-full object-cover opacity-30"
                loading="lazy"
              />
            </div>

            {/* Real Estate Icons scattered on this layer */}
            <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0, zIndex: 1 }}>
              {getIconPositions(iconsLayer3.length, layer3IconRadius).map((pos, i) => {
                const icon = iconsLayer3[i];
                return (
                  <div
                    key={`l3-icon-${i}`}
                    className="absolute hero-icon-pulse"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center rounded-xl backdrop-blur-sm border border-white/5"
                      style={{
                        width: Math.round((icon.size + 16) * iconScale),
                        height: Math.round((icon.size + 16) * iconScale),
                        backgroundColor: `${icon.color}15`,
                      }}
                    >
                      <icon.Icon
                        className="opacity-30"
                        style={{ color: icon.color, width: Math.round(icon.size * iconScale), height: Math.round(icon.size * iconScale) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Property cards on this layer (outermost ring) */}
            <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0, zIndex: 2 }}>
              {getPropertyPositions(propsLayer3.length, layer3PropRadius, 45).map((pos, i) => {
                const prop = propsLayer3[i];
                if (!prop) return null;
                return (
                  <div
                    key={`l3-prop-${prop.id}`}
                    className="absolute hero-card-glow"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${i * 1.2}s`,
                    }}
                  >
                    <div className={`${isTablet ? 'w-28' : 'w-36'} rounded-xl overflow-hidden bg-black/60 backdrop-blur-md border border-white/10`}>
                      <div className={`relative ${isTablet ? 'h-12' : 'h-16'}`}>
                        {prop.image && (
                          <img
                            src={prop.image}
                            alt={prop.title}
                            className="w-full h-full object-cover opacity-60"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#D4AF37]/80 text-white text-[7px] font-bold rounded-full font-body">
                          {TYPE_LABELS[prop.type] || prop.type}
                        </div>
                      </div>
                      <div className="p-1.5">
                        <h4 className="font-display text-[9px] font-bold text-white/80 truncate">
                          {prop.title}
                        </h4>
                        <p className="text-[7px] text-white/40 truncate font-body">
                          {prop.city}, {prop.country}
                        </p>
                        <p className="font-mono-data text-[8px] font-bold text-[#D4AF37]/70 mt-0.5">
                          {formatMiniPrice(prop.price, prop.currency, prop.transaction)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══ Layer 2 (Middle) — Medium ring + Icons + Property cards ══ */}
        <div className="absolute inset-0 hero-spin-slow-reverse">
          {/* Original geometric ring image */}
          <div
            className="absolute top-1/2 left-1/2"
            style={{
              width: `${ring2Size}px`,
              height: `${ring2Size}px`,
              transform: "translate(-50%, -50%) rotate(304.42deg)",
              zIndex: 0,
            }}
          >
            <img
              src="https://framerusercontent.com/images/UbucGYsHDAUHfaGZNjwyCzViw8.png?scale-down-to=1024"
              alt=""
              className="w-full h-full object-cover opacity-35"
              loading="lazy"
            />
          </div>

          {/* Real Estate Icons scattered on this layer */}
          <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0, zIndex: 1 }}>
            {getIconPositions(iconsLayer2.length, layer2IconRadius).map((pos, i) => {
              const icon = iconsLayer2[i];
              return (
                <div
                  key={`l2-icon-${i}`}
                  className="absolute hero-icon-pulse"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 0.35}s`,
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-xl backdrop-blur-sm border border-white/5"
                    style={{
                      width: Math.round((icon.size + 14) * iconScale),
                      height: Math.round((icon.size + 14) * iconScale),
                      backgroundColor: `${icon.color}12`,
                    }}
                  >
                    <icon.Icon
                      className="opacity-35"
                      style={{ color: icon.color, width: Math.round(icon.size * iconScale), height: Math.round(icon.size * iconScale) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Property cards on this layer (middle ring) */}
          <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0, zIndex: 2 }}>
            {getPropertyPositions(propsLayer2.length, layer2PropRadius, 120).map((pos, i) => {
              const prop = propsLayer2[i];
              if (!prop) return null;
              return (
                <div
                  key={`l2-prop-${prop.id}`}
                  className="absolute hero-card-glow"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 1.5}s`,
                  }}
                >
                  <div className={`${isMobile ? 'w-28' : isTablet ? 'w-32' : 'w-40'} rounded-xl overflow-hidden bg-black/60 backdrop-blur-md border border-white/10`}>
                    <div className={`relative ${isMobile ? 'h-12' : isTablet ? 'h-16' : 'h-20'}`}>
                      {prop.image && (
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-full object-cover opacity-65"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#D4AF37]/80 text-white text-[7px] font-bold rounded-full font-body">
                        {TYPE_LABELS[prop.type] || prop.type}
                      </div>
                      {prop.verified && !isMobile && (
                        <div className="absolute top-1.5 right-1.5">
                          <ShieldCheck className="w-3 h-3 text-[#00A651] opacity-70" />
                        </div>
                      )}
                    </div>
                    <div className={`${isMobile ? 'p-1' : 'p-2'}`}>
                      <h4 className={`font-display ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold text-white/80 truncate`}>
                        {prop.title}
                      </h4>
                      <p className="text-[7px] text-white/40 truncate font-body">
                        {prop.city}, {prop.country}
                      </p>
                      <p className={`font-mono-data ${isMobile ? 'text-[7px]' : 'text-[9px]'} font-bold text-[#D4AF37]/80 mt-0.5`}>
                        {formatMiniPrice(prop.price, prop.currency, prop.transaction)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ Layer 1 (Front) — Small inner ring + Icons + Property cards ══ */}
        <div className="absolute inset-0 hero-spin-medium">
          {/* Original geometric ring image */}
          <div
            className="absolute top-1/2 left-1/2"
            style={{
              width: `${ring1Size}px`,
              height: `${ring1Size}px`,
              transform: "translate(-50%, -50%) rotate(48.33deg)",
              zIndex: 0,
            }}
          >
            <img
              src="https://framerusercontent.com/images/Ans5PAxtJfg3CwxlrPMSshx2Pqc.png"
              alt=""
              className="w-full h-full object-cover opacity-40"
              loading="lazy"
            />
          </div>

          {/* Real Estate Icons scattered on this layer (inner ring) */}
          <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0, zIndex: 1 }}>
            {getIconPositions(iconsLayer1.length, layer1IconRadius).map((pos, i) => {
              const icon = iconsLayer1[i];
              return (
                <div
                  key={`l1-icon-${i}`}
                  className="absolute hero-icon-pulse"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 0.25}s`,
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-lg backdrop-blur-sm border border-white/8"
                    style={{
                      width: Math.round((icon.size + 12) * iconScale),
                      height: Math.round((icon.size + 12) * iconScale),
                      backgroundColor: `${icon.color}18`,
                    }}
                  >
                    <icon.Icon
                      className="opacity-40"
                      style={{ color: icon.color, width: Math.round(icon.size * iconScale), height: Math.round(icon.size * iconScale) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Property cards on this layer (inner ring) */}
          <div className="absolute top-1/2 left-1/2" style={{ width: 0, height: 0, zIndex: 2 }}>
            {getPropertyPositions(propsLayer1.length, layer1PropRadius, 200).map((pos, i) => {
              const prop = propsLayer1[i];
              if (!prop) return null;
              return (
                <div
                  key={`l1-prop-${prop.id}`}
                  className="absolute hero-card-glow"
                  style={{
                    left: pos.x,
                    top: pos.y,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 1.8}s`,
                  }}
                >
                  <div className={`${isMobile ? 'w-32' : isTablet ? 'w-36' : 'w-44'} rounded-xl overflow-hidden bg-black/60 backdrop-blur-md border border-white/10`}>
                    <div className={`relative ${isMobile ? 'h-14' : isTablet ? 'h-18' : 'h-22'}`}>
                      {prop.image && (
                        <img
                          src={prop.image}
                          alt={prop.title}
                          className="w-full h-full object-cover opacity-70"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#D4AF37]/80 text-white text-[7px] font-bold rounded-full font-body">
                        {TYPE_LABELS[prop.type] || prop.type}
                      </div>
                      {prop.premium && !isMobile && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 bg-[#003087]/80 text-[#D4AF37] text-[7px] font-bold rounded-full font-body">
                          Premium
                        </div>
                      )}
                      {prop.verified && !isMobile && (
                        <div className="absolute bottom-1.5 right-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#00A651] opacity-80" />
                        </div>
                      )}
                    </div>
                    <div className={`${isMobile ? 'p-1.5' : 'p-2'}`}>
                      <h4 className={`font-display ${isMobile ? 'text-[9px]' : 'text-[11px]'} font-bold text-white/85 truncate`}>
                        {prop.title}
                      </h4>
                      <p className="text-[7px] text-white/45 truncate font-body">
                        {prop.quartier || prop.city}, {prop.country}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`font-mono-data ${isMobile ? 'text-[8px]' : 'text-[10px]'} font-bold text-[#D4AF37]`}>
                          {formatMiniPrice(prop.price, prop.currency, prop.transaction)}
                        </p>
                        {prop.bedrooms && !isMobile && (
                          <span className="text-[7px] text-white/40 font-body">
                            {prop.bedrooms} ch.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gradient Overlay — Navy to transparent */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to top, #003366 5%, rgba(0, 51, 102, 0.88) 25%, rgba(0, 51, 102, 0.65) 50%, rgba(0, 51, 102, 0.4) 75%, rgba(0, 51, 102, 0.25) 100%)`,
        }}
      />

      {/* Animated mesh gradient accents — smaller on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        <motion.div
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute top-20 right-0 ${isMobile ? 'w-48 h-48' : 'w-96 h-96'} bg-[#009CDE]/10 rounded-full blur-3xl`}
        />
        <motion.div
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 30, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute bottom-0 left-0 ${isMobile ? 'w-40 h-40' : 'w-80 h-80'} bg-[#D4AF37]/10 rounded-full blur-3xl`}
        />
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="relative z-20 w-full min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div className="max-w-[1400px] w-full mx-auto flex flex-col items-center text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOut }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full glass border border-white/20 mb-4 sm:mb-6"
          >
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            <span className="text-white/90 text-xs sm:text-sm font-medium font-body">{t('hero.badge', "Plateforme N°1 en Afrique de l'Ouest")}</span>
          </motion.div>

          {/* H1 Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
            className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-[72px] font-bold text-white leading-[1.05] mb-4 sm:mb-6"
          >
            {t('hero.title', "Où l'Afrique")}<br />
            <span className="text-[#D4AF37]">{t('hero.titleAccent', 'trouve sa maison')}</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
            className="text-white/70 text-sm sm:text-base md:text-lg max-w-xl mb-6 sm:mb-10 leading-relaxed font-body px-2"
          >
            {t('hero.subtitle', "Où les rêves deviennent adresses. Achetez, louez, investissez en toute confiance avec escrow sécurisé et documents vérifiés dans 4 pays africains.")}
          </motion.p>

          {/* ═══ Search Bar — Glassmorphism Style ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easeOut }}
            className="w-full max-w-2xl mb-6 sm:mb-12"
          >
            <div className="relative">
              {/* Gradient border glow */}
              <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-r from-[#009CDE]/40 via-[#D4AF37]/30 to-[#009CDE]/40 animate-pulse" />
              <div className="relative flex flex-col sm:flex-row gap-2 p-2 bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-2xl">
                {/* Search Input */}
                <div className="flex-1 flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#003087] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label={t('hero.cta', 'Rechercher')}
                    placeholder={t('hero.searchPlaceholder', 'Ville, quartier, type de bien...')}
                    className="flex-1 text-xs sm:text-sm text-[#2C2E2F] placeholder-gray-400 outline-none bg-transparent font-body"
                  />
                  {/* Voice Search Button */}
                  <VoiceSearchButton
                    onTranscript={handleVoiceTranscript}
                    currentQuery={searchQuery}
                  />
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px bg-gray-200 my-2" />

                {/* Transaction Type Selector */}
                <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-0">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="text-xs sm:text-sm text-[#2C2E2F] bg-transparent outline-none font-body cursor-pointer"
                  >
                    <option value="achat">Acheter</option>
                    <option value="location">Louer</option>
                    <option value="investissement">Investir</option>
                    <option value="sejour">Séjour</option>
                  </select>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px bg-gray-200 my-2" />

                {/* Country Selector - hidden on very small mobile */}
                <div className={`items-center gap-2 px-3 sm:px-4 py-2 sm:py-0 ${isMobile ? 'hidden' : 'flex'}`}>
                  <svg className="w-4 h-4 text-[#009CDE] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                  <select
                    value={searchCountry}
                    onChange={(e) => setSearchCountry(e.target.value)}
                    className="text-xs sm:text-sm text-[#2C2E2F] bg-transparent outline-none font-body cursor-pointer"
                  >
                    <option value="all">Tous les pays</option>
                    {COUNTRIES_CONFIG.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Search Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const routes: Record<string, string> = {
                      achat: '/acheter',
                      location: '/louer',
                      investissement: '/investir',
                      sejour: '/sejours',
                    };
                    window.location.href = routes[searchType] || '/search';
                  }}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#003087] hover:bg-[#0047b3] text-white rounded-[1.2rem] text-xs sm:text-sm font-semibold transition-colors font-body"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('hero.cta', 'Rechercher')}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* ═══ Real Estate & Hospitality Icons Row ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55, ease: easeOut }}
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-10"
          >
            {[
              { Icon: Building2, label: 'Immobilier', color: '#009CDE' },
              { Icon: Home, label: 'Villas', color: '#D4AF37' },
              { Icon: Hotel, label: 'Hôtels', color: '#003087' },
              { Icon: MapPin, label: '5 Pays', color: '#00A651' },
              { Icon: Key, label: 'Location', color: '#D4AF37' },
              { Icon: TrendingUp, label: 'Investir', color: '#009CDE' },
              { Icon: ShieldCheck, label: 'Escrow', color: '#003087' },
              { Icon: BedDouble, label: 'Guesthouses', color: '#00A651' },
              ...(isMobile ? [] : [
                { Icon: Landmark, label: 'Notaires', color: '#009CDE' },
                { Icon: Wrench, label: 'Artisans', color: '#D4AF37' },
              ]),
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.06, ease: easeOut }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <item.Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: item.color }} />
                <span className="text-white/60 text-[10px] sm:text-xs font-body font-medium">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* ═══ Stats Bar with Animated Counters ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7, ease: easeOut }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-10"
          >
            {/* On mobile, show only 4 stats instead of 6 */}
            {(isMobile ? statsItems.slice(0, 4) : statsItems).map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: easeOut }}
                className="text-center"
              >
                <div className="font-mono-data text-lg sm:text-xl md:text-2xl font-bold text-white">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-white/50 text-[10px] sm:text-xs md:text-sm font-body">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Bottom — solid color transition to next section (no gradient) */}
    </section>
  );
}
