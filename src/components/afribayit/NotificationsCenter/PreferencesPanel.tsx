// P3.7-2 — Preferences tab: channel × category matrix with toggles,
// quick enable/disable all, save button, and a security note.

import { motion } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { preferenceCategories, preferenceChannels, easeOut } from './constants';
import type { CategoryKey, ChannelKey, PreferencesMap } from './types';

interface PreferencesPanelProps {
  preferences: PreferencesMap;
  onToggleChannel: (category: CategoryKey, channel: ChannelKey) => void;
  onSetAll: (prefs: PreferencesMap) => void;
  onSave: () => void;
  saving: boolean;
}

export default function PreferencesPanel(props: PreferencesPanelProps) {
  const { preferences, onToggleChannel, onSetAll, onSave, saving } = props;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
      >
        <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1">Canaux de notification</h3>
        <p className="text-xs text-gray-500 mb-5">
          Choisissez comment vous souhaitez recevoir les alertes pour chaque categorie.
        </p>

        {/* Channel header legend */}
        <div className="grid grid-cols-[1fr_repeat(4,_48px)] gap-2 mb-3 items-center">
          <div />
          {preferenceChannels.map((ch) => (
            <div key={ch.key} className="text-center">
              <ch.icon className="w-4 h-4 mx-auto text-gray-400" />
              <p className="text-[8px] text-gray-400 font-medium">{ch.label}</p>
            </div>
          ))}
        </div>

        {/* Category rows */}
        <div className="space-y-2">
          {preferenceCategories.map((cat, catIdx) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: catIdx * 0.06, duration: 0.3, ease: easeOut }}
              className="p-3 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className="grid grid-cols-[1fr_repeat(4,_48px)] gap-2 items-center">
                <div className="flex items-center gap-2">
                  <cat.icon className="w-4 h-4 text-[#003087]" />
                  <div>
                    <p className="text-xs font-semibold text-[#2C2E2F]">{cat.label}</p>
                    <p className="text-[9px] text-gray-400 hidden sm:block">{cat.desc}</p>
                  </div>
                </div>

                {preferenceChannels.map((ch) => {
                  const isActive = preferences[cat.key]?.[ch.key] ?? false;
                  return (
                    <div key={ch.key} className="flex justify-center">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => onToggleChannel(cat.key, ch.key)}
                        aria-label={`${ch.label} pour ${cat.label}: ${isActive ? 'Active' : 'Desactive'}`}
                        className="data-[state=checked]:bg-[#00A651]"
                      />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={() => {
              const allOn = {} as PreferencesMap;
              for (const cat of preferenceCategories) {
                allOn[cat.key] = { email: true, sms: true, push: true, whatsapp: true };
              }
              onSetAll(allOn);
            }}
            className="flex-1 py-2.5 text-xs font-medium text-[#003087] border border-[#003087]/20 rounded-xl hover:bg-[#003087]/5 transition-colors"
          >
            Tout activer
          </button>
          <button
            onClick={() => {
              const allOff = {} as PreferencesMap;
              for (const cat of preferenceCategories) {
                allOff[cat.key] = { email: false, sms: false, push: false, whatsapp: false };
              }
              onSetAll(allOff);
            }}
            className="flex-1 py-2.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Tout desactiver
          </button>
        </div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSave}
          disabled={saving}
          className="w-full mt-4 py-3 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les preferences'}
        </motion.button>

        <div className="mt-4 p-3 bg-[#009CDE]/5 border border-[#009CDE]/10 rounded-xl">
          <p className="text-[10px] text-[#009CDE] leading-relaxed flex items-start gap-1">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
            Les notifications de securite (connexion, KYC, escrow) sont toujours actives par email et push
            pour proteger votre compte.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
