'use client';

import { motion } from 'framer-motion';
import { Landmark, MapPin, Plus, Users, Lock, Globe, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { easeOut } from './constants';
import type { Group } from './types';

interface InvestorGroupsPanelProps {
  groups: Group[];
  groupsLoading: boolean;
  onSelectGroup: (id: string) => void;
  onCreateGroup: () => void;
  isAuth: boolean;
}

export default function InvestorGroupsPanel({
  groups,
  groupsLoading,
  onSelectGroup,
  onCreateGroup,
  isAuth,
}: InvestorGroupsPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-base font-bold text-primary-deep mb-1 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-green-600" /> Groupes d&apos;investisseurs
            </h3>
            <p className="text-xs text-gray-text">
              Groupes privés segmentés par profil : Primo-accédants, Investisseurs locatifs, Diaspora, Promoteurs.
              Accès conditionné au niveau KYC.
            </p>
          </div>
          <button
            onClick={() => { if (!isAuth) { toast({ title: 'Connexion requise' }); return; } onCreateGroup(); }}
            className="px-4 py-2 rounded-full bg-primary-green text-white text-xs font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Créer
          </button>
        </div>

        {/* CDC §5.7.1 info badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['Primo-accédants', 'Investisseurs locatifs', 'Diaspora', 'Promoteurs'].map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-primary-pale text-primary-deep border border-primary-green/20 text-[10px] font-semibold rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        {groupsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-gray-200/60 rounded-2xl border border-gray-200 animate-pulse">
                <div className="h-4 bg-primary-pale rounded w-3/4 mb-2" />
                <div className="h-3 bg-primary-pale/60 rounded-full w-full mb-2" />
                <div className="h-3 bg-primary-pale/60 rounded-full w-1/2" />
              </div>
            ))}
          </div>
        )}
        {!groupsLoading && groups.length === 0 && (
          <div className="text-center py-8 bg-primary-pale/30 rounded-2xl">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-text font-semibold">Aucun groupe disponible</p>
            <p className="text-xs text-gray-400 mt-1">Soyez le premier à créer un groupe d&apos;investisseurs !</p>
          </div>
        )}
        {!groupsLoading && groups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group, i) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, ease: easeOut }}
                className="p-4 bg-white rounded-3xl border border-primary-pale shadow-md hover:shadow-xl hover:border-primary-green/30 transition-all cursor-pointer group overflow-hidden relative"
                onClick={() => onSelectGroup(group.id)}
              >
                {/* Gradient top border on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-deep via-primary-green to-accent-yellow opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {group.role === 'Premium' ? (
                      <Lock className="w-4 h-4 text-accent-yellow" />
                    ) : (
                      <Globe className="w-4 h-4 text-primary-green" />
                    )}
                    <h4 className="font-semibold text-sm text-primary-deep group-hover:text-primary-green transition-colors">{group.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${group.role === 'Premium' ? 'bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30' : 'bg-primary-pale text-primary-deep border border-primary-green/20'}`}>
                    {group.role || 'Privé'}
                  </span>
                </div>
                <p className="text-xs text-gray-text mb-3">{group.city || 'En ligne'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {group.score} membres
                  </span>
                  {group.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {group.city}
                    </span>
                  )}
                </div>
                <div className="flex gap-1 flex-wrap mb-3">
                  {group.skills.map(p => (
                    <span key={p} className="px-2 py-0.5 bg-primary-pale/60 rounded-full text-[10px] font-medium text-gray-text">{p}</span>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectGroup(group.id); }}
                  className="w-full py-2 rounded-full bg-primary-green text-white text-xs font-bold hover:bg-primary-deep transition-all shadow-md"
                >
                  Voir le groupe
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CDC §5.7.1 info card */}
      <div className="bg-primary-pale/50 rounded-2xl p-4 border border-primary-pale flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <p className="text-xs text-gray-text">
          <strong className="text-primary-deep">Accès conditionné</strong> — L&apos;accès aux groupes premium est conditionné
          au niveau KYC et au montant de portefeuille déclaré. Les groupes sont modérés par des Community Managers par pays
          avec modération IA temps réel (détection spam, hate speech, annonces déguisées).
        </p>
      </div>
    </motion.div>
  );
}
