'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Home, Filter, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const stats = [
    { label: 'Propriétés', value: '50K+', icon: Home },
    { label: 'Utilisateurs', value: '100K+', icon: Search },
    { label: 'Pays', value: '25+', icon: MapPin },
    { label: 'Transactions', value: '10K+', icon: Sparkles },
]

export function HeroSection() {
    const { t } = useLanguage()
    const [searchQuery, setSearchQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState(0)
    const [isBlurred, setIsBlurred] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const router = useRouter()

    const handleSearch = (query: string) => {
        setSearchQuery(query)

        // Check if search query is empty - let SearchBar handle validation
        if (!query.trim()) {
            return
        }

        // Open filter panel for precise search
        setShowFilters(true)
    }

    const handleSearchClick = () => {
        // Open filter panel for precise search
        setShowFilters(true)
    }

    const handleAdvancedFiltersClick = () => {
        console.log('Advanced filters clicked')
        // Open advanced filters modal or navigate to properties with filters
        window.location.href = '/properties?filters=advanced'
    }

    const handleSearchWithFilters = (filters: any) => {
        // Start loading state
        setIsLoading(true)
        setIsBlurred(true)
        setLoadingProgress(0)
        setShowFilters(false)

        // Build search parameters
        const searchParams = new URLSearchParams()
        searchParams.set('search', searchQuery)

        if (filters.type) searchParams.set('type', filters.type)
        if (filters.location) searchParams.set('location', filters.location)
        if (filters.priceMin) searchParams.set('price_min', filters.priceMin)
        if (filters.priceMax) searchParams.set('price_max', filters.priceMax)
        if (filters.bedrooms) searchParams.set('bedrooms', filters.bedrooms)
        if (filters.features && filters.features.length > 0) {
            searchParams.set('features', filters.features.join(','))
        }

        const searchUrl = `/properties?${searchParams.toString()}`

        // Simulate loading progress over 2 seconds
        let progress = 0
        const interval = setInterval(() => {
            progress += 100 / (2000 / 50) // Increment by 100% over 40 intervals (50ms each)
            if (progress >= 100) {
                progress = 100
                clearInterval(interval)
                // Navigate after loading is complete
                router.push(searchUrl)
                // Reset loading states after navigation
                setTimeout(() => {
                    setIsLoading(false)
                    setIsBlurred(false)
                    setLoadingProgress(0)
                }, 100)
            }
            setLoadingProgress(Math.min(Math.round(progress), 100))
        }, 50)
    }

    return (
        <section className={`relative min-h-screen flex items-center justify-center overflow-hidden ${isBlurred ? 'blur-sm' : ''} -mt-20`}>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="text-center">
                        {/* Circular Progress Bar */}
                        <div className="relative w-32 h-32 mx-auto mb-6">
                            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                                {/* Background circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="rgba(255,255,255,0.2)"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                {/* Progress circle */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#3B82F6"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - loadingProgress / 100)}`}
                                    className="transition-all duration-100 ease-out"
                                />
                            </svg>
                            {/* Percentage text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {loadingProgress}%
                                </span>
                            </div>
                        </div>

                        {/* Loading text */}
                        <div className="text-white text-lg font-medium mb-2">
                            Recherche en cours...
                        </div>
                        <div className="text-white/70 text-sm">
                            Analyse intelligente des propriétés
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                Filtres de Recherche
                            </h2>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Search Query Input */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Terme de recherche
                                </label>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher par ville, quartier, type de propriété..."
                                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500"
                                />
                            </div>

                            {/* Property Type */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Type de propriété
                                </label>
                                <select className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">
                                    <option value="">Tous les types</option>
                                    <option value="apartment">Appartement</option>
                                    <option value="villa">Villa</option>
                                    <option value="house">Maison</option>
                                    <option value="land">Terrain</option>
                                    <option value="commercial">Commercial</option>
                                </select>
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Localisation
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ville, quartier..."
                                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500"
                                />
                            </div>

                            {/* Price Range */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Prix minimum
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Prix maximum
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Aucune limite"
                                        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500"
                                    />
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Nombre de chambres
                                </label>
                                <select className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white">
                                    <option value="">Toutes</option>
                                    <option value="1">1 chambre</option>
                                    <option value="2">2 chambres</option>
                                    <option value="3">3 chambres</option>
                                    <option value="4">4 chambres</option>
                                    <option value="5">5+ chambres</option>
                                </select>
                            </div>

                            {/* Features */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Équipements
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Piscine', 'Jardin', 'Parking', 'Sécurité', 'Climatisation', 'Internet'].map((feature) => (
                                        <label key={feature} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-neutral-700 dark:text-neutral-300">{feature}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 mt-8">
                            <button
                                onClick={() => setShowFilters(false)}
                                className="flex-1 px-6 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => handleSearchWithFilters({})}
                                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Rechercher
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* 360° Auto-Playing Video Background */}
            <div className="absolute inset-0 w-full h-full">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    style={{
                        transform: 'scale(1.1)',
                        filter: 'brightness(0.8) contrast(1.1)'
                    }}
                    poster="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                >
                    {/* 360° Property Tour Video - Auto-playing luxury property tour */}
                    <source src="https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=165&oauth2_token_id=57447761" type="video/mp4" />
                    <source src="https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c0fd273d2c6d9a064f3ae35579b2bbdf&profile_id=165&oauth2_token_id=57447761" type="video/mp4" />
                    {/* Fallback image for browsers that don't support video */}
                    <img
                        src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                        alt="Luxury Property 360° Auto Tour"
                        className="w-full h-full object-cover"
                    />
                </video>

                {/* Enhanced Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/20 to-black/50 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* Floating Luxury Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        y: [0, -30, 0],
                        rotate: [0, 10, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-20 right-20 w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                />
                <motion.div
                    animate={{
                        y: [0, 25, 0],
                        rotate: [0, -8, 0],
                        scale: [1, 0.9, 1]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute top-40 left-16 w-20 h-20 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                />
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        x: [0, 15, 0],
                        rotate: [0, 5, 0]
                    }}
                    transition={{
                        duration: 12,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute bottom-32 right-1/4 w-16 h-16 bg-white/8 backdrop-blur-sm rounded-full border border-white/15"
                />
            </div>

            <div className="container-custom relative z-10 pt-48">
                <div className="max-w-6xl mx-auto text-center">
                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="mb-16"
                    >
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight drop-shadow-2xl">
                            <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                                {t('hero.title')}
                            </span>
                        </h1>

                        <p className="text-xl md:text-2xl text-white/90 mb-16 max-w-4xl mx-auto leading-relaxed drop-shadow-lg">
                            {t('hero.subtitle')}
                        </p>
                    </motion.div>

                    {/* Search Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mb-20"
                    >
                        <div className="max-w-4xl mx-auto">
                            <div className="text-center mb-6">
                                <p className="text-sm text-white/80 mb-2 drop-shadow-md">
                                    Recherche intelligente avec IA
                                </p>
                                <div className="flex items-center justify-center space-x-4 text-xs text-white/70">
                                    <span className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                        <span>Recherche vocale</span>
                                    </span>
                                    <span className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <span>Détection automatique</span>
                                    </span>
                                    <span className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                        <span>IA avancée</span>
                                    </span>
                                </div>
                            </div>
                            {/* Search Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Button
                                    onClick={() => window.location.href = '/properties'}
                                    size="lg"
                                    className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 hover:border-white/40"
                                    leftIcon={<Search className="w-5 h-5" />}
                                >
                                    Rechercher
                                </Button>

                                <Button
                                    onClick={() => setShowFilters(true)}
                                    variant="outline"
                                    size="lg"
                                    className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 bg-transparent backdrop-blur-md border border-white/40 text-white hover:bg-white/10 hover:border-white/60"
                                    leftIcon={<Filter className="w-5 h-5" />}
                                >
                                    Filtres avancés
                                </Button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20 max-w-4xl mx-auto"
                    >
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                                className="text-center group bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 max-w-32"
                            >
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300 border border-white/30">
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-white/80 font-medium drop-shadow-md">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                </div>
            </div>

            {/* Scroll Indicator - Moved to bottom right */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="absolute bottom-8 right-8"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-6 h-10 border-2 border-neutral-400 rounded-full flex justify-center"
                >
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1 h-3 bg-neutral-400 rounded-full mt-2"
                    />
                </motion.div>
            </motion.div>
        </section>
    )
}
