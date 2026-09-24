'use client';

import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  reason: string;
  setReason: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ReportDialog({ open, onClose, reason, setReason, onSubmit, isSubmitting }: ReportDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;
  const handleClose = () => {
    onClose();
    setReason('');
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-primary-pale"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-1 flex items-center gap-2"><Flag className="w-5 h-5 text-[#D93025]" /> {t('community.report.title', 'Signaler ce contenu')}</h3>
        <p className="text-xs text-gray-text mb-4">{t('community.report.moderationNote', 'Notre équipe de modération examinera votre signalement sous 24h.')}</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-primary-deep uppercase tracking-wider mb-1.5 block">{t('community.report.reasonLabel', 'Raison du signalement')}</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-primary-pale bg-white text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-all"
            >
              <option value="">{t('community.report.selectReason', 'Sélectionnez une raison')}</option>
              <option value="spam">{t('community.report.reasonSpam', 'Spam ou contenu indésirable')}</option>
              <option value="hate">{t('community.report.reasonHate', 'Discours de haine')}</option>
              <option value="harassment">{t('community.report.reasonHarassment', 'Harcèlement')}</option>
              <option value="misinformation">{t('community.report.reasonMisinformation', 'Fausse information')}</option>
              <option value="inappropriate">{t('community.report.reasonInappropriate', 'Contenu inapproprié')}</option>
              <option value="scam">{t('community.report.reasonScam', 'Arnaque / fraude')}</option>
              <option value="other">{t('community.report.reasonOther', 'Autre')}</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleClose} className="flex-1 py-3 rounded-full border border-primary-deep/20 text-primary-deep text-sm font-bold hover:bg-primary-pale transition-all">{t('community.report.cancel', 'Annuler')}</button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !reason}
              className="flex-1 py-3 rounded-full bg-[#D93025] text-white text-sm font-bold shadow-md hover:bg-[#b5251f] transition-all disabled:opacity-50"
            >
              {isSubmitting ? t('community.report.sending', 'Envoi...') : t('community.report.submit', 'Signaler')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
