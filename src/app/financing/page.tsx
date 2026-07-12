'use client';

import FinancingSimulator from '@/components/afribayit/FinancingSimulator';


export default function FinancingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003087]/5 via-white to-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0 bg-navy-gradient opacity-95" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Simulateur de <span className="text-[#D4AF37]">Financement</span>
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto font-body">
            Estimez vos mensualités et trouvez le crédit immobilier adapté à votre budget dans 4 pays d&apos;Afrique de l&apos;Ouest.
          </p>
        </div>
      </section>

      {/* Simulator */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 -mt-8 relative z-10 pb-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <FinancingSimulator />
        </div>
      </section>

      {/* Info section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-lg bg-[#003087]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0a2a5e]">Taux par pays</h3>
            <p className="mt-2 text-sm text-gray-500 font-body">Taux d&apos;intérêt actualisés pour le Bénin, Côte d&apos;Ivoire, Burkina Faso et Togo</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0a2a5e]">Simulation gratuite</h3>
            <p className="mt-2 text-sm text-gray-500 font-body">Estimation instantanée sans engagement, compatible Mobile Money et virement bancaire</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
            <div className="w-12 h-12 rounded-lg bg-[#00A651]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-[#0a2a5e]">Banques partenaires</h3>
            <p className="mt-2 text-sm text-gray-500 font-body">BOA, SGBCI, Ecobank et plus — contacts directs pour votre demande de crédit</p>
          </div>
        </div>
      </section>
    </div>
  );
}
