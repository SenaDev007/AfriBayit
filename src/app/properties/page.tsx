'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { SearchBar } from '@/components/ui/SearchBar'
import { formatPrice } from '@/lib/utils'

type Property = {
  id: string
  title: string
  price: string
  currency: string
  description: string
  propertyType: string
  location?: {
    city?: string
    country?: string
  }
  images?: Array<{
    imageUrl: string
    altText?: string
  }>
}

export default function PropertiesPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProperties = async (city?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '24')
      if (city) params.set('city', city)

      const response = await fetch(`/api/properties?${params.toString()}`, {
        cache: 'no-store'
      })
      const data = await response.json()
      setProperties(data.properties || [])
    } catch (error) {
      console.error('Properties page fetch error:', error)
      setProperties([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const initialSearch = urlParams.get('search') || ''
    setQuery(initialSearch)
    fetchProperties(initialSearch)
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    fetchProperties(value)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <section className="pt-32 pb-16 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              <span className="text-gradient">{t('nav.properties')}</span>
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8">
              Decouvrez des biens verifies et compares en temps reel.
            </p>
            <div className="max-w-2xl mx-auto">
              <SearchBar
                placeholder="Rechercher par ville ou quartier..."
                onSearch={handleSearch}
                className="text-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-custom">
          {loading ? (
            <div className="text-center py-16 text-neutral-600 dark:text-neutral-300">
              Chargement des proprietes...
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-14 h-14 text-neutral-400 mx-auto mb-3" />
              <p className="text-neutral-600 dark:text-neutral-300">
                Aucune propriete trouvee{query ? ` pour "${query}"` : ''}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="h-52 bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
                    <img
                      src={property.images?.[0]?.imageUrl || '/images/placeholders/property.jpg'}
                      alt={property.images?.[0]?.altText || property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-1">
                      {property.title}
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mb-3">
                      {property.description}
                    </p>
                    <p className="text-primary-600 text-xl font-bold mb-2">
                      {formatPrice(parseFloat(property.price as unknown as string), property.currency)}
                    </p>
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location?.city || 'Ville non renseignee'}
                      {property.location?.country ? `, ${property.location.country}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
