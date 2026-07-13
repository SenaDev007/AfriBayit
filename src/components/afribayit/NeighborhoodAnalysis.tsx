'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bus, Car, CloudRain, Droplets, Globe, Home, Plane, Route, Store, Sun, Thermometer, Wind } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface NeighborhoodData {
  walkScore: { score: number; level: string; details: { category: string; distance: number; contribution: number }[] };
  amenities: { totalScore: number; amenityCount: number; varietyScore: number; categories: { category: string; categoryFr: string; icon: React.ReactNode; count: number; nearestDistance: number; score: number }[] };
  transport: { score: number; level: string; options: { type: string; name: string; distance: number; accessible: boolean }[] };
  safety: { score: number; level: string; note: string };
  overallScore: number;
  environmental: { avgTemp: number; avgRainfall: number; humidity: number; airQuality: { index: number; level: string }; uvIndex: number; climate: string; rainySeason: string; drySeason: string } | null;
}

interface Props {
  lat: number;
  lng: number;
  city: string;
  propertyId?: string;
  agentId?: string;
}

export default function NeighborhoodAnalysis({ lat, lng, city, propertyId, agentId }: Props) {
  const [data, setData] = useState<NeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties/neighborhood?lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch {
      // Use fallback data
      setData({
        walkScore: { score: 72, level: 'Bon', details: [{ category: 'school', distance: 350, contribution: 12 }, { category: 'hospital', distance: 800, contribution: 10 }, { category: 'market', distance: 200, contribution: 11 }] },
        amenities: { totalScore: 68, amenityCount: 15, varietyScore: 75, categories: [{ category: 'school', categoryFr: 'Écoles', icon: null, count: 3, nearestDistance: 350, score: 45 }, { category: 'hospital', categoryFr: 'Hôpitaux', icon: null, count: 1, nearestDistance: 800, score: 35 }, { category: 'market', categoryFr: 'Marchés', icon: <Store className="w-4 h-4" />, count: 2, nearestDistance: 200, score: 50 }] },
        transport: { score: 65, level: 'Bon', options: [{ type: 'road', name: 'Route principale', distance: 400, accessible: true }, { type: 'transit', name: 'Transport en commun', distance: 700, accessible: true }, { type: 'taxi', name: 'Station taxi', distance: 500, accessible: true }, { type: 'airport', name: 'Aéroport', distance: 12000, accessible: true }] },
        safety: { score: 70, level: 'Bon', note: 'Données estimées' },
        overallScore: 68,
        environmental: { avgTemp: 27, avgRainfall: 1300, humidity: 78, airQuality: { index: 85, level: 'Modéré' }, uvIndex: 9, climate: 'Tropical humide', rainySeason: 'Avril - Juillet', drySeason: 'Novembre - Mars' },
      });
    } finally {
      setLoading(false);
    }
  }, [lat, lng, city]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleScheduleVisit = async () => {
    if (!selectedDate || !selectedTime || !propertyId) return;
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      await fetch('/api/properties/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, agentId, clientId: 'current-user', type: 'visit', scheduledAt }),
      });
      alert('Visite planifiée avec succès !');
      setShowSchedule(false);
    } catch {
      alert('Visite planifiée (demo)');
      setShowSchedule(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Walk Score Gauge */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOut }} className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4">Score de marche</h3>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28 shrink-0">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={data.walkScore.score >= 60 ? '#00A651' : data.walkScore.score >= 40 ? '#D4AF37' : '#D93025'} strokeWidth="8" strokeDasharray={`${(data.walkScore.score / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="font-mono text-2xl font-bold text-[#0a2a5e]">{data.walkScore.score}</span>
                <span className="block text-[10px] text-gray-400">/100</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: data.walkScore.score >= 60 ? '#00A651' : data.walkScore.score >= 40 ? '#D4AF37' : '#D93025' }}>
              {data.walkScore.level}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              La plupart des commodités sont accessibles à pied.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Amenities */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: easeOut }} className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-[#0a2a5e]">Commodités à proximité</h3>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#00A651]/10 text-[#00A651]">
            {data.amenities.amenityCount} trouvées
          </span>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {data.amenities.categories.map(cat => (
            <div key={cat.category} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-lg">{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0a2a5e]">{cat.categoryFr}</p>
                <p className="text-xs text-gray-400">{cat.count} · {cat.nearestDistance}m le plus proche</p>
              </div>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
                <div className="h-full bg-[#00A651] rounded-lg" style={{ width: `${cat.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Transport */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: easeOut }} className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4">Accessibilité transport</h3>
        <div className="space-y-3">
          {data.transport.options.map(opt => {
            const distKm = opt.distance >= 1000 ? `${(opt.distance / 1000).toFixed(1)} km` : `${opt.distance} m`;
            return (
              <div key={opt.type} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${opt.accessible ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'}`}>
                  {opt.type === 'road' ? <Route className="w-4 h-4" /> : opt.type === 'transit' ? <Bus className="w-4 h-4" /> : opt.type === 'taxi' ? <Car className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[#0a2a5e]">{opt.name}</p>
                  <p className="text-xs text-gray-400">{distKm}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${opt.accessible ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'}`}>
                  {opt.accessible ? 'Accessible' : 'Éloigné'}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Environmental Data */}
      {data.environmental && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: easeOut }} className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4">Données environnementales</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Température moy.', value: `${data.environmental.avgTemp}°C`, icon: <Thermometer className="w-4 h-4" /> },
              { label: 'Pluviométrie', value: `${data.environmental.avgRainfall} mm/an`, icon: <CloudRain className="w-4 h-4" /> },
              { label: 'Humidité', value: `${data.environmental.humidity}%`, icon: <Droplets className="w-4 h-4" /> },
              { label: 'Qualité de l\'air', value: `${data.environmental.airQuality.index} (${data.environmental.airQuality.level})`, icon: <Wind className="w-4 h-4" /> },
              { label: 'Indice UV', value: `${data.environmental.uvIndex}/11`, icon: <Sun className="w-4 h-4" /> },
              { label: 'Climat', value: data.environmental.climate, icon: <Globe className="w-4 h-4" /> },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-gray-50">
                <span className="text-sm">{item.icon}</span>
                <p className="text-xs font-semibold text-[#0a2a5e] mt-1">{item.value}</p>
                <p className="text-[10px] text-gray-400">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <div className="flex-1 p-2 rounded-lg bg-[#009CDE]/10 text-xs">
              <span className="font-semibold text-[#009CDE]"><CloudRain className="w-4 h-4" /> Saison des pluies</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{data.environmental.rainySeason}</p>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-[#D4AF37]/10 text-xs">
              <span className="font-semibold text-[#D4AF37]"><Sun className="w-4 h-4" /> Saison sèche</span>
              <p className="text-[10px] text-gray-500 mt-0.5">{data.environmental.drySeason}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Schedule Visit Button */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4, ease: easeOut }}>
        {!showSchedule ? (
          <button
            onClick={() => setShowSchedule(true)}
            className="w-full py-3.5 bg-[#003087] text-white rounded-2xl font-semibold hover:bg-[#0047b3] transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> Planifier une visite
          </button>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h4 className="font-display text-base font-bold text-[#0a2a5e] mb-4">Planifier une visite</h4>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Date</label>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#003087] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Heure</label>
                <input type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-[#003087] focus:outline-none" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleScheduleVisit} disabled={!selectedDate || !selectedTime} className="flex-1 py-3 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50">
                Confirmer
              </button>
              <button onClick={() => setShowSchedule(false)} className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
