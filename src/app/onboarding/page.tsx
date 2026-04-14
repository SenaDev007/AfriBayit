'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { User, Building2, Heart, Star, ArrowRight, CheckCircle } from 'lucide-react'

const profileTypes = [
    {
        id: 'BUYER',
        title: 'Acheteur Immobilier',
        description: 'Je cherche à acheter une propriété pour y vivre ou investir',
        icon: Building2,
        color: 'from-blue-500 to-blue-600',
        benefits: ['Accès aux meilleures offres', 'Conseils d\'experts', 'Visites virtuelles', 'Financement facilité']
    },
    {
        id: 'SELLER',
        title: 'Vendeur Immobilier',
        description: 'Je veux vendre ma propriété au meilleur prix',
        icon: Heart,
        color: 'from-green-500 to-green-600',
        benefits: ['Évaluation gratuite', 'Marketing professionnel', 'Réseau d\'acheteurs', 'Suivi des visites']
    },
    {
        id: 'INVESTOR',
        title: 'Investisseur Immobilier',
        description: 'Je cherche des opportunités d\'investissement rentables',
        icon: Star,
        color: 'from-purple-500 to-purple-600',
        benefits: ['Analyses de rentabilité', 'Projets pré-qualifiés', 'Réseau d\'investisseurs', 'Outils de gestion']
    },
    {
        id: 'TOURIST',
        title: 'Voyageur & Touriste',
        description: 'Je cherche un hébergement temporaire pour mes voyages',
        icon: User,
        color: 'from-orange-500 to-orange-600',
        benefits: ['Réservations instantanées', 'Prix compétitifs', 'Localisation idéale', 'Expériences authentiques']
    }
]

export default function OnboardingPage() {
    const { user, updateProfile } = useAuth()
    const router = useRouter()
    const [selectedProfileType, setSelectedProfileType] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleProfileTypeSelect = (profileType: string) => {
        setSelectedProfileType(profileType)
    }

    const handleCompleteOnboarding = async () => {
        if (!selectedProfileType) return

        try {
            setIsLoading(true)
            const token = typeof window !== 'undefined'
                ? (localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))
                : null

            if (!token) {
                throw new Error('Session invalide. Veuillez vous reconnecter.')
            }

            const response = await fetch('/api/auth/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    profileType: selectedProfileType
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.message || 'Erreur onboarding')
            }

            await updateProfile({ profileType: selectedProfileType as any })

            // Redirect to appropriate page
            if (selectedProfileType === 'AGENT' || selectedProfileType === 'AGENCY') {
                router.push('/dashboard')
            } else {
                router.push('/properties')
            }
        } catch (error) {
            console.error('Onboarding error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Removed skip functionality - user must select a profile type

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            <div className="container-custom py-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="w-20 h-20 bg-gradient-to-br from-primary-600 to-accent-600 rounded-3xl flex items-center justify-center mx-auto mb-6"
                        >
                            <User className="w-10 h-10 text-white" />
                        </motion.div>

                        <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Bienvenue sur AfriBayit !
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-3xl mx-auto mb-6">
                            Pour vous offrir la meilleure expérience possible, nous devons comprendre vos objectifs immobiliers.
                        </p>
                        <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl p-6 max-w-4xl mx-auto">
                            <div className="flex items-center space-x-3 mb-3">
                                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                    Pourquoi cette information est importante ?
                                </h3>
                            </div>
                            <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                                En connaissant vos objectifs, nous pouvons vous proposer des propriétés adaptées,
                                des conseils personnalisés, et des outils spécialement conçus pour votre situation.
                                Cela nous permet également de vous connecter avec les bons professionnels et de
                                vous guider vers les opportunités les plus pertinentes.
                            </p>
                        </div>
                    </div>

                    {/* Profile Type Selection */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
                    >
                        {profileTypes.map((profile, index) => (
                            <motion.div
                                key={profile.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                                onClick={() => handleProfileTypeSelect(profile.id)}
                                className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 group ${selectedProfileType === profile.id
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${profile.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                                        <profile.icon className="w-7 h-7 text-white" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                            {profile.title}
                                        </h3>
                                        <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-3">
                                            {profile.description}
                                        </p>

                                        {/* Benefits List */}
                                        <div className="space-y-1">
                                            {profile.benefits.map((benefit, benefitIndex) => (
                                                <div key={benefitIndex} className="flex items-center space-x-2">
                                                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{benefit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {selectedProfileType === profile.id && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-4 right-4"
                                    >
                                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.8 }}
                        className="flex flex-col items-center space-y-4"
                    >
                        <Button
                            onClick={handleCompleteOnboarding}
                            disabled={!selectedProfileType || isLoading}
                            loading={isLoading}
                            size="lg"
                            className="px-12 py-4 text-lg font-semibold"
                        >
                            {isLoading ? 'Configuration de votre espace...' : 'Continuer vers mon espace personnalisé'}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>

                        {!selectedProfileType && (
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                                Veuillez sélectionner votre objectif principal pour continuer
                            </p>
                        )}
                    </motion.div>

                    {/* Progress Indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1 }}
                        className="mt-12 text-center"
                    >
                        <div className="flex items-center justify-center space-x-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Objectif</span>
                            </div>
                            <div className="w-8 h-px bg-neutral-300 dark:bg-neutral-600"></div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">Préférences</span>
                            </div>
                            <div className="w-8 h-px bg-neutral-300 dark:bg-neutral-600"></div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-neutral-300 dark:bg-neutral-600 rounded-full"></div>
                                <span className="text-sm text-neutral-500 dark:text-neutral-400">Finalisation</span>
                            </div>
                        </div>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-3">
                            Configuration de votre expérience personnalisée
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}
