'use client';

/**
 * TransactionPageShell — shared layout for the 4 transaction pages:
 * /acheter, /louer, /investir, /short-term
 *
 * Provides:
 *  - Sticky glassmorphism navbar (AfriBayit colors)
 *  - Professional hero section with background image + real stats
 *  - Footer
 *
 * AfriBayit palette:
 *  - Bleu Profond #003087 (hero bg, navbar, titles)
 *  - Or Premium  #D4AF37 (badges, accents)
 *  - Bleu Clair  #009CDE (icons, secondary accents)
 *  - Vert Succès #00A651 (certifications)
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { ArrowRight, ShieldCheck, BadgeCheck, TrendingUp, Home as HomeIcon } from 'lucide-react';

const easeOut = [0.16, 1, 0.3, 1] as const;

const NAVY = '#003087';
const GOLD = '#D4AF37';
const BLUE = '#009CDE';

// ─── Navbar ───────────────────────────────────────────────────────────────

function TransactionNavbar({ activeTab }: { activeTab: 'acheter' | 'louer' | 'investir' | 'sejour' }) {
  const tabs = [
    { key: 'acheter', label: 'Acheter', href: '/acheter' },
    { key: 'louer', label: 'Louer', href: '/louer' },
    { key: 'investir', label: 'Investir', href: '/investir' },
    { key: 'sejour', label: 'Séjours courts', href: '/short-term' },
  ] as const;

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: 'rgba(0, 48, 135, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif', color: 'white' }}>
              Afri<span style={{ color: GOLD }}>Bayit</span>
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.key}
                href={tab.href}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-[#003087]'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
                style={activeTab === tab.key ? { color: NAVY } : {}}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/publish"
            className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105"
            style={{ background: GOLD, color: NAVY }}
          >
            Publier une annonce
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-white' : 'text-white/80 bg-white/10'
              }`}
              style={activeTab === tab.key ? { color: NAVY } : {}}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

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
    <section className="relative min-h-[85vh] flex items-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={backgroundImage}
          alt="AfriBayit hero"
          className="w-full h-full object-cover"
          fallbackType="property"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,48,135,0.92) 0%, rgba(0,48,135,0.75) 50%, rgba(0,156,222,0.6) 100%)' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
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
            className="mt-8 flex flex-wrap gap-4"
          >
            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: GOLD, color: NAVY }}
            >
              {ctaLabel}
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold text-white border-2 border-white/30 hover:bg-white/10 transition-all"
            >
              <HomeIcon className="w-5 h-5" />
              Accueil
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: easeOut }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl"
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

// ─── Footer ───────────────────────────────────────────────────────────────

function TransactionFooter() {
  const footerLinks = [
    {
      title: 'Transactions',
      links: [
        { label: 'Acheter', href: '/acheter' },
        { label: 'Louer', href: '/louer' },
        { label: 'Investir', href: '/investir' },
        { label: 'Location courte durée', href: '/short-term' },
      ],
    },
    {
      title: 'Plateforme',
      links: [
        { label: 'Accueil', href: '/' },
        { label: 'Publier une annonce', href: '/publish' },
        { label: 'Recherche', href: '/search' },
        { label: 'Dashboard', href: '/dashboard' },
      ],
    },
    {
      title: 'Légal',
      links: [
        { label: 'Conditions d\'utilisation', href: '/terms' },
        { label: 'Confidentialité', href: '/privacy' },
        { label: 'Supprimer mes données', href: '/delete-data' },
      ],
    },
  ];

  return (
    <footer style={{ background: NAVY }} className="text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <span className="text-3xl font-bold" style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
              Afri<span style={{ color: GOLD }}>Bayit</span>
            </span>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              La plateforme immobilière pan-africaine de nouvelle génération.
              Où l'Afrique trouve sa maison.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="w-4 h-4" style={{ color: '#00A651' }} />
              <span>Transactions sécurisées Escrow</span>
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col, i) => (
            <div key={i}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link, j) => (
                  <li key={j}>
                    <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} AfriBayit Technologies. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#00A651' }} />
              Documents vérifiés
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: BLUE }} />
              GeoTrust certifié
            </span>
          </div>
        </div>
      </div>
    </footer>
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
        // Map common labels to real stat fields
        if (s.label.toLowerCase().includes('bien')) return { ...s, value: stats.properties ?? s.value };
        if (s.label.toLowerCase().includes('pay')) return { ...s, value: stats.countries ?? s.value };
        if (s.label.toLowerCase().includes('agent')) return { ...s, value: stats.agents ?? s.value };
        if (s.label.toLowerCase().includes('transaction')) return { ...s, value: stats.transactions ?? s.value };
        if (s.label.toLowerCase().includes('utilisateur')) return { ...s, value: stats.users ?? s.value };
        return s;
      })
    : hero.stats;

  return (
    <div className="min-h-screen bg-white">
      <TransactionNavbar activeTab={activeTab} />
      <TransactionHero {...hero} stats={realStats} />
      <main>{children}</main>
      <TransactionFooter />
    </div>
  );
}
