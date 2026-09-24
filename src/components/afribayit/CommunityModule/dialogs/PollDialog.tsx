'use client';

import { motion } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import type { PollFormState } from '../types';
import { useTranslation } from '@/lib/i18n/use-translate';

interface PollDialogProps {
  open: boolean;
  onClose: () => void;
  form: PollFormState;
  setForm: React.Dispatch<React.SetStateAction<PollFormState>>;
  onSubmit: () => void;
  isPending: boolean;
}

export default function PollDialog({ open, onClose, form, setForm, onSubmit, isPending }: PollDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-primary-pale"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-serif text-xl font-bold text-primary-deep mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent-yellow" /> {t('community.pollDialog.title', 'Créer un sondage')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('community.pollDialog.questionLabel', 'Question')}</label>
            <input
              type="text"
              value={form.question}
              onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
              placeholder={t('community.pollDialog.questionPlaceholder', 'Posez votre question...')}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
          </div>
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-primary-pale flex items-center justify-center text-xs font-bold text-primary-deep shrink-0">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const newOpts = [...form.options];
                  newOpts[i] = e.target.value;
                  setForm(p => ({ ...p, options: newOpts }));
                }}
                placeholder={`${t('community.pollDialog.optionLabel', 'Option')} ${i + 1}`}
                className="flex-1 px-4 py-2.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
              />
              {i >= 2 && (
                <button
                  onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                  className="p-1.5 hover:bg-primary-pale rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}
          {form.options.length < 6 && (
            <button
              onClick={() => setForm(p => ({ ...p, options: [...p.options, ''] }))}
              className="w-full py-2 border-2 border-dashed rounded-2xl text-xs text-gray-text hover:border-primary-green hover:text-primary-deep transition-colors"
            >
              + {t('community.pollDialog.addOption', 'Ajouter une option')}
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-all">{t('community.pollDialog.cancel', 'Annuler')}</button>
            <button
              onClick={onSubmit}
              disabled={isPending}
              className="flex-1 py-3 rounded-full bg-accent-yellow text-primary-deep text-sm font-bold shadow-md hover:bg-[#c4a030] transition-all disabled:opacity-50"
            >
              {isPending ? t('community.pollDialog.publishing', 'Publication...') : t('community.pollDialog.publish', 'Publier le sondage')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
