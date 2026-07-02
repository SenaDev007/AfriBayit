// P3.7-2 — Premium tab: premium-only notification toggles + upsell CTA
// for non-premium users.

import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { easeOut, premiumNotificationTypes } from './constants';

interface PremiumPanelProps {
  premiumEnabled: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
  isPremiumUser: boolean;
}

export default function PremiumPanel(props: PremiumPanelProps) {
  const { premiumEnabled, onToggle, isPremiumUser } = props;

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-display text-base font-bold text-[#2C2E2F]">Notifications Premium</h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Notifications exclusives pour les membres Premium et Pro.
        </p>

        <div className="space-y-3">
          {premiumNotificationTypes.map((type, idx) => (
            <motion.div
              key={type.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3, ease: easeOut }}
              className="p-4 rounded-2xl bg-gradient-to-r from-[#003087]/5 to-[#D4AF37]/5 border border-[#D4AF37]/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#D4AF37]/10">
                    <type.icon className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2E2F]">{type.label}</p>
                    <p className="text-[10px] text-gray-500">{type.desc}</p>
                  </div>
                </div>
                <Switch
                  checked={premiumEnabled[type.key] ?? false}
                  onCheckedChange={(checked) => onToggle(type.key, checked)}
                  className="data-[state=checked]:bg-[#D4AF37]"
                />
              </div>
            </motion.div>
          ))}
        </div>

        {!isPremiumUser && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 p-4 bg-[#003087] rounded-2xl text-white"
          >
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-[#D4AF37]" />
              <h4 className="font-semibold text-sm">Passez en Premium</h4>
            </div>
            <p className="text-xs text-white/80 mb-3">
              Debloquez les notifications avancees : qui consulte votre profil, matching inverse, et plus
              encore.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-[#D4AF37] text-[#003087] rounded-xl text-sm font-semibold hover:bg-[#e5c249] transition-colors"
            >
              Decouvrir Premium
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
