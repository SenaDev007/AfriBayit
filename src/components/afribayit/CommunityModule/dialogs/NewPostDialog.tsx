'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-translate';
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
        <h3 className="font-serif text-xl font-bold text-primary-deep mb-4">{t('community.newPost.title', 'Nouveau sujet')}</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('community.newPost.titleLabel', 'Titre')}</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('community.newPost.titlePlaceholder', 'Sujet de discussion')}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('community.newPost.contentLabel', 'Contenu')}</label>
            <textarea
              rows={4}
              value={form.content}
              onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder={t('community.newPost.contentPlaceholder', 'Décrivez votre sujet... Utilisez @ pour mentionner un membre')}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none resize-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
            <p className="text-[10px] text-gray-400 mt-1">{t('community.newPost.mentionHint', '💡 Utilisez @pseudo pour mentionner un membre')}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('community.newPost.categoryLabel', 'Catégorie')}</label>
            <select
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            >
              <option value="">{t('community.newPost.selectCategory', 'Sélectionnez une catégorie')}</option>
              <option value="discussion">{t('community.newPost.catDiscussion', 'Discussion')}</option>
              <option value="question">{t('community.newPost.catQuestion', 'Question')}</option>
              <option value="success_story">{t('community.newPost.catSuccess', 'Témoignage de succès')}</option>
              <option value="market_analysis">{t('community.newPost.catMarket', 'Analyse de marché')}</option>
              <option value="legal">{t('community.newPost.catLegal', 'Juridique')}</option>
              <option value="event">{t('community.newPost.catEvent', 'Événement')}</option>
              <option value="investment">{t('community.newPost.catInvestment', 'Investissement')}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('community.newPost.tagsLabel', 'Tags (séparés par des virgules)')}</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
              placeholder={t('community.newPost.tagsPlaceholder', "ex: investissement, Côte d'Ivoire")}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-primary-pale rounded-xl">
            <Bot className="w-3.5 h-3.5 text-primary-green shrink-0" />
            <span className="text-[10px] text-primary-deep font-medium">{t('community.newPost.rebeccaCheck', 'Rebecca IA vérifiera votre contenu avant publication')}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-all">{t('community.newPost.cancel', 'Annuler')}</button>
            <button
              onClick={onSubmit}
              disabled={isPending || !form.title || !form.content}
              className="flex-1 py-3 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-wait"
            >
              {isPending ? t('community.newPost.publishing', 'Publication...') : t('community.newPost.publish', 'Publier')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
