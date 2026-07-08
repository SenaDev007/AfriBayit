'use client';

/**
 * Page /acheter — Acheter un bien immobilier en Afrique de l'Ouest
 * CDC §5.1 compliance: hero + trust features + property grid + advanced tools (map, comparator, financing)
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid from '@/components/afribayit/PropertyGrid';
import AdvancedFeaturesSection from '@/components/afribayit/AdvancedFeaturesSection';
import { ShieldCheck, FileText, Scale, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const TRUST_FEATURES = [
  {
    icon: FileText,
    title: 'Documents vérifiés',
    description: 'Titre foncier, ACD, permis de construire — chaque bien est contrôlé par notre équipe locale.',
  },
  {
    icon: ShieldCheck,
    title: 'Escrow sécurisé',
    description: 'Fonds protégés sur compte séquestre jusqu\'à signature notariale. Zéro risque de fraude.',
  },
  {
    icon: Scale,
    title: 'Assistance notariale',
    description: 'Notaires certifiés AfriBayit pour une transaction légale dans chaque pays couvert.',
  },
  {
    icon: TrendingUp,
    title: 'Score d\'investissement',
    description: 'Algorithme IA 0-100 qui évalue le potentiel de chaque bien basé sur le marché local.',
  },
];

export default function AcheterPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handlePropertiesLoaded = useCallback((props: any[]) => {
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
      activeTab="acheter"
      hero={{
        badge: 'Achat immobilier',
        title: 'Trouvez votre bien à acheter en Afrique de l\'Ouest',
        subtitle: 'Villas, appartements, terrains et bureaux vérifiés avec documents légaux validés. Transactions sécurisées par Escrow et assistance notariale dans 4 pays.',
        backgroundImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Biens à vendre' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Agents certifiés' },
          { value: 0, suffix: '+', label: 'Transactions' },
        ],
        ctaLabel: 'Voir les biens à acheter',
        ctaHref: '#properties',
      }}
    >
      {/* Trust features section */}
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
              Pourquoi acheter sur AfriBayit ?
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Une plateforme pensée pour la sécurité juridique
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#00308710' }}>
                  <feature.icon className="w-6 h-6" style={{ color: '#003087' }} />
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

      {/* Properties grid */}
      <div id="properties">
        <PropertyGrid
          transaction="achat"
          emptyMessage="Aucun bien à vendre pour le moment"
          onPropertiesLoaded={handlePropertiesLoaded}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      </div>

      {/* Advanced features: map, comparator, financing simulator */}
      <AdvancedFeaturesSection
        transaction="achat"
        properties={properties}
        onSelectProperty={handleSelectProperty}
        showFinancing
      />
    </TransactionPageShell>
  );
}
