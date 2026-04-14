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
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

const services = [
  {
    icon: Building2,
    title: 'Immobilier vérifié',
    description: 'Inventaire résidentiel et commercial avec scoring confiance et filtrage métier',
    features: [
      'Annonce validée KYC/KYB',
      'Contrôle documentaire et conformité',
      'Scoring de risque géospatial',
      'Parcours acquisition/livraison'
    ],
    color: 'from-[#003087] to-[#009CDE]',
    bgColor: 'from-[#eef3ff] to-[#dde9ff]'
  },
  {
    icon: Hotel,
    title: 'Hôtellerie OTA/GDS',
    description: 'Agrégation DB/LIVE/HYBRID avec disponibilité et tarification consolidées',
    features: [
      'Connecteurs Amadeus/Expedia/Booking',
      'Rate-limit et cache serveurs',
      'Persistance snapshot des tarifs',
      'Pipeline réservation extensible'
    ],
    color: 'from-[#00A651] to-[#0b7f44]',
    bgColor: 'from-[#ebfff4] to-[#d7f7e7]'
  },
  {
    icon: GraduationCap,
    title: 'Académie & montée en compétences',
    description: 'Parcours certifiants pour investisseurs, agents et opérateurs immobiliers',
    features: [
      'Programmes professionnalisants',
      'Suivi de progression apprenant',
      'Contenus orientés terrain Afrique',
      'Certification orientée employabilité'
    ],
    color: 'from-[#2C2E2F] to-[#101112]',
    bgColor: 'from-[#f0f1f2] to-[#e1e4e6]'
  },
  {
    icon: Users,
    title: 'Communauté investisseurs',
    description: 'Forum, entraide et intelligence collective pour sécuriser les décisions',
    features: [
      'Discussions modérées par catégorie',
      'Capitalisation retours terrain',
      'Mentorat et réponses experts',
      'Canal de veille marché'
    ],
    color: 'from-[#D4AF37] to-[#b8932c]',
    bgColor: 'from-[#fff8e8] to-[#f8ecc8]'
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
  const router = useRouter()
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const handleServiceClick = (serviceTitle: string) => {
    console.log('Service clicked:', serviceTitle)
    // Routage explicite par module CDC
    switch (serviceTitle) {
      case 'Immobilier vérifié':
        router.push('/properties')
        break
      case 'Hôtellerie OTA/GDS':
        router.push('/hotels')
        break
      case 'Académie & montée en compétences':
        router.push('/learning')
        break
      case 'Communauté investisseurs':
        router.push('/community')
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
              Modules opérationnels AfriBayit
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
              Chaque module couvre un maillon critique du parcours immobilier, de la découverte à la transaction sécurisée.
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
              Fondations technologiques
            </h3>
            <p className="text-xl text-neutral-600 dark:text-neutral-300">
              Une architecture pensée pour la conformité, la traçabilité et la performance.
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
