'use client';

/**
 * Page /louer — Louer un bien immobilier en Afrique de l'Ouest
 */

import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid from '@/components/afribayit/PropertyGrid';
import { Calendar, KeyRound, ShieldCheck, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const easeOut = [0.16, 1, 0.3, 1] as const;

const RENTAL_FEATURES = [
  {
    icon: Calendar,
    title: 'Visites planifiées',
    description: 'Réservez vos visites en ligne avec calendrier synchronisé. Disponibilités en temps réel.',
  },
  {
    icon: ShieldCheck,
    title: 'Bail numérique sécurisé',
    description: 'Signature électronique du bail avec dépôt de garantie protégé sur compte Escrow.',
  },
  {
    icon: KeyRound,
    title: 'Remise des clés',
    description: 'État des lieux digitalisé avec photos et vidéos. Check-in organisé par l\'agent.',
  },
  {
    icon: Wallet,
    title: 'Paiement Mobile Money',
    description: 'Loyer payé via MTN, Orange, Moov ou Airtel Money. Reçus automatiques chaque mois.',
  },
];

export default function LouerPage() {
  return (
    <TransactionPageShell
      activeTab="louer"
      hero={{
        badge: 'Location longue durée',
        title: 'Louez votre prochain chez-vous en toute sérénité',
        subtitle: 'Appartements, villas et bureaux à louer avec bail numérique sécurisé. Paiement Mobile Money intégré et dépôt de garantie protégé par Escrow.',
        backgroundImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Biens à louer' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 0, suffix: '+', label: 'Agents certifiés' },
          { value: 0, suffix: '+', label: 'Bailleurs' },
        ],
        ctaLabel: 'Voir les biens à louer',
        ctaHref: '#properties',
      }}
    >
      {/* Features */}
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
              Location simplifiée
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Une expérience de location sans friction
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RENTAL_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
                className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: '#009CDE15' }}>
                  <feature.icon className="w-6 h-6" style={{ color: '#009CDE' }} />
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

      {/* Properties */}
      <div id="properties">
        <PropertyGrid
          transaction="location"
          emptyMessage="Aucun bien à louer pour le moment"
        />
      </div>
    </TransactionPageShell>
  );
}
