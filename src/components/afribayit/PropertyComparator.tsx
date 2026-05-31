'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, getPropertyTypeLabel, getTransactionLabel } from '@/lib/afribayit-utils';
import { getInvestmentScoreLabel } from '@/lib/investment-score';
import ImageWithFallback from './ImageWithFallback';
import { CheckCircle, Star, X, XCircle } from 'lucide-react';

interface CompareProperty {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  surface: number;
  pricePerSqm: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  images: string[];
  features: string[];
  verified: boolean;
  geoTrust: boolean;
  premium: boolean;
  investmentScore: number | null;
  walkScore: number | null;
  views: number;
  favorites: number;
  agent?: {
    name: string;
    company?: string | null;
    certified: boolean;
  };
}

interface PropertyComparatorProps {
  properties: CompareProperty[];
  bestValues: {
    lowestPrice: number;
    highestScore: number;
    largestSurface: number;
    bestPricePerSqm: number;
  };
  onRemoveProperty?: (id: string) => void;
  onViewProperty?: (id: string) => void;
  onClose?: () => void;
}

interface ComparisonRow {
  label: string;
  category: string;
  getValue: (p: CompareProperty) => React.ReactNode;
  getHighlight: (p: CompareProperty) => boolean;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  // General
  {
    label: 'Photo',
    category: 'Général',
    getValue: (p) => (
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
        <ImageWithFallback
          src={p.images?.[0] || ''}
          alt={p.title}
          className="w-full h-full object-cover"
          fallbackType="property"
        />
      </div>
    ),
    getHighlight: () => false,
  },
  {
    label: 'Titre',
    category: 'Général',
    getValue: (p) => <span className="font-semibold text-sm">{p.title}</span>,
    getHighlight: () => false,
  },
  {
    label: 'Type',
    category: 'Général',
    getValue: (p) => getPropertyTypeLabel(p.type),
    getHighlight: () => false,
  },
  {
    label: 'Transaction',
    category: 'Général',
    getValue: (p) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${
        p.transaction === 'achat' ? 'bg-[#003087]' : p.transaction === 'location' ? 'bg-[#00A651]' : 'bg-[#D4AF37]'
      }`}>
        {getTransactionLabel(p.transaction)}
      </span>
    ),
    getHighlight: () => false,
  },
  // Price
  {
    label: 'Prix',
    category: 'Prix',
    getValue: (p) => <span className="font-bold text-[#D4AF37]">{formatPrice(p.price, p.transaction)}</span>,
    getHighlight: (p, ctx) => p.price === ctx.lowestPrice,
  },
  {
    label: 'Prix/m²',
    category: 'Prix',
    getValue: (p) => `${p.pricePerSqm.toLocaleString('fr-FR')} FCFA/m²`,
    getHighlight: (p, ctx) => p.pricePerSqm === ctx.bestPricePerSqm,
  },
  // Size & Rooms
  {
    label: 'Surface',
    category: 'Caractéristiques',
    getValue: (p) => `${p.surface} m²`,
    getHighlight: (p, ctx) => p.surface === ctx.largestSurface,
  },
  {
    label: 'Pièces',
    category: 'Caractéristiques',
    getValue: (p) => `${p.rooms}`,
    getHighlight: () => false,
  },
  {
    label: 'Chambres',
    category: 'Caractéristiques',
    getValue: (p) => `${p.bedrooms}`,
    getHighlight: () => false,
  },
  {
    label: 'SDB',
    category: 'Caractéristiques',
    getValue: (p) => `${p.bathrooms}`,
    getHighlight: () => false,
  },
  // Location
  {
    label: 'Ville',
    category: 'Localisation',
    getValue: (p) => p.city,
    getHighlight: () => false,
  },
  {
    label: 'Quartier',
    category: 'Localisation',
    getValue: (p) => p.quartier,
    getHighlight: () => false,
  },
  // Quality
  {
    label: 'Vérifié',
    category: 'Qualité',
    getValue: (p) => p.verified ? '<CheckCircle className="w-4 h-4" /> Oui' : '<XCircle className="w-4 h-4" /> Non',
    getHighlight: (p) => p.verified,
  },
  {
    label: 'GeoTrust',
    category: 'Qualité',
    getValue: (p) => p.geoTrust ? '<CheckCircle className="w-4 h-4" /> Oui' : '<XCircle className="w-4 h-4" /> Non',
    getHighlight: (p) => p.geoTrust,
  },
  {
    label: 'Premium',
    category: 'Qualité',
    getValue: (p) => p.premium ? ' Oui' : '—',
    getHighlight: (p) => p.premium,
  },
  {
    label: "Score d'investissement",
    category: 'Qualité',
    getValue: (p) => {
      if (!p.investmentScore) return '—';
      const { label, color } = getInvestmentScoreLabel(p.investmentScore);
      return <span className={`font-bold ${color}`}>{p.investmentScore}/100 ({label})</span>;
    },
    getHighlight: (p, ctx) => p.investmentScore === ctx.highestScore,
  },
  {
    label: 'Vues',
    category: 'Qualité',
    getValue: (p) => `${p.views}`,
    getHighlight: () => false,
  },
];

const CATEGORIES = ['Général', 'Prix', 'Caractéristiques', 'Localisation', 'Qualité'];

export default function PropertyComparator({
  properties,
  bestValues,
  onRemoveProperty,
  onViewProperty,
  onClose,
}: PropertyComparatorProps) {
  if (properties.length < 2) return null;

  const ctx = bestValues;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-8"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[1200px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="font-display text-xl font-bold text-[#2C2E2F]">
              Comparaison de biens
            </h2>
            <p className="text-sm text-gray-500">{properties.length} propriétés sélectionnées</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left text-xs font-semibold text-gray-500 w-40 shrink-0 sticky left-0 bg-white z-10">
                  Critère
                </th>
                {properties.map(p => (
                  <th key={p.id} className="p-4 text-center min-w-[200px]">
                    <button
                      onClick={() => onRemoveProperty?.(p.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(category => {
                const rows = COMPARISON_ROWS.filter(r => r.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr>
                      <td
                        colSpan={properties.length + 1}
                        className="px-4 py-2 bg-[#003087]/5 text-xs font-bold text-[#003087] sticky left-0"
                      >
                        {category}
                      </td>
                    </tr>
                    {rows.map(row => (
                      <tr key={row.label} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-xs font-medium text-gray-600 sticky left-0 bg-white z-10">
                          {row.label}
                        </td>
                        {properties.map(p => {
                          const isHighlight = row.getHighlight(p, ctx);
                          return (
                            <td
                              key={p.id}
                              className={`px-4 py-3 text-center text-sm ${isHighlight ? 'bg-[#00A651]/5 font-semibold' : ''}`}
                            >
                              <div className="flex items-center justify-center">
                                {row.getValue(p)}
                                {isHighlight && (
                                  <span className="ml-1 text-[#00A651] text-xs"><Star className="w-4 h-4" /></span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div className="p-6 border-t flex flex-wrap gap-3">
          {properties.map(p => (
            <button
              key={p.id}
              onClick={() => onViewProperty?.(p.id)}
              className="px-4 py-2 bg-[#003087] text-white text-sm font-semibold rounded-xl hover:bg-[#0047b3] transition-colors"
            >
              Voir : {p.title.slice(0, 20)}...
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
