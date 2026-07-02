'use client';

import { motion } from 'framer-motion';
import { PROFILE_TABS_DEF } from './tabs';
import type { ProfileTab } from './types';
import AgentProfile from './profiles/AgentProfile';
import ArtisanProfile from './profiles/ArtisanProfile';
import FormateurProfile from './profiles/FormateurProfile';
import InvestisseurProfile from './profiles/InvestisseurProfile';

interface ProfilesPanelProps {
  activeProfile: ProfileTab;
  setActiveProfile: (p: ProfileTab) => void;
}

export default function ProfilesPanel({ activeProfile, setActiveProfile }: ProfilesPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PROFILE_TABS_DEF.map((pt) => (
          <button
            key={pt.key}
            onClick={() => setActiveProfile(pt.key)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeProfile === pt.key ? 'text-white shadow-md' : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
            style={activeProfile === pt.key ? { backgroundColor: pt.color } : {}}
          >
            {pt.icon}{pt.label}
          </button>
        ))}
      </div>

      {activeProfile === 'agent' && <AgentProfile />}
      {activeProfile === 'artisan' && <ArtisanProfile />}
      {activeProfile === 'formateur' && <FormateurProfile />}
      {activeProfile === 'investisseur' && <InvestisseurProfile />}
    </motion.div>
  );
}
