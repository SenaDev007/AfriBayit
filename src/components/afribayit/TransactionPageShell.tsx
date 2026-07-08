'use client';

/**
 * TransactionPageShell — shared hero layout for transaction pages:
 * /acheter, /louer, /investir, /short-term
 *
 * NOTE: This component renders ONLY the hero section.
 * The AppShell already provides the navbar (Header) and footer (Footer),
 * so we must NOT duplicate them here.
 *
 * AfriBayit palette:
 *  - Bleu Profond #003087 (hero bg, titles)
 *  - Or Premium  #D4AF37 (badges, accents)
 *  - Bleu Clair  #009CDE (icons, secondary accents)
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { ArrowRight } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';

// ─── Hero ─────────────────────────────────────────────────────────────────

interface HeroProps {
  badge: string;
  title: string;
  subtitle: string;
  backgroundImage: string;
  stats: { value: number | string; suffix?: string; label: string }[];
  ctaLabel: string;
  ctaHref: string;
}

function TransactionHero({ badge, title, subtitle, backgroundImage, stats, ctaLabel, ctaHref }: HeroProps) {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden pt-20">
      {/* Background image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={backgroundImage}
          alt="AfriBayit"
          className="w-full h-full object-cover"
          fallbackType="property"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,48,135,0.92) 0%, rgba(0,48,135,0.78) 50%, rgba(0,156,222,0.65) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.4)' }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
              {badge}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-white"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            {title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
            className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl"
            style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
          >
            {subtitle}
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: easeOut }}
            className="mt-8"
          >
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: GOLD, color: NAVY }}
            >
              {ctaLabel}
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easeOut }}
            className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold" style={{ color: GOLD, fontFamily: 'var(--font-space-grotesk), monospace' }}>
                  {stat.value}{stat.suffix || ''}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/60">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────

interface TransactionPageShellProps {
  activeTab: 'acheter' | 'louer' | 'investir' | 'sejour';
  hero: HeroProps;
  children: React.ReactNode;
}

export default function TransactionPageShell({ activeTab, hero, children }: TransactionPageShellProps) {
  // Fetch real stats for the hero stats bar
  const { data: stats } = useQuery<any>({
    queryKey: ['platform-stats'],
    queryFn: () => apiFetch<any>('/stats'),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Override the hero stats with real data if available
  const realStats = stats
    ? hero.stats.map((s) => {
        if (s.label.toLowerCase().includes('bien')) return { ...s, value: stats.properties ?? s.value };
        if (s.label.toLowerCase().includes('pay')) return { ...s, value: stats.countries ?? s.value };
        if (s.label.toLowerCase().includes('agent')) return { ...s, value: stats.agents ?? s.value };
        if (s.label.toLowerCase().includes('transaction')) return { ...s, value: stats.transactions ?? s.value };
        if (s.label.toLowerCase().includes('utilisateur') || s.label.toLowerCase().includes('bailleur') || s.label.toLowerCase().includes('hôte')) return { ...s, value: stats.users ?? s.value };
        if (s.label.toLowerCase().includes('réservation') || s.label.toLowerCase().includes('reservation')) return { ...s, value: stats.bookings ?? s.value };
        return s;
      })
    : hero.stats;

  return (
    <div className="min-h-screen bg-white">
      <TransactionHero {...hero} stats={realStats} />
      <main>{children}</main>
    </div>
  );
}
