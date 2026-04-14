'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, MapPinned, FileSearch, Radar, CheckCircle2 } from 'lucide-react'

const checks = [
  {
    title: 'Concordance cadastrale',
    detail: 'Validation des références foncières et parcelles officielles.'
  },
  {
    title: 'Risque géographique',
    detail: 'Analyse zone inondable, exposition urbaine et servitudes.'
  },
  {
    title: 'Confiance adresse',
    detail: 'Vérification de cohérence adresse, ville, pays et coordonnées.'
  },
  {
    title: 'Score GeoTrust',
    detail: 'Indice synthétique pour prioriser les biens sûrs.'
  }
]

export default function GeoTrustPage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] pt-28 pb-14">
      <section className="container-custom">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#003087_0%,#001F5B_75%)] p-8 md:p-12 text-white">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs tracking-[0.06em]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            MODULE CONFIANCE
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mt-4">GeoTrust</h1>
          <p className="text-white/85 mt-4 max-w-3xl">
            Moteur de vérification géospatiale pour sécuriser la qualité des annonces, réduire le risque
            juridique et fiabiliser l'achat immobilier.
          </p>
        </div>
      </section>

      <section className="container-custom mt-8">
        <div className="grid md:grid-cols-2 gap-6">
          {checks.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="rounded-2xl bg-white border border-[#003087]/10 p-6"
            >
              <h2 className="text-xl font-semibold text-[#003087]">{item.title}</h2>
              <p className="text-neutral-600 mt-2">{item.detail}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white border border-[#003087]/10 p-6 md:p-8">
          <h3 className="text-2xl font-semibold text-[#003087]">Pipeline de contrôle GeoTrust</h3>
          <div className="grid md:grid-cols-4 gap-4 mt-5">
            <div className="rounded-xl bg-[#003087]/5 p-4">
              <MapPinned className="w-6 h-6 text-[#003087]" />
              <p className="font-medium mt-3">Géolocalisation</p>
            </div>
            <div className="rounded-xl bg-[#003087]/5 p-4">
              <FileSearch className="w-6 h-6 text-[#003087]" />
              <p className="font-medium mt-3">Analyse documentaire</p>
            </div>
            <div className="rounded-xl bg-[#003087]/5 p-4">
              <Radar className="w-6 h-6 text-[#003087]" />
              <p className="font-medium mt-3">Scoring de risque</p>
            </div>
            <div className="rounded-xl bg-[#00A651]/10 p-4">
              <CheckCircle2 className="w-6 h-6 text-[#00A651]" />
              <p className="font-medium mt-3">Validation finale</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
