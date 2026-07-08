'use client';

/**
 * Page /investir — Investir dans l'immobilier en Afrique de l'Ouest
 *
 * Affiche les propriétés à fort potentiel d'investissement (transaction=investissement)
 * avec score d'investissement, simulateur de ROI et stats marché.
 */

import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid from '@/components/afribayit/PropertyGrid';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, MapPin, Calculator } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

const INVESTMENT_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Score d\'investissement IA',
    description: 'Algorithme 0-100 qui évalue la rentabilité locative, l\'appréciation potentielle et le risque par quartier.',
  },
  {
    icon: BarChart3,
    title: 'Prédictions de prix ML',
    description: 'Historique des prix sur 5 ans et prédictions par quartier grâce à nos modèles de machine learning.',
  },
  {
    icon: MapPin,
    title: 'Analyse de quartier',
    description: 'Walk score, accessibilité transports, écoles, commodités et sécurité — données temps réel.',
  },
  {
    icon: Calculator,
    title: 'Simulateur de financement',
    description: 'Calculez votre ROI, mensualités de crédit et cash-flow locatif avec notre simulateur intégré.',
  },
];

const MARKET_STATS = [
  { country: '🇧🇯 Bénin', growth: '+12%', yield: '6-8%', hotAreas: 'Cotonou, Porto-Novo' },
  { country: '🇨🇮 Côte d\'Ivoire', growth: '+15%', yield: '7-9%', hotAreas: 'Abidjan, Bingerville' },
  { country: '🇧🇫 Burkina Faso', growth: '+8%', yield: '5-7%', hotAreas: 'Ouagadougou' },
  { country: '🇹🇬 Togo', growth: '+10%', yield: '6-8%', hotAreas: 'Lomé, Kpogan' },
];

export default function InvestirPage() {
  return (
    <TransactionPageShell
      activeTab="investir"
      hero={{
        badge: 'Investissement immobilier',
        title: 'Investissez dans l\'immobilier ouest-africain en pleine croissance',
        subtitle: 'Terrains et biens à fort potentiel avec score d\'investissement IA, prédictions de prix ML et analyse de quartier. Le marché immobilier africain croît de 10-15% par an.',
        backgroundImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Opportunités' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 12, suffix: '%', label: 'Croissance annuelle' },
          { value: 8, suffix: '%', label: 'Rendement moyen' },
        ],
        ctaLabel: 'Voir les opportunités',
        ctaHref: '#properties',
      }}
    >
      {/* Investment features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#003087]">
              <span className="h-px w-8 bg-[#003087]" />
              Outils d'investissement
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Décidez avec des données, pas avec des intuitions
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INVESTMENT_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#D4AF3715' }}>
                  <feature.icon className="w-6 h-6" style={{ color: '#D4AF37' }} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Market stats table */}
      <section className="py-20 bg-gray-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#003087]">
              <span className="h-px w-8 bg-[#003087]" />
              Marché ouest-africain
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Aperçu des marchés par pays
            </h2>
          </motion.div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr style={{ background: '#003087' }}>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">Pays</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">Croissance annuelle</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">Rendement locatif</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-white">Zones chaudes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MARKET_STATS.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-gray-900">{row.country}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#00A65115', color: '#00A651' }}>
                        <TrendingUp className="w-3 h-3" />
                        {row.growth}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">{row.yield}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{row.hotAreas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Properties */}
      <div id="properties">
        <PropertyGrid
          transaction="investissement"
          emptyMessage="Aucune opportunité d'investissement pour le moment"
        />
      </div>
    </TransactionPageShell>
  );
}
