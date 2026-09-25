'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGeometers, useGeometerMissions, useCreateGeotrustMission } from '@/hooks/useGeotrust';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { AlertTriangle, CheckCircle, ClipboardList, Coins, Drone, Map, MapPin, Ruler, Search, ArrowLeft, Star, Briefcase, Clock, Award, X, ShieldCheck } from 'lucide-react';
import { geoServiceLabel } from '@/lib/constants';
import { useTranslation } from '@/lib/i18n/use-translate';

interface Geometer {
  id: string;
  name: string;
  avatar: string;
  city: string;
  country: string;
  rating: number;
  reviews: number;
  certifications: string[];
  missions: number;
  certifiedAt?: string;
  createdAt?: string;
}

interface Mission {
  id: string;
  propertyTitle: string;
  status: string;
  geometerId: string;
  createdAt: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

// Static config — geometer service catalog using DB service codes (GEO_*)
// Prix : source unique src/lib/geotrust/pricing.ts (décision T-5, registre d'arbitrage CDC)
import { GEO_SERVICE_PRICES, GEO_PACKS } from '@/lib/geotrust/pricing';

const geometerServices = [
  { id: 'geo-1', name: geoServiceLabel('GEO_GPS'), code: 'GEO_GPS', price: GEO_SERVICE_PRICES.GEO_GPS, icon: <MapPin className="w-4 h-4" />, description: 'Relevé GPS de précision pour repérage et coordonnées', descKey: 'geotrust.serviceGpsDesc' },
  { id: 'geo-2', name: geoServiceLabel('GEO_SURF'), code: 'GEO_SURF', price: GEO_SERVICE_PRICES.GEO_SURF, icon: <Ruler className="w-4 h-4" />, description: 'Mesure précise de la superficie réelle du terrain', descKey: 'geotrust.serviceSurfDesc' },
  { id: 'geo-3', name: geoServiceLabel('GEO_INSP'), code: 'GEO_INSP', price: GEO_SERVICE_PRICES.GEO_INSP, icon: <Search className="w-4 h-4" />, description: 'Inspection complète : limites, servitudes, risques', descKey: 'geotrust.serviceInspDesc' },
  { id: 'geo-4', name: geoServiceLabel('GEO_BORN'), code: 'GEO_BORN', price: GEO_SERVICE_PRICES.GEO_BORN, icon: <MapPin className="w-4 h-4" />, description: 'Bornage officiel avec pose de bornes', descKey: 'geotrust.serviceBornDesc' },
  { id: 'geo-5', name: geoServiceLabel('GEO_TOPO'), code: 'GEO_TOPO', price: GEO_SERVICE_PRICES.GEO_TOPO, icon: <Map className="w-4 h-4" />, description: 'Étude topographique complète avec plan', descKey: 'geotrust.serviceTopoDesc' },
  { id: 'geo-6', name: geoServiceLabel('GEO_DRON'), code: 'GEO_DRON', price: GEO_SERVICE_PRICES.GEO_DRON, icon: <Drone className="w-4 h-4" />, description: 'Cartographie aérienne haute résolution', descKey: 'geotrust.serviceDronDesc' },
  { id: 'geo-7', name: geoServiceLabel('GEO_CERT'), code: 'GEO_CERT', price: GEO_SERVICE_PRICES.GEO_CERT, icon: <CheckCircle className="w-4 h-4" />, description: 'Certificat de conformité géométrique', descKey: 'geotrust.serviceCertDesc' },
  { id: 'geo-8', name: geoServiceLabel('GEO_3D'), code: 'GEO_3D', price: GEO_SERVICE_PRICES.GEO_3D, icon: <Map className="w-4 h-4" />, description: 'Modélisation 3D du terrain et des constructions', descKey: 'geotrust.service3dDesc' },
].map((s) => ({ ...s, priceLabel: `${s.price.toLocaleString('fr-FR')} FCFA` }));

// CDC §7C.9 — GeoTrust bundled packs (3 tiers: Standard / Certification / Premium Drone)
// Prix et services : source unique src/lib/geotrust/pricing.ts (décision T-5).
// Packs = 75 000 / 150 000 / 350 000 XOF — remises réelles vs. à la carte :
//   Standard:    95 000 → 75 000   (−21 %)
//   Certificat.: 245 000 → 150 000  (−39 %)
//   Premium:     395 000 → 350 000  (−11 %, + VR et rapport complet)
// Le pourcentage exact est affiché sur chaque carte — économie vérifiable.
const INCLUDE_KEYS: Record<string, string> = {
  'Rapport de mission': 'geotrust.packIncludeReport',
  'Badge GeoTrust officiel': 'geotrust.packIncludeBadge',
  'Sécurisation escrow AfriBayit': 'geotrust.packIncludeEscrow',
  'Visite VR immersive': 'geotrust.packIncludeVr',
  'Rapport détaillé': 'geotrust.packIncludeDetailedReport',
};

const geotrustPacks = GEO_PACKS.map((pack) => ({
  ...pack,
  priceLabel: `${pack.price.toLocaleString('fr-FR')} FCFA`,
  nameKey: pack.code === 'certification' ? 'geotrust.packCertificationName' : pack.code === 'premium_drone' ? 'geotrust.packPremiumName' : 'geotrust.packStandardName',
  descKey: pack.code === 'certification' ? 'geotrust.packCertificationDesc' : pack.code === 'premium_drone' ? 'geotrust.packPremiumDesc' : 'geotrust.packStandardDesc',
  description: pack.code === 'certification'
    ? 'Pack complet : topographie, bornage officiel, certificat de conformité, badge et escrow.'
    : pack.code === 'premium_drone'
      ? 'Solution premium : cartographie drone, modélisation 3D, certificat, visite VR et rapport.'
      : 'Vérification GPS et superficie du terrain avec rapport de mission.',
  icon: pack.code === 'certification' ? <ShieldCheck className="w-4 h-4" /> : pack.code === 'premium_drone' ? <Drone className="w-4 h-4" /> : <MapPin className="w-4 h-4" />,
  includes: pack.includes.map((item) => (item.startsWith('GEO_') ? geoServiceLabel(item) : item)),
  includesKeys: pack.includes.map((item) => (item.startsWith('GEO_') ? null : INCLUDE_KEYS[item] ?? null)) as ReadonlyArray<string | null>,
}));

function GeometerSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-primary-pale" />
        <div className="flex-1">
          <div className="h-4 bg-primary-pale rounded w-28 mb-2" />
          <div className="h-3 bg-primary-pale rounded w-20" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-20 bg-primary-pale/60 rounded-full" />
        <div className="h-4 w-16 bg-primary-pale/60 rounded-full" />
      </div>
      <div className="h-10 bg-primary-pale rounded-xl" />
    </div>
  );
}

export default function GeoTrustModule() {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showMissionDialog, setShowMissionDialog] = useState(false);
  const [selectedGeometer, setSelectedGeometer] = useState<Geometer | null>(null);
  const [detailGeometer, setDetailGeometer] = useState<Geometer | null>(null);
  const [missionForm, setMissionForm] = useState({ serviceCode: '', propertyId: '', notes: '', price: 0 });
  const { selectedCountry } = useCountry();
  const { isAuthenticated } = useAuthStore();

  const { data: geometersData, isLoading: geometersLoading, error: geometersError } = useGeometers(undefined, selectedCountry);
  const { data: missionsData, isLoading: missionsLoading } = useGeometerMissions();

  const createMission = useCreateGeotrustMission();

  const geometers: Geometer[] = ((geometersData?.geometers as Record<string, unknown>[]) || []).map(g => {
    const user = g.user as Record<string, unknown> | null;
    let certifications: string[] = [];
    try {
      const rawSpec = g.specialities as string[];
      if (typeof rawSpec === 'string') certifications = JSON.parse(rawSpec);
      else if (Array.isArray(rawSpec)) certifications = rawSpec as string[];
    } catch { certifications = []; }
    // Safely convert potentially null/Date fields
    const safeStr = (v: unknown): string => {
      if (v == null) return '';
      if (v instanceof Date) return v.toISOString();
      return String(v);
    };
    return {
      id: safeStr(g.id),
      name: safeStr(user?.name ?? g.name),
      avatar: safeStr(user?.avatar ?? g.avatar),
      city: safeStr(user?.city ?? g.city),
      country: safeStr(user?.country ?? g.country),
      rating: Number(g.rating ?? 0),
      reviews: Number(g.reviews ?? 0),
      certifications,
      missions: Number(g.missions ?? 0),
      certifiedAt: g.certifiedAt instanceof Date ? g.certifiedAt.toISOString() : (typeof g.certifiedAt === 'string' ? g.certifiedAt : undefined),
      createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : (typeof g.createdAt === 'string' ? g.createdAt : undefined),
    };
  });
  const missions: Mission[] = (missionsData?.missions as Mission[]) || [];

  const handleViewDetail = (geometer: Geometer) => {
    // CDC §7C — Only registered users can view full geometer profiles
    if (!isAuthenticated) {
      toast({
        title: t('geotrust.loginRequired', 'Connexion requise'),
        description: t('geotrust.loginRequiredDesc', 'Vous devez être connecté pour voir le profil détaillé d\'un géomètre et demander une mission.'),
      });
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setDetailGeometer(geometer);
  };

  const handleBackToList = () => {
    setDetailGeometer(null);
  };

  const handleOpenMissionDialog = (geometer: Geometer) => {
    // CDC §7C — Only registered users can request missions
    if (!isAuthenticated) {
      toast({
        title: t('geotrust.loginRequired', 'Connexion requise'),
        description: t('geotrust.loginRequiredMissionDesc', 'Vous devez être connecté pour demander une mission GeoTrust.'),
      });
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    setSelectedGeometer(geometer);
    const service = selectedService
      ? geometerServices.find(s => s.id === selectedService)
      : null;
    setMissionForm({
      serviceCode: service?.code || '',
      propertyId: '',
      notes: '',
      price: service?.price || 0,
    });
    setShowMissionDialog(true);
  };

  const handleSubmitMission = () => {
    if (!selectedGeometer) return;
    createMission.mutate(
      {
        geometerId: selectedGeometer.id,
        serviceCode: missionForm.serviceCode,
        propertyId: missionForm.propertyId || undefined,
        notes: missionForm.notes || undefined,
        price: missionForm.price || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: t('geotrust.missionCreated', 'Mission créée'), description: t('geotrust.missionCreatedDesc', `Votre demande de mission a été envoyée à ${selectedGeometer.name}.`) });
          setShowMissionDialog(false);
          setSelectedGeometer(null);
          setMissionForm({ serviceCode: '', propertyId: '', notes: '', price: 0 });
        },
        onError: (err: unknown) => {
          const errMsg = err instanceof Error ? err.message : '';
          toast({ title: t('common.error', 'Erreur'), description: errMsg || t('geotrust.missionCreateError', 'Impossible de créer la mission.'), variant: 'destructive' });
        },
      }
    );
  };

  // ─── DETAIL VIEW ──────────────────────────────────────────────────
  if (detailGeometer) {
    return (
      <section className="min-h-screen pb-24 bg-cream">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-gray-text hover:text-primary-deep mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('geotrust.backToList', 'Retour à la liste')}
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            {/* Header card */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-primary-pale mb-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary-green relative">
                  <ImageWithFallback
                    src={detailGeometer.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                    alt={detailGeometer.name}
                    className="absolute inset-0 w-full h-full"
                    fallbackType="avatar"
                    fill
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="font-serif text-2xl font-bold text-primary-deep">
                      {detailGeometer.name}
                    </h1>
                    {detailGeometer.certifiedAt && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('geotrust.certifiedBadge', 'Certifié GeoTrust')}
                      </span>
                    )}
                  </div>
                  <p className="text-primary-green font-semibold mb-2">{t('geotrust.expertRole', 'Géomètre Expert')}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-text">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {detailGeometer.city}, {detailGeometer.country}
                    </span>
                    {detailGeometer.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent-yellow fill-accent-yellow" />
                        {detailGeometer.rating} ({detailGeometer.reviews} {t('geotrust.reviewsLabel', 'avis')})
                      </span>
                    )}
                    {detailGeometer.missions > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {detailGeometer.missions} {t('geotrust.missionsCount', 'missions')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6">
                <button
                  onClick={() => handleOpenMissionDialog(detailGeometer)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all"
                >
                  <ClipboardList className="w-4 h-4" />
                  {t('geotrust.requestMission', 'Demander une mission')}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 max-w-md flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600" />
                <span>
                  {t('geotrust.escrowTrustDesc', 'Toute mission GeoTrust transite par AfriBayit. Le paiement est sécurisé via escrow (commission 8-12%). Le rapport du géomètre devient une condition de libération de l\'escrow : VALIDATED → progression, ALERT → litige, REJECTED → remboursement.')}
                </span>
              </p>
            </div>

            {/* Certifications */}
            {detailGeometer.certifications.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale mb-6">
                <h3 className="text-sm font-bold text-primary-deep mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-green" />
                  {t('geotrust.certificationsTitle', 'Certifications & Spécialités')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {detailGeometer.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1.5 bg-primary-pale text-primary-deep text-xs font-medium rounded-full">
                      {geoServiceLabel(cert)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services offered — horizontal scroll */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale mb-6">
              <h3 className="text-sm font-bold text-primary-deep mb-4">{t('geotrust.servicesOfferedTitle', 'Services proposés')}</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {geometerServices.map((service) => (
                  <div
                    key={service.id}
                    className="shrink-0 w-64 snap-center p-4 rounded-2xl bg-primary-pale/40 border border-primary-pale"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-primary-pale">
                      <span className="text-primary-green">{service.icon}</span>
                    </div>
                    <h4 className="font-semibold text-primary-deep text-sm mb-1">{service.name}</h4>
                    <p className="text-xs text-gray-text mb-2">{service.descKey ? t(service.descKey, service.description) : service.description}</p>
                    <p className="text-accent-dark font-bold text-sm">{service.priceLabel}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {detailGeometer.rating > 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
                  <Star className="w-5 h-5 text-accent-yellow mx-auto mb-1" />
                  <p className="text-xs text-gray-400">{t('geotrust.ratingLabel', 'Note')}</p>
                  <p className="text-sm font-bold text-primary-deep">{detailGeometer.rating}/5</p>
                </div>
              )}
              {detailGeometer.missions > 0 && (
                <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
                  <Briefcase className="w-5 h-5 text-primary-deep mx-auto mb-1" />
                  <p className="text-xs text-gray-400">{t('geotrust.missionsLabel', 'Missions')}</p>
                  <p className="text-sm font-bold text-primary-deep">{detailGeometer.missions}</p>
                </div>
              )}
              {detailGeometer.certifiedAt && (
                <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-xs text-gray-400">{t('geotrust.certifiedLabel', 'Certifié')}</p>
                  <p className="text-sm font-bold text-primary-deep">{timeAgo(detailGeometer.certifiedAt)}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Mission dialog — shared */}
        {showMissionDialog && selectedGeometer && <MissionDialog />}
      </section>
    );
  }

  // ─── LIST VIEW — hub professionnel GeoTrust ─────────────────────────
  return (
    <section className="min-h-screen pb-24 bg-cream">
      {/* Barre sticky du hub */}
      <div className="sticky top-16 sm:top-18 z-30 bg-white/95 backdrop-blur border-b border-primary-pale shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-pale flex items-center justify-center text-primary-deep">
              <Map className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-lg font-bold text-primary-deep leading-tight truncate">
                {t('geotrust.headerTitle1', 'Géomètres')} <span className="text-accent-dark">{t('geotrust.headerTitleAccent', 'Certifiés')}</span>
              </h1>
              <p className="text-[11px] text-gray-text truncate hidden sm:block">
                {t('geotrust.headerSubtitle', 'Vérification foncière, bornage et certification de vos terrains par géomètres agréés.')}
              </p>
            </div>
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full bg-primary-pale text-primary-deep border border-primary-green/20 text-[11px] font-semibold shrink-0">
              {COUNTRY_NAMES[selectedCountry] || selectedCountry}
            </span>
            {selectedService && (
              <span className="ml-auto hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-pale text-accent-dark border border-accent-yellow/40 text-[11px] font-bold shrink-0">
                <CheckCircle className="w-3.5 h-3.5" />
                {geometerServices.find((s) => s.id === selectedService)?.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Corps du hub */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)_312px] gap-5 items-start">
          {/* Rail gauche — navigation + garantie */}
          <aside className="hidden md:block sticky top-[148px] sm:top-[164px] max-h-[calc(100vh-176px)] overflow-y-auto pr-1 space-y-4">
            <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-primary-deep uppercase tracking-wider">Navigation</p>
              <nav className="p-1.5">
                {[
                  { href: '#gt-services', label: 'Services à la carte' },
                  { href: '#gt-packs', label: 'Packs GeoTrust' },
                  { href: '#gt-geometers', label: 'Géomètres certifiés' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-gray-text hover:bg-primary-pale/60 hover:text-primary-deep transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-green shrink-0" />
                    <span className="text-[13px] font-semibold">{item.label}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-primary-pale/70 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary-deep" />
                <h3 className="text-[11px] font-bold text-primary-deep uppercase tracking-wider">Pourquoi GeoTrust</h3>
              </div>
              <ul className="p-4 space-y-3">
                {[
                  'Géomètres agréés et certifiés par pays',
                  'Bornage officiel opposable en cas de litige',
                  'Paiement sécurisé via escrow AfriBayit',
                  'Certificats vérifiables sur votre annonce',
                ].map((point) => (
                  <li key={point} className="flex items-start gap-2 text-[11px] text-gray-text">
                    <CheckCircle className="w-3.5 h-3.5 text-[#00A651] shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Contenu principal */}
          <main className="min-w-0 space-y-10">
            {/* ── Services à la carte ── */}
            <section id="gt-services" className="scroll-mt-36">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-primary-deep">{t('geotrust.servicesTitle', 'Services')}</h2>
                  <p className="text-xs text-gray-text mt-0.5">
                    Tarifs officiels GeoTrust — sélectionnez un service puis choisissez votre géomètre.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30 text-[11px] font-semibold w-fit">
                  <Coins className="w-3.5 h-3.5" /> {t('geotrust.priceInFcfa', 'Prix en FCFA (XOF)')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {geometerServices.map((service) => {
                  const active = selectedService === service.id;
                  return (
                    <button
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`text-left bg-white rounded-2xl p-5 shadow-sm border-2 cursor-pointer transition-all ${
                        active ? 'border-primary-green ring-2 ring-primary-green/20' : 'border-transparent hover:border-primary-pale'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-primary-deep text-white' : 'bg-primary-pale text-primary-green'}`}>
                          {service.icon}
                        </div>
                        {active && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-pale text-primary-deep text-[10px] font-bold border border-primary-green/30">
                            <CheckCircle className="w-3 h-3" /> Sélectionné
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-primary-deep text-sm mb-1">{service.name}</h3>
                      <p className="text-xs text-gray-text mb-3">{service.descKey ? t(service.descKey, service.description) : service.description}</p>
                      <p className="font-mono-data text-sm font-bold text-accent-dark">{service.priceLabel}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* ── Packs GeoTrust — CDC §7C.9 ── */}
            <section id="gt-packs" className="scroll-mt-36">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="font-serif text-xl font-bold text-primary-deep">{t('geotrust.packsTitle', 'Packs GeoTrust')}</h2>
                  <p className="text-xs text-gray-text mt-0.5">
                    {t('geotrust.packsSubtitle', 'Packs groupés à prix réduit — économie réelle affichée sur chaque pack.')}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {geotrustPacks.map((pack) => {
                  const primaryCode = pack.services[0];
                  const primaryService = geometerServices.find((s) => s.code === primaryCode);
                  const totalPrice = pack.services.reduce((sum, code) => {
                    const svc = geometerServices.find((s) => s.code === code);
                    return sum + (svc?.price ?? 0);
                  }, 0);
                  const savings = totalPrice - pack.price;
                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedService(primaryService?.id ?? null)}
                      className={`relative bg-white rounded-2xl p-6 shadow-sm border-2 cursor-pointer transition-all flex flex-col ${
                        pack.highlight
                          ? 'border-accent-yellow ring-2 ring-accent-yellow/25'
                          : 'border-transparent hover:border-primary-pale'
                      }`}
                    >
                      {pack.highlight && (
                        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent-yellow text-primary-deep text-[10px] font-bold shadow-md">
                          <Star className="w-3 h-3 fill-primary-deep" /> {t('geotrust.recommendedBadge', 'Recommandé')}
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${pack.highlight ? 'bg-accent-yellow/15' : 'bg-primary-pale'}`}>
                          <span className={pack.highlight ? 'text-accent-dark' : 'text-primary-green'}>{pack.icon}</span>
                        </div>
                        {savings > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold">
                            −{savings.toLocaleString('fr-FR')} FCFA · −{Math.round((savings / totalPrice) * 100)}%
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-primary-deep mb-1">{pack.nameKey ? t(pack.nameKey, pack.name) : pack.name}</h3>
                      <p className="text-xs text-gray-text mb-3 flex-1">{pack.descKey ? t(pack.descKey, pack.description) : pack.description}</p>
                      {totalPrice > pack.price && (
                        <p className="text-xs text-gray-text/60 line-through mb-0.5">
                          {totalPrice.toLocaleString('fr-FR')} FCFA {t('geotrust.aLaCarte', 'à la carte')}
                        </p>
                      )}
                      <p className="font-mono-data text-lg font-bold text-accent-dark mb-3">{pack.priceLabel}</p>
                      <ul className="space-y-1.5">
                        {pack.includes.map((item, idx) => {
                          const keyArr = (pack as { includesKeys?: ReadonlyArray<string | null> }).includesKeys;
                          const itemKey = keyArr?.[idx];
                          return (
                            <li key={item} className="flex items-start gap-2 text-xs text-gray-text">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                              <span>{itemKey ? t(itemKey, item) : item}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService(primaryService?.id ?? null);
                          toast({
                            title: t('geotrust.packSelected', 'Pack sélectionné'),
                            description: `${pack.nameKey ? t(pack.nameKey, pack.name) : pack.name} (${pack.priceLabel}). ${t('geotrust.chooseGeometerBelow', 'Choisissez un géomètre ci-dessous pour démarrer la mission.')}`,
                          });
                        }}
                        className={`mt-4 w-full py-2.5 rounded-full text-sm font-bold transition-colors shadow-sm ${
                          pack.highlight
                            ? 'bg-accent-yellow text-primary-deep hover:bg-[#c4a030]'
                            : 'bg-primary-deep text-white hover:bg-primary-green'
                        }`}
                      >
                        {t('geotrust.choosePack', 'Choisir ce pack')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ── Géomètres certifiés ── */}
            <section id="gt-geometers" className="scroll-mt-36">
              <h2 className="font-serif text-xl font-bold text-primary-deep mb-1">{t('geotrust.ourGeometers', 'Nos Géomètres')}</h2>
              <p className="text-xs text-gray-text mb-4">
                {geometers.length} professionnel{geometers.length > 1 ? 's' : ''} certifié{geometers.length > 1 ? 's' : ''} — cliquez sur un profil pour consulter le détail ou demander une mission.
              </p>

              {geometersLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <GeometerSkeleton key={i} />)}
                </div>
              )}

              {geometersError && (
                <div className="bg-white rounded-2xl border border-primary-pale shadow-sm p-10 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-text font-semibold mb-1">{t('geotrust.unableToLoad', 'Impossible de charger les géomètres')}</p>
                  <p className="text-sm text-gray-400">{geometersError.message}</p>
                </div>
              )}

              {!geometersLoading && !geometersError && geometers.length === 0 && (
                <div className="bg-white rounded-2xl border border-primary-pale shadow-sm p-10 text-center">
                  <Map className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-text font-semibold mb-1">{t('geotrust.noGeometers', 'Aucun géomètre disponible')}</p>
                  <p className="text-sm text-gray-400">{t('geotrust.comeBackLater', 'Revenez plus tard')}</p>
                </div>
              )}

              {!geometersLoading && !geometersError && geometers.length > 0 && (
                <div className="space-y-3">
                  {geometers.map((geo) => (
                    <article
                      key={geo.id}
                      onClick={() => handleViewDetail(geo)}
                      className="bg-white rounded-2xl border border-primary-pale shadow-sm hover:shadow-md hover:border-primary-green/30 transition-all cursor-pointer"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-primary-pale relative bg-gray-100">
                            <ImageWithFallback src={geo.avatar} alt={geo.name} className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                          </div>

                          {/* Identité */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-primary-deep text-[15px] leading-snug truncate">{geo.name}</h3>
                              {geo.certifiedAt && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-pale text-primary-deep border border-primary-green/30 text-[10px] font-bold shrink-0">
                                  <CheckCircle className="w-3 h-3" /> {t('geotrust.certifiedAgo', 'Certifié')} {timeAgo(geo.certifiedAt)}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {geo.city}, {geo.country}
                            </div>

                            {/* Certifications */}
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {geo.certifications.slice(0, 4).map((cert) => (
                                <span key={cert} className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary-pale text-primary-deep border border-primary-green/20">
                                  {geoServiceLabel(cert)}
                                </span>
                              ))}
                              {geo.certifications.length > 4 && (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cream text-gray-text border border-primary-pale">
                                  +{geo.certifications.length - 4}
                                </span>
                              )}
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
                              <span className="flex items-center gap-1.5 text-[11px] text-gray-text">
                                <Star className="w-3.5 h-3.5 text-accent-yellow fill-accent-yellow" />
                                <span className="font-bold text-primary-deep font-mono-data">{geo.rating || '—'}</span>
                                <span className="text-gray-400">/5 · {geo.reviews} {t('geotrust.reviewsLabel', 'avis')}</span>
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-gray-text">
                                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                                <span className="font-bold text-primary-deep font-mono-data">{geo.missions}</span>
                                <span className="text-gray-400">{t('geotrust.missionsCount', 'missions')}</span>
                              </span>
                              {geo.createdAt && !geo.certifiedAt && (
                                <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  {t('geotrust.registeredAgo', 'Inscrit')} {timeAgo(geo.createdAt)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex sm:flex-col gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewDetail(geo); }}
                              className="px-4 py-2.5 rounded-full border border-primary-deep/20 text-primary-deep text-xs font-bold hover:bg-primary-pale transition-colors whitespace-nowrap"
                            >
                              Voir le profil
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenMissionDialog(geo); }}
                              className="px-4 py-2.5 rounded-full bg-primary-deep text-white text-xs font-bold shadow-sm hover:bg-primary-green transition-colors whitespace-nowrap"
                            >
                              {t('geotrust.requestMission', 'Demander une mission')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* Rail droit — insights */}
          <aside className="hidden lg:block sticky top-[148px] sm:top-[164px] max-h-[calc(100vh-176px)] overflow-y-auto space-y-4">
            {/* Service sélectionné */}
            <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-primary-pale/70 flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5 text-primary-deep" />
                <h3 className="text-[11px] font-bold text-primary-deep uppercase tracking-wider">Votre sélection</h3>
              </div>
              <div className="p-4">
                {selectedService ? (
                  (() => {
                    const svc = geometerServices.find((s) => s.id === selectedService);
                    if (!svc) return null;
                    return (
                      <div>
                        <p className="text-sm font-bold text-primary-deep">{svc.name}</p>
                        <p className="text-[11px] text-gray-text mt-1 mb-2">{svc.descKey ? t(svc.descKey, svc.description) : svc.description}</p>
                        <p className="font-mono-data text-lg font-bold text-accent-dark">{svc.priceLabel}</p>
                        <p className="text-[10px] text-gray-400 mt-2">Choisissez ensuite un géomètre certifié ci-contre pour lancer la mission.</p>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-[11px] text-gray-text leading-relaxed">
                    Sélectionnez un service ou un pack — votre choix sera pré-rempli dans la demande de mission.
                  </p>
                )}
              </div>
            </div>

            {/* Workflow */}
            <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-primary-pale/70 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary-deep" />
                <h3 className="text-[11px] font-bold text-primary-deep uppercase tracking-wider">Workflow de mission</h3>
              </div>
              <ol className="p-4 space-y-3">
                {[
                  { title: 'Demande', titleKey: 'geotrust.workflowDemande', desc: 'Décrivez votre besoin', descKey: 'geotrust.workflowDemandeDesc', icon: <ClipboardList className="w-3.5 h-3.5" /> },
                  { title: 'Devis', titleKey: 'geotrust.workflowDevis', desc: 'Recevez un devis détaillé', descKey: 'geotrust.workflowDevisDesc', icon: <Coins className="w-3.5 h-3.5" /> },
                  { title: 'Mission', titleKey: 'geotrust.workflowMission', desc: 'Le géomètre intervient', descKey: 'geotrust.workflowMissionDesc', icon: <MapPin className="w-3.5 h-3.5" /> },
                  { title: 'Rapport', titleKey: 'geotrust.workflowRapport', desc: 'Recevez le certificat GeoTrust', descKey: 'geotrust.workflowRapportDesc', icon: <CheckCircle className="w-3.5 h-3.5" /> },
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-primary-deep text-white text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-primary-deep">{t(item.titleKey, item.title)}</p>
                      <p className="text-[10px] text-gray-text">{t(item.descKey, item.desc)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Chiffres */}
            <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-primary-pale/70 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-primary-deep" />
                <h3 className="text-[11px] font-bold text-primary-deep uppercase tracking-wider">GeoTrust en chiffres</h3>
              </div>
              <dl className="p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <dt className="text-gray-text">Géomètres certifiés</dt>
                  <dd className="font-bold text-primary-deep font-mono-data">{geometers.length}</dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <dt className="text-gray-text">Missions réalisées</dt>
                  <dd className="font-bold text-primary-deep font-mono-data">{geometers.reduce((s, g) => s + g.missions, 0)}</dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <dt className="text-gray-text">Note moyenne</dt>
                  <dd className="font-bold text-primary-deep font-mono-data">
                    {geometers.length ? (Math.round((geometers.reduce((s, g) => s + g.rating, 0) / geometers.length) * 10) / 10) + '/5' : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <dt className="text-gray-text">Services catalogue</dt>
                  <dd className="font-bold text-primary-deep font-mono-data">{geometerServices.length}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>

        {/* Mission Request Dialog */}
        {showMissionDialog && selectedGeometer && <MissionDialog />}
      </div>
    </section>
  );

  // ─── MissionDialog (shared component function) ───────────────────
  function MissionDialog() {
    if (!selectedGeometer) return null;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
        onClick={() => setShowMissionDialog(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-primary-pale"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary-deep">{t('geotrust.quoteDialogTitle', 'Demander un devis')}</h3>
              <p className="text-xs text-gray-text">{t('geotrust.toGeometer', 'À')} {selectedGeometer.name} — {selectedGeometer.city}</p>
            </div>
            <button onClick={() => setShowMissionDialog(false)} className="p-2 rounded-full hover:bg-primary-pale transition-colors">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('geotrust.serviceLabel', 'Service')}</label>
              <select
                value={missionForm.serviceCode}
                onChange={(e) => {
                  const service = geometerServices.find(s => s.code === e.target.value);
                  setMissionForm(prev => ({
                    ...prev,
                    serviceCode: e.target.value,
                    price: service?.price || 0,
                  }));
                }}
                className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
              >
                <option value="">{t('geotrust.selectService', 'Sélectionnez un service')}</option>
                {geometerServices.map((service) => (
                  <option key={service.code} value={service.code}>
                    {service.name} — {service.priceLabel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('geotrust.propertyIdLabel', 'ID du bien (optionnel)')}</label>
              <input
                type="text"
                value={missionForm.propertyId}
                onChange={(e) => setMissionForm(prev => ({ ...prev, propertyId: e.target.value }))}
                placeholder="ex: prop-abc123"
                className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('geotrust.notesLabel', 'Notes')}</label>
              <textarea
                rows={3}
                value={missionForm.notes}
                onChange={(e) => setMissionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('geotrust.notesPlaceholder', 'Détails supplémentaires...')}
                className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none resize-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMissionDialog(false)}
                className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-all"
              >
                {t('geotrust.cancelBtn', 'Annuler')}
              </button>
              <button
                onClick={handleSubmitMission}
                disabled={createMission.isPending || !missionForm.serviceCode}
                className="flex-1 py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep transition-all disabled:opacity-50 disabled:cursor-wait"
              >
                {createMission.isPending ? t('geotrust.sendingBtn', 'Envoi...') : t('geotrust.sendBtn', 'Envoyer')}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
}
