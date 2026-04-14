'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Counter } from '@/components/ui/Counter'

const stats = [
  {
    number: 12400,
    suffix: '+',
    label: 'Biens vérifiés',
    description: 'Annonces qualifiées avec contrôles documentaires et géographiques',
    color: 'from-[#003087] to-[#009CDE]'
  },
  {
    number: 4920,
    suffix: '',
    label: 'Transactions sécurisées',
    description: 'Parcours sous gouvernance escrow avec checkpoints notariaux',
    color: 'from-[#00A651] to-[#0b7f44]'
  },
  {
    number: 96,
    suffix: '%',
    label: 'Dossiers conformes',
    description: 'Taux de complétude KYC/KYB avant engagement contractuel',
    color: 'from-[#D4AF37] to-[#b8932c]'
  },
  {
    number: 48,
    suffix: '+',
    label: 'Heures gagnées / dossier',
    description: 'Réduction moyenne des délais grâce à l\'orchestration digitale',
    color: 'from-[#2C2E2F] to-[#101112]'
  }
]

export function StatsSection() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
    rootMargin: '-50px 0px'
  })

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-primary-50/60 via-white to-accent-50/60 text-neutral-900 overflow-hidden relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.06) 1px, transparent 0)`,
          backgroundSize: '22px 22px'
        }} />
      </div>
      {/* Marble texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />
      {/* Soft brand tint corners */}
      <div className="absolute -top-24 -left-24 w-[32rem] h-[32rem] bg-gradient-to-br from-primary-200/60 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-[32rem] h-[32rem] bg-gradient-to-tl from-accent-200/60 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-neutral-900">
              Indicateurs de confiance AfriBayit
            </h2>
            <p className="text-xl text-neutral-600 leading-relaxed">
              Pilotage CDC orienté conformité, performance opérationnelle et sécurité transactionnelle.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="relative rounded-3xl bg-white/80 backdrop-blur-xl border border-neutral-200/80 shadow-xl hover:shadow-2xl transition-all duration-300">
                {/* Background Circle */}
                <div className={`absolute -inset-1 bg-gradient-to-br ${stat.color} rounded-3xl opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

                {/* Content */}
                <div className="relative p-8">
                  <div className="text-5xl md:text-6xl font-bold mb-4 text-neutral-900">
                    <Counter
                      end={stat.number}
                      suffix={stat.suffix}
                      duration={2.5}
                      delay={index * 0.15}
                      trigger={inView}
                    />
                  </div>

                  <h3 className="text-2xl font-semibold mb-3 text-neutral-900">
                    {stat.label}
                  </h3>

                  <p className="text-neutral-700 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-white/70 border border-neutral-200 backdrop-blur-md rounded-full px-6 py-3 shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-neutral-700">Supervision active 24/7 avec journal d’audit enrichi</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
