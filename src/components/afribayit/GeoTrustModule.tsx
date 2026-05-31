'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGeometers, useGeometerMissions, useCreateGeotrustMission } from '@/hooks/useGeotrust';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { AlertTriangle, CheckCircle, ClipboardList, Coins, Drone, Map, MapPin, Ruler, Search } from 'lucide-react';

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

// Static config — geometer service catalog (not DB data)
const geometerServices = [
  { id: 'geo-1', name: 'Vérification superficie', code: 'verification_superficie', price: 50000, priceLabel: '50 000 FCFA', icon: '<Ruler className="w-4 h-4" />', description: 'Mesure précise de la superficie réelle du terrain' },
  { id: 'geo-2', name: 'Inspection terrain', code: 'inspection_terrain', price: 75000, priceLabel: '75 000 FCFA', icon: '<Search className="w-4 h-4" />', description: 'Inspection complète : limites, servitudes, risques' },
  { id: 'geo-3', name: 'Bornage', code: 'bornage', price: 120000, priceLabel: '120 000 FCFA', icon: '<MapPin className="w-4 h-4" />', description: 'Bornage officiel avec pose de bornes' },
  { id: 'geo-4', name: 'Drone mapping', code: 'drone_mapping', price: 200000, priceLabel: '200 000 FCFA', icon: '<Drone className="w-4 h-4" />', description: 'Cartographie aérienne haute résolution' },
  { id: 'geo-5', name: 'Certificat GeoTrust', code: 'certificat_geotrust', price: 30000, priceLabel: '30 000 FCFA', icon: '<CheckCircle className="w-4 h-4" />', description: 'Certificat de conformité géométrique' },
  { id: 'geo-6', name: 'Topographie complète', code: 'topographie_complete', price: 350000, priceLabel: '350 000 FCFA', icon: '<Map className="w-4 h-4" />', description: 'Étude topographique complète avec plan' },
];

function GeometerSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-4 w-20 bg-gray-100 rounded-full" />
        <div className="h-4 w-16 bg-gray-100 rounded-full" />
      </div>
      <div className="h-10 bg-gray-200 rounded-full" />
    </div>
  );
}

export default function GeoTrustModule() {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [showMissionDialog, setShowMissionDialog] = useState(false);
  const [selectedGeometer, setSelectedGeometer] = useState<Geometer | null>(null);
  const [missionForm, setMissionForm] = useState({ serviceCode: '', propertyId: '', notes: '', price: 0 });
  const { selectedCountry } = useCountry();

  const { data: geometersData, isLoading: geometersLoading, error: geometersError } = useGeometers(undefined, selectedCountry);
  const { data: missionsData, isLoading: missionsLoading } = useGeometerMissions();

  const createMission = useCreateGeotrustMission();

  const geometers: Geometer[] = (geometersData?.geometers as Geometer[]) || [];
  const missions: Mission[] = (missionsData?.missions as Mission[]) || [];

  const handleOpenMissionDialog = (geometer: Geometer) => {
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

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#009CDE]/10 text-[#009CDE] text-sm font-semibold mb-4">
            <Map className="w-4 h-4" /> GeoTrust
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Géomètres <span className="text-[#009CDE]">Certifiés</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Faites vérifier votre terrain par des géomètres professionnels certifiés GeoTrust. Superficie, bornage, et certification garantis.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Service Catalog */}
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {geometerServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedService(service.id)}
                className={`bg-white rounded-3xl p-5 shadow-sm border-2 cursor-pointer transition-all ${
                  selectedService === service.id ? 'border-[#009CDE]' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <span className="text-3xl block mb-3">{service.icon}</span>
                <h3 className="font-semibold text-[#2C2E2F] mb-1">{service.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{service.description}</p>
                <p className="font-mono-data text-sm font-bold text-[#D4AF37]">{service.priceLabel}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Geometer Profiles */}
        <div>
          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Nos Géomètres</h2>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {geometers.map((geo, i) => (
                <motion.div
                  key={geo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                  className="bg-white rounded-3xl p-6 shadow-sm border"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <ImageWithFallback src={geo.avatar} alt={geo.name} className="w-14 h-14 rounded-full border-2 border-[#009CDE]" fallbackType="avatar" />
                    <div>
                      <h3 className="font-semibold text-[#2C2E2F]">{geo.name}</h3>
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
                        {cert}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleOpenMissionDialog(geo)}
                    className="w-full py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    Demander un devis
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
          className="mt-10 bg-white rounded-3xl p-6 shadow-sm border"
        >
          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Workflow de Mission</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { step: '1', title: 'Demande', desc: 'Décrivez votre besoin', icon: '<ClipboardList className="w-4 h-4" />' },
              { step: '2', title: 'Devis', desc: 'Recevez un devis détaillé', icon: '<Coins className="w-4 h-4" />' },
              { step: '3', title: 'Mission', desc: 'Le géomètre intervient', icon: '<MapPin className="w-4 h-4" />' },
              { step: '4', title: 'Rapport', desc: 'Recevez le certificat GeoTrust', icon: '<CheckCircle className="w-4 h-4" />' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#009CDE]/10 flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2E2F]">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mission Request Dialog */}
        {showMissionDialog && selectedGeometer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowMissionDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-1">Demander un devis</h3>
              <p className="text-xs text-gray-500 mb-4">À {selectedGeometer.name} — {selectedGeometer.city}</p>
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
                        {service.icon} {service.name} — {service.priceLabel}
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
                    className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSubmitMission}
                    disabled={createMission.isPending || !missionForm.serviceCode}
                    className="flex-1 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
                  >
                    {createMission.isPending ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
