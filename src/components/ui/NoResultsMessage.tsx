'use client'

import { Search, MapPin, Home, TrendingUp, Lightbulb, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from './Button'

interface NoResultsMessageProps {
    searchQuery: string
    filters?: {
        type?: string
        location?: string
        priceRange?: string
        bedrooms?: string
        features?: string[]
    }
    onSuggestionClick?: (suggestion: string) => void
}

export function NoResultsMessage({ searchQuery, filters, onSuggestionClick }: NoResultsMessageProps) {
    const lowerQuery = searchQuery.toLowerCase()

    // Extract search criteria
    const detectedCountry = ['ghana', 'togo', 'côte d\'ivoire', 'cote d\'ivoire', 'ivory coast', 'senegal', 'mali', 'burkina faso', 'niger', 'benin'].find(country => lowerQuery.includes(country))
    const detectedPropertyType = ['appartement', 'apartment', 'villa', 'maison', 'house', 'terrain', 'land', 'bureau', 'commercial', 'office'].find(type => lowerQuery.includes(type))

    // Generate intelligent suggestions based on search query and filters
    const generateSuggestions = () => {
        const suggestions = []

        // Precise country-based suggestions
        if (detectedCountry === 'ghana') {
            suggestions.push({
                type: 'location',
                title: 'Autres villes du Ghana',
                options: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Takoradi']
            })
        } else if (detectedCountry === 'togo') {
            suggestions.push({
                type: 'location',
                title: 'Autres villes du Togo',
                options: ['Lomé', 'Kara', 'Sokodé', 'Kpalimé', 'Atakpamé']
            })
        } else if (detectedCountry === 'côte d\'ivoire' || detectedCountry === 'cote d\'ivoire' || detectedCountry === 'ivory coast') {
            suggestions.push({
                type: 'location',
                title: 'Autres villes de Côte d\'Ivoire',
                options: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo']
            })
        } else if (detectedCountry === 'senegal') {
            suggestions.push({
                type: 'location',
                title: 'Autres villes du Sénégal',
                options: ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis']
            })
        }

        // Precise property type suggestions
        if (detectedPropertyType === 'appartement' || detectedPropertyType === 'apartment') {
            suggestions.push({
                type: 'property',
                title: 'Autres types de propriétés disponibles',
                options: ['Villas', 'Studios', 'Terrains', 'Bureaux commerciaux']
            })
        } else if (detectedPropertyType === 'villa' || detectedPropertyType === 'maison' || detectedPropertyType === 'house') {
            suggestions.push({
                type: 'property',
                title: 'Autres types de propriétés disponibles',
                options: ['Appartements', 'Studios', 'Terrains', 'Bureaux']
            })
        } else if (detectedPropertyType === 'terrain' || detectedPropertyType === 'land') {
            suggestions.push({
                type: 'property',
                title: 'Autres types de propriétés disponibles',
                options: ['Villas', 'Appartements', 'Bureaux', 'Studios']
            })
        }

        // Cross-country suggestions if specific country not found
        if (!detectedCountry) {
            suggestions.push({
                type: 'location',
                title: 'Pays disponibles',
                options: ['Ghana', 'Togo', 'Côte d\'Ivoire', 'Sénégal', 'Mali', 'Burkina Faso']
            })
        }

        // Location-based suggestions for specific cities
        if (lowerQuery.includes('abidjan') || lowerQuery.includes('cocody') || lowerQuery.includes('marcory')) {
            suggestions.push({
                type: 'location',
                title: 'Autres quartiers d\'Abidjan',
                options: ['Plateau', 'Treichville', 'Adjamé', 'Yopougon', 'Abobo', 'Attécoubé']
            })
        } else if (lowerQuery.includes('yamoussoukro')) {
            suggestions.push({
                type: 'location',
                title: 'Autres villes de Côte d\'Ivoire',
                options: ['Abidjan', 'Bouaké', 'San-Pédro', 'Korhogo', 'Man']
            })
        }

        // Property type suggestions
        if (lowerQuery.includes('villa') || lowerQuery.includes('maison')) {
            suggestions.push({
                type: 'property',
                title: 'Découvrez d\'autres types de propriétés',
                options: ['Appartements', 'Studios', 'Terrains', 'Bureaux commerciaux']
            })
        } else if (lowerQuery.includes('appartement') || lowerQuery.includes('apartment')) {
            suggestions.push({
                type: 'property',
                title: 'Explorez d\'autres options',
                options: ['Villas', 'Studios', 'Terrains', 'Bureaux']
            })
        }

        // Price-based suggestions
        if (lowerQuery.includes('cher') || lowerQuery.includes('luxe') || lowerQuery.includes('expensive')) {
            suggestions.push({
                type: 'price',
                title: 'Essayez des prix plus accessibles',
                options: ['Propriétés moyennes (10M-50M)', 'Propriétés économiques (moins de 10M)']
            })
        } else if (lowerQuery.includes('pas cher') || lowerQuery.includes('cheap') || lowerQuery.includes('budget')) {
            suggestions.push({
                type: 'price',
                title: 'Explorez d\'autres gammes de prix',
                options: ['Propriétés moyennes (10M-50M)', 'Propriétés haut de gamme (50M+)']
            })
        }

        // Feature-based suggestions
        if (lowerQuery.includes('piscine') || lowerQuery.includes('pool')) {
            suggestions.push({
                type: 'features',
                title: 'Propriétés avec d\'autres équipements',
                options: ['Avec jardin', 'Avec parking', 'Sécurisé', 'Avec garage']
            })
        }

        // General suggestions if no specific patterns found
        if (suggestions.length === 0) {
            suggestions.push(
                {
                    type: 'general',
                    title: 'Suggestions populaires',
                    options: ['Villas à Cocody', 'Appartements au Plateau', 'Terrains à Yamoussoukro', 'Bureaux au Plateau']
                },
                {
                    type: 'tips',
                    title: 'Conseils de recherche',
                    options: ['Essayez des mots-clés plus généraux', 'Vérifiez l\'orthographe', 'Utilisez des synonymes']
                }
            )
        }

        return suggestions
    }

    const suggestions = generateSuggestions()

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center py-16"
        >
            {/* Main Message */}
            <div className="mb-12">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center"
                >
                    <Search className="w-12 h-12 text-primary-600" />
                </motion.div>

                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                    Aucun résultat trouvé
                </h2>

                <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-2">
                    Nous n'avons trouvé aucun résultat correspondant exactement à votre recherche :
                </p>

                <div className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full text-primary-700 dark:text-primary-300 font-medium">
                    <Search className="w-4 h-4 mr-2" />
                    "{searchQuery}"
                </div>

                {/* Intelligent explanation */}
                <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Recherche précise :</strong> Notre système recherche uniquement les propriétés qui correspondent exactement à vos critères.
                        {detectedCountry && detectedPropertyType &&
                            ` Aucune ${detectedPropertyType === 'apartment' ? 'appartement' : detectedPropertyType === 'villa' ? 'villa' : detectedPropertyType === 'land' ? 'terrain' : 'propriété'} n'a été trouvée en ${detectedCountry === 'ghana' ? 'Ghana' : detectedCountry === 'togo' ? 'Togo' : detectedCountry === 'côte d\'ivoire' ? 'Côte d\'Ivoire' : detectedCountry}.`
                        }
                    </p>
                </div>
            </div>

            {/* Intelligent Suggestions */}
            <div className="space-y-8">
                {suggestions.map((suggestion, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-lg border border-neutral-200 dark:border-neutral-700"
                    >
                        <div className="flex items-center mb-4">
                            {suggestion.type === 'location' && <MapPin className="w-5 h-5 text-blue-500 mr-2" />}
                            {suggestion.type === 'property' && <Home className="w-5 h-5 text-green-500 mr-2" />}
                            {suggestion.type === 'price' && <TrendingUp className="w-5 h-5 text-yellow-500 mr-2" />}
                            {suggestion.type === 'features' && <Lightbulb className="w-5 h-5 text-purple-500 mr-2" />}
                            {suggestion.type === 'general' && <Search className="w-5 h-5 text-primary-500 mr-2" />}
                            {suggestion.type === 'tips' && <Lightbulb className="w-5 h-5 text-orange-500 mr-2" />}
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                                {suggestion.title}
                            </h3>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {suggestion.options.map((option, optionIndex) => (
                                <button
                                    key={optionIndex}
                                    onClick={() => onSuggestionClick?.(option)}
                                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-primary-100 dark:hover:bg-primary-900/20 text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-primary-300 rounded-lg transition-all duration-200 text-sm font-medium"
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-12 flex flex-col sm:flex-row gap-4 justify-center"
            >
                <Button
                    onClick={() => window.location.href = '/'}
                    className="btn-primary"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Retour à l'accueil
                </Button>

                <Button
                    onClick={() => window.location.href = '/properties'}
                    className="btn-outline"
                >
                    <Search className="w-4 h-4 mr-2" />
                    Voir toutes les propriétés
                </Button>
            </motion.div>

            {/* Help Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-12 p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl border border-primary-200 dark:border-primary-700"
            >
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Besoin d'aide pour votre recherche ?
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Notre équipe d'experts peut vous aider à trouver la propriété parfaite.
                </p>
                <Button
                    onClick={() => window.location.href = '/contact'}
                    className="btn-secondary"
                >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Contacter un expert
                </Button>
            </motion.div>
        </motion.div>
    )
}
