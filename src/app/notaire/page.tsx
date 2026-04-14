'use client'

import { motion } from 'framer-motion'
import { FileCheck2, Landmark, PenSquare, ShieldAlert, ArrowRightCircle } from 'lucide-react'

const steps = [
  {
    title: 'Constitution du dossier',
    detail: 'Collecte des pièces vendeur/acquéreur, vérification identité, conformité des titres.',
    icon: FileCheck2
  },
  {
    title: 'Contrôle notarial',
    detail: 'Contrôle anti-fraude, situation hypothécaire et conformité réglementaire locale.',
    icon: Landmark
  },
  {
    title: 'Signature acte',
    detail: 'Signature électronique ou présentielle avant déclenchement de libération escrow.',
    icon: PenSquare
  },
  {
    title: 'Gestion litige',
    detail: 'Escalade en cas d’anomalie avec traçabilité complète et arbitrage administrateur.',
    icon: ShieldAlert
  }
]

export default function NotairePage() {
  return (
    <main className="min-h-screen bg-[#F7F9FC] pt-28 pb-14">
      <section className="container-custom">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#003087_0%,#001F5B_75%)] p-8 md:p-12 text-white">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs tracking-[0.06em]">
            <Landmark className="w-3.5 h-3.5 text-[#D4AF37]" />
            MODULE NOTAIRE & ESCROW
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mt-4">Espace notaire</h1>
          <p className="text-white/85 mt-4 max-w-3xl">
            Pilotage des transactions légales avec checkpoints notariaux, signature d’acte et
            condition de libération sécurisée des fonds.
          </p>
        </div>
      </section>

      <section className="container-custom mt-8">
        <div className="rounded-2xl bg-white border border-[#003087]/10 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-[#003087]">Workflow notarial CDC</h2>
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className="rounded-xl border border-[#003087]/10 p-4 md:p-5 bg-[#003087]/[0.03]"
              >
                <div className="flex items-start gap-3">
                  <step.icon className="w-5 h-5 text-[#003087] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-neutral-900">{step.title}</h3>
                    <p className="text-neutral-600 mt-1">{step.detail}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-white border border-[#003087]/10 p-6 md:p-8">
          <h3 className="text-xl font-semibold text-[#003087]">Actions rapides notaire</h3>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <button className="rounded-xl border border-[#003087]/20 px-4 py-3 text-left hover:bg-[#003087]/5 transition-colors">
              Vérifier dossier en attente
            </button>
            <button className="rounded-xl border border-[#003087]/20 px-4 py-3 text-left hover:bg-[#003087]/5 transition-colors">
              Générer minute d’acte
            </button>
            <button className="rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/20 px-4 py-3 text-left text-[#7f6511] inline-flex items-center gap-2">
              Déclencher validation escrow <ArrowRightCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
