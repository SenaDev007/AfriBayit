import { Metadata } from 'next'
import { Shield, Users, Building, FileText, Clock, CheckCircle, AlertTriangle, Scale, Home, DollarSign, Lock, Globe, Phone, Mail, MapPin, Star, TrendingUp, UserX, Eye, Search, Heart, MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Conditions d\'utilisation - AfriBayit',
    description: 'Conditions d\'utilisation de la plateforme AfriBayit - Plateforme immobilière africaine',
}

export default function TermsPage() {
    const sections = [
        {
            id: 'acceptance',
            title: 'Acceptation des conditions',
            icon: CheckCircle,
            content: 'En accédant et en utilisant la plateforme AfriBayit, vous acceptez d\'être lié par ces conditions d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser notre service.',
            legal: 'Ces conditions constituent un accord légal contraignant entre vous et AfriBayit.'
        },
        {
            id: 'service',
            title: 'Description du service',
            icon: Building,
            content: 'AfriBayit est une plateforme immobilière complète dédiée au marché africain, offrant des services intégrés pour l\'immobilier, l\'hôtellerie, la formation et la communauté.',
            features: [
                'Recherche et consultation de propriétés immobilières',
                'Publication et gestion d\'annonces immobilières',
                'Mise en relation avec des agents et courtiers immobiliers',
                'Services de formation et certification immobilière',
                'Communauté professionnelle et forums de discussion',
                'Services hôteliers et touristiques',
                'Outils d\'analyse de marché et de valorisation',
                'Système de notation et d\'avis clients',
                'Services de financement et d\'assurance',
                'Support multilingue et multicurrency'
            ]
        },
        {
            id: 'account',
            title: 'Compte utilisateur et inscription',
            icon: Users,
            content: 'Pour utiliser nos services, vous devez créer un compte en fournissant des informations exactes et à jour. Nous nous réservons le droit de vérifier votre identité.',
            requirements: [
                'Informations personnelles exactes et complètes',
                'Adresse email valide et vérifiée',
                'Numéro de téléphone vérifié',
                'Mot de passe sécurisé (minimum 12 caractères)',
                'Acceptation de nos conditions d\'utilisation',
                'Respect de nos politiques de confidentialité',
                'Vérification d\'identité pour les services premium',
                'Mise à jour régulière des informations'
            ],
            verification: 'Nous pouvons exiger une vérification d\'identité pour certains services, notamment la publication d\'annonces et les transactions financières.'
        },
        {
            id: 'conduct',
            title: 'Conduite utilisateur et éthique',
            icon: Shield,
            content: 'Les utilisateurs s\'engagent à utiliser la plateforme de manière responsable, éthique et respectueuse de la communauté.',
            rules: [
                'Respecter les autres utilisateurs et la communauté',
                'Ne pas publier de contenu illégal, discriminatoire ou inapproprié',
                'Maintenir la confidentialité des informations sensibles',
                'Utiliser la plateforme conformément à sa destination',
                'Respecter les droits de propriété intellectuelle',
                'Ne pas spammer ou harceler d\'autres utilisateurs',
                'Fournir des informations exactes sur les propriétés',
                'Respecter les lois locales et internationales'
            ],
            prohibited: 'Interdictions strictes : fraude, harcèlement, discrimination, contenu illégal, manipulation de prix, faux avis.'
        },
        {
            id: 'listings',
            title: 'Annonces et contenu',
            icon: Home,
            content: 'Les utilisateurs sont responsables du contenu qu\'ils publient sur la plateforme, notamment les annonces immobilières.',
            requirements: [
                'Photos authentiques et récentes des propriétés',
                'Descriptions exactes et complètes',
                'Prix transparents et actualisés',
                'Informations de contact valides',
                'Respect des droits d\'auteur sur les images',
                'Conformité aux réglementations locales',
                'Mise à jour régulière des annonces',
                'Suppression des annonces expirées'
            ],
            moderation: 'Nous nous réservons le droit de modérer, modifier ou supprimer tout contenu qui ne respecte pas nos conditions.'
        },
        {
            id: 'transactions',
            title: 'Transactions et paiements',
            icon: DollarSign,
            content: 'AfriBayit facilite les transactions immobilières mais n\'est pas responsable des accords entre parties.',
            terms: [
                'Transactions directes entre utilisateurs',
                'Frais de service transparents',
                'Sécurité des paiements garantie',
                'Protection contre la fraude',
                'Remboursements selon nos politiques',
                'Conformité aux réglementations financières',
                'Traçabilité des transactions',
                'Support client pour les litiges'
            ],
            disclaimer: 'AfriBayit agit en tant qu\'intermédiaire et ne garantit pas la réussite des transactions.'
        },
        {
            id: 'privacy',
            title: 'Protection des données et confidentialité',
            icon: Lock,
            content: 'Nous nous engageons à protéger vos données personnelles conformément au RGPD, aux lois locales et aux meilleures pratiques de sécurité.',
            protections: [
                'Collecte minimale de données nécessaires',
                'Chiffrement des données sensibles',
                'Accès restreint aux données personnelles',
                'Droit à l\'oubli et à la portabilité',
                'Transparence sur l\'utilisation des données',
                'Sécurité des serveurs et bases de données',
                'Formation du personnel à la protection des données',
                'Audits de sécurité réguliers'
            ],
            cookies: 'Nous utilisons des cookies pour améliorer votre expérience et analyser l\'utilisation de la plateforme.'
        },
        {
            id: 'intellectual',
            title: 'Propriété intellectuelle',
            icon: FileText,
            content: 'Tous les contenus de la plateforme AfriBayit sont protégés par les droits de propriété intellectuelle.',
            rights: [
                'Marques et logos AfriBayit protégés',
                'Contenu de la plateforme sous copyright',
                'Algorithmes et technologies propriétaires',
                'Base de données protégée',
                'Design et interface utilisateur',
                'Contenus de formation exclusifs',
                'Rapports de marché et analyses',
                'Outils de valorisation propriétaires'
            ],
            userContent: 'Vous conservez les droits sur vos contenus mais accordez à AfriBayit une licence d\'utilisation pour les services de la plateforme.'
        },
        {
            id: 'liability',
            title: 'Limitation de responsabilité',
            icon: AlertTriangle,
            content: 'AfriBayit agit en tant qu\'intermédiaire et ne peut être tenu responsable des transactions entre utilisateurs ou des dommages indirects.',
            limitations: [
                'Vérification indépendante des informations recommandée',
                'Responsabilité des utilisateurs pour leurs transactions',
                'Exclusion de garanties implicites',
                'Limitation des dommages indirects',
                'Force majeure et événements imprévisibles',
                'Limitation de responsabilité financière',
                'Exclusion de responsabilité pour les tiers',
                'Obligation de diligence des utilisateurs'
            ],
            insurance: 'Nous recommandons aux utilisateurs de souscrire des assurances appropriées pour leurs activités.'
        },
        {
            id: 'termination',
            title: 'Suspension et résiliation',
            icon: UserX,
            content: 'Nous nous réservons le droit de suspendre ou résilier les comptes qui violent nos conditions d\'utilisation.',
            grounds: [
                'Violation des conditions d\'utilisation',
                'Comportement frauduleux ou illégal',
                'Harcèlement d\'autres utilisateurs',
                'Publication de contenu inapproprié',
                'Non-paiement des frais de service',
                'Fausses informations sur l\'identité',
                'Utilisation abusive de la plateforme',
                'Non-respect des lois applicables'
            ],
            process: 'La résiliation suit un processus équitable avec notification préalable et possibilité de recours.'
        },
        {
            id: 'disputes',
            title: 'Résolution des litiges',
            icon: Scale,
            content: 'Nous encourageons la résolution amiable des conflits et proposons des mécanismes de médiation.',
            process: [
                'Contact direct avec notre service client',
                'Médiation par nos équipes spécialisées',
                'Arbitrage en cas d\'échec de la médiation',
                'Recours aux tribunaux compétents',
                'Application du droit applicable',
                'Juridiction des tribunaux locaux',
                'Processus de plainte transparent',
                'Suivi et résolution des cas'
            ],
            jurisdiction: 'Les litiges sont soumis à la juridiction des tribunaux compétents selon votre localisation.'
        },
        {
            id: 'updates',
            title: 'Modifications des conditions',
            icon: TrendingUp,
            content: 'Nous nous réservons le droit de modifier ces conditions d\'utilisation avec notification préalable.',
            process: [
                'Notification par email 30 jours avant modification',
                'Publication sur la plateforme',
                'Possibilité de refuser les nouvelles conditions',
                'Résiliation du compte en cas de refus',
                'Acceptation tacite par la poursuite d\'utilisation',
                'Archivage des versions précédentes',
                'Communication transparente des changements',
                'Support client pour les questions'
            ],
            effective: 'Les modifications prennent effet 30 jours après notification, sauf urgence légale.'
        }
    ]

    const stats = [
        { number: '50,000+', label: 'Propriétés listées' },
        { number: '25,000+', label: 'Utilisateurs actifs' },
        { number: '15+', label: 'Pays couverts' },
        { number: '98%', label: 'Satisfaction client' }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-accent-600/10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full mb-6">
                            <Scale className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
                            Conditions d'utilisation
                        </h1>
                        <p className="text-xl text-neutral-600 dark:text-neutral-300 mb-8 max-w-3xl mx-auto">
                            Découvrez nos conditions d'utilisation pour une expérience transparente et sécurisée sur AfriBayit, la plateforme immobilière de référence en Afrique
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
                                        Contact légal
                                    </h4>
                                    <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
                                        <div className="flex items-center space-x-2">
                                            <Mail className="w-3 h-3" />
                                            <span>legal@afribayit.com</span>
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
                                        {section.legal && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                                                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                                                    {section.legal}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Features/Requirements/Rules Lists */}
                                {(section.features || section.requirements || section.rules || section.protections || section.limitations || section.terms || section.rights || section.grounds || section.process) && (
                                    <div className="mt-6">
                                        <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                            {section.features && 'Fonctionnalités principales'}
                                            {section.requirements && 'Exigences d\'inscription'}
                                            {section.rules && 'Règles de conduite'}
                                            {section.protections && 'Mesures de protection'}
                                            {section.limitations && 'Limitations de responsabilité'}
                                            {section.terms && 'Conditions de transaction'}
                                            {section.rights && 'Droits de propriété intellectuelle'}
                                            {section.grounds && 'Motifs de suspension'}
                                            {section.process && 'Processus de résolution'}
                                        </h4>
                                        <ul className="space-y-3">
                                            {(section.features || section.requirements || section.rules || section.protections || section.limitations || section.terms || section.rights || section.grounds || section.process)?.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-start space-x-3">
                                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                    <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Additional content */}
                                {(section.verification || section.prohibited || section.moderation || section.disclaimer || section.insurance || section.cookies || section.userContent || section.effective || section.jurisdiction) && (
                                    <div className="mt-6">
                                        {(section.verification || section.prohibited || section.moderation || section.disclaimer || section.insurance || section.cookies || section.userContent || section.effective || section.jurisdiction) && (
                                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                                                <div className="flex items-start space-x-2">
                                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h5 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                                                            {section.verification && 'Vérification d\'identité'}
                                                            {section.prohibited && 'Interdictions strictes'}
                                                            {section.moderation && 'Modération du contenu'}
                                                            {section.disclaimer && 'Avertissement'}
                                                            {section.insurance && 'Assurance recommandée'}
                                                            {section.cookies && 'Utilisation des cookies'}
                                                            {section.userContent && 'Contenu utilisateur'}
                                                            {section.effective && 'Entrée en vigueur'}
                                                            {section.jurisdiction && 'Juridiction compétente'}
                                                        </h5>
                                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                                            {section.verification || section.prohibited || section.moderation || section.disclaimer || section.insurance || section.cookies || section.userContent || section.effective || section.jurisdiction}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        ))}

                        {/* Contact Section */}
                        <section className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl shadow-lg p-8 text-white animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-4">
                                    Questions sur nos conditions ?
                                </h2>
                                <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
                                    Notre équipe juridique est à votre disposition pour clarifier tout point de nos conditions d'utilisation et vous accompagner dans votre utilisation de la plateforme.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <a
                                        href="mailto:legal@afribayit.com"
                                        className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors duration-200"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Contacter l'équipe juridique
                                    </a>
                                    <a
                                        href="/privacy"
                                        className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary-600 transition-colors duration-200"
                                    >
                                        <Shield className="w-4 h-4 mr-2" />
                                        Politique de confidentialité
                                    </a>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="font-semibold">Multilingue</div>
                                        <div className="text-primary-200">Support en 5 langues</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                        <div className="font-semibold">Sécurisé</div>
                                        <div className="text-primary-200">Données protégées</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <Star className="w-4 h-4" />
                                        </div>
                                        <div className="font-semibold">Certifié</div>
                                        <div className="text-primary-200">Conformité RGPD</div>
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