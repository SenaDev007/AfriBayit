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
const geometerServices = [
  { id: 'geo-1', name: geoServiceLabel('GEO_GPS'), code: 'GEO_GPS', price: 50000, priceLabel: '50 000 FCFA', icon: <MapPin className="w-4 h-4" />, description: 'Relevé GPS de précision pour repérage et coordonnées' },
  { id: 'geo-2', name: geoServiceLabel('GEO_SURF'), code: 'GEO_SURF', price: 75000, priceLabel: '75 000 FCFA', icon: <Ruler className="w-4 h-4" />, description: 'Mesure précise de la superficie réelle du terrain' },
  { id: 'geo-3', name: geoServiceLabel('GEO_INSP'), code: 'GEO_INSP', price: 120000, priceLabel: '120 000 FCFA', icon: <Search className="w-4 h-4" />, description: 'Inspection complète : limites, servitudes, risques' },
  { id: 'geo-4', name: geoServiceLabel('GEO_BORN'), code: 'GEO_BORN', price: 150000, priceLabel: '150 000 FCFA', icon: <MapPin className="w-4 h-4" />, description: 'Bornage officiel avec pose de bornes' },
  { id: 'geo-5', name: geoServiceLabel('GEO_TOPO'), code: 'GEO_TOPO', price: 350000, priceLabel: '350 000 FCFA', icon: <Map className="w-4 h-4" />, description: 'Étude topographique complète avec plan' },
  { id: 'geo-6', name: geoServiceLabel('GEO_DRON'), code: 'GEO_DRON', price: 200000, priceLabel: '200 000 FCFA', icon: <Drone className="w-4 h-4" />, description: 'Cartographie aérienne haute résolution' },
  { id: 'geo-7', name: geoServiceLabel('GEO_CERT'), code: 'GEO_CERT', price: 30000, priceLabel: '30 000 FCFA', icon: <CheckCircle className="w-4 h-4" />, description: 'Certificat de conformité géométrique' },
  { id: 'geo-8', name: geoServiceLabel('GEO_3D'), code: 'GEO_3D', price: 250000, priceLabel: '250 000 FCFA', icon: <Map className="w-4 h-4" />, description: 'Modélisation 3D du terrain et des constructions' },
];

function GeometerSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-lg bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-20 bg-gray-100 rounded-lg" />
        <div className="h-4 w-16 bg-gray-100 rounded-lg" />
      </div>
      <div className="h-10 bg-gray-200 rounded-lg" />
    </div>
  );
}

export default function GeoTrustModule() {
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
      const rawSpec = g.specialities;
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
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour voir le profil détaillé d\'un géomètre et demander une mission.',
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
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour demander une mission GeoTrust.',
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
          toast({ title: 'Mission créée', description: `Votre demande de mission a été envoyée à ${selectedGeometer.name}.` });
          setShowMissionDialog(false);
          setSelectedGeometer(null);
          setMissionForm({ serviceCode: '', propertyId: '', notes: '', price: 0 });
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible de créer la mission.', variant: 'destructive' });
        },
      }
    );
  };

  // ─── DETAIL VIEW ──────────────────────────────────────────────────
  if (detailGeometer) {
    return (
      <section className="min-h-screen pb-24 bg-gray-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <button
            onClick={handleBackToList}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            {/* Header card */}
            <div className="bg-white rounded-xl p-8 shadow-sm border mb-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#009CDE] relative">
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
                    <h1 className="text-2xl font-bold text-[#0a2a5e]" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                      {detailGeometer.name}
                    </h1>
                    {detailGeometer.certifiedAt && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00A651]/10 text-[#00A651]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Certifié GeoTrust
                      </span>
                    )}
                  </div>
                  <p className="text-[#009CDE] font-semibold mb-2">Géomètre Expert</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {detailGeometer.city}, {detailGeometer.country}
                    </span>
                    {detailGeometer.rating > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
                        {detailGeometer.rating} ({detailGeometer.reviews} avis)
                      </span>
                    )}
                    {detailGeometer.missions > 0 && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {detailGeometer.missions} missions
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-6">
                <button
                  onClick={() => handleOpenMissionDialog(detailGeometer)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                >
                  <ClipboardList className="w-4 h-4" />
                  Demander une mission
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 max-w-md flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#00A651]" />
                <span>
                  Toute mission GeoTrust transite par AfriBayit. Le paiement est sécurisé via escrow
                  (commission 8-12%). Le rapport du géomètre devient une condition de libération
                  de l&apos;escrow : VALIDATED → progression, ALERT → litige, REJECTED → remboursement.
                </span>
              </p>
            </div>

            {/* Certifications */}
            {detailGeometer.certifications.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
                <h3 className="text-sm font-bold text-[#0a2a5e] mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#009CDE]" />
                  Certifications & Spécialités
                </h3>
                <div className="flex flex-wrap gap-2">
                  {detailGeometer.certifications.map((cert) => (
                    <span key={cert} className="px-3 py-1.5 bg-[#009CDE]/5 text-[#009CDE] text-xs font-medium rounded-lg">
                      {geoServiceLabel(cert)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services offered — horizontal scroll */}
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="text-sm font-bold text-[#0a2a5e] mb-4">Services proposés</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                {geometerServices.map((service) => (
                  <div
                    key={service.id}
                    className="shrink-0 w-64 snap-center p-4 rounded-2xl bg-gray-50/50 border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: '#009CDE10' }}>
                      <span className="text-[#009CDE]">{service.icon}</span>
                    </div>
                    <h4 className="font-semibold text-[#0a2a5e] text-sm mb-1">{service.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">{service.description}</p>
                    <p className="text-[#D4AF37] font-bold text-sm">{service.priceLabel}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {detailGeometer.rating > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                  <Star className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Note</p>
                  <p className="text-sm font-bold text-[#0a2a5e]">{detailGeometer.rating}/5</p>
                </div>
              )}
              {detailGeometer.missions > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                  <Briefcase className="w-5 h-5 text-[#003087] mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Missions</p>
                  <p className="text-sm font-bold text-[#0a2a5e]">{detailGeometer.missions}</p>
                </div>
              )}
              {detailGeometer.certifiedAt && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                  <CheckCircle className="w-5 h-5 text-[#00A651] mx-auto mb-1" />
                  <p className="text-xs text-gray-400">Certifié</p>
                  <p className="text-sm font-bold text-[#0a2a5e]">{timeAgo(detailGeometer.certifiedAt)}</p>
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

  // ─── LIST VIEW ────────────────────────────────────────────────────
  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#009CDE]/10 text-[#009CDE] text-sm font-semibold mb-4">
            <Map className="w-4 h-4" /> GeoTrust
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0a2a5e] mb-3">
            Géomètres <span className="text-[#009CDE]">Certifiés</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Faites vérifier votre terrain par des géomètres professionnels certifiés GeoTrust. Superficie, bornage, et certification garantis.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Service Catalog — horizontal scroll */}
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold text-[#0a2a5e] mb-4">Services</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {geometerServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: easeOut }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedService(service.id)}
                className={`shrink-0 w-64 snap-center bg-white rounded-xl p-5 shadow-sm border-2 cursor-pointer transition-all ${
                  selectedService === service.id ? 'border-[#009CDE]' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: '#009CDE10' }}>
                  <span className="text-[#009CDE]">{service.icon}</span>
                </div>
                <h3 className="font-semibold text-[#0a2a5e] mb-1">{service.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{service.description}</p>
                <p className="font-mono-data text-sm font-bold text-[#D4AF37]">{service.priceLabel}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Geometer Profiles */}
        <div>
          <h2 className="font-display text-xl font-bold text-[#0a2a5e] mb-4">Nos Géomètres</h2>

          {/* Loading State */}
          {geometersLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <GeometerSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {geometersError && (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3"><AlertTriangle className="w-4 h-4" /></span>
              <p className="text-gray-600 font-semibold mb-1">Impossible de charger les géomètres</p>
              <p className="text-sm text-gray-400">{geometersError.message}</p>
            </div>
          )}

          {/* Empty State */}
          {!geometersLoading && !geometersError && geometers.length === 0 && (
            <div className="text-center py-12">
              <span className="text-4xl block mb-3"><Map className="w-4 h-4" /></span>
              <p className="text-gray-600 font-semibold mb-1">Aucun géomètre disponible</p>
              <p className="text-sm text-gray-400">Revenez plus tard</p>
            </div>
          )}

          {/* Geometer Cards */}
          {!geometersLoading && !geometersError && geometers.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6">
              {geometers.map((geo, i) => (
                <motion.div
                  key={geo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                  whileHover={{ y: -4 }}
                  onClick={() => handleViewDetail(geo)}
                  className="bg-white rounded-xl p-6 shadow-sm border cursor-pointer w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-[#009CDE] relative">
                      <ImageWithFallback src={geo.avatar} alt={geo.name} className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0a2a5e]">{geo.name}</h3>
                      <p className="text-xs text-gray-500">{geo.city}, {geo.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {geo.rating} ({geo.reviews} avis)
                    </span>
                    <span>{geo.missions} missions</span>
                  </div>
                  {(geo.certifiedAt || geo.createdAt) && (
                    <p className="text-[10px] text-gray-400 mb-3">
                      {geo.certifiedAt ? `Certifié ${timeAgo(geo.certifiedAt)}` : `Inscrit ${timeAgo(geo.createdAt!)}`}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {geo.certifications.map((cert) => (
                      <span key={cert} className="px-2.5 py-1 bg-[#009CDE]/5 text-[#009CDE] text-[10px] font-medium rounded-full">
                        {geoServiceLabel(cert)}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenMissionDialog(geo); }}
                    className="w-full py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    Demander une mission
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Mission Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 bg-white rounded-xl p-6 shadow-sm border"
        >
          <h2 className="font-display text-xl font-bold text-[#0a2a5e] mb-4">Workflow de Mission</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { step: '1', title: 'Demande', desc: 'Décrivez votre besoin', icon: <ClipboardList className="w-4 h-4" /> },
              { step: '2', title: 'Devis', desc: 'Recevez un devis détaillé', icon: <Coins className="w-4 h-4" /> },
              { step: '3', title: 'Mission', desc: 'Le géomètre intervient', icon: <MapPin className="w-4 h-4" /> },
              { step: '4', title: 'Rapport', desc: 'Recevez le certificat GeoTrust', icon: <CheckCircle className="w-4 h-4" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-[#009CDE]/10 flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0a2a5e]">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

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
          className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-xl font-bold text-[#0a2a5e]">Demander un devis</h3>
              <p className="text-xs text-gray-500">À {selectedGeometer.name} — {selectedGeometer.city}</p>
            </div>
            <button onClick={() => setShowMissionDialog(false)} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Service</label>
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
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#009CDE] transition-colors"
              >
                <option value="">Sélectionnez un service</option>
                {geometerServices.map((service) => (
                  <option key={service.code} value={service.code}>
                    {service.name} — {service.priceLabel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">ID du bien (optionnel)</label>
              <input
                type="text"
                value={missionForm.propertyId}
                onChange={(e) => setMissionForm(prev => ({ ...prev, propertyId: e.target.value }))}
                placeholder="ex: prop-abc123"
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#009CDE] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Notes</label>
              <textarea
                rows={3}
                value={missionForm.notes}
                onChange={(e) => setMissionForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Détails supplémentaires..."
                className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#009CDE] transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMissionDialog(false)}
                className="flex-1 py-3 border rounded-lg text-sm font-semibold text-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitMission}
                disabled={createMission.isPending || !missionForm.serviceCode}
                className="flex-1 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
              >
                {createMission.isPending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }
}
