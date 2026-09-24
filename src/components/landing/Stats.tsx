'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  subText: string;
}

/**
 * Carte statistique avec compteur animé au scroll (IntersectionObserver)
 * — portage fidèle du design Win-Agro Stats.tsx : chiffre serif géant navy,
 * suffixe or, séparateur doré animé au survol, lift + shimmer sur la carte.
 */
const StatItem: React.FC<StatItemProps> = ({ value, suffix, label, subText }) => {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000; // 2 secondes
          const stepTime = Math.abs(Math.floor(duration / value));

          const timer = setInterval(() => {
            start += Math.ceil(value / 50);
            if (start >= value) {
              clearInterval(timer);
              setCount(value);
            } else {
              setCount(start);
            }
          }, Math.max(stepTime, 20));
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [value, hasAnimated]);

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="relative p-8 rounded-3xl bg-white border border-primary-pale shadow-lg hover:shadow-xl hover:border-primary-green/30 transition-all duration-300 flex flex-col justify-between h-full group card-shimmer"
    >
      <div>
        {/* Affichage du compteur avec style premium */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="font-serif text-5xl sm:text-6xl font-black text-primary-deep tracking-tight group-hover:text-primary-green transition-colors duration-300">
            {count}
          </span>
          <span className="font-sans text-3xl font-black text-accent-dark">{suffix}</span>
        </div>

        {/* Ligne séparatrice avec animation de brillance */}
        <div className="w-12 h-1 bg-accent-yellow rounded-full mb-4 group-hover:w-20 transition-all duration-300" />

        {/* Libellés */}
        <h3 className="font-sans font-bold text-lg text-primary-deep tracking-wide mb-2">{label}</h3>
      </div>
      <p className="font-sans text-sm text-gray-text leading-relaxed">{subText}</p>
    </motion.div>
  );
};

/**
 * Section statistiques — design Win-Agro sur palette AfriBayit :
 * fond crème, halos flous pâles, 4 compteurs animés.
 */
export default function Stats() {
  const statsData: StatItemProps[] = [
    {
      value: 12000,
      suffix: '+',
      label: 'Africains accompagnés',
      subText: 'Acheteurs, locataires, vendeurs et voyageurs réunis sur la plateforme.',
    },
    {
      value: 8500,
      suffix: '+',
      label: 'Biens et séjours listés',
      subText: 'Villas, appartements, terrains, hôtels et guesthouses vérifiés.',
    },
    {
      value: 4,
      suffix: '',
      label: 'Pays pionniers couverts',
      subText: 'Bénin, Côte d\u2019Ivoire, Burkina Faso et Togo — et l\u2019Afrique ensuite.',
    },
    {
      value: 100,
      suffix: '%',
      label: 'Transactions sécurisées',
      subText: 'Séquestre digitalisé, notaires accrédités et litiges médiés.',
    },
  ];

  return (
    <section className="py-20 bg-cream relative overflow-hidden">
      {/* Accents d'arrière-plan dynamiques */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-primary-pale/30 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-96 h-96 bg-accent-pale/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {statsData.map((stat, idx) => (
            <StatItem
              key={idx}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              subText={stat.subText}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
