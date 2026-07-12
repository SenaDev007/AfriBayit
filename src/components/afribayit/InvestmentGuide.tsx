'use client';

/**
 * InvestmentGuide — CDC §10B "Cadre légal d'investissement par pays"
 *
 * Educational section displaying the legal framework for real estate
 * investment in each UEMOA country (Bénin, Côte d'Ivoire, Burkina Faso,
 * Togo). Covers:
 *   - Textes législatifs de référence
 *   - Documents légaux acceptés (titre foncier, ACD, ADU, PUH, etc.)
 *   - Innovations réglementaires 2025
 *   - Fiscalité immobilière (droits de mutation, taxe foncière, plus-value)
 *   - Conseils pour investisseurs
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, FileText, Scale, TrendingUp, Lightbulb, ChevronDown } from 'lucide-react';

interface CountryGuide {
  code: string;
  flag: string;
  name: string;
  legalBase: string;
  acceptedDocs: Array<{ doc: string; type: string; status: 'accepted' | 'warning' | 'refused' }>;
  innovations: string[];
  taxation: {
    mutationDuty: string;   // droits de mutation
    propertyTax: string;    // taxe foncière
    capitalGains: string;   // plus-value
  };
  tips: string[];
}

const GUIDES: CountryGuide[] = [
  {
    code: 'BJ',
    flag: '🇧🇯',
    name: 'Bénin',
    legalBase: 'Loi n°2017-20 sur le numérique · Code foncier et domanial · OHADA',
    acceptedDocs: [
      { doc: 'Titre Foncier (TF)', type: 'Tout type', status: 'accepted' },
      { doc: 'Arrêté de Concession Définitive (ACD)', type: 'Terrain urbain', status: 'accepted' },
      { doc: 'Attestation de Droit d\'Usage Coutumier (ADU)', type: 'Terrain rural (depuis 2025)', status: 'accepted' },
      { doc: 'Certificat Foncier Rural (ancien)', type: 'Terrain rural (avant 2025)', status: 'warning' },
      { doc: 'Lettre d\'Attribution', type: 'Terrain (anc. concession)', status: 'warning' },
      { doc: 'Attestation villagioise', type: 'Terrain coutumier', status: 'refused' },
    ],
    innovations: [
      'ACD : SEUL document conférant la pleine propriété d\'un terrain urbain — délai max 6 mois',
      'ADU : nouveau document obligatoire en zone rurale depuis janvier 2025',
      'Frais d\'agence réglementés (Décret 2024-1115) : répartition 50/50 bailleur/locataire',
      'Signature électronique qualifiée conforme à la Loi n°2017-20',
    ],
    taxation: {
      mutationDuty: '5% du prix de vente (particulier) · 10% (professionnel)',
      propertyTax: '0,5% à 2% de la valeur locative cadastrale (annuelle)',
      capitalGains: '15% sur la plus-value (détention < 5 ans) · 5% (> 5 ans) · exonéré (> 10 ans)',
    },
    tips: [
      'Vérifiez que le vendeur possède un TF ou ACD avant toute offre',
      'Privilégiez les biens avec GeoTrust certifié pour sécuriser la transaction',
      'Pour la location longue durée, le dépôt de garantie est plafonné à 3 mois de loyer',
    ],
  },
  {
    code: 'CI',
    flag: '🇨🇮',
    name: 'Côte d\'Ivoire',
    legalBase: 'Code Foncier et Domanial · Décret 2024-1115 · ACD / ADU · OHADA',
    acceptedDocs: [
      { doc: 'Titre Foncier (TF)', type: 'Tout type', status: 'accepted' },
      { doc: 'Arrêté de Concession Définitive (ACD)', type: 'Terrain urbain', status: 'accepted' },
      { doc: 'Attestation de Droit d\'Usage Coutumier (ADU)', type: 'Terrain rural (depuis 2025)', status: 'accepted' },
      { doc: 'Certificat Foncier Rural (ancien)', type: 'Terrain rural (avant 2025)', status: 'warning' },
      { doc: 'Approbation de lotissement', type: 'Immobilier bâti', status: 'warning' },
      { doc: 'Attestation villagioise', type: 'Terrain coutumier', status: 'refused' },
    ],
    innovations: [
      'PRESFOR : opérationnel 2024-2033 — numérisation cadastrale via SIFOR-CI',
      'Décret 2024-1115 : répartition équitable obligatoire des frais d\'agence bailleur/locataire',
      'ADU obligatoire en zone rurale depuis janvier 2025',
      'Marché immobilier en forte croissance (+15%/an à Abidjan)',
    ],
    taxation: {
      mutationDuty: '4% du prix de vente (particulier) · 7% (professionnel)',
      propertyTax: '0,5% à 1,5% de la valeur locative (annuelle)',
      capitalGains: '5% forfaitaire sur le prix de vente (revente < 5 ans) · exonéré (> 5 ans)',
    },
    tips: [
      'Abidjan connaît la plus forte croissance immobilière de la zone UEMOA (+15%/an)',
      'Vérifiez l\'appartenance au lotissement approuvé pour les biens bâtis',
      'Le rendement locatif moyen à Abidjan est de 8% brut (meilleur de la zone)',
    ],
  },
  {
    code: 'BF',
    flag: '🇧🇫',
    name: 'Burkina Faso',
    legalBase: 'Nouvelle RAF 2025 (loi du 22 octobre 2025, 214 articles) · OHADA',
    acceptedDocs: [
      { doc: 'Titre Foncier (TF)', type: 'Tout type urbain', status: 'accepted' },
      { doc: 'Permis Urbain d\'Habiter (PUH)', type: 'Terrain urbain / périurbain', status: 'accepted' },
      { doc: 'Attestation de Possession Foncière Rurale (APFR)', type: 'Terrain rural (nouveau 2025)', status: 'accepted' },
      { doc: 'Bail emphytéotique', type: 'Investissement long terme', status: 'accepted' },
      { doc: 'Arrêté de morcellement', type: 'Terrain lotis', status: 'warning' },
      { doc: 'Convention de vente simple', type: 'Tout bien', status: 'refused' },
    ],
    innovations: [
      'Nouvelle RAF 2025 : l\'État devient propriétaire unique du domaine foncier national',
      'APFR : nouveau document reconnaissant les droits coutumiers ruraux',
      'Baux emphytéotiques (art. 102) : durée 18-99 ans pour investisseurs',
      'Interdiction de propriété foncière rurale pour étrangers (conforme à la RAF 2025)',
    ],
    taxation: {
      mutationDuty: '4% du prix de vente (particulier) · 8% (professionnel)',
      propertyTax: '0,5% à 1% de la valeur locative (annuelle)',
      capitalGains: '10% sur la plus-value (revente < 5 ans) · 5% (> 5 ans) · exonéré (> 10 ans)',
    },
    tips: [
      'Le rendement locatif est le plus élevé de la zone (9% brut) — idéal pour investissement locatif',
      'Pour les investisseurs étrangers : privilégiez le bail emphytéotique (18-99 ans)',
      'Vérifiez la conformité avec la nouvelle RAF 2025 pour les terrains ruraux',
    ],
  },
  {
    code: 'TG',
    flag: '🇹🇬',
    name: 'Togo',
    legalBase: 'Code Foncier et Domanial 2018 (Loi n°2018-005) · OTR n°003/2025 · OHADA',
    acceptedDocs: [
      { doc: 'Titre Foncier (TF)', type: 'Tout type', status: 'accepted' },
      { doc: 'Permis Urbain d\'Habiter (PUH)', type: 'Terrain urbain', status: 'accepted' },
      { doc: 'Certificat de propriété ANDF', type: 'Bien immatriculé', status: 'accepted' },
      { doc: 'Acte de cession notarié', type: 'Tout bien', status: 'warning' },
      { doc: 'Convention verbale', type: 'Tout bien', status: 'refused' },
    ],
    innovations: [
      'CFD 2018 : titre foncier définitif, intangible et inattaquable (art. 256)',
      'Dépôt de provision obligatoire pour réquisition foncière (OTR n°003/2025)',
      'ANDF (Agence Nationale du Domaine et du Foncier) + Cadastre : numérisation en cours',
      'Signature électronique reconnue pour les actes immobiliers',
    ],
    taxation: {
      mutationDuty: '5% du prix de vente (particulier) · 7% (professionnel)',
      propertyTax: '0,5% à 1,5% de la valeur locative (annuelle)',
      capitalGains: '10% sur la plus-value (revente < 5 ans) · 5% (> 5 ans) · exonéré (> 10 ans)',
    },
    tips: [
      'Le TF est intangible et inattaquable — c\'est le document le plus sûr de la zone UEMOA',
      'Lomé connaît une croissance de +10%/an — bon équilibre risque/rendement',
      'Prévoyez le dépôt de provision obligatoire pour les réquisitions foncières (depuis mars 2025)',
    ],
  },
];

const STATUS_CONFIG = {
  accepted: { label: 'Accepté', color: '#00A651', bg: '#00A65115' },
  warning: { label: 'Sous conditions', color: '#D4AF37', bg: '#D4AF3715' },
  refused: { label: 'Refusé', color: '#ef4444', bg: '#ef444415' },
};

export default function InvestmentGuide() {
  const [selectedCountry, setSelectedCountry] = useState<string>('BJ');
  const guide = GUIDES.find(g => g.code === selectedCountry) || GUIDES[0];

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b bg-gradient-to-r from-[#2C2E2F] to-[#1a1c1d]">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-[#D4AF37]" />
          <h3 className="font-display text-sm font-bold text-white">Guide d&apos;investissement par pays</h3>
        </div>
        <p className="text-[10px] text-white/70">
          Cadre légal OHADA, documents acceptés, fiscalité immobilière et conseils
          pour investir en Afrique de l&apos;Ouest.
        </p>
      </div>

      {/* Country selector */}
      <div className="flex gap-1 p-3 bg-gray-50/50 border-b overflow-x-auto">
        {GUIDES.map(g => (
          <button
            key={g.code}
            onClick={() => setSelectedCountry(g.code)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCountry === g.code
                ? 'bg-[#003087] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span className="text-base">{g.flag}</span>
            {g.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={guide.code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="p-5 space-y-4"
        >
          {/* Legal base */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Scale className="w-4 h-4 text-[#003087]" />
              <h4 className="text-xs font-bold text-[#003087]">Cadre légal</h4>
            </div>
            <p className="text-xs text-gray-600 bg-[#003087]/5 rounded-xl p-3">
              {guide.legalBase}
            </p>
          </div>

          {/* Accepted documents */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="w-4 h-4 text-[#003087]" />
              <h4 className="text-xs font-bold text-[#003087]">Documents légaux acceptés</h4>
            </div>
            <div className="space-y-1.5">
              {guide.acceptedDocs.map((doc, i) => {
                const cfg = STATUS_CONFIG[doc.status];
                return (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50/50">
                    <span
                      className="shrink-0 w-2 h-2 rounded-full"
                      style={{ backgroundColor: cfg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0a2a5e] truncate">{doc.doc}</p>
                      <p className="text-[10px] text-gray-400">{doc.type}</p>
                    </div>
                    <span
                      className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Innovations */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-4 h-4 text-[#00A651]" />
              <h4 className="text-xs font-bold text-[#003087]">Innovations réglementaires 2025</h4>
            </div>
            <ul className="space-y-1.5">
              {guide.innovations.map((innov, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-[#00A651] mt-0.5">✦</span>
                  <span>{innov}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Taxation */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs font-bold text-[#003087]">Fiscalité immobilière</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <TaxRow label="Droits de mutation" value={guide.taxation.mutationDuty} />
              <TaxRow label="Taxe foncière (annuelle)" value={guide.taxation.propertyTax} />
              <TaxRow label="Plus-value à la revente" value={guide.taxation.capitalGains} />
            </div>
          </div>

          {/* Tips */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Lightbulb className="w-4 h-4 text-[#D4AF37]" />
              <h4 className="text-xs font-bold text-[#003087]">Conseils pour investisseurs</h4>
            </div>
            <ul className="space-y-1.5">
              {guide.tips.map((tip, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-0.5">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function TaxRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-[#D4AF37]/5">
      <span className="text-[10px] text-gray-500 shrink-0 pt-0.5">{label}</span>
      <span className="text-xs font-semibold text-[#0a2a5e] text-right">{value}</span>
    </div>
  );
}
