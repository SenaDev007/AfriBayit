'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';

/**
 * Section Pourquoi AfriBayit — portage du design Win-Agro WhyUs.tsx :
 * déclaration stratégique à fort contraste avec souligné or animé,
 * grille de cartes premium numérotées avec images, reveal en cascade
 * (staggerChildren), lift + scale au survol.
 */

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`;

const differentiations = [
  {
    num: '01',
    tag: 'SÉCURITÉ DES FONDS',
    title: 'Séquestre digitalisé (escrow)',
    description:
      "Ton argent reste bloqué en sécurité jusqu'à la livraison. Le vendeur n'est payé qu'une fois l'acte signé et le bien conforme. Aucune transaction directe risquée.",
    image: IMG('photo-1554224155-6726b3ff858f'),
  },
  {
    num: '02',
    tag: 'TITRES VÉRIFIÉS GEOTRUST',
    title: 'Zéro terrain litigieux',
    description:
      'Notre module GeoTrust détecte les conflits fonciers, croise les registres et vérifie les titres avant même la publication de l\u2019annonce.',
    image: IMG('photo-1500382017468-9049fed747ef'),
  },
  {
    num: '03',
    tag: 'NOTAIRES ACRÉDITÉS',
    title: 'Signature authentifiée',
    description:
      'Des notaires agréés dans chaque pays, une e-signature qualifiée et des actes conformes au droit local. De la promesse de vente à l\u2019enregistrement.',
    image: IMG('photo-1589829545856-d10d557cf95f'),
  },
  {
    num: '04',
    tag: 'IA REBECCA 24H/24',
    title: 'Une conseillère qui ne dort jamais',
    description:
      'Rebecca, notre IA immobilière, qualifie tes besoins, propose les bons biens et déclenche les visites — jour et nuit, dans ta langue.',
    image: IMG('photo-1531746790731-6c087fecd65a'),
  },
  {
    num: '05',
    tag: 'ÉCOSYSTÈME COMPLET',
    title: 'Tout sous un même toit',
    description:
      'Artisans ProMatch pour tes travaux, Académie pour apprendre à investir, portefeuille AfriPoints et communauté d\u2019investisseurs — sans quitter la plateforme.',
    image: IMG('photo-1521737604893-d14cc237f1d2'),
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function WhyUs() {
  const router = useRouter();

  return (
    <section id="pourquoi-nous" className="py-24 bg-white relative overflow-hidden">
      {/* Flou décoratif */}
      <div className="absolute bottom-10 right-0 w-72 h-72 bg-primary-pale rounded-full blur-3xl opacity-50 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête — déclaration stratégique à fort contraste */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-4">
            Pourquoi choisir AfriBayit
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary-deep leading-snug"
          >
            &quot;Beaucoup de plateformes t&apos;accompagnent jusqu&apos;à la recherche.{' '}
            <span className="relative inline-block text-primary-green">
              Nous, nous t&apos;accompagnons jusqu&apos;aux clés.
              <motion.span
                animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
                transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
                className="absolute bottom-0 left-0 w-full h-[4px] bg-accent-yellow rounded-full"
              />
            </span>{' '}
            Ce n&apos;est pas la même chose.&quot;
          </motion.h2>

          <motion.div
            animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
            className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full"
          />
        </div>

        {/* Grille de cartes premium */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="flex flex-wrap justify-center gap-8 w-full mt-6"
        >
          {differentiations.map((item) => (
            <motion.div
              key={item.num}
              variants={cardVariants}
              whileHover={{
                y: -6,
                scale: 1.02,
                borderColor: 'rgba(0, 156, 222, 0.3)',
                boxShadow: '0 20px 25px -5px rgba(0, 48, 135, 0.08), 0 8px 10px -6px rgba(0, 48, 135, 0.08)',
              }}
              onClick={() => router.push('/search')}
              className="max-w-72 w-full bg-cream/40 border border-primary-green/10 rounded-2xl p-4 shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Couverture image */}
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden relative shadow-sm border border-primary-green/5">
                  <Image
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    src={item.image}
                    alt={item.title}
                    unoptimized
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-sans font-black text-primary-green shadow-sm">
                    {item.num}
                  </div>
                </div>

                {/* Badge tag */}
                <p className="text-[9px] font-sans font-black uppercase tracking-wider text-primary-green mt-4">
                  {item.tag}
                </p>

                {/* Titre de carte */}
                <h3 className="text-base font-serif font-bold text-primary-deep mt-2 leading-tight text-left">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-gray-500 font-sans mt-2.5 leading-relaxed text-left">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
