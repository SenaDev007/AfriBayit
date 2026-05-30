'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { properties } from '@/lib/mockData';
import PropertyCard from './PropertyCard';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface FeaturedPropertiesProps {
  onSelectProperty: (id: string) => void;
  onNavigate: (section: string) => void;
}

export default function FeaturedProperties({ onSelectProperty, onNavigate }: FeaturedPropertiesProps) {
  const featured = properties.filter(p => p.premium || p.verified).slice(0, 6);

  return (
    <section className="py-16 sm:py-24 bg-gray-50/50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
              Sélection Premium
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#2C2E2F]">
              Biens <span className="text-[#003087]">en vedette</span>
            </h2>
          </div>
          <motion.button
            whileHover={{ x: 4 }}
            onClick={() => onNavigate('search')}
            className="mt-4 sm:mt-0 text-[#003087] text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            Voir tous les biens
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featured.map((property, i) => (
            <PropertyCard
              key={property.id}
              property={property}
              index={i}
              onSelect={onSelectProperty}
            />
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="mt-16 p-8 sm:p-12 rounded-3xl bg-navy-gradient noise-overlay relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#009CDE]/20 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1 text-center lg:text-left">
              <h3 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3">
                Prêt à trouver votre bien idéal ?
              </h3>
              <p className="text-white/70 max-w-lg">
                Rejoignez des milliers de propriétaires et acheteurs qui font confiance à AfriBayit
                pour leurs transactions immobilières en Afrique de l&apos;Ouest.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('search')}
                className="px-8 py-3.5 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg gold-glow transition-colors"
              >
                Explorer les biens
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('academy')}
                className="px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm border border-white/20 transition-colors"
              >
                En savoir plus
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
