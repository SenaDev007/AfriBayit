'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Star,
  Gift,
  Share2,
  ArrowRight,
  Check,
  ChevronDown,
  Award,
  TrendingUp,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Easing & animation constants ───────────────────────────────────────────
const easeOut = [0.16, 1, 0.3, 1] as const;

// ─── Tier data ──────────────────────────────────────────────────────────────
const tiers = [
  {
    id: 'bronze',
    name: 'Bronze',
    commission: '2%',
    color: '#CD7F32',
    colorLight: 'rgba(205, 127, 50, 0.08)',
    colorBorder: 'rgba(205, 127, 50, 0.35)',
    icon: Award,
    features: [
      'Commission de 2% sur chaque transaction',
      'Badge Bronze sur votre profil',
      'Score de confiance > 300',
      'Au moins 1 transaction complétée',
      'Lien de parrainage personnalisé',
    ],
    requirements: 'Score > 300 + 1 transaction',
  },
  {
    id: 'silver',
    name: 'Silver',
    commission: '3%',
    color: '#94A3B8',
    colorLight: 'rgba(148, 163, 184, 0.08)',
    colorBorder: 'rgba(148, 163, 184, 0.35)',
    icon: Star,
    features: [
      'Commission de 3% sur chaque transaction',
      'Accès VIP aux événements AfriBayit',
      'Kit communication personnalisé',
      'Score de confiance > 600',
      'Au moins 5 transactions complétées',
      'Support prioritaire dédié',
    ],
    requirements: 'Score > 600 + 5 transactions',
  },
  {
    id: 'gold',
    name: 'Gold',
    commission: '4%',
    color: '#D4AF37',
    colorLight: 'rgba(212, 175, 55, 0.08)',
    colorBorder: 'rgba(212, 175, 55, 0.35)',
    icon: Gift,
    features: [
      'Commission de 4% sur chaque transaction',
      'Rémunération fixe mensuelle',
      'Co-branding sur supports marketing',
      'Score de confiance > 900',
      'Au moins 10 transactions complétées',
      'Accès aux rapports analytiques avancés',
      'Mise en avant sur la plateforme',
    ],
    requirements: 'Score > 900 + 10 transactions',
    highlighted: true,
  },
];

// ─── How-it-works steps ─────────────────────────────────────────────────────
const steps = [
  {
    number: 1,
    icon: Share2,
    title: 'Partagez votre lien',
    description:
      "Recevez un lien de parrainage unique et partagez-le avec votre réseau — amis, famille, collègues, communautés.",
    color: '#009CDE',
  },
  {
    number: 2,
    icon: Users,
    title: 'Vos filleuls s\'inscrivent',
    description:
      'Chaque personne qui s\'inscrit via votre lien devient votre filleul. Plus vous parrainez, plus vous montez en grade.',
    color: '#003087',
  },
  {
    number: 3,
    icon: TrendingUp,
    title: 'Gagnez des commissions',
    description:
      'Gagnez des commissions sur chaque transaction réalisée par vos filleuls. Des revenus récurrents, sans limite.',
    color: '#D4AF37',
  },
];

// ─── FAQ data ───────────────────────────────────────────────────────────────
const faqItems = [
  {
    question: 'Comment devenir ambassadeur AfriBayit ?',
    answer:
      "C'est simple ! Créez un compte sur AfriBayit, complétez votre profil, et accédez automatiquement à votre lien de parrainage. Partagez-le et commencez à gagner des commissions dès la première transaction de vos filleuls.",
  },
  {
    question: 'Comment sont calculées les commissions ?',
    answer:
      'Les commissions sont calculées en pourcentage du montant de chaque transaction réalisée par vos filleuls. Le taux varie selon votre palier : 2% (Bronze), 3% (Silver) ou 4% (Gold). Les commissions sont créditées directement sur votre portefeuille AfriBayit.',
  },
  {
    question: 'Comment passer au palier supérieur ?',
    answer:
      'Vous progressez automatiquement en accumulant des transactions et en améliorant votre score de confiance. Bronze nécessite un score > 300 + 1 transaction, Silver un score > 600 + 5 transactions, et Gold un score > 900 + 10 transactions.',
  },
  {
    question: 'Puis-je retirer mes commissions à tout moment ?',
    answer:
      'Oui, vos commissions sont disponibles sur votre portefeuille AfriBayit et peuvent être retirées à tout moment via nos partenaires de paiement (FedaPay, MTN Mobile Money, Moov Money). Le seuil minimum de retrait est de 5 000 FCFA.',
  },
  {
    question: 'Y a-t-il une limite au nombre de filleuls ?',
    answer:
      "Non, il n'y a aucune limite ! Plus vous parrainez, plus vous gagnez. Certains de nos ambassadeurs ont parrainé plus de 100 utilisateurs et génèrent des revenus significatifs chaque mois.",
  },
];

// ─── FAQ Item Component ─────────────────────────────────────────────────────
function FAQItem({ item, isOpen, onToggle }: { item: typeof faqItems[0]; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#003087]/10"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 sm:p-6 text-left bg-white hover:bg-gray-50/50 transition-colors"
      >
        <span className="font-display text-base sm:text-lg font-semibold text-[#2C2E2F] pr-4">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: easeOut }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#003087]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: easeOut }}
          >
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed font-body">
                {item.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Animated counter ───────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  return (
    <motion.span
      onViewportEnter={() => {
        let start = 0;
        const duration = 2000;
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          start = Math.round(eased * target);
          setCount(start);
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }}
    >
      {count.toLocaleString('fr-FR')}{suffix}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function AmbassadorPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-navy-gradient noise-overlay">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#009CDE]/15 via-transparent to-[#D4AF37]/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#009CDE]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Gold particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="particle-gold particle-gold-1 absolute w-2 h-2 top-[20%] left-[10%]" />
          <div className="particle-gold particle-gold-2 absolute w-1.5 h-1.5 top-[40%] right-[15%]" />
          <div className="particle-gold particle-gold-3 absolute w-2.5 h-2.5 top-[60%] left-[70%]" />
          <div className="particle-gold particle-gold-4 absolute w-1 h-1 top-[80%] left-[30%]" />
          <div className="particle-gold particle-gold-5 absolute w-2 h-2 top-[30%] right-[40%]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: easeOut }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider font-body mb-6">
                <Award className="w-4 h-4" />
                Programme Ambassadeurs
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: easeOut }}
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Programme Ambassadeurs{' '}
              <span className="text-[#D4AF37]">AfriBayit</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
              className="font-body text-lg sm:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed"
            >
              Recommandez. Gagnez. Grandissez avec nous.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45, ease: easeOut }}
              className="flex flex-col sm:flex-row gap-4 items-center"
            >
              <motion.a
                href="/auth/register"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg gold-glow transition-colors font-body"
              >
                Devenir ambassadeur
                <ArrowRight className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm border border-white/20 transition-colors font-body"
              >
                En savoir plus
              </motion.a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: easeOut }}
              className="flex flex-wrap justify-center gap-6 mt-12 text-white/50 text-sm font-body"
            >
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#00A651]" />
                Inscription gratuite
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#00A651]" />
                Paiements sécurisés
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#00A651]" />
                Support dédié
              </span>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. HOW IT WORKS SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#003087]/5 border border-[#003087]/10 text-[#003087] text-xs font-semibold uppercase tracking-wider font-body mb-4">
              <TrendingUp className="w-3.5 h-3.5" />
              Comment ça marche
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              3 étapes pour <span className="text-[#003087]">gagner</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base font-body">
              Un programme simple et transparent. Partagez, parrainez, et gagnez des commissions sur chaque transaction.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-24 left-[20%] right-[20%] border-t-2 border-dashed border-gray-200 z-0" />

            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: easeOut }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="relative z-10 p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:border-[#003087]/10 transition-all duration-300 cursor-pointer group"
                >
                  {/* Step number */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white font-display text-xl font-bold"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-colors"
                    style={{ backgroundColor: `${step.color}10`, color: step.color }}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed font-body">
                    {step.description}
                  </p>

                  {/* Decorative corner */}
                  <div
                    className="absolute top-0 right-0 w-20 h-20 rounded-bl-[3rem] opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(225deg, ${step.color}08, transparent)`,
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. TIER CARDS SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/5 border border-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold uppercase tracking-wider font-body mb-4">
              <Star className="w-3.5 h-3.5" />
              Paliers
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Montez en <span className="text-[#003087]">grade</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-base font-body">
              Plus vous parrainez, plus vos avantages augmentent. Atteignez les paliers supérieurs et débloquez des bénéfices exclusifs.
            </p>
          </motion.div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier, i) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: easeOut }}
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className={cn(
                    'relative rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group',
                    tier.highlighted
                      ? 'border-2 shadow-xl'
                      : 'border border-gray-100 hover:shadow-xl'
                  )}
                  style={{
                    borderColor: tier.highlighted ? tier.colorBorder : undefined,
                  }}
                >
                  {/* Gold glow for highlighted tier */}
                  {tier.highlighted && (
                    <div
                      className="absolute -inset-px rounded-2xl opacity-30 blur-xl pointer-events-none"
                      style={{ backgroundColor: tier.color }}
                    />
                  )}

                  <div className="relative bg-white p-6 sm:p-8 h-full flex flex-col">
                    {/* Top badge for highlighted */}
                    {tier.highlighted && (
                      <div className="absolute top-0 right-0">
                        <div
                          className="px-4 py-1.5 rounded-bl-xl text-white text-xs font-semibold uppercase tracking-wider font-body"
                          style={{ backgroundColor: tier.color }}
                        >
                          Populaire
                        </div>
                      </div>
                    )}

                    {/* Tier icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                      style={{ backgroundColor: tier.colorLight, color: tier.color }}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    {/* Tier name */}
                    <h3
                      className="font-display text-2xl font-bold mb-1"
                      style={{ color: tier.color }}
                    >
                      {tier.name}
                    </h3>

                    {/* Commission */}
                    <div className="mb-5">
                      <span className="font-display text-4xl font-bold text-[#2C2E2F]">
                        {tier.commission}
                      </span>
                      <span className="text-gray-500 text-sm font-body ml-1">commission</span>
                    </div>

                    {/* Requirements badge */}
                    <div
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-5 w-fit font-body"
                      style={{ backgroundColor: tier.colorLight, color: tier.color }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {tier.requirements}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 flex-1 mb-6">
                      {tier.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-3">
                          <Check
                            className="w-4 h-4 mt-0.5 flex-shrink-0"
                            style={{ color: tier.color }}
                          />
                          <span className="text-sm text-gray-600 leading-relaxed font-body">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <motion.a
                      href="/auth/register"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-colors font-body',
                        tier.highlighted
                          ? 'text-white shadow-lg'
                          : 'text-white'
                      )}
                      style={{
                        backgroundColor: tier.color,
                        boxShadow: tier.highlighted
                          ? `0 0 20px ${tier.color}40, 0 0 60px ${tier.color}15`
                          : undefined,
                      }}
                    >
                      Commencer
                      <ArrowRight className="w-4 h-4" />
                    </motion.a>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. STATS SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="relative rounded-2xl overflow-hidden bg-navy-gradient noise-overlay"
          >
            {/* Decorative overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#009CDE]/10 via-transparent to-[#D4AF37]/10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#009CDE]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 p-8 sm:p-12 lg:p-16">
              {/* Section heading */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: easeOut }}
                >
                  <Globe className="w-8 h-8 text-[#D4AF37] mx-auto mb-3" />
                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                    Rejoignez{' '}
                    <span className="text-[#D4AF37]">
                      <AnimatedCounter target={500} suffix="+" />
                    </span>{' '}
                    ambassadeurs
                  </h2>
                  <p className="text-white/70 max-w-xl mx-auto font-body text-base sm:text-lg">
                    dans <span className="text-[#D4AF37] font-semibold">4 pays</span> d&apos;Afrique de l&apos;Ouest
                  </p>
                </motion.div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { value: 500, suffix: '+', label: 'Ambassadeurs actifs', icon: Users },
                  { value: 4, suffix: '', label: 'Pays couverts', icon: Globe },
                  { value: 2500, suffix: '+', label: 'Filleuls parrainés', icon: Users },
                  { value: 15, suffix: 'M+', label: 'FCFA de commissions', icon: TrendingUp },
                ].map((stat, i) => {
                  const StatIcon = stat.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.1, ease: easeOut }}
                      className="glass rounded-2xl p-5 sm:p-6 text-center"
                    >
                      <StatIcon className="w-5 h-5 text-[#D4AF37] mx-auto mb-3" />
                      <div className="font-display text-2xl sm:text-3xl font-bold text-white mb-1">
                        <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                      </div>
                      <div className="text-white/60 text-xs sm:text-sm font-body">
                        {stat.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Country flags / names */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.6, ease: easeOut }}
                className="flex flex-wrap justify-center gap-3 mt-8"
              >
                {['Bénin', 'Côte d\'Ivoire', 'Burkina Faso', 'Togo'].map((country) => (
                  <span
                    key={country}
                    className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm font-body"
                  >
                    {country}
                  </span>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. FAQ SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-white via-gray-50/30 to-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#003087]/5 border border-[#003087]/10 text-[#003087] text-xs font-semibold uppercase tracking-wider font-body mb-4">
              FAQ
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions <span className="text-[#003087]">fréquentes</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-base font-body">
              Tout ce que vous devez savoir sur le Programme Ambassadeurs AfriBayit.
            </p>
          </motion.div>

          {/* FAQ items */}
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <FAQItem
                key={i}
                item={item}
                isOpen={openFAQ === i}
                onToggle={() => setOpenFAQ(openFAQ === i ? null : i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. CTA BOTTOM BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="bg-navy-gradient noise-overlay relative p-8 sm:p-12 lg:p-16">
              {/* Decorative overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#009CDE]/20 via-transparent to-[#D4AF37]/10 pointer-events-none" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#009CDE]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Gold particles */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="particle-gold particle-gold-6 absolute w-2 h-2 top-[25%] left-[80%]" />
                <div className="particle-gold particle-gold-7 absolute w-1.5 h-1.5 top-[65%] left-[15%]" />
                <div className="particle-gold particle-gold-8 absolute w-2 h-2 top-[45%] left-[50%]" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Text */}
                <div className="flex-1 text-center lg:text-left">
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
                    className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
                  >
                    Prêt à faire grandir{' '}
                    <span className="text-[#D4AF37]">AfriBayit</span> ?
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
                    className="text-white/70 max-w-lg font-body text-base sm:text-lg"
                  >
                    Rejoignez notre communauté d&apos;ambassadeurs et commencez à gagner des
                    commissions dès aujourd&apos;hui. L&apos;inscription est gratuite et ne prend que 2 minutes.
                  </motion.p>
                </div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4, ease: easeOut }}
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <motion.a
                    href="/auth/register"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg gold-glow transition-colors font-body"
                  >
                    Devenir ambassadeur
                    <ArrowRight className="w-4 h-4" />
                  </motion.a>
                  <motion.a
                    href="#how-it-works"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold text-sm border border-white/20 transition-colors font-body"
                  >
                    En savoir plus
                  </motion.a>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
