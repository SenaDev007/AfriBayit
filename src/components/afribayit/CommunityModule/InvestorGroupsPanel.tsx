'use client';

import { motion } from 'framer-motion';
import { Landmark, MapPin, Plus, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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
      <div className="bg-white rounded-3xl p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1 flex items-center gap-2"><Landmark className="w-5 h-5 text-[#00A651]" /> Groupes d&apos;investisseurs</h3>
            <p className="text-xs text-gray-500">Groupes privés segmentés par profil pour des échanges qualitatifs.</p>
          </div>
          <button
            onClick={() => { if (!isAuth) { toast({ title: 'Connexion requise' }); return; } onCreateGroup(); }}
            className="px-4 py-2 bg-[#00A651] text-white rounded-full text-xs font-semibold hover:bg-[#008f47] transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Créer un groupe
          </button>
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
          <div className="text-center py-8">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun groupe disponible</p>
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
                className="p-4 bg-gray-50 rounded-2xl border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectGroup(group.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-[#2C2E2F]">{group.name}</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${group.role === 'Premium' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#003087]/10 text-[#003087]'}`}>{group.role || 'Privé'}</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{group.city || 'En ligne'}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.score} membres</span>
                  {group.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.city}</span>}
                </div>
                <div className="flex gap-1 flex-wrap mb-3">
                  {group.skills.map(p => <span key={p} className="px-2 py-0.5 bg-white rounded-full text-[10px] font-medium text-gray-600 border">{p}</span>)}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectGroup(group.id); }}
                  className="w-full py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors"
                >
                  Voir le groupe
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
