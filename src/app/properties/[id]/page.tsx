'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { MapPin, Phone, User2 } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { formatPrice } from '@/lib/utils'

type PropertyDetail = {
  id: string
  title: string
  description: string
  price: string
  currency: string
  propertyType: string
  bedrooms?: number | null
  bathrooms?: number | null
  surfaceArea?: string | null
  location?: {
    city?: string
    country?: string
    address?: string
  }
  images?: Array<{ imageUrl: string; altText?: string }>
  owner?: {
    id?: string
    firstName?: string | null
    lastName?: string | null
    phone?: string | null
  }
}

export default function PropertyDetailPage() {
  const { user } = useAuth()
  const params = useParams<{ id: string }>()
  const [property, setProperty] = useState<PropertyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [txMessage, setTxMessage] = useState('')
  const [isCreatingTx, setIsCreatingTx] = useState(false)

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params.id}`, { cache: 'no-store' })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Erreur de chargement')
        }

        setProperty(data.property)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProperty()
    }
  }, [params.id])

  if (loading) {
    return <main className="min-h-screen pt-28 container-custom">Chargement...</main>
  }

  if (error || !property) {
    return (
      <main className="min-h-screen pt-28 container-custom">
        <p className="text-red-600 mb-4">{error || 'Propriete introuvable'}</p>
        <Link href="/properties" className="text-primary-600">Retour aux proprietes</Link>
      </main>
    )
  }

  const handleStartTransaction = async () => {
    if (!user?.id || !property.owner?.id) {
      setTxMessage('Connecte-toi pour demarrer une transaction.')
      return
    }

    try {
      setIsCreatingTx(true)
      setTxMessage('')
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: property.owner.id,
          amount: Number(property.price),
          currency: property.currency,
          type: 'PROPERTY_SALE'
        })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Impossible de creer la transaction')
      }
      setTxMessage(`Transaction creee: ${data.transaction.id}`)
    } catch (e) {
      setTxMessage(e instanceof Error ? e.message : 'Erreur transaction')
    } finally {
      setIsCreatingTx(false)
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-900 pt-28 pb-12">
      <div className="container-custom">
        <Link href="/properties" className="text-primary-600 text-sm">Retour aux proprietes</Link>

        <section className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="h-[420px] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-700">
              <img
                src={property.images?.[0]?.imageUrl || '/images/placeholders/property.jpg'}
                alt={property.images?.[0]?.altText || property.title}
                className="w-full h-full object-cover"
              />
            </div>

            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-6 mb-3">
              {property.title}
            </h1>

            <p className="text-neutral-700 dark:text-neutral-300 mb-6">{property.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500">Type</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{property.propertyType}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500">Chambres</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{property.bedrooms ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500">Salles de bain</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{property.bathrooms ?? '-'}</p>
              </div>
              <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                <p className="text-xs text-neutral-500">Surface</p>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{property.surfaceArea ?? '-'} m2</p>
              </div>
            </div>
          </div>

          <aside className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 h-fit shadow-sm">
            <p className="text-3xl font-bold text-primary-600 mb-4">
              {formatPrice(parseFloat(property.price as unknown as string), property.currency)}
            </p>

            <div className="flex items-start text-sm text-neutral-600 dark:text-neutral-300 mb-6">
              <MapPin className="w-4 h-4 mr-2 mt-0.5" />
              <span>
                {property.location?.address || ''}
                {property.location?.city ? `, ${property.location.city}` : ''}
                {property.location?.country ? `, ${property.location.country}` : ''}
              </span>
            </div>

            <div className="rounded-xl bg-neutral-50 dark:bg-neutral-700/30 p-4">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Agent</p>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                <User2 className="w-4 h-4" />
                {(property.owner?.firstName || '') + ' ' + (property.owner?.lastName || '')}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <Phone className="w-4 h-4" />
                {property.owner?.phone || 'Contact indisponible'}
              </div>
            </div>

            <button
              onClick={handleStartTransaction}
              disabled={isCreatingTx}
              className="w-full mt-4 px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium"
            >
              {isCreatingTx ? 'Creation...' : 'Initier transaction'}
            </button>
            {txMessage && (
              <p className="mt-3 text-sm text-primary-600">{txMessage}</p>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}
