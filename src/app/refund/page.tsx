'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface Policy {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
  title: string;
  text: string;
}

const POLICIES: Policy[] = [
  {
    icon: CheckCircle,
    color: '#009CDE',
    title: 'Transactions immobilières',
    text: "Remboursement intégral si le bien s'avère non conforme aux documents légaux vérifiés par AfriBayit. Délai : 30 jours après signature.",
  },
  {
    icon: Clock,
    color: '#009CDE',
    title: 'Réservations hôtelières',
    text: "Annulation gratuite jusqu'à 24h avant check-in (politique flexible). Remboursement sous 5-7 jours ouvrés via Mobile Money ou carte.",
  },
  {
    icon: AlertCircle,
    color: '#D4AF37',
    title: 'Missions artisans',
    text: "Si l'artisan ne complète pas la mission, l'escrow est remboursé intégralement au client. Commission AfriBayit non prélevée.",
  },
  {
    icon: Shield,
    color: '#003087',
    title: 'Escrow Sécurisé',
    text: "Tous les fonds en escrow sont protégés. En cas de litage, le Service Arbitrage AfriBayit statue sous 72h avec remboursement si nécessaire.",
  },
];

interface Step {
  step: number;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    step: 1,
    title: 'Soumettre la demande',
    text: 'Contactez le support via le Centre d\'aide ou email avec les détails de la transaction.',
  },
  {
    step: 2,
    title: 'Vérification',
    text: "Notre équipe vérifie les éléments sous 48h et confirme l'éligibilité au remboursement.",
  },
  {
    step: 3,
    title: 'Remboursement',
    text: 'Le remboursement est effectué sous 5-7 jours ouvrés via le même canal de paiement.',
  },
];

export default function RefundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero — P6 */}
      <section className="bg-primary-deep text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-accent-yellow" />
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-white leading-tight">
            {t('refundPage.heroTitle', 'Politique de remboursement')}
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto mt-4 text-base">
            {t(
              'refundPage.heroDesc',
              'Votre confiance est notre priorité. AfriBayit garantit des remboursements transparents et rapides pour toutes les transactions sécurisées par escrow.'
            )}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Policies */}
      <section className="py-16 sm:py-20 bg-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {POLICIES.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                  className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-primary-pale"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        i % 2 === 0 ? 'bg-primary-pale' : 'bg-accent-yellow/15'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          i % 2 === 0 ? 'text-primary-green' : 'text-accent-dark'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-primary-deep mb-1">{p.title}</h3>
                      <p className="text-sm text-gray-text leading-relaxed">{p.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 sm:py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
              {t('refundPage.stepsBadge', 'Procédure')}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
              {t('refundPage.stepsTitle', 'Comment se faire rembourser ?')}
            </h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-primary-pale border border-primary-green/20">
                  <span className="text-xl font-bold text-primary-deep">
                    {s.step}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-primary-deep mb-2">{s.title}</h3>
                <p className="text-sm text-gray-text">{s.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
