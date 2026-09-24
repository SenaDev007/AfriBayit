'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import {
  Home,
  Building2,
  Hotel,
  ShieldCheck,
  MapPin,
  TrendingUp,
  Users,
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  BarChart3,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface ProjectStat {
  units?: number;
  sold?: number | string;
  rooms?: number;
  occupancy?: string;
  surface?: string;
  value: string;
}

interface Project {
  country: string;
  flag: string;
  title: string;
  location: string;
  type: string;
  description: string;
  stats: ProjectStat;
  tags: string[];
  image: string;
}

const PROJECTS: Project[] = [
  {
    country: "Côte d'Ivoire",
    flag: '🇨🇮',
    title: 'Résidence Les Palmiers',
    location: 'Cocody, Abidjan',
    type: 'Résidentiel',
    description:
      "Complex résidentiel de 48 appartements haut standing avec piscine, espace coworking et jardin paysager. Chaque unité dispose d'une certification GeoTrust et d'un suivi notarial complet pour garantir la transparence de la transaction.",
    stats: { units: 48, sold: 42, value: '3.2 Mds FCFA' },
    tags: ['GeoTrust Certifié', 'Escrow Sécurisé', 'Notaire Assigné'],
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop',
  },
  {
    country: 'Bénin',
    flag: '🇧🇯',
    title: 'Éco-Village de Ganhi',
    location: 'Ganhi, Cotonou',
    type: 'Éco-résidentiel',
    description:
      "Projet éco-responsable de 24 villas avec énergie solaire, récupération d'eau de pluie et matériaux locaux. Le premier projet immobilier au Bénin certifié GeoTrust de bout en bout, avec bornage GPS et modélisation 3D complète.",
    stats: { units: 24, sold: 18, value: '1.8 Md FCFA' },
    tags: ['Éco-responsable', 'GeoTrust 3D', 'Énergie Solaire'],
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop',
  },
  {
    country: 'Sénégal',
    flag: '🇸🇳',
    title: 'Hôtel Baobab Premium',
    location: 'Almadies, Dakar',
    type: 'Hôtellerie',
    description:
      "Hôtel 4 étoiles de 120 chambres avec vue sur l'Atlantique, intégré au réseau AfriBayit Hospitality. Connexion OTA automatisée avec les plateformes de voyage, gestion des réservations en temps réel et programme de fidélité AfriPoints.",
    stats: { rooms: 120, occupancy: '87%', value: '5.1 Mds FCFA' },
    tags: ['OTA Connecté', 'AfriPoints', 'PMS Intégré'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop',
  },
  {
    country: 'Togo',
    flag: '🇹🇬',
    title: 'Résidence Les Cascades',
    location: 'Kpalimé',
    type: 'Résidentiel',
    description:
      "Programme immobilier de 36 appartements et 12 villas dans la région montagneuse de Kpalimé. Chaque bien bénéficie d'une inspection GeoTrust complète et d'un escrow sécurisé via FedaPay pour des transactions transparentes et fiables.",
    stats: { units: 48, sold: 31, value: '1.2 Md FCFA' },
    tags: ['Escrow FedaPay', 'Inspection GeoTrust', 'Montagne'],
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop',
  },
  {
    country: 'Burkina Faso',
    flag: '🇧🇫',
    title: 'Centre Affaires Ouaga',
    location: 'Ouagadougou',
    type: 'Commercial',
    description:
      "Centre d'affaires moderne de 15 000 m² avec espaces de bureaux, salles de conférence et zone commerciale. Le projet intègre un système de gestion immobilier intelligent et une certification GeoTrust pour chaque lot commercial.",
    stats: { surface: '15 000 m²', sold: '78%', value: '4.5 Mds FCFA' },
    tags: ['Commercial', 'Smart Building', 'GeoTrust Pro'],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop',
  },
];

interface StatItem {
  labelKey: 'statPropertiesLabel' | 'statVolumeLabel' | 'statCountriesLabel' | 'statSatisfactionLabel';
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATS: StatItem[] = [
  { labelKey: 'statPropertiesLabel', value: '2 400+', icon: Home },
  { labelKey: 'statVolumeLabel', value: '15.8 Mds FCFA', icon: TrendingUp },
  { labelKey: 'statCountriesLabel', value: '5', icon: Globe },
  { labelKey: 'statSatisfactionLabel', value: '98%', icon: Star },
];

interface ServiceItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const SERVICES: ServiceItem[] = [
  {
    icon: ShieldCheck,
    title: 'GeoTrust Certification',
    description:
      'Chaque bien est vérifié par un géomètre certifié : bornage GPS, inspection immobilière, modélisation 3D. La certification GeoTrust garantit la conformité et la transparence des transactions.',
  },
  {
    icon: Building2,
    title: 'Escrow Sécurisé',
    description:
      "Les fonds sont bloqués sur un compte séquestre jusqu'à la signature de l'acte notarié. Le système de release automatique protège acheteur et vendeur tout au long du processus.",
  },
  {
    icon: Hotel,
    title: 'Hospitalité Connectée',
    description:
      "Hôtels et guesthouses intégrés au réseau OTA mondial. Gestion centralisée des réservations, tarification dynamique et programme de fidélité pour maximiser le taux d'occupation.",
  },
  {
    icon: BarChart3,
    title: 'Analytics Immobilier',
    description:
      "Données de marché en temps réel, estimation AVM automatisée et indicateurs de performance. Des outils décisionnels pour investisseurs et promoteurs immobiliers.",
  },
];

function statUnitLabel(
  key: string,
  t: (path: string, fallback?: string) => string
): string {
  switch (key) {
    case 'units':
      return t('ourWorkPage.statUnitUnits', 'Unités');
    case 'sold':
      return t('ourWorkPage.statUnitSold', 'Vendus');
    case 'rooms':
      return t('ourWorkPage.statUnitRooms', 'Chambres');
    case 'occupancy':
      return t('ourWorkPage.statUnitOccupancy', 'Occupation');
    case 'surface':
      return t('ourWorkPage.statUnitSurface', 'Surface');
    case 'value':
      return t('ourWorkPage.statUnitValue', 'Valeur');
    default:
      return key;
  }
}

export default function OurWorkPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section — P6 */}
      <section className="pt-28 pb-20 bg-primary-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary-green/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 -left-20 w-72 h-72 bg-accent-yellow/10 rounded-full blur-[100px]" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-sm text-white/80 mb-6">
              <MapPin className="w-4 h-4 text-accent-yellow" />
              {t('ourWorkPage.heroBadge', "5 pays en Afrique de l'Ouest")}
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
              {t('ourWorkPage.heroTitle', 'Nos Réalisations')}
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              {t(
                'ourWorkPage.heroDesc',
                "Découvrez comment AfriBayit transforme le marché immobilier en Afrique de l'Ouest avec des transactions sécurisées, des certifications géolocalisées et une technologie de pointe au service de la transparence."
              )}
            </p>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12"
          >
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.labelKey}
                  className="bg-white/10 backdrop-blur-sm rounded-3xl p-5 text-center border border-white/10"
                >
                  <Icon className="w-6 h-6 text-accent-yellow mx-auto mb-2" />
                  <p className="font-mono-data text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">
                    {t(`ourWorkPage.${stat.labelKey}`, stat.labelKey)}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 sm:py-24 bg-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
              {t('ourWorkPage.portfolioBadge', 'Portfolio')}
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
              {t('ourWorkPage.projectsTitle', 'Projets Phares')}
            </h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
            <p className="text-gray-text max-w-2xl mx-auto mt-4">
              {t(
                'ourWorkPage.projectsDesc',
                "Des projets immobiliers et hôteliers qui illustrent notre engagement pour des transactions transparentes et sécurisées en Afrique de l'Ouest."
              )}
            </p>
          </motion.div>

          <div className="space-y-8">
            {PROJECTS.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: easeOut }}
                className="bg-white rounded-3xl shadow-lg border border-primary-pale overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Image */}
                  <div className="lg:w-2/5 relative">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-64 lg:h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-primary-deep border border-primary-pale">
                        {project.flag} {project.country}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:w-3/5 p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold text-accent-dark uppercase tracking-wider">
                          {project.type}
                        </span>
                        <h3 className="font-serif text-2xl font-bold text-primary-deep mt-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-text/80 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {project.location}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-text leading-relaxed mb-5">
                      {project.description}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mb-5">
                      {Object.entries(project.stats).map(([key, val]) => (
                        <div
                          key={key}
                          className="bg-primary-pale/60 rounded-2xl px-4 py-2.5 text-center"
                        >
                          <p className="font-mono-data text-lg font-bold text-primary-deep">
                            {val}
                          </p>
                          <p className="text-[10px] text-gray-text/80 uppercase tracking-wider">
                            {statUnitLabel(key, t)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary-pale text-primary-deep border border-primary-green/20 text-xs font-bold rounded-full"
                        >
                          <CheckCircle className="w-3 h-3 text-primary-green" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
              Expertise
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-primary-deep leading-tight">
              {t('ourWorkPage.approachTitle', 'Notre Approche')}
            </h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full" />
            <p className="text-gray-text max-w-2xl mx-auto mt-4">
              {t(
                'ourWorkPage.approachDesc',
                "Une technologie propriétaire au service de la confiance immobilière en Afrique de l'Ouest. Chaque transaction bénéficie d'un écosystème de vérification et sécurité complet."
              )}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: easeOut }}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-pale flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-green" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-primary-deep mb-2">
                    {service.title}
                  </h3>
                  <p className="text-sm text-gray-text leading-relaxed">
                    {service.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary-deep relative overflow-hidden">
        <div className="absolute inset-0 bg-grain opacity-[0.03]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-yellow/10 rounded-full blur-[100px]" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-serif text-3xl font-extrabold text-white mb-4">
              {t('ourWorkPage.ctaTitle', "Rejoignez l'aventure AfriBayit")}
            </h2>
            <div className="h-1 w-16 bg-accent-yellow mx-auto mt-6 mb-6 rounded-full" />
            <p className="text-white/70 mb-8">
              {t(
                'ourWorkPage.ctaDesc',
                "Que vous soyez acheteur, vendeur, investisseur ou hôtelier, notre plateforme offre les outils et la sécurité pour concrétiser vos projets immobiliers en Afrique de l'Ouest."
              )}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/search')}
                className="px-8 py-3.5 bg-white text-primary-deep rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {t('ourWorkPage.ctaExplore', 'Explorer les biens')}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/publish')}
                className="px-8 py-3.5 bg-accent-yellow text-primary-deep rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                {t('ourWorkPage.ctaPublish', 'Publier une annonce')}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
