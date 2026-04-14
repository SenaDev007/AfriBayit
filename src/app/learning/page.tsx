'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { GraduationCap, BookOpen, Award, Users, Play, Clock, Star } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'

const courses = [
    {
        id: 1,
        title: 'Introduction à l\'Investissement Immobilier',
        description: 'Apprenez les bases de l\'investissement immobilier en Afrique',
        duration: '2h 30min',
        level: 'Débutant',
        rating: 4.8,
        students: 1250,
        price: 'Gratuit',
        image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400'
    },
    {
        id: 2,
        title: 'Analyse de Marché Immobilier',
        description: 'Techniques avancées d\'analyse des marchés immobiliers africains',
        duration: '4h 15min',
        level: 'Intermédiaire',
        rating: 4.9,
        students: 890,
        price: '29,99€',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'
    },
    {
        id: 3,
        title: 'Négociation Immobilière',
        description: 'Maîtrisez l\'art de la négociation dans l\'immobilier',
        duration: '3h 45min',
        level: 'Avancé',
        rating: 4.7,
        students: 650,
        price: '49,99€',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400'
    }
]

export default function LearningPage() {
    const { t } = useLanguage()
    const [apiCourses, setApiCourses] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const response = await fetch('/api/courses?limit=6')
            const data = await response.json()
            setApiCourses(data.courses || [])
        }
        load()
    }, [])

    const handleCourseClick = (courseId: number) => {
        console.log('Course clicked:', courseId)
        alert(`Commencer le cours ${courseId}`)
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
                                {t('nav.learning')}
                            </span>
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
                            Développez vos compétences en immobilier avec nos formations expertes
                        </p>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-8 h-8 text-primary-600" />
                                </div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">50+</div>
                                <div className="text-neutral-600 dark:text-neutral-300">Cours Disponibles</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-accent-600" />
                                </div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">5,000+</div>
                                <div className="text-neutral-600 dark:text-neutral-300">Étudiants Actifs</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Award className="w-8 h-8 text-secondary-600" />
                                </div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">95%</div>
                                <div className="text-neutral-600 dark:text-neutral-300">Taux de Réussite</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Courses Section */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Cours Populaires
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-300">
                            Commencez votre parcours d'apprentissage avec nos cours les plus appréciés
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(apiCourses.length > 0 ? apiCourses : courses).map((course: any, index: number) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="h-48 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/20 dark:to-accent-900/20 flex items-center justify-center">
                                    <GraduationCap className="w-16 h-16 text-primary-600" />
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-600 text-sm rounded-full">
                                            {course.level}
                                        </span>
                                        <span className="text-lg font-bold text-primary-600">
                                            {course.price}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                                        {course.title}
                                    </h3>

                                    <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                                        {course.description}
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                                        <div className="flex items-center">
                                            <Clock className="w-4 h-4 mr-1" />
                                            {course.duration}
                                        </div>
                                        <div className="flex items-center">
                                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                            {course.rating}
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 mr-1" />
                                            {course.students}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleCourseClick(course.id)}
                                        className="w-full"
                                    >
                                        <Play className="w-4 h-4 mr-2" />
                                        Commencer le cours
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Coming Soon Message */}
                    <div className="max-w-2xl mx-auto text-center py-20 mt-16">
                        <GraduationCap className="w-24 h-24 text-primary-600 mx-auto mb-8" />
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Académie Immobilière en Développement
                        </h3>
                        <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
                            Notre plateforme d'apprentissage complète sera bientôt disponible avec
                            des cours interactifs, certifications et mentorat personnalisé.
                        </p>
                        <Button
                            onClick={handleBackToHome}
                            size="lg"
                        >
                            Retour à l'accueil
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
