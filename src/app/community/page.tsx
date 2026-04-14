'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Users, MessageCircle, TrendingUp, Award, Calendar, MapPin } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'

const forumCategories = [
    {
        id: 1,
        title: 'Investissement Immobilier',
        description: 'Discussions sur les stratégies d\'investissement',
        posts: 1250,
        members: 3400,
        icon: TrendingUp
    },
    {
        id: 2,
        title: 'Conseils Juridiques',
        description: 'Questions légales et réglementaires',
        posts: 890,
        members: 2100,
        icon: Award
    },
    {
        id: 3,
        title: 'Marchés Locaux',
        description: 'Informations sur les marchés par région',
        posts: 2100,
        members: 5600,
        icon: MapPin
    }
]

const recentPosts = [
    {
        id: 1,
        title: 'Meilleures opportunités d\'investissement à Abidjan',
        author: 'Marie Koné',
        category: 'Investissement',
        replies: 24,
        views: 156,
        time: '2h'
    },
    {
        id: 2,
        title: 'Nouvelle réglementation sur les achats immobiliers',
        author: 'Jean Traoré',
        category: 'Juridique',
        replies: 18,
        views: 89,
        time: '4h'
    },
    {
        id: 3,
        title: 'Évolution des prix à Dakar - Analyse 2025',
        author: 'Aïcha Diallo',
        category: 'Marchés',
        replies: 31,
        views: 203,
        time: '6h'
    }
]

export default function CommunityPage() {
    const { t } = useLanguage()
    const [apiPosts, setApiPosts] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const response = await fetch('/api/forum/posts?limit=5')
            const data = await response.json()
            setApiPosts(data.posts || [])
        }
        load()
    }, [])

    const handleForumClick = (categoryId: number) => {
        console.log('Forum clicked:', categoryId)
        alert(`Rejoindre la discussion ${categoryId}`)
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
                                {t('nav.community')}
                            </span>
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 leading-relaxed">
                            Rejoignez notre communauté d'experts et d'investisseurs immobiliers
                        </p>

                        {/* Community Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-primary-600" />
                                </div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">15,000+</div>
                                <div className="text-neutral-600 dark:text-neutral-300">Membres Actifs</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-accent-600" />
                                </div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">8,500+</div>
                                <div className="text-neutral-600 dark:text-neutral-300">Discussions</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Award className="w-8 h-8 text-secondary-600" />
                                </div>
                                <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">500+</div>
                                <div className="text-neutral-600 dark:text-neutral-300">Experts Certifiés</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Forum Categories */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Forums de Discussion
                        </h2>
                        <p className="text-lg text-neutral-600 dark:text-neutral-300">
                            Participez aux discussions dans nos forums spécialisés
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {forumCategories.map((category, index) => (
                            <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mb-6">
                                    <category.icon className="w-8 h-8 text-primary-600" />
                                </div>

                                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                                    {category.title}
                                </h3>

                                <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                                    {category.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                                    <div className="flex items-center">
                                        <MessageCircle className="w-4 h-4 mr-1" />
                                        {category.posts} posts
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-1" />
                                        {category.members} membres
                                    </div>
                                </div>

                                <Button
                                    onClick={() => handleForumClick(category.id)}
                                    className="w-full"
                                >
                                    Rejoindre la discussion
                                </Button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Posts */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8">
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                            Discussions Récentes
                        </h3>

                        <div className="space-y-4">
                            {(apiPosts.length > 0 ? apiPosts.map((p: any) => ({
                                id: p.id,
                                title: p.title,
                                author: `${p.users?.firstName || ''} ${p.users?.lastName || ''}`.trim(),
                                category: p.category || 'Forum',
                                replies: p._count?.forum_replies || 0,
                                views: p.viewsCount || 0,
                                time: 'recent'
                            })) : recentPosts).map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                                            {post.title}
                                        </h4>
                                        <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                                            <span>Par {post.author}</span>
                                            <span className="mx-2">•</span>
                                            <span>{post.category}</span>
                                            <span className="mx-2">•</span>
                                            <span>{post.time}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                                        <div className="flex items-center">
                                            <MessageCircle className="w-4 h-4 mr-1" />
                                            {post.replies}
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 mr-1" />
                                            {post.views}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Coming Soon Message */}
                    <div className="max-w-2xl mx-auto text-center py-20 mt-16">
                        <Users className="w-24 h-24 text-primary-600 mx-auto mb-8" />
                        <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Communauté en Développement
                        </h3>
                        <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-8">
                            Notre plateforme communautaire complète sera bientôt disponible avec
                            des forums, événements, mentorat et networking.
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
