'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  Star,
  Eye
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

// Data must come from the database – no hardcoded fallbacks

export function FeaturedProperties() {
  const { t } = useLanguage()
  const [favorites, setFavorites] = useState<string[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  // Fetch featured properties from API
  useEffect(() => {
    const fetchFeaturedProperties = async () => {
      try {
        const response = await fetch('/api/properties?featured=true&limit=6', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          const apiProps: any[] = data.properties || []
          setProperties(apiProps)
        }
      } catch (error) {
        // On error, do not show any local data for security
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProperties()
  }, [])

  const toggleFavorite = (propertyId: string) => {
    setFavorites(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    )
  }

  const handleShare = (propertyId: string) => {
    // In a real app, this would open a share modal or copy link to clipboard
    if (navigator.share) {
      navigator.share({
        title: 'Propriété AfriBayit',
        text: 'Découvrez cette propriété sur AfriBayit',
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Lien copié dans le presse-papiers!')
    }
  }

  const handleContactAgent = (agentName: string) => {
    // In a real app, this would open a contact modal or navigate to contact page
    alert(`Contacter ${agentName}`)
  }

  const handleViewProperty = (propertyId: string) => {
    // Navigate to property details page
    window.location.href = `/properties/${propertyId}`
  }

  const handleViewAllProperties = () => {
    window.location.href = '/properties'
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {t('property.featured')}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Découvrez nos propriétés sélectionnées avec soin par nos experts
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-64 bg-neutral-200 dark:bg-neutral-700 rounded-t-2xl"></div>
                <div className="p-6">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
                  <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property, index) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group cursor-pointer rounded-3xl overflow-hidden border border-neutral-200 bg-white/70 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300"
                onClick={() => handleViewProperty(property.id)}
              >
                {/* Image Gallery */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={property.images?.[0]?.imageUrl || '/images/placeholders/property.jpg'}
                    alt={property.images?.[0]?.altText || property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-neutral-200"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement
                      const stage = img.getAttribute('data-fallback-stage') || '0'
                      if (stage === '0') {
                        img.setAttribute('data-fallback-stage', '1')
                        img.src = `${property.images?.[0]?.imageUrl || ''}?fallback=1`
                      } else if (stage === '1') {
                        img.setAttribute('data-fallback-stage', '2')
                        img.src = 'https://source.unsplash.com/1200x800/?luxury,real-estate,architecture'
                      } else if (stage === '2') {
                        img.setAttribute('data-fallback-stage', '3')
                        img.src = 'https://images.pexels.com/photos/259950/pexels-photo-259950.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1'
                      }
                    }}
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex space-x-2">
                    {property.isPremium && (
                      <span className="px-3 py-1 bg-primary-600 text-white text-xs font-medium rounded-full">
                        Premium
                      </span>
                    )}
                    {property.isVerified && (
                      <span className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                        Vérifié
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(property.id)
                      }}
                      className={`p-2 rounded-full backdrop-blur-sm transition-colors duration-200 ${favorites.includes(property.id)
                        ? 'bg-red-500 text-white'
                        : 'bg-white/80 text-neutral-700 hover:bg-red-500 hover:text-white'
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(property.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleShare(property.id)
                      }}
                      className="p-2 bg-white/80 text-neutral-700 hover:bg-primary-500 hover:text-white rounded-full backdrop-blur-sm transition-colors duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="absolute bottom-4 left-4">
                    <div className="text-2xl font-bold text-white">
                      {formatPrice(parseFloat(property.price as any), property.currency)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title and Location */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-neutral-500 dark:text-neutral-400 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      {property.location ? `${property.location.city}${property.location.country ? ', ' + property.location.country : ''}` : ''}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-4 line-clamp-2">
                    {property.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(Array.isArray(property.features) ? property.features : []).slice(0, 3).map((feature: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs rounded-md"
                      >
                        {feature}
                      </span>
                    ))}
                    {(Array.isArray(property.features) && property.features.length > 3) && (
                      <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs rounded-md">
                        +{(property.features as any).length - 3} autres
                      </span>
                    )}
                  </div>

                  {/* Property Details */}
                  <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    <div className="flex items-center space-x-4">
                      {property.bedrooms !== null && property.bedrooms !== undefined && (
                        <div className="flex items-center">
                          <Bed className="w-4 h-4 mr-1" />
                          {property.bedrooms}
                        </div>
                      )}
                      {property.bathrooms !== null && property.bathrooms !== undefined && (
                        <div className="flex items-center">
                          <Bath className="w-4 h-4 mr-1" />
                          {property.bathrooms}
                        </div>
                      )}
                      {property.parkingSpaces !== null && property.parkingSpaces !== undefined && (
                        <div className="flex items-center">
                          <Car className="w-4 h-4 mr-1" />
                          {property.parkingSpaces}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Ruler className="w-4 h-4 mr-1" />
                        {property.surfaceArea ?? '-'}m²
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {property.viewsCount}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {property.favoritesCount}
                      </div>
                    </div>
                  </div>

                  {/* Agent */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={property.owner?.avatarUrl || '/images/avatars/default.jpg'}
                        alt={`${property.owner?.firstName || ''} ${property.owner?.lastName || ''}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {`${property.owner?.firstName || ''} ${property.owner?.lastName || ''}`.trim()}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Agent immobilier
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleContactAgent(`${property.owner?.firstName || ''} ${property.owner?.lastName || ''}`.trim())
                      }}
                      size="sm"
                      className="text-xs"
                    >
                      Contacter
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-600 dark:text-neutral-400">
              Aucune propriété disponible pour le moment.
            </p>
          </div>
        )}

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12"
        >
          <Button
            onClick={handleViewAllProperties}
            size="lg"
            className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Voir toutes les propriétés
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
