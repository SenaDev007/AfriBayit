// P3.7-2 — Silent hours tab: do-not-disturb toggle, time range sliders,
// quick presets, and a security exception note.

import { motion } from 'framer-motion';
import { Moon, Shield } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { easeOut } from './constants';

interface SilentHoursPanelProps {
  enabled: boolean;
  start: number;
  end: number;
  onToggleEnabled: (checked: boolean) => void;
  onChangeStart: (v: number) => void;
  onChangeEnd: (v: number) => void;
  onApplyPreset: (start: number, end: number) => void;
}

const PRESETS = [
  { label: 'Standard (22h-7h)', start: 22, end: 7 },
  { label: 'Couche-tot (21h-6h)', start: 21, end: 6 },
  { label: 'Noctambule (23h-8h)', start: 23, end: 8 },
  { label: 'Sieste (13h-15h)', start: 13, end: 15 },
];

export default function SilentHoursPanel(props: SilentHoursPanelProps) {
  const { enabled, start, end, onToggleEnabled, onChangeStart, onChangeEnd, onApplyPreset } = props;

  const formatRange = () => {
    const startStr = `${String(start).padStart(2, '0')}h`;
    const endStr = `${String(end).padStart(2, '0')}h`;
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: easeOut }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Moon className="w-5 h-5 text-[#003087]" />
          <h3 className="font-display text-base font-bold text-[#0a2a5e]">Heures silencieuses</h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Configurez une plage horaire pendant laquelle vous ne recevez pas de notifications.
        </p>

        {/* Enable toggle */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0a2a5e]">Ne pas deranger</p>
              <p className="text-[10px] text-gray-500">
                Desactive les notifications pendant vos heures de repos
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={onToggleEnabled}
              className="data-[state=checked]:bg-[#003087]"
            />
          </div>
        </div>

        {/* Time range selector */}
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Visual time display */}
            <div className="p-6 rounded-2xl bg-[#003087]/5 border border-[#003087]/10 text-center">
              <Moon className="w-8 h-8 text-[#003087] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#003087]">{formatRange()}</p>
              <p className="text-xs text-gray-500 mt-1">Plage silencieuse</p>
            </div>

            {/* Start hour slider */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#0a2a5e]">Debut</p>
                <p className="text-sm font-bold text-[#003087]">{String(start).padStart(2, '0')}h</p>
              </div>
              <Slider
                value={[start]}
                onValueChange={([v]) => onChangeStart(v)}
                min={18}
                max={23}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>18h</span>
                <span>23h</span>
              </div>
            </div>

            {/* End hour slider */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#0a2a5e]">Fin</p>
                <p className="text-sm font-bold text-[#003087]">{String(end).padStart(2, '0')}h</p>
              </div>
              <Slider
                value={[end]}
                onValueChange={([v]) => onChangeEnd(v)}
                min={5}
                max={10}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                <span>5h</span>
                <span>10h</span>
              </div>
            </div>

            {/* Quick presets */}
            <div>
              <p className="text-xs font-medium text-[#0a2a5e] mb-2">Presets rapides</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <motion.button
                    key={preset.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onApplyPreset(preset.start, preset.end)}
                    className={`p-2.5 rounded-xl text-[10px] font-medium transition-colors border ${
                      start === preset.start && end === preset.end
                        ? 'bg-[#003087] text-white border-[#003087]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#003087]/30'
                    }`}
                  >
                    {preset.label}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="mt-2 p-3 bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-xl">
              <p className="text-[10px] text-[#D4AF37] leading-relaxed flex items-start gap-1">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                Les alertes de securite et transactions escrow ne sont jamais silenciees, meme pendant les
                heures de repos.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
