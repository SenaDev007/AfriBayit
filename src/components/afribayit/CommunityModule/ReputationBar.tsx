'use client';

import { motion } from 'framer-motion';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { Bot, Flag, Lock, MessageCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { badges, reputationLevels, afriPointLevels } from './constants';
import { getUserReputationScore, getUserAfriPoints } from './utils';

interface ReputationBarProps {
  user: unknown;
  forumCity: string;
  setForumCity: (v: string) => void;
}

export default function ReputationBar({ user, forumCity, setForumCity }: ReputationBarProps) {
  const { selectedCountry } = useCountry();
  const currentUserScore = getUserReputationScore(user);
  const userRepLevel = reputationLevels.find(l => currentUserScore >= l.min && currentUserScore < l.max) || reputationLevels[0];
  const userAfriPoints = getUserAfriPoints(user);
  const afriLevel = afriPointLevels.filter(l => userAfriPoints >= l.min).pop() || afriPointLevels[0];
  const nextLevel = afriPointLevels.find(l => l.min > userAfriPoints);

  return (
    <>
      {/* Country + City Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs text-gray-text font-medium">Pays:</span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-pale text-primary-deep border border-primary-green/20 text-xs font-semibold">
          {COUNTRY_NAMES[selectedCountry] || selectedCountry}
        </span>
        <span className="text-xs text-gray-400 mx-1">|</span>
        <span className="text-xs text-gray-text font-medium">Ville:</span>
        <select
          value={forumCity}
          onChange={e => setForumCity(e.target.value)}
          className="text-xs border border-primary-pale rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
        >
          <option value="">Toutes les villes</option>
          <option value="Cotonou">Cotonou</option>
          <option value="Abidjan">Abidjan</option>
          <option value="Lomé">Lomé</option>
          <option value="Ouagadougou">Ouagadougou</option>
        </select>
      </div>

      {/* Reputation + AfriPoints Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{userRepLevel.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-primary-deep">{userRepLevel.name}</p>
                  <p className="text-xs text-gray-text">Score AfriBayit : {currentUserScore}/1000</p>
                </div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${userRepLevel.color}15`, color: userRepLevel.color }}>{userRepLevel.name}</span>
            </div>
            <div className="h-2 bg-primary-pale/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((currentUserScore / 1000) * 100, 100)}%`, backgroundColor: userRepLevel.color }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-400">
              {reputationLevels.map(level => <span key={level.name} className="flex items-center gap-0.5">{level.icon} {level.name}</span>)}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{afriLevel.icon}</span>
                <div><p className="text-sm font-semibold text-primary-deep">AfriPoints</p><p className="text-xs text-gray-text">{userAfriPoints} points</p></div>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ backgroundColor: `${afriLevel.color}15`, color: afriLevel.color }}>{afriLevel.name}</span>
            </div>
            <div className="h-2 bg-primary-pale/60 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all bg-gradient-to-r from-accent-yellow to-primary-deep" style={{ width: nextLevel ? `${Math.min((userAfriPoints / nextLevel.min) * 100, 100)}%` : '100%' }} />
            </div>
            <div className="flex justify-between mt-1 text-[9px] text-gray-400">{afriPointLevels.slice(0, 4).map(level => <span key={level.name} className="flex items-center gap-0.5">{level.icon} {level.name}</span>)}</div>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {badges.filter(b => b.earned).map(badge => (
            <span key={badge.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30" title={badge.description}>{badge.icon} {badge.name}</span>
          ))}
          {badges.filter(b => !b.earned).map(badge => (
            <span key={badge.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-gray-50 text-gray-300" title={badge.description}><Lock className="w-3 h-3" /> {badge.name}</span>
          ))}
        </div>
        {/* NLP moderation + Signalement + Rebecca AI */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-pale rounded-xl">
            <Bot className="w-3.5 h-3.5 text-primary-green shrink-0" />
            <span className="text-[10px] text-primary-deep font-medium">Modération NLP — Rebecca IA</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-accent-yellow/10 rounded-xl">
            <Flag className="w-3.5 h-3.5 text-accent-dark shrink-0" />
            <span className="text-[10px] text-accent-dark font-medium">Signalement</span>
          </div>
          <button
            onClick={() => toast({ title: 'Rebecca IA', description: 'Ouvrez le chat Rebecca pour obtenir de l\'aide.' })}
            className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
            <span className="text-[10px] text-green-700 font-medium">Chat Rebecca IA</span>
          </button>
        </div>
      </motion.div>
    </>
  );
}
