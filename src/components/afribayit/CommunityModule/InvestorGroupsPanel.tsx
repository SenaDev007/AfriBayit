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
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-1 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-[#00A651]" /> Groupes d&apos;investisseurs
            </h3>
            <p className="text-xs text-gray-500">
              Groupes privés segmentés par profil : Primo-accédants, Investisseurs locatifs, Diaspora, Promoteurs.
              Accès conditionné au niveau KYC.
            </p>
          </div>
          <button
            onClick={() => { if (!isAuth) { toast({ title: 'Connexion requise' }); return; } onCreateGroup(); }}
            className="px-4 py-2 bg-[#00A651] text-white rounded-lg text-xs font-semibold hover:bg-[#008f47] transition-colors flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Créer
          </button>
        </div>

        {/* CDC §5.7.1 info badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['Primo-accédants', 'Investisseurs locatifs', 'Diaspora', 'Promoteurs'].map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-[#003087]/5 text-[#003087] text-[10px] font-semibold rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        {groupsLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}
        {!groupsLoading && groups.length === 0 && (
          <div className="text-center py-8 bg-gray-50/50 rounded-2xl">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-semibold">Aucun groupe disponible</p>
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
                className="p-4 bg-white rounded-2xl border hover:shadow-lg hover:border-[#00A651]/20 transition-all cursor-pointer group overflow-hidden relative"
                onClick={() => onSelectGroup(group.id)}
              >
                {/* Gradient top border on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#003087] via-[#00A651] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {group.role === 'Premium' ? (
                      <Lock className="w-4 h-4 text-[#D4AF37]" />
                    ) : (
                      <Globe className="w-4 h-4 text-[#009CDE]" />
                    )}
                    <h4 className="font-semibold text-sm text-[#0a2a5e] group-hover:text-[#003087] transition-colors">{group.name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${group.role === 'Premium' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#009CDE]/10 text-[#009CDE]'}`}>
                    {group.role || 'Privé'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{group.city || 'En ligne'}</p>
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
                    <span key={p} className="px-2 py-0.5 bg-gray-50 rounded-full text-[10px] font-medium text-gray-600">{p}</span>
                  ))}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectGroup(group.id); }}
                  className="w-full py-2 bg-[#003087] text-white rounded-lg text-xs font-semibold hover:bg-[#0047b3] transition-colors"
                >
                  Voir le groupe
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CDC §5.7.1 info card */}
      <div className="bg-gradient-to-r from-[#003087]/5 to-[#00A651]/5 rounded-2xl p-4 border flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#00A651] shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          <strong className="text-[#0a2a5e]">Accès conditionné</strong> — L&apos;accès aux groupes premium est conditionné
          au niveau KYC et au montant de portefeuille déclaré. Les groupes sont modérés par des Community Managers par pays
          avec modération IA temps réel (détection spam, hate speech, annonces déguisées).
        </p>
      </div>
    </motion.div>
  );
}
