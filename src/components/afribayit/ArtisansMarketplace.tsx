'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { artisans } from '@/lib/mockData';

interface ArtisansMarketplaceProps {
  onNavigate: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const trades = ['Tous', 'Électricien', 'Plombier', 'Maçon', 'Peintre', 'Menuisier', 'Architecte d\'intérieur', 'Chauffagiste', 'Couvreur'];

export default function ArtisansMarketplace({ onNavigate }: ArtisansMarketplaceProps) {
  const [selectedTrade, setSelectedTrade] = useState('Tous');
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [showDevis, setShowDevis] = useState(false);

  const filtered = selectedTrade === 'Tous'
    ? artisans
    : artisans.filter(a => a.trade === selectedTrade);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            🔧 ProMatch
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Artisans <span className="text-[#D4AF37]">Certifiés</span>
          </h1>
          <p className="text-gray-500 max-w-lg">
            Trouvez les meilleurs artisans pour vos projets immobiliers. Vérifiés, notés, et disponibles.
          </p>
        </motion.div>

        {/* Emergency Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => setEmergencyMode(!emergencyMode)}
            className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-sm transition-all ${
              emergencyMode
                ? 'bg-[#D93025] text-white shadow-lg animate-pulse'
                : 'bg-white border-2 border-[#D93025] text-[#D93025] hover:bg-[#D93025]/5'
            }`}
          >
            <span className="text-xl">🚨</span>
            {emergencyMode ? 'Mode Urgence Activé - Artisans < 10km' : 'Urgence ? Trouvez un artisan près de vous'}
          </button>
        </motion.div>

        {/* Trade Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {trades.map((trade) => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTrade === trade
                  ? 'bg-[#003087] text-white'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {trade}
            </button>
          ))}
        </div>

        {/* Artisan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((artisan, i) => (
            <motion.div
              key={artisan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-5 shadow-sm border"
            >
              <div className="flex items-start gap-3 mb-4">
                <img
                  src={artisan.avatar}
                  alt={artisan.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#D4AF37]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[#2C2E2F]">{artisan.name}</h3>
                    {artisan.certified && (
                      <svg className="w-4 h-4 text-[#009CDE]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#D4AF37]">{artisan.trade}</p>
                  <p className="text-xs text-gray-500">{artisan.city}, {artisan.country}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                  artisan.available ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                }`}>
                  {artisan.available ? 'Disponible' : 'Occupé'}
                </div>
              </div>

              {/* Specialties */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {artisan.specialties.slice(0, 3).map((spec) => (
                  <span key={spec} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">
                    {spec}
                  </span>
                ))}
              </div>

              {/* Rating & Price */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-[#2C2E2F]">{artisan.rating}</span>
                  <span className="text-xs text-gray-400">({artisan.reviews})</span>
                </div>
                <span className="text-xs text-gray-500">{artisan.priceRange}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {artisan.emergency && emergencyMode && (
                  <button className="flex-1 py-2.5 bg-[#D93025] text-white rounded-full text-sm font-semibold animate-pulse">
                    🚨 Appel urgent
                  </button>
                )}
                <button
                  onClick={() => setShowDevis(true)}
                  className="flex-1 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
                >
                  Demander devis
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Devis Request Modal */}
        {showDevis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowDevis(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Demander un devis</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type de travaux</label>
                  <select className="w-full px-4 py-3 rounded-2xl border text-sm outline-none">
                    <option>Réparation</option>
                    <option>Installation</option>
                    <option>Rénovation</option>
                    <option>Construction neuve</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                  <textarea rows={3} placeholder="Décrivez vos besoins..." className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Budget estimé</label>
                  <input type="text" placeholder="ex: 500 000 FCFA" className="w-full px-4 py-3 rounded-2xl border text-sm outline-none" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowDevis(false)} className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600">Annuler</button>
                  <button onClick={() => setShowDevis(false)} className="flex-1 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold">Envoyer</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
