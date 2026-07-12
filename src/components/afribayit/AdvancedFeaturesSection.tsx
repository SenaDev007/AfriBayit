'use client';

/**
 * AdvancedFeaturesSection — CDC §5.1.1 & §5.1.2 compliance
 *
 * Integrates 3 advanced features on the transaction pages:
 * 1. Interactive Mapbox map (with fallback list when no token)
 * 2. Property comparator (3-5 properties side by side with scoring)
 * 3. Financing simulator (mortgage calculator with amortization)
 *
 * Also provides a compare toggle on each property card.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import PropertyMap from './PropertyMap';
import PropertyComparator from './PropertyComparator';
import FinancingSimulator from './FinancingSimulator';
import { Map as MapIcon, GitCompare, Calculator, X, Layers } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';

interface AdvancedFeaturesSectionProps {
  transaction: 'achat' | 'location' | 'investissement' | 'location_courte_duree';
  properties: any[];
  onSelectProperty: (id: string) => void;
  /** Show financing simulator (only for achat/investissement) */
  showFinancing?: boolean;
  /** Compare IDs shared with PropertyGrid */
  compareIds?: string[];
  onToggleCompare?: (id: string) => void;
}

export default function AdvancedFeaturesSection({
  transaction,
  properties,
  onSelectProperty,
  showFinancing = false,
  compareIds = [],
  onToggleCompare,
}: AdvancedFeaturesSectionProps) {
  const { selectedCountry } = useCountry();
  const [activeTab, setActiveTab] = useState<'map' | 'compare' | 'financing'>('map');
  const [showComparator, setShowComparator] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [financingPrice, setFinancingPrice] = useState(25000000);

  // Properties with valid coordinates for the map
  const mappableProperties = useMemo(() => {
    return properties
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        transaction: p.transaction,
        type: p.type,
        city: p.city,
        quartier: p.quartier,
        bedrooms: p.bedrooms,
        surface: p.surface,
        images: Array.isArray(p.images) ? p.images : [],
        lat: p.lat,
        lng: p.lng,
        verified: p.verified,
        geoTrust: p.geoTrust,
        investmentScore: p.investmentScore,
      }));
  }, [properties]);

  // Properties selected for comparison
  const compareProperties = useMemo(() => {
    return properties
      .filter((p) => compareIds.includes(p.id))
      .map((p) => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : [],
        features: Array.isArray(p.features) ? p.features : [],
        pricePerSqm: p.surface > 0 ? Math.round(p.price / p.surface) : 0,
        agent: p.owner ? { name: p.owner.name, certified: p.verified } : undefined,
      }));
  }, [properties, compareIds]);

  // Best values for comparator highlighting
  const bestValues = useMemo(() => {
    if (compareProperties.length === 0) {
      return { lowestPrice: 0, highestScore: 0, largestSurface: 0, bestPricePerSqm: 0 };
    }
    return {
      lowestPrice: Math.min(...compareProperties.map((p) => p.price)),
      highestScore: Math.max(...compareProperties.map((p) => p.investmentScore || 0)),
      largestSurface: Math.max(...compareProperties.map((p) => p.surface || 0)),
      bestPricePerSqm: Math.min(...compareProperties.map((p) => p.pricePerSqm || Infinity)),
    };
  }, [compareProperties]);

  const toggleCompare = onToggleCompare || (() => {});

  const openFinancing = useCallback((price?: number) => {
    if (price) setFinancingPrice(price);
    setShowFinancingModal(true);
  }, []);

  const tabs = [
    { key: 'map' as const, label: 'Carte interactive', icon: MapIcon, count: mappableProperties.length },
    { key: 'compare' as const, label: 'Comparateur', icon: GitCompare, count: compareIds.length },
    ...(showFinancing ? [{ key: 'financing' as const, label: 'Simulateur', icon: Calculator, count: 0 }] : []),
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center max-w-3xl mx-auto mb-10"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
            <span className="h-px w-8" style={{ background: NAVY }} />
            <Layers className="w-3.5 h-3.5" />
            Outils avancés
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
            Décidez avec les meilleurs outils
          </h2>
          <p className="mt-3 text-gray-500">
            Carte interactive, comparateur de biens et simulateur de financement — tout ce qu'il faut pour choisir intelligemment.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'compare' && compareIds.length >= 2) {
                  setShowComparator(true);
                }
                if (tab.key === 'financing') {
                  setShowFinancingModal(true);
                }
              }}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'text-white'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
              style={activeTab === tab.key ? { background: NAVY } : {}}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : `${GOLD}20`,
                    color: activeTab === tab.key ? 'white' : GOLD,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div
              key="map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                <PropertyMap
                  properties={mappableProperties}
                  onPropertyClick={onSelectProperty}
                  selectedCountry={selectedCountry !== ('all' as any) ? selectedCountry : undefined}
                  className="h-[500px] w-full"
                  showGeoTrustOverlay
                />
              </div>
              <p className="mt-3 text-center text-xs text-gray-400">
                {mappableProperties.length} bien{mappableProperties.length !== 1 ? 's' : ''} géolocalisé{mappableProperties.length !== 1 ? 's' : ''} sur la carte
              </p>
            </motion.div>
          )}

          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-8"
            >
              {compareIds.length < 2 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: `${NAVY}10` }}>
                    <GitCompare className="w-8 h-8" style={{ color: NAVY }} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
                    Comparez jusqu'à 5 biens
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Cliquez sur le bouton « Comparer » sous chaque bien pour l'ajouter au comparateur.
                    Vous pourrez voir les caractéristiques côte à côte avec scoring automatique.
                  </p>
                  {compareIds.length === 1 && (
                    <p className="mt-4 text-sm font-semibold" style={{ color: GOLD }}>
                      1 bien sélectionné — ajoutez au moins 1 autre pour comparer
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowComparator(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 shadow-lg"
                    style={{ background: NAVY }}
                  >
                    <GitCompare className="w-5 h-5" />
                    Voir la comparaison ({compareIds.length} biens)
                  </button>
                </div>
              )}

              {/* Selected properties preview */}
              {compareIds.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {compareProperties.map((p) => (
                    <div key={p.id} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop'}
                        alt={p.title}
                        className="w-full h-20 object-cover"
                      />
                      <button
                        onClick={() => toggleCompare(p.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="p-2">
                        <p className="text-xs font-bold text-gray-900 truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-500">{p.quartier}, {p.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'financing' && (
            <motion.div
              key="financing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
              className="rounded-xl border border-gray-200 bg-gray-50/50 p-8"
            >
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4" style={{ background: `${GOLD}15` }}>
                  <Calculator className="w-8 h-8" style={{ color: GOLD }} />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
                  Simulateur de financement immobilier
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Calculez vos mensualités de crédit, comparez les taux par pays et visualisez le tableau d'amortissement complet.
                </p>
                <button
                  onClick={() => setShowFinancingModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-105 shadow-lg"
                  style={{ background: GOLD, color: NAVY }}
                >
                  <Calculator className="w-5 h-5" />
                  Ouvrir le simulateur
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comparator modal */}
      <PropertyComparator
        properties={compareProperties}
        bestValues={bestValues}
        onRemoveProperty={toggleCompare}
        onViewProperty={onSelectProperty}
        onClose={() => setShowComparator(false)}
      />

      {/* Financing simulator modal */}
      <AnimatePresence>
        {showFinancingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-8"
            onClick={() => setShowFinancingModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: easeOut }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
                  Simulateur de financement
                </h2>
                <button
                  onClick={() => setShowFinancingModal(false)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <FinancingSimulator
                  propertyPrice={financingPrice}
                  country={selectedCountry !== ('all' as any) ? selectedCountry : 'BJ'}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
