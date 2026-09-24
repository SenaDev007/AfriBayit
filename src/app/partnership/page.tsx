'use client';

import { motion } from 'framer-motion';
import { Handshake, Mail, Phone, ArrowRight, Building, Hotel, Wrench, Users } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface PartnerType {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  benefits: string[];
}

const PARTNER_TYPES: PartnerType[] = [
  {
    icon: Building,
    title: 'Agences immobilières',
    desc: "Diffusez vos annonces sur AfriBayit et touchez des milliers d'acheteurs certifiés.",
    benefits: ['Visibilité multi-pays', 'Escrow sécurisé', 'Analytics avancés', 'Support dédié'],
  },
  {
    icon: Hotel,
    title: 'Hôtels & Guesthouses',
    desc: 'Rejoignez le réseau AfriBayit Hospitality avec PMS intégré et distribution OTA.',
    benefits: ['PMS gratuit Phase 1', 'Channel Manager', 'Mobile Money', 'Commission directe'],
  },
  {
    icon: Wrench,
    title: 'Artisans BTP',
    desc: 'Inscrivez-vous comme artisan certifié et recevez des missions près de chez vous.',
    benefits: ['Badge certifié', 'Missions automatiques', 'Paiement escrow', 'Portfolio en ligne'],
  },
  {
    icon: Users,
    title: 'Notaires & Géomètres',
    desc: 'Devenez partenaire officiel AfriBayit pour les transactions et certifications.',
    benefits: ['Clients qualifiés', 'Outils numériques', 'Signature électronique', 'Réputation en ligne'],
  },
];

export default function PartnershipPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero — P6 */}
      <section className="bg-primary-deep text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Handshake className="w-12 h-12 mx-auto mb-4 text-accent-yellow" />
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {t('partnershipPage.heroTitle', 'Devenir partenaire')}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto mt-4 text-base">
            {t(
              'partnershipPage.heroDesc',
              "Rejoignez l'écosystème AfriBayit et développez votre activité en Afrique de l'Ouest. Plus de 18 000 utilisateurs vous attendent."
            )}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Partner types */}
      <section className="py-16 sm:py-20 bg-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PARTNER_TYPES.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                  className="bg-white rounded-3xl p-8 shadow-lg border border-primary-pale"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-pale flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 text-primary-green" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-primary-deep mb-1">
                        {p.title}
                      </h3>
                      <p className="text-sm text-gray-text">{p.desc}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {p.benefits.map((b, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-text">
                        <svg
                          className="w-4 h-4 text-primary-green shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="mailto:contact@afribayit.com?subject=Partenariat"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-green hover:bg-primary-deep text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                  >
                    {t('partnershipPage.contactButton', 'Nous contacter')}{' '}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Question / contact */}
      <section className="py-16 sm:py-20 bg-primary-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-white mb-4">
            {t('partnershipPage.questionTitle', 'Une question sur le partenariat ?')}
          </h2>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 mb-8 rounded-full" />
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <a
              href="mailto:contact@afribayit.com"
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-deep rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Mail className="w-4 h-4" /> {t('partnershipPage.emailButton', 'Email')}
            </a>
            <a
              href="tel:+22997000000"
              className="flex items-center gap-2 px-6 py-3 bg-accent-yellow text-primary-deep rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all"
            >
              <Phone className="w-4 h-4" /> {t('partnershipPage.callButton', 'Appeler')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
