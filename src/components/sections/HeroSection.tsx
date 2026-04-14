'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Building2, ShieldCheck, Star, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

const stats = [
    { label: 'Biens vérifiés', value: '12 400+' },
    { label: 'Transactions sécurisées', value: '4 920' },
    { label: 'Pays pilotes', value: '4' },
    { label: 'Satisfaction clients', value: '97%' }
]

export function HeroSection() {
    const [city, setCity] = useState('')
    const [type, setType] = useState('ALL')
    const router = useRouter()

    const handleSearch = () => {
        const searchParams = new URLSearchParams()
        if (city.trim()) searchParams.set('city', city.trim())
        if (type !== 'ALL') searchParams.set('type', type)
        router.push(`/properties?${searchParams.toString()}`)
    }

    return (
        <section className="relative min-h-[100dvh] pt-32 pb-10 overflow-hidden bg-[#003087]">
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2200&q=80')"
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(0,156,222,0.18),transparent_40%),radial-gradient(circle_at_90%_15%,rgba(212,175,55,0.16),transparent_36%),linear-gradient(180deg,rgba(0,48,135,0.62)_0%,rgba(0,35,95,0.78)_70%)]" />
            <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,0.8)_25%,rgba(255,255,255,0.8)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.8)_75%,rgba(255,255,255,0.8)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(255,255,255,0.8)_25%,rgba(255,255,255,0.8)_26%,transparent_27%,transparent_74%,rgba(255,255,255,0.8)_75%,rgba(255,255,255,0.8)_76%,transparent_77%)] [background-size:44px_44px]" />
            <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-soft-light bg-[radial-gradient(circle,transparent_20%,#000_120%)]" />

            <div className="container-custom relative z-10">
                <div className="grid lg:grid-cols-2 gap-10 items-center min-h-[72dvh]">
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <p className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/30 bg-white/10 text-white/90 text-xs tracking-[0.08em]">
                            Où l'Afrique trouve sa maison
                        </p>
                        <h1 className="font-serif text-[48px] md:text-[68px] leading-[1.05] text-white mt-6">
                            Investir, louer et sécuriser chaque transaction immobilière.
                        </h1>
                        <p className="text-white/85 text-base md:text-lg leading-relaxed max-w-2xl mt-6 text-balance">
                            Plateforme panafricaine premium inspirée des standards Immoweb et Airbnb:
                            recherche structurée, vérification légale et escrow transactionnel.
                        </p>

                        <div className="mt-8 bg-white/10 backdrop-blur-[20px] border border-white/25 rounded-[24px] p-4 md:p-5 max-w-2xl">
                            <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] gap-3">
                                <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 min-w-0">
                                    <MapPin className="w-4 h-4 text-[#003087]" />
                                    <input
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        placeholder="Ville, quartier, commune..."
                                        className="w-full min-w-0 text-sm text-neutral-800 outline-none bg-transparent placeholder:text-neutral-500"
                                    />
                                </div>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="rounded-full bg-white px-4 py-3 text-sm text-neutral-800 outline-none min-w-0"
                                >
                                    <option value="ALL">Tous les biens</option>
                                    <option value="VILLA">Villa</option>
                                    <option value="APARTMENT">Appartement</option>
                                    <option value="LAND">Terrain</option>
                                    <option value="COMMERCIAL">Commercial</option>
                                </select>
                                <button
                                    onClick={handleSearch}
                                    className="px-6 py-3 rounded-full bg-[#D4AF37] text-[#001F5B] font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 transition-all whitespace-nowrap"
                                >
                                    <Search className="w-4 h-4" />
                                    Rechercher
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="relative h-[420px] hidden lg:block"
                    >
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-6 left-0 w-[280px] bg-white rounded-3xl p-5 shadow-2xl"
                        >
                            <p className="text-xs text-[#009CDE] font-semibold tracking-[0.06em]">BIEN PREMIUM</p>
                            <h3 className="font-serif text-2xl text-[#003087] mt-2">Villa Cocody Riviera</h3>
                            <p className="text-sm text-neutral-600 mt-2">4 chambres · 320m² · titre foncier validé</p>
                            <p className="text-xl font-semibold text-[#003087] mt-3">175 000 000 FCFA</p>
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute top-28 right-8 w-[260px] bg-white/95 rounded-3xl p-5 shadow-2xl border border-[#D4AF37]/40"
                        >
                            <p className="text-xs text-[#D4AF37] font-semibold tracking-[0.06em]">PARCOURS SÉCURISÉ</p>
                            <div className="mt-3 space-y-2 text-sm text-neutral-700">
                                <p className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#00A651]" />KYC validé</p>
                                <p className="inline-flex items-center gap-2"><Building2 className="w-4 h-4 text-[#003087]" />Dossier notarial prêt</p>
                                <p className="inline-flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#009CDE]" />Escrow actif</p>
                            </div>
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute bottom-8 left-16 w-[250px] bg-[#2C2E2F] text-white rounded-3xl p-5 shadow-2xl"
                        >
                            <p className="text-xs text-white/70 tracking-[0.06em]">CONFIANCE MARCHÉ</p>
                            <p className="text-2xl font-serif mt-2">4.8/5</p>
                            <p className="text-sm text-white/80 mt-1 inline-flex items-center gap-1">
                                <Star className="w-4 h-4 text-[#D4AF37]" />1 284 avis vérifiés
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <div className="relative z-10 container-custom">
                <div className="rounded-[24px] bg-[#D4AF37] text-[#001F5B] grid grid-cols-2 md:grid-cols-4 gap-4 p-5 md:p-6 shadow-[0_18px_44px_rgba(212,175,55,0.32)]">
                    {stats.map((item) => (
                        <div key={item.label} className="text-center">
                            <p className="font-serif text-2xl md:text-3xl leading-none">{item.value}</p>
                            <p className="text-xs md:text-sm mt-1 opacity-90">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
