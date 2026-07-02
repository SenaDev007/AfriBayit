'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import type { NewPostFormState } from '../types';

interface NewPostDialogProps {
  open: boolean;
  onClose: () => void;
  form: NewPostFormState;
  setForm: React.Dispatch<React.SetStateAction<NewPostFormState>>;
  onSubmit: () => void;
  isPending: boolean;
}

export default function NewPostDialog({ open, onClose, form, setForm, onSubmit, isPending }: NewPostDialogProps) {
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
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Nouveau sujet</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Titre</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Sujet de discussion"
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Contenu</label>
            <textarea
              rows={4}
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Décrivez votre sujet... Utilisez @ pour mentionner un membre"
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors"
            />
            <p className="text-[10px] text-gray-400 mt-1">💡 Utilisez @pseudo pour mentionner un membre</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catégorie</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            >
              <option value="">Sélectionnez une catégorie</option>
              <option value="discussion">Discussion</option>
              <option value="question">Question</option>
              <option value="success_story">Témoignage de succès</option>
              <option value="market_analysis">Analyse de marché</option>
              <option value="legal">Juridique</option>
              <option value="event">Événement</option>
              <option value="investment">Investissement</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="ex: investissement, Côte d'Ivoire"
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#009CDE]/5 rounded-xl">
            <Bot className="w-3.5 h-3.5 text-[#009CDE] shrink-0" />
            <span className="text-[10px] text-[#009CDE] font-medium">Rebecca IA vérifiera votre contenu avant publication</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600">Annuler</button>
            <button
              onClick={onSubmit}
              disabled={isPending || !form.title || !form.content}
              className="flex-1 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
            >
              {isPending ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
