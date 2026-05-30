'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { hotels } from '@/lib/mockData';

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function HospitalityModule() {
  const [selectedHotel, setSelectedHotel] = useState<string | null>(null);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-4">
            🏨 AfriBayit Hospitality
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Hôtels & <span className="text-[#D4AF37]">Séjours</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Réservez votre hébergement en Afrique de l&apos;Ouest. Hôtels, résidences, et maisons d&apos;hôtes vérifiés.
          </p>
        </motion.div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border"
            >
              <div className="relative aspect-[16/10]">
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-1">
                  {Array.from({ length: hotel.stars }).map((_, j) => (
                    <span key={j} className="text-[#D4AF37] text-sm">★</span>
                  ))}
                </div>
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold ${
                  hotel.available ? 'bg-[#00A651] text-white' : 'bg-gray-500 text-white'
                }`}>
                  {hotel.available ? 'Disponible' : 'Complet'}
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1">{hotel.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {hotel.city}, {hotel.country}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {hotel.amenities.slice(0, 4).map((amenity) => (
                    <span key={amenity} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">
                      {amenity}
                    </span>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-[10px] rounded-full">
                      +{hotel.amenities.length - 4}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <span className="font-mono-data text-xl font-bold text-[#D4AF37]">
                      {new Intl.NumberFormat('fr-FR').format(hotel.pricePerNight)}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">FCFA/nuit</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold">{hotel.rating}</span>
                  </div>
                </div>

                {hotel.available && (
                  <button
                    onClick={() => setSelectedHotel(hotel.id)}
                    className="w-full mt-4 py-2.5 bg-[#D4AF37] text-white rounded-full text-sm font-semibold hover:bg-[#b8961f] transition-colors"
                  >
                    Réserver
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Availability Calendar Placeholder */}
        {selectedHotel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-3xl p-6 shadow-sm border"
          >
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-4">Disponibilités</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 28 }).map((_, i) => {
                const day = i + 1;
                const available = Math.random() > 0.3;
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-medium cursor-pointer transition-colors ${
                      available
                        ? 'bg-[#00A651]/10 text-[#00A651] hover:bg-[#00A651]/20'
                        : 'bg-gray-100 text-gray-300 line-through'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#00A651]/10 rounded" /> Disponible</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded" /> Complet</span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
