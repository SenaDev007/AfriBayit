'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { GraduationCap, BookOpen, Award, Users, Play, Clock, Star } from 'lucide-react'

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
    const [apiCourses, setApiCourses] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const response = await fetch('/api/courses?limit=10', { cache: 'no-store' })
            const data = await response.json()
            setApiCourses(data.courses || [])
        }
        load()
    }, [])

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
                            Académie immobilière
                        </h1>
                        <p className="text-xl text-white/85 mb-8 leading-relaxed">
                            Parcours de formation certifiants: investissement, conformité légale, négociation, fiscalité.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                                    <BookOpen className="w-8 h-8 text-[#D4AF37]" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">50+</div>
                                <div className="text-white/80">Cours disponibles</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                                    <Users className="w-8 h-8 text-[#D4AF37]" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">5,000+</div>
                                <div className="text-white/80">Étudiants actifs</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                                    <Award className="w-8 h-8 text-[#D4AF37]" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">95%</div>
                                <div className="text-white/80">Taux de réussite</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Courses Section */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#003087] mb-4">
                            Cours Populaires
                        </h2>
                        <p className="text-lg text-neutral-600">
                            Commencez votre parcours d'apprentissage avec nos cours les plus appréciés
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {(apiCourses.length > 0 ? apiCourses : courses).slice(0, 10).map((course: any, index: number) => (
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-white rounded-2xl border border-[#003087]/10 shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="h-48 bg-[linear-gradient(135deg,#003087_0%,#001F5B_75%)] flex items-center justify-center">
                                    <GraduationCap className="w-16 h-16 text-[#D4AF37]" />
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="px-3 py-1 bg-[#003087]/10 text-[#003087] text-sm rounded-full">
                                            {course.level}
                                        </span>
                                        <span className="text-lg font-bold text-[#003087]">
                                            {course.price}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                                        {course.title}
                                    </h3>

                                    <p className="text-neutral-600 mb-4">
                                        {course.description}
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-neutral-500 mb-4">
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

                                    <button className="w-full rounded-full bg-[#003087] text-white hover:bg-[#00266e] px-4 py-2.5 inline-flex items-center justify-center">
                                        <Play className="w-4 h-4 mr-2" />
                                        Commencer le cours
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="max-w-3xl mx-auto text-center py-14 mt-16 rounded-3xl bg-white border border-[#003087]/10">
                        <h3 className="text-2xl font-bold text-[#003087] mb-4">
                            Objectif CDC: parcours certifiant de bout en bout
                        </h3>
                        <p className="text-lg text-neutral-600 px-6">
                            Accès aux modules, progression, évaluations, certification et suivi d'employabilité.
                        </p>
                    </div>
                    {apiCourses.length > 0 && apiCourses.length < 10 && (
                        <p className="mt-6 text-sm text-neutral-500 text-center">
                            Données BDD disponibles: {apiCourses.length} cours publiés (objectif 10+).
                        </p>
                    )}
                </div>
            </section>
        </div>
    )
}
