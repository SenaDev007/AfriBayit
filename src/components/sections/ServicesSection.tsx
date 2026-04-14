'use client'

import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Building2,
  Hotel,
  GraduationCap,
  Users,
  Search,
  Brain,
  Shield,
  ArrowRight
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'

const services = [
  {
    icon: Building2,
    title: 'Recherche de Propriétés',
    description: 'IA avancée, visites virtuelles 360°, et recommandations personnalisées',
    features: [
      'Recherche conversationnelle par IA',
      'Visites virtuelles immersives',
      'Recommandations personnalisées',
      'Analyse prédictive des prix'
    ],
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-blue-100'
  },
  {
    icon: Hotel,
    title: 'Réservation Hôtelière',
    description: 'Hôtels de luxe et hébergements locaux avec réservation instantanée',
    features: [
      'Réservation instantanée',
      'Comparaison de prix temps réel',
      'Check-in numérique',
      'Concierge virtuel'
    ],
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-green-100'
  },
  {
    icon: GraduationCap,
    title: 'Académie Immobilière',
    description: 'Formations certifiantes et conseils d\'experts pour investir intelligemment',
    features: [
      'Cours en ligne interactifs',
      'Certifications reconnues',
      'Mentorat individuel',
      'Bibliothèque de ressources'
    ],
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-purple-100'
  },
  {
    icon: Users,
    title: 'Communauté',
    description: 'Réseau d\'experts, forums et événements de networking',
    features: [
      'Forums spécialisés',
      'Événements de networking',
      'Système de mentorat',
      'Marketplace de services'
    ],
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-orange-100'
  }
]

const technologies = [
  {
    icon: Brain,
    title: 'Intelligence Artificielle',
    description: 'IA conversationnelle et recommandations personnalisées'
  },
  {
    icon: Search,
    title: 'Recherche Avancée',
    description: 'Algorithmes intelligents et filtres personnalisés'
  },
  {
    icon: Shield,
    title: 'Sécurité Avancée',
    description: 'Chiffrement end-to-end et authentification biométrique'
  }
]

export function ServicesSection() {
  const { t } = useLanguage()
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const handleServiceClick = (serviceTitle: string) => {
    console.log('Service clicked:', serviceTitle)
    // Navigate to appropriate page based on service
    switch (serviceTitle) {
      case 'Recherche de Propriétés':
        window.location.href = '/properties'
        break
      case 'Réservation Hôtelière':
        window.location.href = '/hotels'
        break
      case 'Académie Immobilière':
        window.location.href = '/learning'
        break
      case 'Communauté':
        window.location.href = '/community'
        break
      default:
        console.log('Unknown service:', serviceTitle)
    }
  }

  return (
    <section ref={ref} className="py-20 bg-white dark:bg-neutral-900">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {t('services.title')}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t('services.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="card card-hover h-full">
                <div className={`p-8 bg-gradient-to-br ${service.bgColor} rounded-t-xl`}>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                        {service.title}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-300">
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <ul className="space-y-3 mb-6">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-neutral-600 dark:text-neutral-300">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleServiceClick(service.title)}
                    variant="outline"
                    className="w-full group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all duration-300"
                  >
                    En savoir plus
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technologies Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-gradient-to-br from-neutral-50 to-primary-50 dark:from-neutral-800 dark:to-primary-900/20 rounded-3xl p-12"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Technologies Révolutionnaires
            </h3>
            <p className="text-xl text-neutral-600 dark:text-neutral-300">
              Des innovations de pointe pour une expérience immobilière unique
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {technologies.map((tech, index) => (
              <motion.div
                key={tech.title}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="text-center group"
              >
                <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <tech.icon className="w-10 h-10 text-primary-600" />
                </div>
                <h4 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  {tech.title}
                </h4>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
