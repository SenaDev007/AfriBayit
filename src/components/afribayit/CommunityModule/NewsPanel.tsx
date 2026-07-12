'use client';

import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, FileText, Calendar, ExternalLink } from 'lucide-react';
import { easeOut } from './constants';

export default function NewsPanel() {
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
      <div className="bg-white rounded-xl p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#003087]/10 flex items-center justify-center">
            <Newspaper className="w-5 h-5 text-[#003087]" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#0a2a5e]">Actualités immobilières</h3>
            <p className="text-xs text-gray-500">Réglementation, tendances de marché et annonces premium — curaté par IA + éditeur humain</p>
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
          className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-[#003087]/20 transition-all overflow-hidden group cursor-pointer"
        >
          <div className="h-1 bg-gradient-to-r from-[#003087] via-[#00A651] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
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
            <h4 className="font-semibold text-sm text-[#0a2a5e] mb-1.5 group-hover:text-[#003087] transition-colors">
              {news.title}
            </h4>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">{news.excerpt}</p>
            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <FileText className="w-3 h-3" />
                {news.source}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[#003087] font-semibold group-hover:gap-2 transition-all">
                Lire plus
                <ExternalLink className="w-3 h-3" />
              </span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Info banner */}
      <div className="bg-gradient-to-r from-[#003087]/5 to-[#009CDE]/5 rounded-2xl p-4 border flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-[#009CDE] shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          <strong className="text-[#0a2a5e]">Fil actualités AfriBayit</strong> — Agrégation automatique des nouvelles
          réglementaires (Section 10B), tendances de marché (données AVM), et annonces premium de la plateforme.
        </p>
      </div>
    </motion.div>
  );
}
