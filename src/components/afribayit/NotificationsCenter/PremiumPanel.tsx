// P3.7-2 — Premium tab: premium-only notification toggles + upsell CTA
// for non-premium users.

'use client';

import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/lib/i18n/use-translate';
import { easeOut, premiumNotificationTypes } from './constants';

interface PremiumPanelProps {
  premiumEnabled: Record<string, boolean>;
  onToggle: (key: string, checked: boolean) => void;
  isPremiumUser: boolean;
}

// Local lookup mapping each premium notification key to its translation
// sub-key. The constants file (`./constants.tsx`) is pure data and is not
// a React component, so we translate at the render site using these keys.
const PREMIUM_TYPE_KEYS: Record<string, { label: string; desc: string }> = {
  profile_view: { label: 'profile_view', desc: 'profile_view' },
  matching_inverse: { label: 'matching_inverse', desc: 'matching_inverse' },
  performance_weekly: { label: 'performance_weekly', desc: 'performance_weekly' },
  inmail_credit: { label: 'inmail_credit', desc: 'inmail_credit' },
};

export default function PremiumPanel(props: PremiumPanelProps) {
  const { premiumEnabled, onToggle, isPremiumUser } = props;
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-display text-base font-bold text-[#0a2a5e]">
            {t('notificationsCenter.premiumTitle', 'Notifications Premium')}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {t(
            'notificationsCenter.premiumSubtitle',
            'Notifications exclusives pour les membres Premium et Pro.',
          )}
        </p>

        <div className="space-y-3">
          {premiumNotificationTypes.map((type, idx) => {
            const typeKeys = PREMIUM_TYPE_KEYS[type.key];
            const labelKey = typeKeys
              ? `notificationsCenter.premiumTypes.${typeKeys.label}.label`
              : '';
            const descKey = typeKeys
              ? `notificationsCenter.premiumTypes.${typeKeys.desc}.desc`
              : '';
            return (
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
                      <p className="text-sm font-semibold text-[#0a2a5e]">
                        {labelKey ? t(labelKey, type.label) : type.label}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {descKey ? t(descKey, type.desc) : type.desc}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={premiumEnabled[type.key] ?? false}
                    onCheckedChange={(checked) => onToggle(type.key, checked)}
                    className="data-[state=checked]:bg-[#D4AF37]"
                  />
                </div>
              </motion.div>
            );
          })}
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
              <h4 className="font-semibold text-sm">
                {t('notificationsCenter.premiumUpsellTitle', 'Passez en Premium')}
              </h4>
            </div>
            <p className="text-xs text-white/80 mb-3">
              {t(
                'notificationsCenter.premiumUpsellDesc',
                'Debloquez les notifications avancees : qui consulte votre profil, matching inverse, et plus encore.',
              )}
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 bg-[#D4AF37] text-[#003087] rounded-xl text-sm font-semibold hover:bg-[#e5c249] transition-colors"
            >
              {t('notificationsCenter.premiumUpsellCta', 'Decouvrir Premium')}
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
