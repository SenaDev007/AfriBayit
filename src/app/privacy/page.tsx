import { Metadata } from 'next'
import { Shield, Eye, Lock, Database, Globe, Users, FileText, Clock, CheckCircle, AlertTriangle, Scale, Home, DollarSign, Phone, Mail, MapPin, Star, TrendingUp, UserX, Search, Heart, MessageCircle, Settings, Key, Server, Zap, Bell, Camera, Map, CreditCard, Building, UserCheck, BellRing } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Politique de confidentialité - AfriBayit',
    description: 'Politique de confidentialité de la plateforme AfriBayit - Protection des données personnelles',
}

export default function PrivacyPage() {
    const sections = [
        {
            id: 'introduction',
            title: 'Introduction et engagement',
            icon: Shield,
            content: 'AfriBayit s\'engage à protéger votre vie privée et vos données personnelles conformément au RGPD, aux lois locales et aux meilleures pratiques internationales de sécurité.',
            commitment: 'Nous nous engageons à être transparents sur l\'utilisation de vos données et à vous donner le contrôle total sur vos informations personnelles.',
            principles: [
                'Transparence totale sur l\'utilisation des données',
                'Minimisation de la collecte de données',
                'Sécurité maximale des informations',
                'Respect de vos droits fondamentaux',
                'Conformité aux réglementations internationales',
                'Audit régulier de nos pratiques',
                'Formation continue de notre équipe',
                'Amélioration continue de nos processus'
            ]
        },
        {
            id: 'data-collection',
            title: 'Données collectées',
            icon: Database,
            content: 'Nous collectons uniquement les données nécessaires pour fournir nos services immobiliers et améliorer votre expérience sur notre plateforme.',
            categories: [
                'Données d\'identité : nom, prénom, email, téléphone',
                'Données de compte : nom d\'utilisateur, préférences, paramètres',
                'Données de localisation : pays, ville, coordonnées GPS (avec consentement)',
                'Données d\'activité : pages visitées, recherches, interactions',
                'Données de communication : messages, appels, emails',
                'Données financières : informations de paiement sécurisées',
                'Données de propriété : annonces, photos, descriptions',
                'Données de préférences : critères de recherche, favoris'
            ],
            legalBasis: 'Nous collectons vos données sur la base de votre consentement, de l\'exécution de contrats, et de nos intérêts légitimes pour fournir nos services.'
        },
        {
            id: 'data-usage',
            title: 'Utilisation des données',
            icon: Eye,
            content: 'Vos données personnelles sont utilisées exclusivement pour améliorer nos services immobiliers et votre expérience utilisateur.',
            purposes: [
                'Fournir nos services immobiliers et hôteliers',
                'Faciliter les transactions entre utilisateurs',
                'Personnaliser votre expérience de recherche',
                'Améliorer la sécurité de la plateforme',
                'Analyser les tendances du marché immobilier',
                'Envoyer des notifications importantes',
                'Respecter nos obligations légales',
                'Développer de nouveaux services'
            ],
            analytics: 'Nous utilisons des données anonymisées pour analyser l\'utilisation de la plateforme et améliorer nos services, sans compromettre votre vie privée.'
        },
        {
            id: 'data-sharing',
            title: 'Partage des données',
            icon: Users,
            content: 'Nous ne vendons jamais vos données personnelles. Le partage est limité aux cas strictement nécessaires pour nos services.',
            sharing: [
                'Avec votre consentement explicite uniquement',
                'Avec nos partenaires de confiance (agents immobiliers, banques)',
                'Avec les autorités légales si requis par la loi',
                'Avec nos prestataires de services (hébergement, paiement)',
                'En cas de fusion ou acquisition (avec notification)',
                'Pour la sécurité et la prévention de la fraude',
                'Avec des tiers certifiés RGPD uniquement',
                'Jamais à des fins commerciales externes'
            ],
            protection: 'Tous nos partenaires sont soumis à des accords de confidentialité stricts et à des audits de conformité RGPD.'
        },
        {
            id: 'data-security',
            title: 'Sécurité des données',
            icon: Lock,
            content: 'Nous mettons en œuvre des mesures de sécurité de niveau bancaire pour protéger vos données contre tout accès non autorisé.',
            measures: [
                'Chiffrement AES-256 pour toutes les données sensibles',
                'Authentification à deux facteurs obligatoire',
                'Surveillance 24/7 de nos systèmes',
                'Tests de pénétration réguliers',
                'Formation sécurité de tout le personnel',
                'Accès restreint basé sur les rôles',
                'Sauvegarde chiffrée et géographiquement distribuée',
                'Audit de sécurité trimestriel'
            ],
            incidents: 'En cas d\'incident de sécurité, nous vous notifierons dans les 72 heures et prendrons toutes les mesures nécessaires.'
        },
        {
            id: 'data-retention',
            title: 'Conservation des données',
            icon: Clock,
            content: 'Nous conservons vos données uniquement le temps nécessaire aux finalités pour lesquelles elles ont été collectées.',
            periods: [
                'Données de compte : 3 ans après la dernière activité',
                'Données de transaction : 7 ans (obligation légale)',
                'Données de communication : 2 ans',
                'Données de marketing : jusqu\'au désabonnement',
                'Données de cookies : 13 mois maximum',
                'Données de localisation : 1 an maximum',
                'Données de préférences : 2 ans après suppression du compte',
                'Données anonymisées : conservation illimitée'
            ],
            deletion: 'Vous pouvez demander la suppression de vos données à tout moment, sous réserve de nos obligations légales.'
        },
        {
            id: 'user-rights',
            title: 'Vos droits',
            icon: UserCheck,
            content: 'Conformément au RGPD, vous disposez de droits complets sur vos données personnelles.',
            rights: [
                'Droit d\'accès : consulter toutes vos données',
                'Droit de rectification : corriger les informations inexactes',
                'Droit à l\'effacement : supprimer vos données',
                'Droit à la portabilité : récupérer vos données',
                'Droit d\'opposition : refuser certains traitements',
                'Droit de limitation : restreindre l\'utilisation',
                'Droit de retrait du consentement',
                'Droit de déposer une plainte'
            ],
            exercise: 'Vous pouvez exercer ces droits en nous contactant à privacy@afribayit.com ou via votre espace personnel.'
        },
        {
            id: 'cookies',
            title: 'Cookies et technologies',
            icon: Settings,
            content: 'Nous utilisons des cookies et technologies similaires pour améliorer votre expérience et analyser l\'utilisation de notre plateforme.',
            types: [
                'Cookies essentiels : fonctionnement de la plateforme',
                'Cookies de performance : analyse d\'utilisation',
                'Cookies de fonctionnalité : personnalisation',
                'Cookies de marketing : publicité ciblée',
                'Pixels de suivi : réseaux sociaux',
                'Local storage : préférences utilisateur',
                'Session storage : données temporaires',
                'Web beacons : statistiques d\'email'
            ],
            management: 'Vous pouvez gérer vos préférences de cookies via notre bannière de consentement ou les paramètres de votre navigateur.'
        },
        {
            id: 'third-party',
            title: 'Services tiers',
            icon: Globe,
            content: 'Nous utilisons des services tiers de confiance pour améliorer nos fonctionnalités, tous conformes au RGPD.',
            services: [
                'Google Analytics : analyse d\'utilisation (anonymisée)',
                'Stripe : traitement des paiements sécurisé',
                'SendGrid : envoi d\'emails transactionnels',
                'Cloudflare : sécurité et performance',
                'AWS : hébergement sécurisé',
                'Intercom : support client',
                'HubSpot : gestion de la relation client',
                'Facebook Pixel : publicité ciblée (avec consentement)'
            ],
            protection: 'Tous nos partenaires sont certifiés RGPD et soumis à nos standards de sécurité.'
        },
        {
            id: 'international',
            title: 'Transferts internationaux',
            icon: Map,
            content: 'Vos données peuvent être transférées vers des pays tiers uniquement avec des garanties de protection adéquates.',
            safeguards: [
                'Décisions d\'adéquation de la Commission européenne',
                'Clauses contractuelles types approuvées',
                'Certifications de conformité internationales',
                'Codes de conduite approuvés',
                'Certifications et labels de protection',
                'Accords de transfert spécifiques',
                'Garanties techniques et organisationnelles',
                'Audit régulier des pays de destination'
            ],
            countries: 'Principaux pays : France, Allemagne, États-Unis (avec Privacy Shield), Canada, Royaume-Uni.'
        },
        {
            id: 'children',
            title: 'Protection des mineurs',
            icon: Heart,
            content: 'Nous ne collectons pas sciemment de données personnelles d\'enfants de moins de 16 ans sans le consentement parental.',
            measures: [
                'Vérification d\'âge lors de l\'inscription',
                'Consentement parental obligatoire',
                'Surveillance des contenus inappropriés',
                'Formation de l\'équipe sur la protection des mineurs',
                'Signalement automatique des comptes suspects',
                'Interface adaptée aux mineurs',
                'Contrôles parentaux intégrés',
                'Politique de suppression stricte'
            ],
            reporting: 'Si vous pensez qu\'un mineur a fourni des données sans consentement, contactez-nous immédiatement.'
        },
        {
            id: 'updates',
            title: 'Modifications de la politique',
            icon: TrendingUp,
            content: 'Nous nous réservons le droit de modifier cette politique de confidentialité avec notification préalable.',
            process: [
                'Notification par email 30 jours avant modification',
                'Publication sur la plateforme',
                'Bannière d\'information sur le site',
                'Possibilité de refuser les nouvelles conditions',
                'Résiliation du compte en cas de refus',
                'Archivage des versions précédentes',
                'Communication transparente des changements',
                'Support client pour les questions'
            ],
            effective: 'Les modifications prennent effet 30 jours après notification, sauf urgence légale ou réglementaire.'
        }
    ]

    const stats = [
        { number: '99.9%', label: 'Uptime sécurité' },
        { number: '256-bit', label: 'Chiffrement SSL' },
        { number: '24/7', label: 'Surveillance' },
        { number: 'RGPD', label: 'Conformité' }
    ]

    const features = [
        {
            icon: Shield,
            title: 'Sécurité maximale',
            description: 'Chiffrement de niveau bancaire et surveillance 24/7'
        },
        {
            icon: UserCheck,
            title: 'Contrôle total',
            description: 'Gérez vos données et préférences en toute transparence'
        },
        {
            icon: Lock,
            title: 'Confidentialité',
            description: 'Vos données ne sont jamais vendues à des tiers'
        },
        {
            icon: Globe,
            title: 'Conformité internationale',
            description: 'Respect des réglementations RGPD et locales'
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-accent-600/10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                            Politique de confidentialité
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-3xl mx-auto">
                            Découvrez comment AfriBayit protège vos données personnelles et respecte votre vie privée sur notre plateforme immobilière sécurisée
                        </p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-neutral-500 dark:text-neutral-400 mb-8">
                            <Clock className="w-4 h-4" />
                            <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                                        {stat.number}
                                    </div>
                                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-neutral-700 text-center animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Table of Contents */}
                    <div className="lg:col-span-1 animate-slide-in-left pt-8">
                        <div className="sticky top-0">
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 border border-neutral-200 dark:border-neutral-700">
                                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                    Table des matières
                                </h3>
                                <nav className="space-y-2">
                                    {sections.map((section, index) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="block py-2 px-3 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200"
                                        >
                                            {index + 1}. {section.title}
                                        </a>
                                    ))}
                                </nav>
                                
                                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                                        Contact confidentialité
                                    </h4>
                                    <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                                        <div className="flex items-center space-x-2">
                                            <Mail className="w-3 h-3" />
                                            <span>privacy@afribayit.com</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Phone className="w-3 h-3" />
                                            <span>+33 1 23 45 67 89</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <MapPin className="w-3 h-3" />
                                            <span>Paris, France</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Sections */}
                    <div className="lg:col-span-2 space-y-8 pt-8">
                        {sections.map((section, index) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8 border border-neutral-200 dark:border-neutral-700 animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className="flex items-start space-x-4 mb-6">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                                            <section.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                                            {index + 1}. {section.title}
                                        </h2>
                                        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4">
                                            {section.content}
                                        </p>
                                        {section.commitment && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                                    {section.commitment}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Lists */}
                                {(section.principles || section.categories || section.purposes || section.sharing || section.measures || section.periods || section.rights || section.types || section.services || section.safeguards || section.measures || section.process) && (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                            {section.principles && 'Nos principes fondamentaux'}
                                            {section.categories && 'Types de données collectées'}
                                            {section.purposes && 'Finalités d\'utilisation'}
                                            {section.sharing && 'Politique de partage'}
                                            {section.measures && 'Mesures de sécurité'}
                                            {section.periods && 'Durées de conservation'}
                                            {section.rights && 'Vos droits RGPD'}
                                            {section.types && 'Types de cookies'}
                                            {section.services && 'Services tiers utilisés'}
                                            {section.safeguards && 'Garanties de protection'}
                                            {section.measures && 'Mesures de protection'}
                                            {section.process && 'Processus de modification'}
                                        </h4>
                                        <ul className="space-y-3">
                                            {(section.principles || section.categories || section.purposes || section.sharing || section.measures || section.periods || section.rights || section.types || section.services || section.safeguards || section.measures || section.process)?.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start space-x-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Additional content */}
                                {(section.legalBasis || section.analytics || section.protection || section.incidents || section.deletion || section.exercise || section.management || section.protection || section.countries || section.reporting || section.effective) && (
                                    <div className="mt-6">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                            <div className="flex items-start space-x-2">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                                                        {section.legalBasis && 'Base légale'}
                                                        {section.analytics && 'Analytics et anonymisation'}
                                                        {section.protection && 'Protection des partenaires'}
                                                        {section.incidents && 'Gestion des incidents'}
                                                        {section.deletion && 'Suppression des données'}
                                                        {section.exercise && 'Exercice de vos droits'}
                                                        {section.management && 'Gestion des cookies'}
                                                        {section.protection && 'Protection des données'}
                                                        {section.countries && 'Pays de destination'}
                                                        {section.reporting && 'Signalement'}
                                                        {section.effective && 'Entrée en vigueur'}
                                                    </h5>
                                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                                        {section.legalBasis || section.analytics || section.protection || section.incidents || section.deletion || section.exercise || section.management || section.protection || section.countries || section.reporting || section.effective}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        ))}

                        {/* Contact Section */}
                        <section className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl shadow-lg p-8 text-white animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-4">
                                    Questions sur la confidentialité ?
                                </h2>
                                <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                                    Notre équipe de protection des données est à votre disposition pour répondre à toutes vos questions sur la confidentialité et l'utilisation de vos données personnelles.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                        href="mailto:privacy@afribayit.com"
                                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors duration-200"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Contacter l'équipe confidentialité
                                    </a>
                                    <a
                                        href="/terms"
                                        className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-600 transition-colors duration-200"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Conditions d'utilisation
                                    </a>
                                </div>
                                
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <div className="font-semibold">Sécurisé</div>
                                        <div className="text-primary-200">Chiffrement 256-bit</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <UserCheck className="w-4 h-4" />
                                        </div>
                                        <div className="font-semibold">Contrôle</div>
                                        <div className="text-primary-200">Vos droits respectés</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="font-semibold">Conformité</div>
                                        <div className="text-primary-200">RGPD certifié</div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}