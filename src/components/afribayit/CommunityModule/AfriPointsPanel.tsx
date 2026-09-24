'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-translate';
import {
  Award, BookOpen, CheckCircle, Coins, Handshake, PartyPopper,
  PenTool, Rocket, ShoppingCart, Sparkles, Star, User, TrendingUp,
} from 'lucide-react';
import { afriPointLevels, easeOut } from './constants';

interface AfriPointsPanelProps {
  userAfriPoints: number;
}

export default function AfriPointsPanel({ userAfriPoints }: AfriPointsPanelProps) {
  const { t } = useTranslation();
  const afriLevel = afriPointLevels.filter(l => userAfriPoints >= l.min).pop() || afriPointLevels[0];
  const nextLevel = afriPointLevels.find(l => l.min > userAfriPoints);
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((userAfriPoints - afriLevel.min) / (nextLevel.min - afriLevel.min)) * 100))
    : 100;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Main score card — LinkedIn-style gradient */}
      <div className="relative bg-primary-deep rounded-3xl p-6 overflow-hidden text-white text-center shadow-lg">
        {/* Decorative */}
        <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-primary-green/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-yellow/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              {afriLevel.icon}
            </div>
          </div>
          <p className="font-mono-data text-4xl font-bold text-accent-yellow mb-1">{userAfriPoints}</p>
          <p className="text-sm text-white/70 mb-2">{t('community.afriPoints.points', 'AfriPoints')}</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/20">
            {t('community.afriPoints.level', 'Niveau')} {afriLevel.name}
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
                  className="h-full bg-gradient-to-r from-accent-yellow to-[#FFD700] rounded-full"
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                {t('community.afriPoints.pointsToNext', 'Plus que')} <span className="font-bold text-accent-yellow">{nextLevel.min - userAfriPoints} {t('community.afriPoints.pointsUnit', 'points')}</span> {t('community.afriPoints.forLevel', 'pour le niveau')} {nextLevel.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CDC §5.7.2 — How to earn */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-accent-yellow" /> {t('community.afriPoints.earnTitle', 'Gagner des AfriPoints')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { action: t('community.afriPoints.earnProfile', 'Profil complété'), points: 50, icon: <User className="w-5 h-5" />, color: '#003087' },
            { action: t('community.afriPoints.earnPost', 'Sujet publié'), points: 5, icon: <PenTool className="w-5 h-5" />, color: '#009CDE' },
            { action: t('community.afriPoints.earnReview', 'Avis publié'), points: 10, icon: <Star className="w-5 h-5" />, color: '#D4AF37' },
            { action: t('community.afriPoints.earnCourse', 'Cours complété'), points: 25, icon: <BookOpen className="w-5 h-5" />, color: '#00A651' },
            { action: t('community.afriPoints.earnQuiz', 'Quiz réussi'), points: 10, icon: <CheckCircle className="w-5 h-5" />, color: '#00A651' },
            { action: t('community.afriPoints.earnCertificate', 'Certificat obtenu'), points: 15, icon: <Award className="w-5 h-5" />, color: '#D4AF37' },
            { action: t('community.afriPoints.earnReferral', 'Parrainage'), points: 100, icon: <Handshake className="w-5 h-5" />, color: '#003087' },
            { action: t('community.afriPoints.earnEvent', 'Événement participé'), points: 15, icon: <PartyPopper className="w-5 h-5" />, color: '#009CDE' },
          ].map(item => (
            <div key={item.action} className="flex items-center gap-3 p-3 bg-primary-pale/40 rounded-2xl hover:bg-primary-pale/60 transition-colors">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-deep">{item.action}</p>
                <p className="text-xs font-semibold text-accent-dark">+{item.points} {t('community.afriPoints.pts', 'pts')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CDC §5.7.2 — How to spend */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-base font-bold text-primary-deep mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary-deep" /> {t('community.afriPoints.spendTitle', 'Dépenser des AfriPoints')}
        </h3>
        <div className="space-y-2">
          {[
            { item: t('community.afriPoints.spendBoost7', 'Boost annonce 7 jours'), cost: 200, icon: <Rocket className="w-5 h-5" />, color: '#003087' },
            { item: t('community.afriPoints.spendBoost30', 'Boost annonce 30 jours'), cost: 500, icon: <Rocket className="w-5 h-5" />, color: '#003087' },
            { item: t('community.afriPoints.spendPremium', 'Fonctionnalité premium'), cost: 100, icon: <Sparkles className="w-5 h-5" />, color: '#D4AF37' },
            { item: t('community.afriPoints.spendCourse10', 'Réduction cours 10%'), cost: 150, icon: <BookOpen className="w-5 h-5" />, color: '#00A651' },
            { item: t('community.afriPoints.spendCourse25', 'Réduction cours 25%'), cost: 300, icon: <BookOpen className="w-5 h-5" />, color: '#00A651' },
          ].map(item => (
            <div key={item.item} className="flex items-center justify-between p-3 bg-primary-pale/40 rounded-2xl hover:bg-primary-pale/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-primary-deep">{item.item}</p>
              </div>
              <span className="px-3 py-1 bg-primary-pale text-primary-deep border border-primary-green/20 text-xs font-bold rounded-full">{item.cost} {t('community.afriPoints.pts', 'pts')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CDC §5.7.2 info */}
      <div className="bg-accent-yellow/10 rounded-2xl p-4 border border-accent-yellow/30 flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-accent-dark shrink-0 mt-0.5" />
        <p className="text-xs text-gray-text">
          <strong className="text-primary-deep">{t('community.afriPoints.rule', '1 XOF de transaction = 1 point')}</strong> — {t('community.afriPoints.ruleDesc', 'Bonus pour actions communautaires et parrainage. Les AfriPoints sont utilisables en réductions sur commissions, abonnements, services GeoTrust et réservations hôtel.')}
        </p>
      </div>
    </motion.div>
  );
}
