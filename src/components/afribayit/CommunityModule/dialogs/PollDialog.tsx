'use client';

import { motion } from 'framer-motion';
import { BarChart3, X } from 'lucide-react';
import type { PollFormState } from '../types';

interface PollDialogProps {
  open: boolean;
  onClose: () => void;
  form: PollFormState;
  setForm: React.Dispatch<React.SetStateAction<PollFormState>>;
  onSubmit: () => void;
  isPending: boolean;
}

export default function PollDialog({ open, onClose, form, setForm, onSubmit, isPending }: PollDialogProps) {
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
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#D4AF37]" /> Créer un sondage</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Question</label>
            <input
              type="text"
              value={form.question}
              onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
              placeholder="Posez votre question..."
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            />
          </div>
          {form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#003087]/10 flex items-center justify-center text-xs font-bold text-[#003087] shrink-0">{String.fromCharCode(65 + i)}</span>
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const newOpts = [...form.options];
                  newOpts[i] = e.target.value;
                  setForm(p => ({ ...p, options: newOpts }));
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-4 py-2.5 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
              />
              {i >= 2 && (
                <button
                  onClick={() => setForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))}
                  className="p-1.5 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          ))}
          {form.options.length < 6 && (
            <button
              onClick={() => setForm(p => ({ ...p, options: [...p.options, ''] }))}
              className="w-full py-2 border-2 border-dashed rounded-2xl text-xs text-gray-400 hover:border-[#003087] hover:text-[#003087] transition-colors"
            >
              + Ajouter une option
            </button>
          )}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border rounded-lg text-sm font-semibold text-gray-600">Annuler</button>
            <button
              onClick={onSubmit}
              disabled={isPending}
              className="flex-1 py-3 bg-[#D4AF37] text-[#003087] rounded-lg text-sm font-bold disabled:opacity-50"
            >
              {isPending ? 'Publication...' : 'Publier le sondage'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
