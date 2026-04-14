'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Building2,
    Hotel,
    GraduationCap,
    MessageSquare,
    TrendingUp,
    DollarSign,
    Eye,
    Settings,
    Shield,
    BarChart3,
    Activity
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'

const adminStats = [
    {
        title: 'Utilisateurs Actifs',
        value: '12,543',
        change: '+12.5%',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    {
        title: 'Propriétés Listées',
        value: '3,247',
        change: '+8.2%',
        icon: Building2,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
    },
    {
        title: 'Réservations Hôtels',
        value: '1,892',
        change: '+15.3%',
        icon: Hotel,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
    },
    {
        title: 'Cours Vendus',
        value: '856',
        change: '+23.1%',
        icon: GraduationCap,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
    },
    {
        title: 'Messages Forum',
        value: '4,521',
        change: '+5.7%',
        icon: MessageSquare,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50'
    },
    {
        title: 'Revenus Mensuels',
        value: '2.4M XOF',
        change: '+18.9%',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
    }
]

const recentActivities = [
    {
        id: 1,
        type: 'user_registration',
        message: 'Nouvel utilisateur inscrit: Marie Kouassi',
        time: 'Il y a 5 minutes',
        icon: Users,
        color: 'text-blue-600'
    },
    {
        id: 2,
        type: 'property_listed',
        message: 'Nouvelle propriété listée: Villa à Cocody',
        time: 'Il y a 12 minutes',
        icon: Building2,
        color: 'text-green-600'
    },
    {
        id: 3,
        type: 'booking_confirmed',
        message: 'Réservation confirmée: Hôtel Pullman',
        time: 'Il y a 25 minutes',
        icon: Hotel,
        color: 'text-purple-600'
    },
    {
        id: 4,
        type: 'course_purchased',
        message: 'Cours acheté: Investissement Immobilier',
        time: 'Il y a 1 heure',
        icon: GraduationCap,
        color: 'text-orange-600'
    },
    {
        id: 5,
        type: 'forum_post',
        message: 'Nouveau post forum: Questions légales',
        time: 'Il y a 2 heures',
        icon: MessageSquare,
        color: 'text-indigo-600'
    }
]

export default function AdminDashboard() {
    const { t } = useLanguage()
    const [activeTab, setActiveTab] = useState('overview')

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-neutral-200">
                <div className="container-custom py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900">
                                Tableau de Bord Admin
                            </h1>
                            <p className="text-neutral-600 mt-1">
                                Gestion complète de la plateforme AfriBayit
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                                <Settings className="w-4 h-4" />
                                <span>Paramètres</span>
                            </button>
                            <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                                <Shield className="w-4 h-4" />
                                <span>Sécurité</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                {/* Navigation Tabs */}
                <div className="flex space-x-1 mb-8 bg-white rounded-lg p-1 shadow-sm">
                    {[
                        { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
                        { id: 'users', label: 'Utilisateurs', icon: Users },
                        { id: 'properties', label: 'Propriétés', icon: Building2 },
                        { id: 'hotels', label: 'Hôtels', icon: Hotel },
                        { id: 'courses', label: 'Formations', icon: GraduationCap },
                        { id: 'analytics', label: 'Analytics', icon: Activity }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${activeTab === tab.id
                                ? 'bg-primary-600 text-white'
                                : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {adminStats.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    {stat.change}
                                </span>
                            </div>
                            <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                                {stat.value}
                            </h3>
                            <p className="text-neutral-600 text-sm">
                                {stat.title}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Activities */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                            Activités Récentes
                        </h3>
                        <div className="space-y-4">
                            {recentActivities.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                                >
                                    <div className={`w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center`}>
                                        <activity.icon className={`w-4 h-4 ${activity.color}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-neutral-900">
                                            {activity.message}
                                        </p>
                                        <p className="text-xs text-neutral-500 mt-1">
                                            {activity.time}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                        <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                            Actions Rapides
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Nouveau Utilisateur', icon: Users, color: 'bg-blue-500' },
                                { label: 'Modérer Contenu', icon: Eye, color: 'bg-green-500' },
                                { label: 'Analytics Avancées', icon: TrendingUp, color: 'bg-purple-500' },
                                { label: 'Paramètres Système', icon: Settings, color: 'bg-orange-500' }
                            ].map((action, index) => (
                                <motion.button
                                    key={action.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="flex flex-col items-center space-y-2 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all"
                                >
                                    <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                                        <action.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-700 text-center">
                                        {action.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
