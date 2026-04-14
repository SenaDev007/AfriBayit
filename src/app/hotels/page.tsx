'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Search, Star, MapPin, Calendar, Users } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'

export default function HotelsPage() {
    const { t } = useLanguage()
    const [hotels, setHotels] = useState<any[]>([])
    const [searchData, setSearchData] = useState({
        destination: '',
        checkIn: '',
        checkOut: '',
        guests: '1'
    })

    const handleSearch = async () => {
        const params = new URLSearchParams()
        if (searchData.destination) params.set('city', searchData.destination)
        const response = await fetch(`/api/hotels?${params.toString()}`)
        const data = await response.json()
        setHotels(data.hotels || [])
    }

    const handleBackToHome = () => {
        window.location.href = '/'
    }

    return (
        <div className="min-h-screen bg-white dark:bg-neutral-900">
            {/* Header Section */}
            <section className="pt-32 pb-20 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                            <span className="text-gradient">
                                {t('nav.hotels')}
                            </span>
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
                            Réservez votre hébergement dans les meilleurs hôtels d'Afrique
                        </p>

                        {/* Search Form */}
                        <div className="max-w-4xl mx-auto bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Destination
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            placeholder="Où allez-vous ?"
                                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Arrivée
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Départ
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="date"
                                            className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                        Voyageurs
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <select className="w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400">
                                            <option>1 voyageur</option>
                                            <option>2 voyageurs</option>
                                            <option>3 voyageurs</option>
                                            <option>4+ voyageurs</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleSearch}
                                size="lg"
                                className="w-full"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Rechercher des hôtels
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Hotels Section */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Hôtels Recommandés
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-300">
                            Découvrez nos hôtels partenaires sélectionnés pour leur excellence
                        </p>
                    </div>

                    {hotels.length === 0 ? (
                        <div className="max-w-2xl mx-auto text-center py-20">
                            <Hotel className="w-24 h-24 text-primary-600 mx-auto mb-8" />
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                                Lance une recherche pour voir les hotels disponibles
                            </h3>
                            <Button onClick={handleBackToHome} size="lg">
                                Retour a l'accueil
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotels.map((hotel) => (
                                <div key={hotel.id} className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700">
                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">{hotel.name}</h4>
                                    <p className="text-sm text-neutral-600 dark:text-neutral-300">{hotel.city}, {hotel.country}</p>
                                    <p className="text-sm text-neutral-500 mt-2">Note: {hotel.starRating} etoiles</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
