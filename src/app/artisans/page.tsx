'use client'

import { useEffect, useState } from 'react'
import { Hammer, ShieldCheck, MapPin, Star, FileText, Wrench } from 'lucide-react'

type Artisan = {
  id: string
  fullName: string
  specialty: string
  city: string
  rating: number
  verified: boolean
  services?: string[]
}

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/artisans?limit=10', { cache: 'no-store' })
        const data = await res.json()
        setArtisans(data.artisans || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main className="min-h-screen pt-28 pb-12 bg-[#F7F9FC]">
      <div className="container-custom">
        <section className="rounded-3xl bg-[linear-gradient(135deg,#003087_0%,#001F5B_75%)] px-6 py-10 md:px-10 md:py-14 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Marketplace Artisans BTP
          </h1>
          <p className="text-white/85 max-w-3xl">
            Référencement certifié des corps de métier BTP africains: profils vérifiés, spécialités,
            localisation, notation qualité et demandes de devis.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white text-sm inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" /> Vérification KYC prestataire
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white text-sm inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#D4AF37]" /> Demande de devis structurée
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white text-sm inline-flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#D4AF37]" /> Spécialités BTP locales
            </div>
          </div>
        </section>

        {loading ? (
          <div className="py-16 text-center text-neutral-600">Chargement des artisans...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {artisans.map((artisan) => (
            <div key={artisan.id} className="bg-white rounded-2xl border border-[#003087]/10 p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Hammer className="w-5 h-5 text-[#003087]" />
                  <h2 className="font-semibold text-neutral-900">{artisan.fullName}</h2>
                </div>
                {artisan.verified && (
                  <span className="inline-flex items-center gap-1 text-xs rounded-full bg-[#00A651]/15 text-[#0b7f44] px-2.5 py-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Vérifié
                  </span>
                )}
              </div>
              <p className="text-sm text-neutral-700">{artisan.specialty}</p>
              <p className="text-sm text-neutral-500 mt-1 inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {artisan.city}
              </p>
              <p className="text-sm text-neutral-500 mt-2 inline-flex items-center gap-1">
                <Star className="w-4 h-4 text-[#D4AF37]" /> {artisan.rating} / 5
              </p>
              {artisan.services && artisan.services.length > 0 && (
                <p className="text-sm text-neutral-500 mt-2">
                  Services: {artisan.services.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
        )}
        {!loading && artisans.length < 10 && (
          <p className="mt-6 text-sm text-neutral-500">
            Données BDD disponibles: {artisans.length} artisans affichés (objectif 10+).
          </p>
        )}
      </div>
    </main>
  )
}
