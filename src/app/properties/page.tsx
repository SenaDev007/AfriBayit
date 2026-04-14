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

type PropertyFilters = {
  city: string
  type: string
  minPrice: string
  maxPrice: string
  bedrooms: string
  bathrooms: string
  featured: boolean
  sort: string
}

type Pagination = {
  page: number
  limit: number
  total: number
  pages: number
  hasMore: boolean
}

export default function PropertiesPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 24,
    total: 0,
    pages: 1,
    hasMore: false
  })
  const [filters, setFilters] = useState<PropertyFilters>({
    city: '',
    type: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: '',
    featured: false,
    sort: 'newest'
  })

  const fetchProperties = async (nextPage = 1, overrideCity?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '24')
      params.set('page', String(nextPage))
      params.set('sort', filters.sort)
      const cityValue = overrideCity ?? filters.city
      if (cityValue) params.set('city', cityValue)
      if (filters.type) params.set('type', filters.type)
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.bedrooms) params.set('bedrooms', filters.bedrooms)
      if (filters.bathrooms) params.set('bathrooms', filters.bathrooms)
      if (filters.featured) params.set('featured', 'true')

      const response = await fetch(`/api/properties?${params.toString()}`, {
        cache: 'no-store'
      })
      const data = await response.json()
      setProperties(data.properties || [])
      setPagination(data.pagination || { page: 1, limit: 24, total: 0, pages: 1, hasMore: false })
      setPage(nextPage)
    } catch (error) {
      console.error('Properties page fetch error:', error)
      setProperties([])
      setPagination({ page: 1, limit: 24, total: 0, pages: 1, hasMore: false })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const initialSearch = urlParams.get('search') || ''
    setQuery(initialSearch)
    setFilters((prev) => ({ ...prev, city: initialSearch }))
    fetchProperties(1, initialSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (value: string) => {
    setQuery(value)
    setFilters((prev) => ({ ...prev, city: value }))
    fetchProperties(1, value)
  }

  const applyFilters = () => {
    fetchProperties(1)
  }

  const goToPage = (nextPage: number) => {
    fetchProperties(nextPage)
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <section className="pt-32 pb-16 bg-[linear-gradient(135deg,#003087_0%,#001F5B_70%)]">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Recherche & résultats immobiliers
            </h1>
            <p className="text-xl text-white/85 mb-8">
              Biens vérifiés, tri multi-critères, parcours sécurisé et conformité légale.
            </p>
            <div className="max-w-2xl mx-auto rounded-[24px] bg-white/10 border border-white/20 p-4">
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
          <div className="mb-8 rounded-[24px] bg-white border border-[#003087]/10 p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 shadow-sm">
            <select
              value={filters.type}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Tous les types</option>
              <option value="VILLA">Villa</option>
              <option value="APARTMENT">Appartement</option>
              <option value="LAND">Terrain</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
              placeholder="Prix min"
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
              placeholder="Prix max"
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            />
            <select
              value={filters.sort}
              onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="newest">Plus récents</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="popular">Plus populaires</option>
            </select>
            <select
              value={filters.bedrooms}
              onChange={(e) => setFilters((prev) => ({ ...prev, bedrooms: e.target.value }))}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Chambres</option>
              <option value="1">1 chambre</option>
              <option value="2">2 chambres</option>
              <option value="3">3 chambres</option>
              <option value="4">4+ chambres</option>
            </select>
            <select
              value={filters.bathrooms}
              onChange={(e) => setFilters((prev) => ({ ...prev, bathrooms: e.target.value }))}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Salles de bain</option>
              <option value="1">1 salle de bain</option>
              <option value="2">2 salles de bain</option>
              <option value="3">3+ salles de bain</option>
            </select>
            <label className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) => setFilters((prev) => ({ ...prev, featured: e.target.checked }))}
              />
              Biens premium
            </label>
            <button
              onClick={applyFilters}
              className="rounded-xl bg-[#003087] hover:bg-[#00266e] text-white px-4 py-2 text-sm font-medium"
            >
              Appliquer les filtres
            </button>
          </div>

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
                  className="group bg-white border border-[#003087]/10 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-52 bg-neutral-100 overflow-hidden">
                    <img
                      src={property.images?.[0]?.imageUrl || '/images/placeholders/property.jpg'}
                      alt={property.images?.[0]?.altText || property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h2 className="font-semibold text-lg text-neutral-900 mb-2 line-clamp-1">
                      {property.title}
                    </h2>
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                      {property.description}
                    </p>
                    <p className="text-[#003087] text-xl font-bold mb-2">
                      {formatPrice(parseFloat(property.price as unknown as string), property.currency)}
                    </p>
                    <div className="flex items-center text-sm text-neutral-500">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location?.city || 'Ville non renseignee'}
                      {property.location?.country ? `, ${property.location.country}` : ''}
                    </div>
                    <div className="mt-3 inline-flex items-center rounded-full bg-[#D4AF37]/20 text-[#7f6511] px-3 py-1 text-xs font-medium">
                      Escrow & KYC compatibles
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {!loading && pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                onClick={() => goToPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-neutral-600">
                Page {page} / {pagination.pages}
              </span>
              <button
                onClick={() => goToPage(Math.min(pagination.pages, page + 1))}
                disabled={page >= pagination.pages}
                className="px-4 py-2 rounded-lg border border-neutral-300 bg-white disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          )}
          {!loading && properties.length < 10 && (
            <p className="mt-6 text-sm text-neutral-500 text-center">
              Données BDD disponibles: {properties.length} biens affichés (objectif 10+).
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
