'use client';

/**
 * PricePredictionChart — CDC §5.1.1 "Prédictions de prix par quartier (ML) — historique 5 ans"
 *
 * Displays a 5-year price history chart with ML-based prediction for the next 2 years.
 *
 * Previously, this component computed fake growth rates (BJ 12%, CI 15%, BF 8%, TG 10%)
 * client-side and presented them as if they were real market data. The audit-infra
 * task #6 flagged this as dishonest. The chart now fetches real predictions from the
 * backend `/properties/{id}/price-prediction` endpoint and shows an honest
 * "available soon" empty state when the backend has no data yet (or returns an error).
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Brain, Info } from 'lucide-react';
import { api } from '@/lib/api-client';

const easeOut = [0.16, 1, 0.3, 1] as const;
const NAVY = '#003087';
const GOLD = '#D4AF37';
const GREEN = '#00A651';

interface HistoryPoint {
  year: number;
  price: number;
}

interface ForecastPoint {
  year: number;
  price: number;
  confidence: number;
}

interface PricePredictionResponse {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
}

interface PricePredictionChartProps {
  /** Property id — used to fetch real predictions from the backend. */
  propertyId?: string;
  /** Current property price in FCFA (used as fallback when no history is returned). */
  currentPrice: number;
  /** City label (display only). */
  city?: string;
  /** Country code (BJ, CI, BF, TG — display only). */
  country?: string;
}

export default function PricePredictionChart({
  propertyId,
  currentPrice,
  city = 'Cotonou',
  country = 'BJ',
}: PricePredictionChartProps) {
  const [showInfo, setShowInfo] = useState(false);

  // Real backend fetch — no more simulated growth rates.
  // On any error (404, 500, network), we surface an honest empty state
  // instead of pretending to display real predictions.
  const { data: predictionData } = useQuery<PricePredictionResponse | null>({
    queryKey: ['price-prediction', propertyId, city, country],
    queryFn: async () => {
      if (!propertyId) return null;
      try {
        return await api.get<PricePredictionResponse>(
          `/properties/${propertyId}/price-prediction`,
        );
      } catch {
        return null; // empty state, not fake data
      }
    },
    enabled: !!propertyId,
  });

  // Derive the chart series + summary stats from the backend response.
  const { history, prediction, stats } = useMemo(() => {
    if (!predictionData || !predictionData.history?.length) {
      return { history: [] as HistoryPoint[], prediction: [] as ForecastPoint[], stats: null };
    }

    const historyPoints = predictionData.history;
    const predictionPoints = predictionData.forecast ?? [];

    const price5yAgo = historyPoints[0]?.price ?? currentPrice;
    const price2yFuture = predictionPoints[1]?.price ?? currentPrice;
    const totalGrowth5y = price5yAgo > 0
      ? ((currentPrice - price5yAgo) / price5yAgo) * 100
      : 0;
    const predictedGrowth2y = currentPrice > 0
      ? ((price2yFuture - currentPrice) / currentPrice) * 100
      : 0;
    const annualGrowth = historyPoints.length >= 2 && price5yAgo > 0
      ? (Math.pow(currentPrice / price5yAgo, 1 / Math.max(historyPoints.length - 1, 1)) - 1) * 100
      : 0;

    return {
      history: historyPoints,
      prediction: predictionPoints,
      stats: {
        price5yAgo,
        currentPrice,
        price2yFuture,
        totalGrowth5y: Math.round(totalGrowth5y * 10) / 10,
        predictedGrowth2y: Math.round(predictedGrowth2y * 10) / 10,
        annualGrowth: Math.round(annualGrowth * 10) / 10,
      },
    };
  }, [predictionData, currentPrice]);

  const formatPrice = (p: number) => {
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
    if (p >= 1_000) return `${(p / 1_000).toFixed(0)}K`;
    return String(p);
  };

  // ─── Honest empty state ────────────────────────────────────────────────
  // When the backend has no prediction data (or the endpoint is not yet
  // implemented), do NOT fall back to simulated data — show an honest
  // "available soon" message instead.
  if (!predictionData || history.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-5 h-5" style={{ color: GOLD }} />
              <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
                Prédiction de prix IA
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${GOLD}15`, color: GOLD }}>
                ML
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Historique 5 ans + prédiction 2 ans · {city}, {country}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: `${GOLD}10` }}>
            <Brain className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Prédictions de prix disponibles prochainement
          </p>
          <p className="text-xs text-gray-400 max-w-md">
            Notre moteur de prédiction basé sur l&apos;historique des transactions AfriBayit est en cours
            d&apos;entraînement sur ce marché. Revenez bientôt pour consulter les tendances et prévisions.
          </p>
        </div>
      </div>
    );
  }

  // ─── Chart dimensions ────────────────────────────────────────────────
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allPrices = [...history, ...prediction].map((p) => p.price);
  const minPrice = Math.min(...allPrices) * 0.95;
  const maxPrice = Math.max(...allPrices) * 1.05;
  const priceRange = maxPrice - minPrice;

  const allPoints = [...history, ...prediction];
  const xStep = chartW / (allPoints.length - 1);

  const getX = (i: number) => padding.left + i * xStep;
  const getY = (price: number) =>
    padding.top + chartH - ((price - minPrice) / priceRange) * chartH;

  // Build SVG path for history
  const historyPath = history
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.price)}`)
    .join(' ');

  // Build SVG path for prediction (dashed)
  const predictionPath = prediction
    .map((p, i) => {
      const histIdx = history.length - 1;
      return `${i === 0 ? 'M' : 'L'} ${getX(histIdx + i)} ${getY(p.price)}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5" style={{ color: GOLD }} />
            <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'var(--font-inter), Georgia, serif' }}>
              Prédiction de prix IA
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${GOLD}15`, color: GOLD }}>
              ML
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Historique 5 ans + prédiction 2 ans · {city}, {country}
          </p>
        </div>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Info className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Info tooltip */}
      {showInfo && stats && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 p-3 rounded-xl bg-blue-50 text-xs text-gray-600"
        >
          Modèle de régression linéaire basé sur l&apos;historique des transactions AfriBayit et les tendances
          du marché immobilier ouest-africain. Croissance annuelle estimée: {stats.annualGrowth}%.
          Les prédictions sont indicatives et ne constituent pas un conseil financier.
        </motion.div>
      )}

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-400 mb-1">Il y a 5 ans</p>
            <p className="text-sm font-bold text-gray-700">{formatPrice(stats.price5yAgo)} FCFA</p>
            <p className="text-[10px] mt-1 flex items-center justify-center gap-0.5" style={{ color: GREEN }}>
              <TrendingUp className="w-3 h-3" />
              +{stats.totalGrowth5y}%
            </p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: `${NAVY}08` }}>
            <p className="text-xs text-gray-400 mb-1">Aujourd&apos;hui</p>
            <p className="text-sm font-bold" style={{ color: NAVY }}>
              {formatPrice(stats.currentPrice)} FCFA
            </p>
            <p className="text-[10px] mt-1 text-gray-400">Valeur actuelle</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: `${GOLD}08` }}>
            <p className="text-xs text-gray-400 mb-1">Dans 2 ans</p>
            <p className="text-sm font-bold" style={{ color: GOLD }}>
              {formatPrice(stats.price2yFuture)} FCFA
            </p>
            <p className="text-[10px] mt-1 flex items-center justify-center gap-0.5" style={{ color: GREEN }}>
              <TrendingUp className="w-3 h-3" />
              +{stats.predictedGrowth2y}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={padding.left}
              y1={padding.top + chartH * t}
              x2={width - padding.right}
              y2={padding.top + chartH * t}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}

          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const price = maxPrice - priceRange * t;
            return (
              <text
                key={t}
                x={padding.left - 8}
                y={padding.top + chartH * t + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400"
                style={{ fontSize: '10px' }}
              >
                {formatPrice(price)}
              </text>
            );
          })}

          {/* X-axis labels (years) */}
          {allPoints.map((p, i) => (
            <text
              key={i}
              x={getX(i)}
              y={height - 8}
              textAnchor="middle"
              className="fill-gray-400"
              style={{ fontSize: '10px' }}
            >
              {p.year}
            </text>
          ))}

          {/* History area fill */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={NAVY} stopOpacity="0.2" />
              <stop offset="100%" stopColor={NAVY} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${historyPath} L ${getX(history.length - 1)} ${padding.top + chartH} L ${getX(0)} ${padding.top + chartH} Z`}
            fill="url(#priceGradient)"
          />

          {/* History line */}
          <motion.path
            d={historyPath}
            fill="none"
            stroke={NAVY}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: easeOut }}
          />

          {/* Prediction line (dashed) */}
          {prediction.length > 0 && (
            <motion.path
              d={predictionPath}
              fill="none"
              stroke={GOLD}
              strokeWidth={2.5}
              strokeDasharray="6 4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: 1, ease: easeOut }}
            />
          )}

          {/* Data points */}
          {history.map((p, i) => (
            <circle
              key={`h-${i}`}
              cx={getX(i)}
              cy={getY(p.price)}
              r={3}
              fill="white"
              stroke={NAVY}
              strokeWidth={2}
            />
          ))}
          {prediction.map((p, i) => (
            <circle
              key={`p-${i}`}
              cx={getX(history.length - 1 + i)}
              cy={getY(p.price)}
              r={3}
              fill="white"
              stroke={GOLD}
              strokeWidth={2}
            />
          ))}

          {/* Current price indicator */}
          <line
            x1={getX(history.length - 1)}
            y1={padding.top}
            x2={getX(history.length - 1)}
            y2={padding.top + chartH}
            stroke={NAVY}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.3}
          />
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-lg" style={{ background: NAVY }} />
            <span className="text-xs text-gray-500">Historique réel</span>
          </div>
          {prediction.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-0.5 rounded-lg" style={{ background: GOLD, opacity: 0.7 }} />
              <span className="text-xs text-gray-500">Prédiction ML</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
