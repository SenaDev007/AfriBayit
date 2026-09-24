'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TestimonialsCarousel, type Testimonial } from './TestimonialsCarousel';

/**
 * Section Témoignages — portage du design Win-Agro Testimonials.tsx :
 * en-tête centré avec souligné or animé, double carrousel marquee
 * (gauche + droite) de témoignages africains AfriBayit, bouton d'action.
 */
const TESTIMONIALS: Testimonial[] = [
  {
    text: "J'ai acheté ma villa à Abidjan sans même y voler. Le séquestre AfriBayit a bloqué mes fonds jusqu'à la signature chez le notaire accrédité. Zéro stress, zéro intermédiaire douteux.",
    highlight: 'Le séquestre a bloqué mes fonds jusqu\u2019à la signature',
    name: 'Koffi A.',
    role: 'Acheteur · Abidjan, Côte d\u2019Ivoire',
  },
  {
    text: "Mon dépôt de garantie était protégé sous séquestre pour la première fois de ma vie. Quand le propriétaire a tardé sur une réparation, la médiation AfriBayit a réglé le litige en 48h.",
    highlight: 'la médiation a réglé le litige en 48h',
    name: 'Aïcha D.',
    role: 'Locataire · Cotonou, Bénin',
  },
  {
    text: "En tant qu'investisseur diaspora, je voulais acheter un terrain à Lomé sans y retourner. GeoTrust a vérifié le titre, le notaire a signé en ligne, et mes 4 parcelles sont enregistrées.",
    highlight: 'mes 4 parcelles sont enregistrées',
    name: 'Serge M.',
    role: 'Investisseur diaspora · Paris → Lomé',
  },
  {
    text: "Nos réservations guesthouse ont doublé depuis que nous sommes certifiés AfriBayit. Les voyageurs font confiance aux adresses inspectées, et le check-in QR nous fait gagner un temps fou.",
    highlight: 'nos réservations ont doublé',
    name: 'Mariam T.',
    role: 'Gestionnaire de guesthouse · Ouagadougou',
  },
  {
    text: "Rebecca m'a trouvé un appartement 3 chambres à Dakar correspondant EXACTEMENT à mon budget en une nuit. Le matin, trois visites étaient déjà planifiées. bluffante.",
    highlight: 'trois visites déjà planifiées le matin',
    name: 'Fatou N.',
    role: 'Locataire · Dakar, Sénégal',
  },
  {
    text: "La formation de l'Académie m'a appris à évaluer le rendement locatif avant d'acheter. Ma première décision d'investissement a été rentabilisée en 14 mois au lieu des 24 prévus.",
    highlight: 'rentabilisée en 14 mois au lieu des 24 prévus',
    name: 'Ibrahima S.',
    role: 'Investisseur débutant · Bobo-Dioulasso',
  },
];

export default function Testimonials() {
  const router = useRouter();

  const isLargeSet = TESTIMONIALS.length >= 6;
  const firstRow = isLargeSet ? TESTIMONIALS.filter((_, index) => index % 2 === 0) : TESTIMONIALS;
  const secondRow = isLargeSet ? TESTIMONIALS.filter((_, index) => index % 2 !== 0) : [];

  return (
    <section id="témoignages" className="py-24 bg-cream relative overflow-hidden">
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-4 border border-primary-green/10">
            Témoignages Réels
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-deep leading-tight"
          >
            Ils cherchaient comme toi.
          </motion.h2>

          <p className="text-primary-green font-serif text-lg sm:text-xl font-bold mt-2">
            Voilà ce qu&apos;ils ont trouvé avec AfriBayit.
          </p>

          <motion.div
            animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
            className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full"
          />

          <div className="mt-8">
            <button
              onClick={() => router.push('/community')}
              className="px-6 py-3 rounded-full bg-primary-green text-white font-bold text-xs hover:bg-primary-deep transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5 inline-flex items-center gap-2 btn-shimmer"
            >
              ⭐ Décrypter les avis de la communauté
            </button>
          </div>
        </div>
      </div>

      {/* Carrousels défilants double rangée */}
      <div className="space-y-6 w-full relative z-10 select-none pointer-events-auto">
        <TestimonialsCarousel testimonials={firstRow} speed={isLargeSet ? 28 : 34} direction="left" cardHeight={240} />
        {isLargeSet && (
          <TestimonialsCarousel testimonials={secondRow} speed={34} direction="right" cardHeight={240} />
        )}
      </div>
    </section>
  );
}
