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
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

/**
 * Minimal property shape used by AdvancedFeaturesSection. The full
 * `PropertyData` from `@/lib/afribayit-utils` doesn't carry `investmentScore`
 * or `owner`, so we declare a local superset covering the fields this
 * component actually reads.
 */
interface AdvancedPropertyItem {
  id: string;
  title: string;
  price: number;
  transaction: string;
  type: string;
  city: string;
  quartier: string;
  bedrooms: number;
  surface: number;
  images?: string[];
  features?: string[];
  lat?: number | null;
  lng?: number | null;
  verified: boolean;
  geoTrust: boolean;
  investmentScore?: number | null;
  owner?: { name: string };
}

interface AdvancedFeaturesSectionProps {
  transaction: 'achat' | 'location' | 'investissement' | 'location_courte_duree';
  properties: AdvancedPropertyItem[];
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
  const { t } = useTranslation();
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
    { key: 'map' as const, label: t('advancedFeatures.tabMap', 'Carte interactive'), icon: MapIcon, count: mappableProperties.length },
    { key: 'compare' as const, label: t('advancedFeatures.tabCompare', 'Comparateur'), icon: GitCompare, count: compareIds.length },
    ...(showFinancing ? [{ key: 'financing' as const, label: t('advancedFeatures.tabFinancing', 'Simulateur'), icon: Calculator, count: 0 }] : []),
  ];

  const mapCountText = `${mappableProperties.length} ${t('advancedFeatures.propertiesGeolocated', 'bien(s) géolocalisé(s) sur la carte')}`;

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            {t('advancedFeatures.eyebrow', 'Outils avancés')}
          </span>
          <h2 className="mt-4 font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
            {t('advancedFeatures.title', 'Décidez avec les meilleurs outils')}
          </h2>
          <p className="mt-3 text-gray-text">
            {t(
              'advancedFeatures.subtitle',
              'Carte interactive, comparateur de biens et simulateur de financement — tout ce qu\'il faut pour choisir intelligemment.'
            )}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
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
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-deep text-white shadow-md'
                  : 'bg-white border border-primary-pale text-gray-text hover:bg-primary-pale/50 hover:text-primary-deep'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30'
                  }`}
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
              <div className="rounded-3xl overflow-hidden border border-primary-pale shadow-lg">
                <PropertyMap
                  properties={mappableProperties}
                  onPropertyClick={onSelectProperty}
                  selectedCountry={selectedCountry}
                  className="h-[500px] w-full"
                  showGeoTrustOverlay
                />
              </div>
              <p className="mt-3 text-center text-xs text-gray-text/70">
                {mapCountText}
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
              className="rounded-3xl border border-primary-pale bg-white shadow-lg p-8"
            >
              {compareIds.length < 2 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary-pale">
                    <GitCompare className="w-8 h-8 text-primary-deep" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-primary-deep mb-2">
                    {t('advancedFeatures.compareUpTo5', 'Comparez jusqu\'à 5 biens')}
                  </h3>
                  <p className="text-sm text-gray-text max-w-md mx-auto">
                    {t(
                      'advancedFeatures.compareHint',
                      'Cliquez sur le bouton « Comparer » sous chaque bien pour l\'ajouter au comparateur. Vous pourrez voir les caractéristiques côte à côte avec scoring automatique.'
                    )}
                  </p>
                  {compareIds.length === 1 && (
                    <p className="mt-4 text-sm font-bold text-accent-dark">
                      {t('advancedFeatures.addOneMoreToCompare', '1 bien sélectionné — ajoutez au moins 1 autre pour comparer')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <button
                    onClick={() => setShowComparator(true)}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white transition-all hover:scale-[1.03] shadow-lg bg-primary-deep hover:bg-primary-green"
                  >
                    <GitCompare className="w-5 h-5" />
                    {t('advancedFeatures.viewComparison', 'Voir la comparaison')} ({compareIds.length} {t('advancedFeatures.properties', 'biens')})
                  </button>
                </div>
              )}

              {/* Selected properties preview */}
              {compareIds.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {compareProperties.map((p) => (
                    <div key={p.id} className="relative rounded-2xl overflow-hidden border border-primary-pale bg-white shadow-md">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop'}
                        alt={p.title}
                        className="w-full h-20 object-cover"
                      />
                      <button
                        onClick={() => toggleCompare(p.id)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="p-2">
                        <p className="text-xs font-bold text-primary-deep truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-text">{p.quartier}, {p.city}</p>
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
              className="rounded-3xl border border-primary-pale bg-white shadow-lg p-8"
            >
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-accent-yellow/15 border border-accent-yellow/30">
                  <Calculator className="w-8 h-8 text-accent-dark" />
                </div>
                <h3 className="font-serif text-xl font-bold text-primary-deep mb-2">
                  {t('advancedFeatures.financingSimulatorTitle', 'Simulateur de financement immobilier')}
                </h3>
                <p className="text-sm text-gray-text max-w-md mx-auto mb-6">
                  {t(
                    'advancedFeatures.financingSimulatorDesc',
                    'Calculez vos mensualités de crédit, comparez les taux par pays et visualisez le tableau d\'amortissement complet.'
                  )}
                </p>
                <button
                  onClick={() => setShowFinancingModal(true)}
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-[1.03] shadow-lg bg-accent-yellow text-primary-deep hover:bg-accent-yellow/90"
                >
                  <Calculator className="w-5 h-5" />
                  {t('advancedFeatures.openSimulator', 'Ouvrir le simulateur')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comparator modal */}
      <PropertyComparator
        properties={compareProperties as never}
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
              className="bg-white rounded-3xl border border-primary-pale shadow-2xl w-full max-w-3xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-primary-pale">
                <h2 className="font-serif text-xl font-bold text-primary-deep">
                  {t('advancedFeatures.financingModalTitle', 'Simulateur de financement')}
                </h2>
                <button
                  onClick={() => setShowFinancingModal(false)}
                  className="w-10 h-10 rounded-full bg-primary-pale hover:bg-primary-pale/70 flex items-center justify-center transition-colors text-primary-deep"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <FinancingSimulator
                  propertyPrice={financingPrice}
                  country={selectedCountry}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
