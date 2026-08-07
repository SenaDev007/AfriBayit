'use client';

/**
 * PackagesSection — CDC §7D.9 "Package Stratégique AfriBayit Hospitality + Immobilier"
 *
 * 3 combined packages that differentiate AfriBayit from any other platform:
 * 1. Package Investisseur — Séjour + Visite terrain immobilier
 * 2. Package Relocation — Hôtel transition + Recherche logement
 * 3. Package Artisan — Hébergement + Mission BTP
 */

import { motion } from 'framer-motion';
import { Plane, Home, Wrench, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';

type FeatureKey =
  | 'investorFeature1'
  | 'investorFeature2'
  | 'investorFeature3'
  | 'investorFeature4'
  | 'investorFeature5'
  | 'relocationFeature1'
  | 'relocationFeature2'
  | 'relocationFeature3'
  | 'relocationFeature4'
  | 'relocationFeature5'
  | 'artisanFeature1'
  | 'artisanFeature2'
  | 'artisanFeature3'
  | 'artisanFeature4'
  | 'artisanFeature5';

const PACKAGES: Array<{
  icon: typeof Plane;
  titleKey: string;
  titleFallback: string;
  subtitleKey: string;
  subtitleFallback: string;
  descKey: string;
  descFallback: string;
  features: Array<{ key: string; fallback: string }>;
  priceKey: string;
  priceFallback: string;
  color: string;
  bgColor: string;
  href: string;
}> = [
  {
    icon: Plane,
    titleKey: 'packages.investor.title',
    titleFallback: 'Package Investisseur',
    subtitleKey: 'packages.investor.subtitle',
    subtitleFallback: 'Séjour + Visite terrain',
    descKey: 'packages.investor.description',
    descFallback:
      'Réservation d\'un hôtel à Cotonou ou Abidjan depuis la diaspora + planification automatique de visites de biens immobiliers à vendre dans la ville. Agenda intégré avec agent immobilier certifié AfriBayit.',
    features: [
      { key: 'packages.investor.feature1', fallback: 'Réservation hôtel 3-7 nuits' },
      { key: 'packages.investor.feature2', fallback: '3 visites de biens immobiliers programmées' },
      { key: 'packages.investor.feature3', fallback: 'Agent immobilier certifié dédié' },
      { key: 'packages.investor.feature4', fallback: 'Transport sur site inclus' },
      { key: 'packages.investor.feature5', fallback: 'Rapport de visite détaillé' },
    ],
    priceKey: 'packages.investor.price',
    priceFallback: 'À partir de 500 000 FCFA',
    color: GOLD,
    bgColor: 'rgba(212, 175, 55, 0.08)',
    href: '/investir',
  },
  {
    icon: Home,
    titleKey: 'packages.relocation.title',
    titleFallback: 'Package Relocation',
    subtitleKey: 'packages.relocation.subtitle',
    subtitleFallback: 'Hôtel transition + Recherche logement',
    descKey: 'packages.relocation.description',
    descFallback:
      'Professionnel muté en Afrique de l\'Ouest : réservation hôtel court terme (1-4 semaines) + accès prioritaire aux annonces immobilières locales + matching agent AfriBayit.',
    features: [
      { key: 'packages.relocation.feature1', fallback: 'Hôtel 1-4 semaines' },
      { key: 'packages.relocation.feature2', fallback: 'Accès prioritaire aux annonces' },
      { key: 'packages.relocation.feature3', fallback: 'Matching avec agent AfriBayit' },
      { key: 'packages.relocation.feature4', fallback: 'Visite virtuelle 360° des biens' },
      { key: 'packages.relocation.feature5', fallback: 'Remise croisée 10% sur l\'immobilier' },
    ],
    priceKey: 'packages.relocation.price',
    priceFallback: 'Sur mesure',
    color: NAVY,
    bgColor: 'rgba(0, 48, 135, 0.08)',
    href: '/louer',
  },
  {
    icon: Wrench,
    titleKey: 'packages.artisan.title',
    titleFallback: 'Package Artisan',
    subtitleKey: 'packages.artisan.subtitle',
    subtitleFallback: 'Hébergement + Mission BTP',
    descKey: 'packages.artisan.description',
    descFallback:
      'Artisan en déplacement pour mission : réservation chambre dans l\'hôtel partenaire le plus proche du chantier + gestion mission via marketplace artisans. Facturation unifiée AfriBayit.',
    features: [
      { key: 'packages.artisan.feature1', fallback: 'Chambre d\'hôtel près du chantier' },
      { key: 'packages.artisan.feature2', fallback: 'Gestion mission BTP intégrée' },
      { key: 'packages.artisan.feature3', fallback: 'Facturation unifiée AfriBayit' },
      { key: 'packages.artisan.feature4', fallback: 'Escrow sécurisé pour la mission' },
      { key: 'packages.artisan.feature5', fallback: 'Support 7j/7' },
    ],
    priceKey: 'packages.artisan.price',
    priceFallback: 'À partir de 25 000 FCFA/nuit',
    color: BLUE,
    bgColor: 'rgba(0, 156, 222, 0.08)',
    href: '/artisans',
  },
];

export default function PackagesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-gray-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: NAVY }}>
            <span className="h-px w-8" style={{ background: NAVY }} />
            {t('packages.eyebrow', 'Packages combinés')}
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
            {t('packages.title', 'Hôtellerie + Immobilier = l\'avantage AfriBayit')}
          </h2>
          <p className="mt-4 text-gray-500">
            {t(
              'packages.subtitle',
              'La seule plateforme qui combine réservation hôtelière et immobilier en Afrique de l\'Ouest. Des packages uniques impossibles à trouver ailleurs.'
            )}
          </p>
        </motion.div>

        {/* Package cards */}
        <div className="flex flex-wrap justify-center gap-6">
          {PACKAGES.map((pkg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-xl bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-all"
            >
              {/* Header */}
              <div className="p-6" style={{ background: pkg.bgColor }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${pkg.color}15` }}>
                  <pkg.icon className="w-6 h-6" style={{ color: pkg.color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
                  {t(pkg.titleKey, pkg.titleFallback)}
                </h3>
                <p className="text-sm font-semibold" style={{ color: pkg.color }}>
                  {t(pkg.subtitleKey, pkg.subtitleFallback)}
                </p>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {t(pkg.descKey, pkg.descFallback)}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: pkg.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t(feature.key, feature.fallback)}
                    </li>
                  ))}
                </ul>

                {/* Price + CTA */}
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-900 mb-3">{t(pkg.priceKey, pkg.priceFallback)}</p>
                  <Link
                    href={pkg.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:scale-105"
                    style={{ background: pkg.color }}
                  >
                    {t('packages.discover', 'Découvrir')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
