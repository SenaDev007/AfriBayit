'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const guesthouses = [
  {
    id: 'gh-001',
    name: 'Maison d\'Hôtes Les Colibris',
    city: 'Cotonou',
    country: 'Bénin',
    rating: 4.8,
    reviews: 56,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',
    certified: true,
    certificationStatus: 'Certifié AfriBayit',
    chambers: [
      { id: 'ch-01', name: 'Chambre Baobab', capacity: 2, price: 25000, amenities: ['Climatisation', 'Wi-Fi', 'SDB privée'], available: true },
      { id: 'ch-02', name: 'Chambre Flamboyant', capacity: 3, price: 35000, amenities: ['Climatisation', 'Wi-Fi', 'SDB privée', 'Terrasse'], available: true },
      { id: 'ch-03', name: 'Suite Royale', capacity: 4, price: 55000, amenities: ['Climatisation', 'Wi-Fi', 'SDB privée', 'Salon', 'Kitchenette'], available: false },
    ],
    meals: [
      { type: 'Petit-déjeuner', price: 3500, available: true },
      { type: 'Déjeuner', price: 5500, available: true },
      { type: 'Dîner', price: 7000, available: true },
    ],
    staff: [
      { name: 'Adjo Mensah', role: 'Réceptionniste', schedule: '7h-15h' },
      { name: 'Kodjo Afi', role: 'Femme de ménage', schedule: '8h-16h' },
    ],
    seasonalPricing: [
      { season: 'Basse saison', modifier: '-20%', dates: 'Mars – Juin' },
      { season: 'Haute saison', modifier: '+30%', dates: 'Déc – Fév' },
      { season: 'Événementiel', modifier: '+50%', dates: 'Fêtes / FIMA' },
    ],
  },
  {
    id: 'gh-002',
    name: 'Résidence Palmiers Cocody',
    city: 'Abidjan',
    country: "Côte d'Ivoire",
    rating: 4.6,
    reviews: 34,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=250&fit=crop',
    certified: true,
    certificationStatus: 'En cours de certification',
    chambers: [
      { id: 'ch-04', name: 'Studio Lagune', capacity: 2, price: 30000, amenities: ['Climatisation', 'Wi-Fi', 'Kitchenette'], available: true },
      { id: 'ch-05', name: 'Chambre Ébrié', capacity: 2, price: 28000, amenities: ['Climatisation', 'Wi-Fi', 'SDB privée'], available: true },
    ],
    meals: [
      { type: 'Petit-déjeuner', price: 4000, available: true },
      { type: 'Dîner', price: 8000, available: true },
    ],
    staff: [
      { name: 'Marie Bamba', role: 'Réceptionniste', schedule: '6h-14h' },
      { name: 'Awa Koné', role: 'Femme de ménage', schedule: '9h-17h' },
      { name: 'Ibrahim Touré', role: 'Agent de sécurité', schedule: '18h-6h' },
    ],
    seasonalPricing: [
      { season: 'Basse saison', modifier: '-15%', dates: 'Avril – Juil' },
      { season: 'Haute saison', modifier: '+25%', dates: 'Nov – Mars' },
    ],
  },
  {
    id: 'gh-003',
    name: 'Guesthouse Sarakawa',
    city: 'Lomé',
    country: 'Togo',
    rating: 4.4,
    reviews: 22,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=250&fit=crop',
    certified: false,
    certificationStatus: 'Non certifié',
    chambers: [
      { id: 'ch-06', name: 'Chambre Océane', capacity: 2, price: 18000, amenities: ['Ventilateur', 'Wi-Fi', 'SDB partagée'], available: true },
    ],
    meals: [
      { type: 'Petit-déjeuner', price: 2500, available: true },
    ],
    staff: [
      { name: 'Esso Agbéko', role: 'Gérant', schedule: '8h-20h' },
    ],
    seasonalPricing: [
      { season: 'Haute saison', modifier: '+20%', dates: 'Déc – Fév' },
    ],
  },
];

const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const calendarDays = Array.from({ length: 35 }, (_, i) => {
  const day = (i % 31) + 1;
  const booked = [3, 4, 5, 12, 13, 19, 20, 21, 27, 28].includes(day);
  return { day, booked };
});

const certificationProcessSteps = [
  { step: 1, title: 'Demande', desc: 'Soumission du dossier de certification', icon: '📋' },
  { step: 2, title: 'Inspection', desc: 'Visite de contrôle qualité AfriBayit', icon: '🔍' },
  { step: 3, title: 'Conformité', desc: 'Vérification sécurité, hygiène, confort', icon: '✅' },
  { step: 4, title: 'Certification', desc: 'Badge Guesthouse Certifié délivré', icon: '🏅' },
];

type TabKey = 'listings' | 'chambers' | 'booking' | 'meals' | 'staff' | 'pricing' | 'certification';

export default function GuesthouseModule({ onNavigate }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('listings');
  const [selectedGh, setSelectedGh] = useState(guesthouses[0]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'listings', label: 'Listings', icon: '🏠' },
    { key: 'chambers', label: 'Chambres', icon: '🛏️' },
    { key: 'booking', label: 'Réservations', icon: '📅' },
    { key: 'meals', label: 'Repas', icon: '🍽️' },
    { key: 'staff', label: 'Personnel', icon: '👥' },
    { key: 'pricing', label: 'Tarifs saisonniers', icon: '💹' },
    { key: 'certification', label: 'Certification', icon: '🏅' },
  ];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
            🏡 PMS Hôtelier — CDC §5.3
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Maisons <span className="text-[#00A651]">d&apos;Hôtes</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Gestion complète de votre guesthouse : chambres, réservations, repas et personnel
          </p>
        </motion.div>

        {/* Revenue Model Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#003087]/5 to-[#00A651]/5 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div>
              <p className="text-sm font-semibold text-[#2C2E2F]">Modèle de revenus</p>
              <p className="text-xs text-gray-500">Commission voyageur : 10-13% · Commission propriétaire : 3%</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#00A651]">10-13%</p>
              <p className="text-[10px] text-gray-500">Voyageur</p>
            </div>
            <div className="w-px bg-gray-200" />
            <div className="text-center">
              <p className="font-mono text-lg font-bold text-[#003087]">3%</p>
              <p className="text-[10px] text-gray-500">Propriétaire</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ===== LISTINGS ===== */}
          {activeTab === 'listings' && (
            <motion.div key="listings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {guesthouses.map((gh, i) => (
                  <motion.div
                    key={gh.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, ease: easeOut }}
                    whileHover={{ y: -4 }}
                    onClick={() => { setSelectedGh(gh); setActiveTab('chambers'); }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border group cursor-pointer"
                  >
                    <div className="relative aspect-[16/10]">
                      <img src={gh.image} alt={gh.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full text-white ${
                          gh.certified ? 'bg-[#00A651]' : gh.certificationStatus === 'En cours de certification' ? 'bg-[#D4AF37]' : 'bg-gray-500'
                        }`}>
                          {gh.certified ? '✅ Certifié' : gh.certificationStatus === 'En cours de certification' ? '⏳ En cours' : '❌ Non certifié'}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded-lg text-white text-xs font-mono">
                        {gh.chambers.length} chambre{gh.chambers.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-display text-base font-bold text-[#2C2E2F] group-hover:text-[#003087] transition-colors">
                        {gh.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">{gh.city}, {gh.country}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                          {gh.rating} ({gh.reviews})
                        </span>
                        <span>À partir de <span className="font-mono font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(gh.chambers[0]?.price || 0)} FCFA</span></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== CHAMBERS ===== */}
          {activeTab === 'chambers' && (
            <motion.div key="chambers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={selectedGh.id}
                  onChange={e => setSelectedGh(guesthouses.find(g => g.id === e.target.value) || guesthouses[0])}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthouses.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {selectedGh.chambers.map((ch, i) => (
                  <motion.div
                    key={ch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-3xl p-5 shadow-sm border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-display text-base font-bold text-[#2C2E2F]">{ch.name}</h4>
                      <span className={`w-3 h-3 rounded-full ${ch.available ? 'bg-[#00A651]' : 'bg-[#D93025]'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2 bg-gray-50 rounded-xl">
                        <p className="text-[10px] text-gray-500">Capacité</p>
                        <p className="font-mono text-sm font-bold text-[#2C2E2F]">{ch.capacity} pers.</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded-xl">
                        <p className="text-[10px] text-gray-500">Prix/nuit</p>
                        <p className="font-mono text-sm font-bold text-[#D4AF37]">{new Intl.NumberFormat('fr-FR').format(ch.price)} FCFA</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {ch.amenities.map(a => (
                        <span key={a} className="px-2 py-0.5 bg-[#009CDE]/5 text-[#009CDE] rounded-full text-[10px] font-medium">{a}</span>
                      ))}
                    </div>
                    <button
                      disabled={!ch.available}
                      className={`w-full py-2.5 rounded-full text-sm font-semibold transition-colors ${
                        ch.available ? 'bg-[#003087] text-white hover:bg-[#0047b3]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {ch.available ? 'Réserver' : 'Indisponible'}
                    </button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== BOOKING CALENDAR ===== */}
          {activeTab === 'booking' && (
            <motion.div key="booking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-bold text-[#2C2E2F]">Calendrier — Mars 2025</h3>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-[#00A651]/20" /> Disponible</span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-3 rounded bg-[#D93025]/20" /> Réservé</span>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((cd, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        cd.booked
                          ? 'bg-[#D93025]/10 text-[#D93025]'
                          : 'bg-[#00A651]/5 text-[#2C2E2F] hover:bg-[#00A651]/20'
                      }`}
                    >
                      {cd.day}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== MEALS ===== */}
          {activeTab === 'meals' && (
            <motion.div key="meals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={selectedGh.id}
                  onChange={e => setSelectedGh(guesthouses.find(g => g.id === e.target.value) || guesthouses[0])}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthouses.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { type: 'Petit-déjeuner', icon: '🥐', color: '#D4AF37' },
                  { type: 'Déjeuner', icon: '🍲', color: '#00A651' },
                  { type: 'Dîner', icon: '🍷', color: '#003087' },
                ].map((mealType) => {
                  const meal = selectedGh.meals.find(m => m.type === mealType.type);
                  return (
                    <motion.div
                      key={mealType.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl p-6 shadow-sm border text-center"
                    >
                      <span className="text-4xl block mb-3">{mealType.icon}</span>
                      <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">{mealType.type}</h4>
                      {meal ? (
                        <>
                          <p className="font-mono text-2xl font-bold" style={{ color: mealType.color }}>
                            {new Intl.NumberFormat('fr-FR').format(meal.price)} FCFA
                          </p>
                          <span className="inline-flex mt-2 px-2 py-0.5 bg-[#00A651]/10 text-[#00A651] text-[10px] font-semibold rounded-full">
                            {meal.available ? '✅ Disponible' : '❌ Indisponible'}
                          </span>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 mt-2">Non proposé</p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ===== STAFF ===== */}
          {activeTab === 'staff' && (
            <motion.div key="staff" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={selectedGh.id}
                  onChange={e => setSelectedGh(guesthouses.find(g => g.id === e.target.value) || guesthouses[0])}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthouses.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                {selectedGh.staff.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-2xl p-4 shadow-sm border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center">
                        <span className="text-sm">{s.role === 'Réceptionniste' ? '🛎️' : s.role === 'Femme de ménage' ? '🧹' : s.role === 'Agent de sécurité' ? '🛡️' : '👤'}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-medium text-gray-600">🕐 {s.schedule}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== SEASONAL PRICING ===== */}
          {activeTab === 'pricing' && (
            <motion.div key="pricing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="flex items-center gap-2 mb-4">
                <select
                  value={selectedGh.id}
                  onChange={e => setSelectedGh(guesthouses.find(g => g.id === e.target.value) || guesthouses[0])}
                  className="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white"
                >
                  {guesthouses.map(gh => <option key={gh.id} value={gh.id}>{gh.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {selectedGh.seasonalPricing.map((sp, i) => {
                  const isLow = sp.season.toLowerCase().includes('basse');
                  const isHigh = sp.season.toLowerCase().includes('haute');
                  const isEvent = sp.season.toLowerCase().includes('événement') || sp.season.toLowerCase().includes('evenement');
                  const color = isLow ? '#009CDE' : isHigh ? '#D4AF37' : isEvent ? '#D93025' : '#6b7280';
                  const icon = isLow ? '📉' : isHigh ? '📈' : isEvent ? '🎉' : '📊';
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, ease: easeOut }}
                      className="bg-white rounded-3xl p-5 shadow-sm border text-center"
                    >
                      <span className="text-3xl block mb-2">{icon}</span>
                      <h4 className="font-display text-base font-bold text-[#2C2E2F] mb-1">{sp.season}</h4>
                      <p className="font-mono text-2xl font-bold mb-1" style={{ color }}>{sp.modifier}</p>
                      <p className="text-xs text-gray-500">{sp.dates}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ===== CERTIFICATION ===== */}
          {activeTab === 'certification' && (
            <motion.div key="certification" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-sm border">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-6">Certification Guesthouse</h3>
                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
                  {certificationProcessSteps.map((s, i) => (
                    <div key={s.step} className="flex items-start shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                          i < 2 ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {s.icon}
                        </div>
                        <p className={`text-[10px] font-medium mt-1 text-center w-20 ${i < 2 ? 'text-[#00A651]' : 'text-gray-400'}`}>{s.title}</p>
                      </div>
                      {i < certificationProcessSteps.length - 1 && (
                        <div className={`w-6 h-0.5 mt-6 shrink-0 ${i < 1 ? 'bg-[#00A651]' : 'bg-gray-200'}`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-[#D4AF37]/5 rounded-2xl">
                  <p className="text-sm text-[#2C2E2F] font-semibold mb-1">⏳ En cours de certification</p>
                  <p className="text-xs text-gray-500">Votre demande est en cours de traitement. L&apos;inspection sera planifiée sous 5 jours ouvrés.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
