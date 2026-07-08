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

const easeOut = [0.16, 1, 0.3, 1] as const;

const PROJECTS = [
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

const STATS = [
  { label: 'Biens transactés', value: '2 400+', icon: Home },
  { label: 'Volume total', value: '15.8 Mds FCFA', icon: TrendingUp },
  { label: 'Pays couverts', value: '5', icon: Globe },
  { label: 'Clients satisfaits', value: '98%', icon: Star },
];

const SERVICES = [
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
      'Les fonds sont bloqués sur un compte séquestre jusqu\'à la signature de l\'acte notarié. Le système de release automatique protège acheteur et vendeur tout au long du processus.',
  },
  {
    icon: Hotel,
    title: 'Hospitalité Connectée',
    description:
      'Hôtels et guesthouses intégrés au réseau OTA mondial. Gestion centralisée des réservations, tarification dynamique et programme de fidélité pour maximiser le taux d\'occupation.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Immobilier',
    description:
      'Données de marché en temps réel, estimation AVM automatisée et indicateurs de performance. Des outils décisionnels pour investisseurs et promoteurs immobiliers.',
  },
];

export default function OurWorkPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-28 pb-20 bg-gradient-to-br from-[#003087] via-[#001f5c] to-[#003087] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37] rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm text-white/80 mb-6">
              <MapPin className="w-4 h-4" />
              5 pays en Afrique de l&apos;Ouest
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
              Nos Réalisations
            </h1>
            <p className="text-lg text-white/70 leading-relaxed">
              Découvrez comment AfriBayit transforme le marché immobilier en Afrique de l&apos;Ouest
              avec des transactions sécurisées, des certifications géolocalisées et une
              technologie de pointe au service de la transparence.
            </p>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOut }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12"
          >
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 text-center"
              >
                <stat.icon className="w-6 h-6 text-[#D4AF37] mx-auto mb-2" />
                <p className="font-mono-data text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-16 sm:py-24 bg-gray-50/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-[#2C2E2F] mb-4">
              Projets Phares
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Des projets immobiliers et hôteliers qui illustrent notre engagement pour des
              transactions transparentes et sécurisées en Afrique de l&apos;Ouest.
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
                className="bg-white rounded-3xl shadow-sm border overflow-hidden"
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
                      <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-[#003087]">
                        {project.flag} {project.country}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="lg:w-3/5 p-6 lg:p-8">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-medium text-[#D4AF37] uppercase tracking-wider">
                          {project.type}
                        </span>
                        <h3 className="font-display text-2xl font-bold text-[#2C2E2F] mt-1">
                          {project.title}
                        </h3>
                        <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {project.location}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed mb-5">
                      {project.description}
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mb-5">
                      {Object.entries(project.stats).map(([key, val]) => (
                        <div
                          key={key}
                          className="bg-gray-50 rounded-xl px-4 py-2.5 text-center"
                        >
                          <p className="font-mono-data text-lg font-bold text-[#003087]">
                            {val}
                          </p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                            {key === 'units'
                              ? 'Unités'
                              : key === 'sold'
                              ? 'Vendus'
                              : key === 'rooms'
                              ? 'Chambres'
                              : key === 'occupancy'
                              ? 'Occupation'
                              : key === 'surface'
                              ? 'Surface'
                              : key === 'value'
                              ? 'Valeur'
                              : key}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#00A651]/5 text-[#00A651] text-xs font-medium rounded-full"
                        >
                          <CheckCircle className="w-3 h-3" />
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
      <section className="py-16 sm:py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-3xl font-bold text-[#2C2E2F] mb-4">
              Notre Approche
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Une technologie propriétaire au service de la confiance immobilière en Afrique de
              l&apos;Ouest. Chaque transaction bénéficie d&apos;un écosystème de vérification et
              sécurité complet.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: easeOut }}
                className="bg-white rounded-3xl p-6 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#003087]/10 flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-[#003087]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-[#003087] to-[#001f5c] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] rounded-full blur-3xl" />
        </div>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              Rejoignez l&apos;aventure AfriBayit
            </h2>
            <p className="text-white/70 mb-8">
              Que vous soyez acheteur, vendeur, investisseur ou hôtelier, notre plateforme
              offre les outils et la sécurité pour concrétiser vos projets immobiliers en
              Afrique de l&apos;Ouest.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => router.push('/search')}
                className="px-8 py-3.5 bg-white text-[#003087] rounded-full font-semibold text-sm hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                Explorer les biens <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/publish')}
                className="px-8 py-3.5 bg-[#D4AF37] text-white rounded-full font-semibold text-sm hover:bg-[#b8961f] transition-colors flex items-center gap-2"
              >
                Publier une annonce <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
