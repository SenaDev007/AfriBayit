'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { geometerServices, formatPrice } from '@/lib/mockData';

const easeOut = [0.16, 1, 0.3, 1] as const;

const geometers = [
  {
    id: 'g1',
    name: 'Ing. Paul Dossou',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    city: 'Cotonou',
    country: 'Bénin',
    rating: 4.9,
    reviews: 67,
    certifications: ['Géomètre Expert', 'GeoTrust Certifié', 'Drone License'],
    missions: 156,
  },
  {
    id: 'g2',
    name: 'Ing. Aïssatou Bah',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    rating: 4.8,
    reviews: 45,
    certifications: ['Géomètre Expert', 'Topographe'],
    missions: 89,
  },
  {
    id: 'g3',
    name: 'Ing. Komlan Agbéko',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    city: 'Lomé',
    country: 'Togo',
    rating: 4.7,
    reviews: 34,
    certifications: ['Géomètre Certifié', 'GeoTrust'],
    missions: 67,
  },
];

export default function GeoTrustModule() {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#009CDE]/10 text-[#009CDE] text-sm font-semibold mb-4">
            🗺️ GeoTrust
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Géomètres <span className="text-[#009CDE]">Certifiés</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Faites vérifier votre terrain par des géomètres professionnels certifiés GeoTrust. Superficie, bornage, et certification garantis.
          </p>
        </motion.div>

        {/* Service Catalog */}
        <div className="mb-10">
          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {geometerServices.map((service, i) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedService(service.id)}
                className={`bg-white rounded-3xl p-5 shadow-sm border-2 cursor-pointer transition-all ${
                  selectedService === service.id ? 'border-[#009CDE]' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <span className="text-3xl block mb-3">{service.icon}</span>
                <h3 className="font-semibold text-[#2C2E2F] mb-1">{service.name}</h3>
                <p className="text-xs text-gray-500 mb-3">{service.description}</p>
                <p className="font-mono-data text-sm font-bold text-[#D4AF37]">{service.price}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Geometer Profiles */}
        <div>
          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Nos Géomètres</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {geometers.map((geo, i) => (
              <motion.div
                key={geo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1, ease: easeOut }}
                className="bg-white rounded-3xl p-6 shadow-sm border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <img src={geo.avatar} alt={geo.name} className="w-14 h-14 rounded-full object-cover border-2 border-[#009CDE]" />
                  <div>
                    <h3 className="font-semibold text-[#2C2E2F]">{geo.name}</h3>
                    <p className="text-xs text-gray-500">{geo.city}, {geo.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {geo.rating} ({geo.reviews} avis)
                  </span>
                  <span>{geo.missions} missions</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {geo.certifications.map((cert) => (
                    <span key={cert} className="px-2.5 py-1 bg-[#009CDE]/5 text-[#009CDE] text-[10px] font-medium rounded-full">
                      {cert}
                    </span>
                  ))}
                </div>
                <button className="w-full py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                  Demander un devis
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mission Workflow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 bg-white rounded-3xl p-6 shadow-sm border"
        >
          <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Workflow de Mission</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {[
              { step: '1', title: 'Demande', desc: 'Décrivez votre besoin', icon: '📋' },
              { step: '2', title: 'Devis', desc: 'Recevez un devis détaillé', icon: '💰' },
              { step: '3', title: 'Mission', desc: 'Le géomètre intervient', icon: '📍' },
              { step: '4', title: 'Rapport', desc: 'Recevez le certificat GeoTrust', icon: '✅' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-[#009CDE]/10 flex items-center justify-center text-lg shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2E2F]">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
