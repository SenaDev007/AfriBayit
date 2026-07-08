'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

const easeOut = [0.16, 1, 0.3, 1] as const;

// ─── Animated Counter (counts continuously, pauses on hover) ──────────────
function AnimatedCounter({
  value,
  suffix = '',
  duration = 2000,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const currentValueRef = useRef(0);

  useEffect(() => {
    // If value is 0 or undefined, show 0
    if (!value || value === 0) {
      setDisplayValue(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = (elapsed % duration) / duration;

      // Ease in-out cubic
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const current = Math.floor(eased * value);
      currentValueRef.current = current;
      setDisplayValue(current);

      if (!isHovered) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    if (!isHovered) {
      startTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, isHovered]);

  // Format number with thousands separator
  const formatted = displayValue >= 1000
    ? displayValue.toLocaleString('fr-FR')
    : String(displayValue);

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="cursor-default tabular-nums"
    >
      {formatted}{suffix}
    </span>
  );
}

// ─── Pillar Card (animated) ───────────────────────────────────────────────
function PillarCard({
  icon,
  title,
  description,
  stat,
  statLabel,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  stat: string;
  statLabel: string;
  delay: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: easeOut }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border-2 border-[#003366]/20 bg-white p-6 transition-all duration-300 hover:border-[#003366] hover:shadow-xl"
    >
      {/* Animated top bar */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1 bg-[#003366]"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: delay + 0.2, ease: easeOut }}
        style={{ originX: 0 }}
      />

      {/* Floating icon with continuous rotation animation */}
      <motion.div
        animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
        transition={{ duration: 0.3 }}
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#003366] text-white"
      >
        {icon}
      </motion.div>

      {/* Stat badge */}
      <div className="mt-5 flex items-baseline gap-2">
        <span className="font-[family-name:var(--font-space-grotesk),monospace] text-2xl font-bold text-[#003366]">
          {stat}
        </span>
        <span className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-[10px] uppercase tracking-wider text-gray-400">
          {statLabel}
        </span>
      </div>

      <h3 className="mt-3 font-[family-name:var(--font-cormorant),Georgia,serif] text-xl font-bold text-gray-900">
        {title}
      </h3>
      <p className="mt-2 font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm leading-relaxed text-gray-500">
        {description}
      </p>

      {/* Bottom accent line — animates on hover */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-[#FFCC00]"
        initial={{ width: 0 }}
        animate={isHovered ? { width: '100%' } : { width: 0 }}
        transition={{ duration: 0.4, ease: easeOut }}
      />
    </motion.div>
  );
}

const pillars = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Documents Vérifiés',
    description: 'Titres fonciers, permis et actes authentifiés par nos experts juridiques.',
    stat: '100%',
    statLabel: 'Conformité',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Escrow Sécurisé',
    description: 'Fonds protégés via compte séquestre jusqu\'à signature notariale.',
    stat: '0 FCFA',
    statLabel: 'Perdu',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'Agents Certifiés',
    description: 'Professionnels vérifiés avec formation continue et certification AfriBayit.',
    stat: '500+',
    statLabel: 'Experts',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
      </svg>
    ),
    title: 'GeoTrust Terrain',
    description: 'Géomètres certifiés pour vérification et bornage de votre terrain.',
    stat: 'GPS',
    statLabel: 'Bornage',
  },
];

export default function TrustSection() {
  // Fetch real platform stats from the public /stats endpoint
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: () => api.get<any>('/stats'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Derive real stats from the single /stats response
  const totalProperties = stats?.properties ?? 0;
  const totalCountries = stats?.countries ?? 0;
  const totalUsers = stats?.users ?? 0;
  const satisfaction = stats?.satisfaction ?? 0;

  const statsItems = [
    { value: totalProperties, suffix: '+', label: 'Biens vérifiés' },
    { value: totalCountries, suffix: '', label: 'Pays couverts' },
    { value: totalUsers, suffix: '+', label: 'Utilisateurs' },
    { value: satisfaction, suffix: '%', label: 'Satisfaction' },
  ];

  return (
    <section className="bg-[#FFCC00] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#003366]">
            <span className="h-px w-8 bg-[#003366]" />
            Confiance & Sécurité
            <span className="h-px w-8 bg-[#003366]" />
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-cormorant),Georgia,serif] text-4xl font-bold leading-tight text-[#003366] sm:text-5xl lg:text-6xl">
            Pourquoi AfriBayit ?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-[family-name:var(--font-inter),system-ui,sans-serif] text-lg text-[#003366]/70">
            Quatre piliers fondamentaux pour garantir des transactions immobilières
            transparentes et sécurisées en Afrique de l&apos;Ouest.
          </p>
        </motion.div>

        {/* Stats banner — animated counters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease: easeOut }}
          className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#003366]/20 bg-[#003366]/10 md:grid-cols-4"
        >
          {statsItems.map((stat) => (
            <div key={stat.label} className="bg-[#FFCC00] px-6 py-8 text-center">
              <div className="font-[family-name:var(--font-space-grotesk),monospace] text-4xl font-bold text-[#003366]">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm text-[#003366]/60">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pillars grid — animated cards */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar, i) => (
            <PillarCard
              key={pillar.title}
              icon={pillar.icon}
              title={pillar.title}
              description={pillar.description}
              stat={pillar.stat}
              statLabel={pillar.statLabel}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
