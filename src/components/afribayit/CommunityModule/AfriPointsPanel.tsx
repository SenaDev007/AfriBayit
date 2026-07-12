'use client';

import { motion } from 'framer-motion';
import {
  Award, BookOpen, CheckCircle, Coins, Handshake, PartyPopper,
  PenTool, Rocket, ShoppingCart, Sparkles, Star, User, TrendingUp,
} from 'lucide-react';
import { afriPointLevels, easeOut } from './constants';

interface AfriPointsPanelProps {
  userAfriPoints: number;
}

export default function AfriPointsPanel({ userAfriPoints }: AfriPointsPanelProps) {
  const afriLevel = afriPointLevels.filter(l => userAfriPoints >= l.min).pop() || afriPointLevels[0];
  const nextLevel = afriPointLevels.find(l => l.min > userAfriPoints);
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((userAfriPoints - afriLevel.min) / (nextLevel.min - afriLevel.min)) * 100))
    : 100;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Main score card — LinkedIn-style gradient */}
      <div className="relative bg-gradient-to-br from-[#003087] via-[#0047b3] to-[#00A651] rounded-xl p-6 overflow-hidden text-white text-center">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-lg bg-[#D4AF37]/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              {afriLevel.icon}
            </div>
          </div>
          <p className="font-mono-data text-4xl font-bold text-[#D4AF37] mb-1">{userAfriPoints}</p>
          <p className="text-sm text-white/70 mb-2">AfriPoints</p>
          <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-white/15 backdrop-blur">
            Niveau {afriLevel.name}
          </span>
          {nextLevel && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-[10px] text-white/60 mb-1">
                <span>{afriLevel.name}</span>
                <span>{nextLevel.name}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.8, ease: easeOut }}
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FFD700] rounded-lg"
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                Plus que <span className="font-bold text-[#D4AF37]">{nextLevel.min - userAfriPoints} points</span> pour le niveau {nextLevel.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CDC §5.7.2 — How to earn */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#D4AF37]" /> Gagner des AfriPoints
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { action: 'Profil complété', points: 50, icon: <User className="w-5 h-5" />, color: '#003087' },
            { action: 'Sujet publié', points: 5, icon: <PenTool className="w-5 h-5" />, color: '#009CDE' },
            { action: 'Avis publié', points: 10, icon: <Star className="w-5 h-5" />, color: '#D4AF37' },
            { action: 'Cours complété', points: 25, icon: <BookOpen className="w-5 h-5" />, color: '#00A651' },
            { action: 'Quiz réussi', points: 10, icon: <CheckCircle className="w-5 h-5" />, color: '#00A651' },
            { action: 'Certificat obtenu', points: 15, icon: <Award className="w-5 h-5" />, color: '#D4AF37' },
            { action: 'Parrainage', points: 100, icon: <Handshake className="w-5 h-5" />, color: '#003087' },
            { action: 'Événement participé', points: 15, icon: <PartyPopper className="w-5 h-5" />, color: '#009CDE' },
          ].map(item => (
            <div key={item.action} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0a2a5e]">{item.action}</p>
                <p className="text-xs font-semibold text-[#D4AF37]">+{item.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CDC §5.7.2 — How to spend */}
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#003087]" /> Dépenser des AfriPoints
        </h3>
        <div className="space-y-2">
          {[
            { item: 'Boost annonce 7 jours', cost: 200, icon: <Rocket className="w-5 h-5" />, color: '#003087' },
            { item: 'Boost annonce 30 jours', cost: 500, icon: <Rocket className="w-5 h-5" />, color: '#003087' },
            { item: 'Fonctionnalité premium', cost: 100, icon: <Sparkles className="w-5 h-5" />, color: '#D4AF37' },
            { item: 'Réduction cours 10%', cost: 150, icon: <BookOpen className="w-5 h-5" />, color: '#00A651' },
            { item: 'Réduction cours 25%', cost: 300, icon: <BookOpen className="w-5 h-5" />, color: '#00A651' },
          ].map(item => (
            <div key={item.item} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-[#0a2a5e]">{item.item}</p>
              </div>
              <span className="px-3 py-1 bg-[#003087]/10 text-[#003087] text-xs font-bold rounded-lg">{item.cost} pts</span>
            </div>
          ))}
        </div>
      </div>

      {/* CDC §5.7.2 info */}
      <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#00A651]/5 rounded-2xl p-4 border flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          <strong className="text-[#0a2a5e]">1 XOF de transaction = 1 point</strong> — Bonus pour actions communautaires
          et parrainage. Les AfriPoints sont utilisables en réductions sur commissions, abonnements, services GeoTrust
          et réservations hôtel.
        </p>
      </div>
    </motion.div>
  );
}
