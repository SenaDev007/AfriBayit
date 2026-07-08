'use client';

import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle,
  Coins,
  Handshake,
  PartyPopper,
  PenTool,
  Rocket,
  ShoppingCart,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { afriPointLevels } from './constants';

interface AfriPointsPanelProps {
  userAfriPoints: number;
}

export default function AfriPointsPanel({ userAfriPoints }: AfriPointsPanelProps) {
  const afriLevel = afriPointLevels.filter(l => userAfriPoints >= l.min).pop() || afriPointLevels[0];
  const nextLevel = afriPointLevels.find(l => l.min > userAfriPoints);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="bg-white rounded-3xl p-6 shadow-sm border text-center">
        <span className="inline-flex items-center justify-center mb-2">{afriLevel.icon}</span>
        <p className="font-mono text-3xl font-bold text-[#D4AF37]">{userAfriPoints}</p>
        <p className="text-sm text-gray-500 mb-1">AfriPoints</p>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${afriLevel.color}15`, color: afriLevel.color }}>Niveau {afriLevel.name}</span>
        {nextLevel && (
          <p className="text-xs text-gray-400 mt-2">Plus que <span className="font-semibold text-[#003087]">{nextLevel.min - userAfriPoints} points</span> pour atteindre le niveau {nextLevel.name}</p>
        )}
      </div>
      <div className="bg-white rounded-3xl p-5 shadow-sm border">
        <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Coins className="w-5 h-5" /> Gagner des AfriPoints</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { action: 'Profil complété', points: 50, icon: <User className="w-5 h-5" /> },
            { action: 'Sujet publié', points: 5, icon: <PenTool className="w-5 h-5" /> },
            { action: 'Avis publié', points: 10, icon: <Star className="w-5 h-5" /> },
            { action: 'Cours complété', points: 25, icon: <BookOpen className="w-5 h-5" /> },
            { action: 'Quiz réussi', points: 10, icon: <CheckCircle className="w-5 h-5" /> },
            { action: 'Certificat obtenu', points: 15, icon: <Award className="w-5 h-5" /> },
            { action: 'Parrainage', points: 100, icon: <Handshake className="w-5 h-5" /> },
            { action: 'Événement participé', points: 15, icon: <PartyPopper className="w-5 h-5" /> },
          ].map(item => (
            <div key={item.action} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <span className="text-gray-500">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-[#2C2E2F]">{item.action}</p>
                <p className="text-xs text-[#D4AF37] font-semibold">+{item.points} pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-3xl p-5 shadow-sm border">
        <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Dépenser des AfriPoints</h3>
        <div className="space-y-3">
          {[
            { item: 'Boost annonce 7 jours', cost: 200, icon: <Rocket className="w-5 h-5" /> },
            { item: 'Boost annonce 30 jours', cost: 500, icon: <Rocket className="w-5 h-5" /> },
            { item: 'Fonctionnalité premium', cost: 100, icon: <Sparkles className="w-5 h-5" /> },
            { item: 'Réduction cours 10%', cost: 150, icon: <BookOpen className="w-5 h-5" /> },
            { item: 'Réduction cours 25%', cost: 300, icon: <BookOpen className="w-5 h-5" /> },
          ].map(item => (
            <div key={item.item} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-gray-500">{item.icon}</span>
                <p className="text-sm font-medium text-[#2C2E2F]">{item.item}</p>
              </div>
              <span className="px-3 py-1 bg-[#003087]/10 text-[#003087] text-xs font-semibold rounded-full">{item.cost} pts</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
