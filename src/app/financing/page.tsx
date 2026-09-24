'use client';

import FinancingSimulator from '@/components/afribayit/FinancingSimulator';
import { useTranslation } from '@/lib/i18n/use-translate';


export default function FinancingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero — P6 */}
      <section className="bg-primary-deep text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-accent-yellow text-xs font-bold uppercase tracking-wider mb-4">
            {t('financingPage.heroBadge', 'Crédit immobilier')}
          </div>
          <h1 className="font-serif text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {t('financingPage.titlePre', 'Simulateur de')}{' '}
            <span className="text-accent-yellow">
              {t('financingPage.titleHighlight', 'Financement')}
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto font-body">
            {t(
              'financingPage.subtitle',
              "Estimez vos mensualités et trouvez le crédit immobilier adapté à votre budget dans 4 pays d'Afrique de l'Ouest."
            )}
          </p>
          <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
        </div>
      </section>

      {/* Simulator */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 -mt-8 relative z-10 pb-16">
        <div className="bg-white rounded-3xl shadow-xl border border-primary-pale p-6 sm:p-8">
          <FinancingSimulator />
        </div>
      </section>

      {/* Info section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 border border-primary-pale shadow-lg text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-pale flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-deep">
              {t('financingPage.card1Title', 'Taux par pays')}
            </h3>
            <p className="mt-2 text-sm text-gray-text font-body">
              {t(
                'financingPage.card1Desc',
                "Taux d'intérêt actualisés pour le Bénin, Côte d'Ivoire, Burkina Faso et Togo"
              )}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-primary-pale shadow-lg text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-yellow/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-deep">
              {t('financingPage.card2Title', 'Simulation gratuite')}
            </h3>
            <p className="mt-2 text-sm text-gray-text font-body">
              {t(
                'financingPage.card2Desc',
                'Estimation instantanée sans engagement, compatible Mobile Money et virement bancaire'
              )}
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 border border-primary-pale shadow-lg text-center">
            <div className="w-12 h-12 rounded-2xl bg-primary-pale flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-primary-deep">
              {t('financingPage.card3Title', 'Banques partenaires')}
            </h3>
            <p className="mt-2 text-sm text-gray-text font-body">
              {t(
                'financingPage.card3Desc',
                'BOA, SGBCI, Ecobank et plus — contacts directs pour votre demande de crédit'
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
