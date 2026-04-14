'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Users, MessageCircle, TrendingUp, Award, MapPin, ShieldCheck } from 'lucide-react'

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
    const [apiPosts, setApiPosts] = useState<any[]>([])

    useEffect(() => {
        const load = async () => {
            const response = await fetch('/api/forum/posts?limit=10', { cache: 'no-store' })
            const data = await response.json()
            setApiPosts(data.posts || [])
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
                            Communauté investisseurs
                        </h1>
                        <p className="text-xl text-white/85 mb-8 leading-relaxed">
                            Forums, mentoring, analyses marchés et échanges entre investisseurs par pays.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-[#D4AF37]" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">15,000+</div>
                                <div className="text-white/80">Membres actifs</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-[#D4AF37]" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">8,500+</div>
                                <div className="text-white/80">Discussions</div>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Award className="w-8 h-8 text-[#D4AF37]" />
                                </div>
                                <div className="text-3xl font-bold text-white mb-2">500+</div>
                                <div className="text-white/80">Experts certifiés</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Forum Categories */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-[#003087] mb-4">
                            Forums de Discussion
                        </h2>
                        <p className="text-lg text-neutral-600">
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
                                className="bg-white rounded-2xl border border-[#003087]/10 shadow-sm p-8 hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="w-16 h-16 bg-[#003087]/10 rounded-2xl flex items-center justify-center mb-6">
                                    <category.icon className="w-8 h-8 text-[#003087]" />
                                </div>

                                <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                                    {category.title}
                                </h3>

                                <p className="text-neutral-600 mb-6">
                                    {category.description}
                                </p>

                                <div className="flex items-center justify-between text-sm text-neutral-500 mb-6">
                                    <div className="flex items-center">
                                        <MessageCircle className="w-4 h-4 mr-1" />
                                        {category.posts} posts
                                    </div>
                                    <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-1" />
                                        {category.members} membres
                                    </div>
                                </div>

                                <button className="w-full rounded-full bg-[#003087] hover:bg-[#00266e] text-white px-4 py-2.5">
                                    Rejoindre la discussion
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-[#003087]/10 shadow-sm p-8">
                        <h3 className="text-2xl font-bold text-[#003087] mb-6">
                            Discussions Récentes
                        </h3>

                        <div className="space-y-4">
                            {(apiPosts.length > 0 ? apiPosts.map((p: any) => ({
                                id: p.id,
                                title: p.title,
                                author: `${p.author?.firstName || ''} ${p.author?.lastName || ''}`.trim(),
                                category: p.category || 'Forum',
                                replies: p._count?.replies || 0,
                                views: p.viewCount || 0,
                                time: 'recent'
                            })) : recentPosts).slice(0, 10).map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.4, delay: index * 0.1 }}
                                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
                                >
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-neutral-900 mb-1">
                                            {post.title}
                                        </h4>
                                        <div className="flex items-center text-sm text-neutral-500">
                                            <span>Par {post.author}</span>
                                            <span className="mx-2">•</span>
                                            <span>{post.category}</span>
                                            <span className="mx-2">•</span>
                                            <span>{post.time}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
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

                    <div className="max-w-3xl mx-auto text-center py-14 mt-16 rounded-3xl bg-white border border-[#003087]/10">
                        <h3 className="text-2xl font-bold text-[#003087] mb-4">
                            Contenu CDC: communauté orientée action
                        </h3>
                        <p className="text-lg text-neutral-600 px-6">
                            Mentoring, événements réseau pays et discussions modérées avec profils vérifiés.
                        </p>
                        <div className="mt-5 inline-flex items-center gap-2 text-sm rounded-full bg-[#00A651]/15 text-[#0b7f44] px-3 py-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            Modération et traçabilité renforcées
                        </div>
                    </div>
                    {apiPosts.length > 0 && apiPosts.length < 10 && (
                        <p className="mt-6 text-sm text-neutral-500 text-center">
                            Données BDD disponibles: {apiPosts.length} posts forum (objectif 10+).
                        </p>
                    )}
                </div>
            </section>
        </div>
    )
}
