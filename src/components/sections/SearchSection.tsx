'use client'

import { motion } from 'framer-motion'
import { Search, MapPin, Home, Filter, Sparkles, TrendingUp, Zap, Globe, Shield, Clock, TrendingDown, Users, Award } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const searchFeatures = [
  {
    icon: Sparkles,
    title: 'Recherche Conversationnelle IA',
    description: 'Trouvez votre propriété idéale en parlant naturellement avec notre IA avancée qui comprend le contexte et vos préférences',
    color: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10'
  },
  {
    icon: MapPin,
    title: 'Géolocalisation Intelligente',
    description: 'Carte interactive avec clustering avancé pour localiser précisément les meilleures opportunités immobilières en Afrique',
    color: 'from-emerald-500 to-emerald-600',
    bgGradient: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/10'
  },
  {
    icon: Home,
    title: 'Visites Virtuelles Immersives',
    description: 'Explorez les propriétés en 360° et réalité augmentée depuis votre navigateur, sans vous déplacer',
    color: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10'
  },
  {
    icon: TrendingUp,
    title: 'Analyse Prédictive du Marché',
    description: 'Données en temps réel et prédictions avancées sur les prix, tendances et opportunités d\'investissement immobilier',
    color: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10'
  }
]

const benefits = [
  {
    icon: Zap,
    text: 'Résultats Instantanés',
    color: 'text-yellow-500'
  },
  {
    icon: Shield,
    text: 'Données Vérifiées',
    color: 'text-green-500'
  },
  {
    icon: Clock,
    text: 'Recherche 24/7',
    color: 'text-blue-500'
  },
  {
    icon: Users,
    text: 'Support Expert',
    color: 'text-purple-500'
  }
]

const popularSearches = [
  'Villa luxe Cocody',
  'Appartement moderne Plateau',
  'Terrain constructible Yopougon',
  'Maison Riviera 5 pièces',
  'Bureau commercial Abidjan',
  'Commerce populaire Marcory',
  'Studio meublé Treichville',
  'Villa piscine Zone 4'
]

export function SearchSection() {
  const { t } = useLanguage()
  const router = useRouter()

  const handleStartSearch = () => {
    router.push('/properties')
  }

  return (
    <section className="py-24 bg-gradient-to-b from-neutral-50 via-white to-white dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-900 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-100/30 to-transparent dark:from-primary-900/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-accent-100/30 to-transparent dark:from-accent-900/10 blur-3xl rounded-full" />
      </div>

      <div className="container-custom relative z-10">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-full text-sm font-medium mb-6 shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span>Technologie IA Avancée</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Recherche Immobilière
              </span>
              <br />
              <span className="text-neutral-900 dark:text-neutral-100">
                Par Intelligence Artificielle
              </span>
            </h2>

            <p className="text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl mx-auto mb-8">
              Découvrez des milliers de propriétés en Afrique avec notre moteur de recherche intelligent. IA conversationnelle, visites virtuelles 360° et données en temps réel pour investir en toute confiance.
            </p>

            {/* Benefits Pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.text}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-full shadow-md border border-neutral-200 dark:border-neutral-700"
                >
                  <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Search Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {searchFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              <div className={`h-full p-8 rounded-3xl bg-gradient-to-br ${feature.bgGradient} border border-neutral-200/50 dark:border-neutral-700/50 hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 dark:hover:shadow-primary/20`}>
                {/* Icon */}
                <div className="mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-xl`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* Decorative gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-300 pointer-events-none`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Popular Searches */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 dark:from-primary-500/5 dark:via-accent-500/5 dark:to-primary-500/5 rounded-3xl blur-xl" />

          {/* Background Gallery - Real Estate Properties Spread */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl opacity-90 dark:opacity-75 z-0 pointer-events-none">
            {/* Left Side - 3 Images */}
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"
              alt="Luxury Villa"
              className="absolute top-12 left-20 w-48 h-56 object-cover rounded-2xl rotate-[-10deg] shadow-2xl z-10"
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1600585154512-527d681abc5f?auto=format&fit=crop&w=800&h=600&q=80"
              alt="Elegant Property"
              className="absolute top-52 left-24 w-44 h-60 object-cover rounded-2xl rotate-[12deg] shadow-2xl z-20 bg-white"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement
                const stage = img.getAttribute('data-fallback-stage') || '0'
                if (stage === '0') {
                  img.setAttribute('data-fallback-stage', '1')
                  img.src = 'https://source.unsplash.com/800x600/?luxury,villa,architecture'
                } else if (stage === '1') {
                  img.setAttribute('data-fallback-stage', '2')
                  img.src = 'https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1'
                }
              }}
            />
            <img
              src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d"
              alt="Modern Villa"
              className="absolute bottom-24 left-24 w-48 h-56 object-cover rounded-2xl rotate-[-8deg] shadow-2xl z-10"
              loading="lazy"
            />

            {/* Right Side - 3 Images */}
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
              alt="Modern Apartment"
              className="absolute top-12 right-20 w-48 h-56 object-cover rounded-2xl rotate-[10deg] shadow-2xl z-10"
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1600607687644-c7171b42498f"
              alt="Stylish Property"
              className="absolute top-60 right-24 w-44 h-60 object-cover rounded-2xl rotate-[-12deg] shadow-2xl z-10"
              loading="lazy"
            />
            <img
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d"
              alt="Luxury Estate"
              className="absolute bottom-24 right-24 w-48 h-56 object-cover rounded-2xl rotate-[8deg] shadow-2xl z-10"
              loading="lazy"
            />
          </div>

          <div className="relative bg-white/20 dark:bg-neutral-900/20 rounded-3xl px-16 py-12 border border-white/20 dark:border-neutral-700/20 shadow-2xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-full mb-4">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">Tendances du Marché</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Recherches Immobilières Populaires
              </h3>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Explorez les tendances actuelles et trouvez votre prochaine propriété parmi les recherches les plus populaires en Afrique
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {popularSearches.map((search, index) => (
                <motion.button
                  key={search}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(`/properties?search=${encodeURIComponent(search)}`)}
                  className="px-6 py-3 bg-white dark:bg-neutral-800 rounded-full shadow-md hover:shadow-xl border border-neutral-200 dark:border-neutral-600 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium text-sm"
                >
                  {search}
                </motion.button>
              ))}
            </div>

            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <Button
                  size="lg"
                  onClick={handleStartSearch}
                  leftIcon={<Search className="w-5 h-5" />}
                  className="transform hover:-translate-y-1 transition-all duration-300"
                >
                  Commencer ma Recherche Immobilière
                </Button>
                <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
                  Gratuit • Sans engagement • Résultats instantanés
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
