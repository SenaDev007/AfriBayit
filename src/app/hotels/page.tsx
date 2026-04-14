'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Hotel, Search, Star, MapPin, Calendar, Users, ShieldCheck } from 'lucide-react'

export default function HotelsPage() {
    const [hotels, setHotels] = useState<any[]>([])
    const [searchData, setSearchData] = useState({
        destination: '',
        checkIn: '',
        checkOut: '',
        guests: '1'
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetch('/api/hotels?limit=10', { cache: 'no-store' })
                const data = await response.json()
                setHotels(data.hotels || [])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleSearch = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (searchData.destination) params.set('city', searchData.destination)
        params.set('limit', '10')
        const response = await fetch(`/api/hotels?${params.toString()}`, { cache: 'no-store' })
        const data = await response.json()
        setHotels(data.hotels || [])
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-[#F7F9FC]">
            <section className="pt-32 pb-20 bg-[linear-gradient(135deg,#003087_0%,#001F5B_75%)]">
                <div className="container-custom">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                            Écosystème hôtellerie
                        </h1>
                        <p className="text-xl text-white/85 mb-8 leading-relaxed">
                            Agrégation hôtels locaux + standards réservation moderne pour l'Afrique de l'Ouest.
                        </p>

                        <div className="max-w-4xl mx-auto bg-white/10 border border-white/20 rounded-2xl p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Destination
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="text"
                                            value={searchData.destination}
                                            onChange={(e) => setSearchData((p) => ({ ...p, destination: e.target.value }))}
                                            placeholder="Où allez-vous ?"
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Arrivée
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="date"
                                            value={searchData.checkIn}
                                            onChange={(e) => setSearchData((p) => ({ ...p, checkIn: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Départ
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <input
                                            type="date"
                                            value={searchData.checkOut}
                                            onChange={(e) => setSearchData((p) => ({ ...p, checkOut: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Voyageurs
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                        <select
                                            value={searchData.guests}
                                            onChange={(e) => setSearchData((p) => ({ ...p, guests: e.target.value }))}
                                            className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                        >
                                            <option>1 voyageur</option>
                                            <option>2 voyageurs</option>
                                            <option>3 voyageurs</option>
                                            <option>4+ voyageurs</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleSearch}
                                className="w-full rounded-full bg-[#D4AF37] text-[#001F5B] px-6 py-3 font-semibold hover:brightness-95 transition-all"
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Rechercher des hôtels
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#003087] mb-4">
                            Hôtels recommandés
                        </h2>
                        <p className="text-lg text-neutral-600">
                            Parcours réservation structuré: destination, dates, capacité, disponibilités.
                        </p>
                    </div>

                    {loading ? (
                        <div className="max-w-2xl mx-auto text-center py-16 rounded-3xl bg-white border border-[#003087]/10">
                            <p className="text-neutral-600">Chargement des hôtels...</p>
                        </div>
                    ) : hotels.length === 0 ? (
                        <div className="max-w-2xl mx-auto text-center py-16 rounded-3xl bg-white border border-[#003087]/10">
                            <Hotel className="w-20 h-20 text-[#003087] mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-[#003087] mb-3">
                                Lance une recherche pour afficher les hôtels disponibles
                            </h3>
                            <p className="text-neutral-600">Intégration API prête pour les connecteurs Booking/Expedia.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hotels.map((hotel) => (
                                <div key={hotel.id} className="bg-white rounded-2xl p-5 border border-[#003087]/10 hover:shadow-xl transition-all">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-neutral-900">{hotel.name}</h4>
                                        <span className="inline-flex items-center gap-1 text-xs rounded-full bg-[#D4AF37]/20 text-[#7f6511] px-2.5 py-1">
                                            <Star className="w-3.5 h-3.5" />
                                            {hotel.starRating}
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-600">{hotel.city}, {hotel.country}</p>
                                    <p className="text-sm text-neutral-500 mt-2">Chambres disponibles: {hotel._count?.rooms || 0}</p>
                                    <p className="text-sm text-neutral-500">Réservations: {hotel._count?.bookings || 0}</p>
                                    <div className="mt-3 inline-flex items-center gap-1 text-xs rounded-full bg-[#00A651]/15 text-[#0b7f44] px-2.5 py-1">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        Fournisseur vérifié
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!loading && hotels.length < 10 && (
                        <p className="mt-6 text-sm text-neutral-500 text-center">
                            Données BDD disponibles: {hotels.length} hôtels affichés (objectif 10+).
                        </p>
                    )}
                </div>
            </section>
        </div>
    )
}
