'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/use-translate';
import { Newspaper, TrendingUp, FileText, Calendar, ExternalLink } from 'lucide-react';
import { easeOut } from './constants';

export default function NewsPanel() {
  const { t } = useTranslation();
  // CDC §5.7.1 — Fil actualités immobilières: regulatory updates, market trends,
  // premium announcements. Curated by IA + human editor.
  const newsItems = [
    {
      category: 'Réglementation',
      title: 'Réforme foncière Bénin 2023 : le notaire devient incontournable',
      excerpt: 'Toute transaction immobilière doit désormais être authentifiée devant notaire. Le maire ne peut plus affirmer un acte de vente.',
      date: '2025-08-15',
      source: 'Section 10B.1 — CDC',
      color: '#003087',
    },
    {
      category: 'Marché',
      title: 'Abidjan : +15% de croissance immobilière en 2025',
      excerpt: 'Le marché immobilier ivoirien connaît la plus forte croissance de la zone UEMOA, porté par les investissements de la diaspora.',
      date: '2025-08-10',
      source: 'Données AVM AfriBayit',
      color: '#00A651',
    },
    {
      category: 'Fiscalité',
      title: 'Décret 2024-1115 : répartition des honoraires d\'agence',
      excerpt: 'Les frais d\'agence sont désormais répartis équitablement (50/50) entre bailleur et locataire dans toute la zone UEMOA.',
      date: '2025-07-28',
      source: 'Section 10B — CDC',
      color: '#D4AF37',
    },
    {
      category: 'Innovation',
      title: 'Nouvelle RAF Burkina Faso : l\'État propriétaire unique du foncier',
      excerpt: 'La loi du 22 octobre 2025 réforme le régime foncier. Baux emphytéotiques 18-99 ans pour les investisseurs.',
      date: '2025-07-20',
      source: 'Section 10B.3 — CDC',
      color: '#009CDE',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-primary-pale flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-primary-deep" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-primary-deep">{t('community.news.title', 'Actualités immobilières')}</h3>
            <p className="text-xs text-gray-text">{t('community.news.subtitle', 'Réglementation, tendances de marché et annonces premium — curaté par IA + éditeur humain')}</p>
          </div>
        </div>
      </div>

      {/* News cards */}
      {newsItems.map((news, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, ease: easeOut }}
          className="bg-white rounded-3xl shadow-lg border border-primary-pale hover:shadow-xl hover:border-primary-green/30 transition-all overflow-hidden group cursor-pointer"
        >
          <div className="h-1 bg-gradient-to-r from-primary-deep via-primary-green to-accent-yellow opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: `${news.color}15`, color: news.color }}
              >
                {news.category}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Calendar className="w-2.5 h-2.5" />
                {new Date(news.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <h4 className="font-semibold text-sm text-primary-deep mb-1.5 group-hover:text-primary-green transition-colors">
              {news.title}
            </h4>
            <p className="text-xs text-gray-text mb-3 leading-relaxed">{news.excerpt}</p>
            <div className="flex items-center justify-between pt-2 border-t border-primary-pale/60">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <FileText className="w-3 h-3" />
                {news.source}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-primary-deep font-semibold group-hover:gap-2 transition-all">
                {t('community.news.readMore', 'Lire plus')}
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Info banner */}
      <div className="bg-primary-pale/50 rounded-2xl p-4 border border-primary-pale flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-primary-green shrink-0 mt-0.5" />
        <p className="text-xs text-gray-text">
          <strong className="text-primary-deep">{t('community.news.bannerTitle', 'Fil actualités AfriBayit')}</strong> — {t('community.news.bannerDesc', 'Agrégation automatique des nouvelles réglementaires (Section 10B), tendances de marché (données AVM), et annonces premium de la plateforme.')}
        </p>
      </div>
    </motion.div>
  );
}
