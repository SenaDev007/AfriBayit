'use client';

/**
 * Page /investir — Investir dans l'immobilier en Afrique de l'Ouest
 *
 * CDC §5.1.1 / §5.9.2 compliance:
 *   - Hero with real investment stats (avg yield, growth, opportunities)
 *   - Top opportunities section (sorted by investment score 0-100)
 *   - Property grid with conversational AI search
 *   - ROI calculator (rental yield, cashflow, 5-year projection)
 *   - Tax calculator (taxes foncières, droits de mutation, plus-values)
 *   - Advanced features: map, comparator, financing simulator
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid, { type PropertyListItem } from '@/components/afribayit/PropertyGrid';
import AdvancedFeaturesSection from '@/components/afribayit/AdvancedFeaturesSection';
import ConversationalSearchBar from '@/components/afribayit/ConversationalSearchBar';
import InvestmentOpportunities from '@/components/afribayit/InvestmentOpportunities';
import ROICalculator from '@/components/afribayit/ROICalculator';
import TaxCalculator from '@/components/afribayit/TaxCalculator';
import PriceAlertsManager from '@/components/afribayit/PriceAlertsManager';
import InvestmentGuide from '@/components/afribayit/InvestmentGuide';
import { useInvestmentStats } from '@/hooks/useInvestment';
import { Brain, TrendingUp, Coins, Calculator, FileText, X, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

export default function InvestirPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showRoiCalc, setShowRoiCalc] = useState(false);
  const [showTaxCalc, setShowTaxCalc] = useState(false);

  const { data: invStats } = useInvestmentStats();

  const handlePropertiesLoaded = useCallback((props: PropertyListItem[]) => {
    setProperties(props);
  }, []);

  const handleToggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }, []);

  const handleSelectProperty = useCallback((id: string) => {
    router.push(`/property/${id}`);
  }, [router]);

  return (
    <TransactionPageShell
      activeTab="investir"
      hero={{
        badge: t('transactionPages.investir.badge', 'Investissement immobilier'),
        title: t(
          'transactionPages.investir.title',
          "Investissez dans l'immobilier ouest-africain en pleine croissance"
        ),
        subtitle: t(
          'transactionPages.investir.subtitle',
          "Terrains et biens à fort potentiel avec score d'investissement IA, prédictions de prix ML et analyse de quartier. Le marché immobilier africain croît de 10-15% par an."
        ),
        backgroundImage:
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=900&fit=crop',
        stats: [
          { value: invStats?.totalOpportunities ?? 0, suffix: '+', label: t('transactionPages.investir.statOpportunities', 'Opportunités') },
          { value: invStats?.byCountry?.length ?? 4, suffix: '', label: t('transactionPages.investir.statCountriesCovered', 'Pays couverts') },
          { value: invStats?.avgAnnualGrowth ?? 12, suffix: '%', label: t('transactionPages.investir.statAnnualGrowth', 'Croissance annuelle') },
          { value: invStats?.avgRentalYield ?? 8, suffix: '%', label: t('transactionPages.investir.statRentalYield', 'Rendement moyen') },
        ],
        ctaLabel: t('transactionPages.investir.ctaLabel', 'Voir les opportunités'),
        ctaHref: '#opportunities',
      }}
    >
      {/* Conversational AI search */}
      <section className="py-12 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConversationalSearchBar transaction="investissement" />
        </div>
      </section>

      {/* Top opportunities — sorted by investment score */}
      <section id="opportunities" className="py-20 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/10 rounded-lg text-xs font-semibold text-[#D4AF37] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              {t('transactionPages.investir.aiSelection', 'Sélection IA')}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#003087] mb-2">
              {t('transactionPages.investir.topOpportunitiesTitle', "Top opportunités d'investissement")}
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              {t(
                'transactionPages.investir.topOpportunitiesDesc',
                "Chaque bien reçoit un score d'investissement 0-100 calculé par notre algorithme IA, basé sur le prix au m², le potentiel de rendement locatif, la croissance du marché et les signaux de confiance (GeoTrust, vérification, visite VR)."
              )}
            </p>
          </motion.div>

          <InvestmentOpportunities limit={6} />
        </div>
      </section>

      {/* Investor tools — ROI + Tax calculators */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#003087] mb-2">
              {t('transactionPages.investir.investorToolsTitle', 'Outils pour investisseurs')}
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              {t(
                'transactionPages.investir.investorToolsDesc',
                'Calculez la rentabilité de votre investissement et les taxes applicables dans chaque pays de la zone UEMOA.'
              )}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* ROI Calculator trigger */}
            <div className="bg-gradient-to-br from-[#003087] to-[#0047b3] rounded-xl p-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="font-display text-xl font-bold">
                  {t('transactionPages.investir.roiCalculatorTitle', 'Calculateur ROI locatif')}
                </h3>
              </div>
              <p className="text-sm text-white/70 mb-6">
                {t(
                  'transactionPages.investir.roiCalculatorDesc',
                  'Estimez le rendement brut/net, le cashflow mensuel et la plus-value à 5 ans de votre investissement locatif. Taux de croissance par pays, vacance locative, charges et taxe foncière inclus.'
                )}
              </p>
              <ul className="space-y-2 text-xs text-white/80 mb-6">
                <li className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />{' '}
                  {t('transactionPages.investir.roiFeature1', 'Rendement brut & net')}
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />{' '}
                  {t('transactionPages.investir.roiFeature2', 'Projection plus-value 5 ans')}
                </li>
                <li className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />{' '}
                  {t('transactionPages.investir.roiFeature3', 'Cashflow mensuel & annuel')}
                </li>
              </ul>
              <button
                onClick={() => setShowRoiCalc(true)}
                className="w-full py-3 bg-[#D4AF37] text-[#003087] rounded-lg text-sm font-bold hover:bg-[#b8961f] transition-colors"
              >
                {t('transactionPages.investir.openRoiCalculator', 'Ouvrir le calculateur ROI')}
              </button>
            </div>

            {/* Tax Calculator trigger */}
            <div className="bg-gradient-to-br from-[#2C2E2F] to-[#1a1c1d] rounded-xl p-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <h3 className="font-display text-xl font-bold">
                  {t('transactionPages.investir.taxCalculatorTitle', 'Calculateur fiscal')}
                </h3>
              </div>
              <p className="text-sm text-white/70 mb-6">
                {t(
                  'transactionPages.investir.taxCalculatorDesc',
                  "Calculez les taxes foncières, droits de mutation et plus-values par pays (Bénin, Côte d'Ivoire, Burkina Faso, Togo). Mis à jour selon les réformes fiscales en vigueur (Décret 2024-1115, RAF 2025, CFD 2018)."
                )}
              </p>
              <ul className="space-y-2 text-xs text-white/80 mb-6">
                <li className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />{' '}
                  {t('transactionPages.investir.taxFeature1', 'Droits de mutation')}
                </li>
                <li className="flex items-center gap-2">
                  <Calculator className="w-3.5 h-3.5 text-[#D4AF37]" />{' '}
                  {t('transactionPages.investir.taxFeature2', 'Taxe foncière annuelle')}
                </li>
                <li className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" />{' '}
                  {t('transactionPages.investir.taxFeature3', 'Plus-value à la revente')}
                </li>
              </ul>
              <button
                onClick={() => setShowTaxCalc(true)}
                className="w-full py-3 bg-white text-[#0a2a5e] rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
              >
                {t('transactionPages.investir.openTaxCalculator', 'Ouvrir le calculateur fiscal')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Price alerts + Investment guide */}
      <section className="py-20 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 text-center"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#003087] mb-2">
              {t(
                'transactionPages.investir.alertsTitle',
                'Restez informé & investissez en toute connaissance de cause'
              )}
            </h2>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              {t(
                'transactionPages.investir.alertsDesc',
                "Créez des alertes personnalisées pour ne manquer aucune opportunité, et consultez le cadre légal d'investissement dans chaque pays de la zone UEMOA."
              )}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <PriceAlertsManager />
            <InvestmentGuide />
          </div>
        </div>
      </section>

      {/* Properties grid */}
      <section id="properties" className="py-20 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#003087] mb-2">
              {t('transactionPages.investir.allOpportunitiesTitle', 'Toutes les opportunités')}
            </h2>
            <p className="text-sm text-gray-500">
              {t(
                'transactionPages.investir.allOpportunitiesDesc',
                "Parcourez tous les biens d'investissement disponibles. Utilisez les filtres pour affiner par score, ROI, prix ou localisation."
              )}
            </p>
          </motion.div>

          <PropertyGrid
            transaction="investissement"
            emptyMessage={t(
              'transactionPages.investir.emptyMessage',
              "Aucune opportunité d'investissement pour le moment"
            )}
            onPropertiesLoaded={handlePropertiesLoaded}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
          />
        </div>
      </section>

      {/* Advanced features: map, comparator, financing simulator */}
      <AdvancedFeaturesSection
        transaction="investissement"
        properties={properties}
        onSelectProperty={handleSelectProperty}
        showFinancing
        compareIds={compareIds}
        onToggleCompare={handleToggleCompare}
      />

      {/* ROI Calculator modal */}
      {showRoiCalc && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowRoiCalc(false)}
        >
          <div className="max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowRoiCalc(false)}
                className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <ROICalculator propertyPrice={25_000_000} country="BJ" />
          </div>
        </div>
      )}

      {/* Tax Calculator modal */}
      {showTaxCalc && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowTaxCalc(false)}
        >
          <div className="max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowTaxCalc(false)}
                className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <TaxCalculator onClose={() => setShowTaxCalc(false)} />
          </div>
        </div>
      )}
    </TransactionPageShell>
  );
}
