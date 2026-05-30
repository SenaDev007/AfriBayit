'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { properties, agents, formatPrice } from '@/lib/mockData';

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
  onNavigate: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function PropertyDetail({ propertyId, onBack, onNavigate }: PropertyDetailProps) {
  const property = properties.find(p => p.id === propertyId);
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  if (!property) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-gray-400">Bien non trouvé</h2>
          <button onClick={onBack} className="mt-4 text-[#003087] font-semibold text-sm">Retour</button>
        </div>
      </div>
    );
  }

  const agent = agents.find(a => a.id === property.agentId);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux résultats
        </motion.button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - 65% */}
          <div className="flex-1 lg:max-w-[65%]">
            {/* Photo Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="mb-6"
            >
              <div className="relative rounded-3xl overflow-hidden aspect-[16/10] bg-gray-100">
                <img
                  src={property.images[activeImage]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                {/* VR Badge */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {property.verified && (
                    <span className="px-3 py-1.5 bg-[#00A651] text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Documents vérifiés
                    </span>
                  )}
                  {property.geoTrust && (
                    <span className="px-3 py-1.5 bg-[#009CDE] text-white text-xs font-bold rounded-full flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                      </svg>
                      GeoTrust
                    </span>
                  )}
                  <span className="px-3 py-1.5 bg-white/90 backdrop-blur text-xs font-bold rounded-full text-gray-700 flex items-center gap-1.5">
                    <span className="text-lg">🥽</span> VR 360°
                  </span>
                </div>
                {/* Nav arrows */}
                {property.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((prev) => (prev - 1 + property.images.length) % property.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveImage((prev) => (prev + 1) % property.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                {/* Image counter */}
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full backdrop-blur">
                  {activeImage + 1} / {property.images.length}
                </div>
              </div>
              {/* Thumbnails */}
              {property.images.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {property.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-colors ${
                        i === activeImage ? 'border-[#003087]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Title & Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
              className="mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                {property.premium && (
                  <span className="px-2.5 py-0.5 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">Premium</span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-2">
                {property.title}
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {property.quartier}, {property.city}, {property.country}
              </p>
            </motion.div>

            {/* Key specs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
              className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl mb-6"
            >
              {property.bedrooms > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-[#2C2E2F]">{property.bedrooms}</span>
                    <span className="text-xs text-gray-500 ml-1">Chambres</span>
                  </div>
                </div>
              )}
              {property.bathrooms > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-[#2C2E2F]">{property.bathrooms}</span>
                    <span className="text-xs text-gray-500 ml-1">SdB</span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-[#2C2E2F]">{property.surface}</span>
                  <span className="text-xs text-gray-500 ml-1">m²</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#003087]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-bold text-[#2C2E2F]">{property.views}</span>
                  <span className="text-xs text-gray-500 ml-1">Vues</span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
              className="mb-6"
            >
              <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-3">Description</h2>
              <p className="text-gray-600 leading-relaxed">{property.description}</p>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: easeOut }}
              className="mb-6"
            >
              <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-3">Équipements</h2>
              <div className="flex flex-wrap gap-2">
                {property.features.map((feature) => (
                  <span key={feature} className="px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-600 font-medium">
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
              className="mb-6"
            >
              <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-3">Localisation</h2>
              <div className="h-64 rounded-3xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-200">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-gray-400">Carte Mapbox</p>
                  <p className="text-xs text-gray-300">{property.quartier}, {property.city}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - 35% Sticky */}
          <div className="lg:w-[35%] shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
              className="lg:sticky lg:top-24"
            >
              {/* Price Box */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border mb-4">
                <div className="mb-4">
                  <p className="font-mono-data text-3xl sm:text-4xl font-bold text-[#D4AF37] mb-1">
                    {property.priceLabel}
                  </p>
                  {property.transaction === 'location' && (
                    <p className="text-xs text-gray-400">Charges comprises si indiqué</p>
                  )}
                </div>

                {/* Escrow Badge */}
                <div className="flex items-center gap-2 p-3 bg-[#00A651]/5 rounded-2xl mb-5">
                  <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#00A651]">Escrow Sécurisé</p>
                    <p className="text-[10px] text-gray-500">Fonds protégés jusqu&apos;à signature</p>
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg transition-colors"
                  >
                    Demander une visite
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full py-3.5 bg-transparent border-2 border-[#003087] text-[#003087] rounded-full font-semibold text-sm hover:bg-[#003087] hover:text-white transition-colors"
                  >
                    Contacter l&apos;agent
                  </motion.button>
                </div>

                {/* Share */}
                <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t">
                  <span className="text-xs text-gray-400">Partager :</span>
                  {['WhatsApp', 'Facebook', 'Twitter', 'Lien'].map((platform) => (
                    <button key={platform} className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Card */}
              {agent && (
                <div className="bg-white rounded-3xl p-5 shadow-sm border mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-[#2C2E2F]">{agent.name}</h3>
                        {agent.certified && (
                          <span className="px-1.5 py-0.5 bg-[#009CDE]/10 text-[#009CDE] text-[9px] font-bold rounded-full">Certifié</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{agent.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {agent.rating} ({agent.reviews})
                    </span>
                    <span>{agent.listings} annonces</span>
                  </div>
                  <button
                    onClick={() => setShowPhone(!showPhone)}
                    className="w-full py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    {showPhone ? agent.phone : 'Voir le numéro'}
                  </button>
                </div>
              )}

              {/* Trust Badges */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="text-sm font-semibold text-[#2C2E2F] mb-3">Garanties AfriBayit</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: '✓', text: 'Documents vérifiés', active: property.verified },
                    { icon: '🗺️', text: 'GeoTrust certifié', active: property.geoTrust },
                    { icon: '🔒', text: 'Escrow sécurisé', active: true },
                    { icon: '📋', text: 'Assistance notariale', active: true },
                  ].map((badge) => (
                    <div key={badge.text} className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                        badge.active ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {badge.icon}
                      </span>
                      <span className={`text-xs ${badge.active ? 'text-gray-700' : 'text-gray-400'}`}>{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
