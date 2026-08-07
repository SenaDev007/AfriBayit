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
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-1 flex items-center gap-2"><Flag className="w-5 h-5 text-[#D93025]" /> {t('community.report.title', 'Signaler ce contenu')}</h3>
        <p className="text-xs text-gray-500 mb-4">{t('community.report.moderationNote', 'Notre équipe de modération examinera votre signalement sous 24h.')}</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('community.report.reasonLabel', 'Raison du signalement')}</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
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
            <button onClick={handleClose} className="flex-1 py-3 border rounded-lg text-sm font-semibold text-gray-600">{t('community.report.cancel', 'Annuler')}</button>
            <button
              onClick={onSubmit}
              disabled={isSubmitting || !reason}
              className="flex-1 py-3 bg-[#D93025] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              {isSubmitting ? t('community.report.sending', 'Envoi...') : t('community.report.submit', 'Signaler')}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
