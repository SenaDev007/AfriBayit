'use client'

import { useEffect, useState } from 'react'
import { Hammer } from 'lucide-react'

type Artisan = {
  id: string
  fullName: string
  specialty: string
  city: string
  rating: number
  verified: boolean
}

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/artisans')
      const data = await res.json()
      setArtisans(data.artisans || [])
    }
    load()
  }, [])

  return (
    <main className="min-h-screen pt-28 pb-12 bg-neutral-50 dark:bg-neutral-900">
      <div className="container-custom">
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-8">
          Marketplace Artisans
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {artisans.map((artisan) => (
            <div key={artisan.id} className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{artisan.fullName}</h2>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">{artisan.specialty} - {artisan.city}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                Note: {artisan.rating} / 5 {artisan.verified ? '• Verifie' : ''}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
