'use client';

/**
 * ROICalculator — CDC §5.9.2 "ROI locatif : rendement brut/net, revenus perçus"
 *
 * Interactive rental ROI calculator. Lets the investor adjust:
 *   - Purchase price
 *   - Estimated monthly rent
 *   - Charges (monthly)
 *   - Vacancy rate (%)
 *   - Property tax (annual)
 *
 * Computes:
 *   - Gross yield (annual rent / price)
 *   - Net yield ((annual rent - charges - tax - vacancy) / price)
 *   - Monthly cashflow
 *   - Annual cashflow
 *   - Payback period (years)
 *   - 5-year projected capital gain (based on country growth rate)
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Coins, Calendar, Percent, Wallet, ArrowRight } from 'lucide-react';

const COUNTRY_GROWTH: Record<string, number> = {
  BJ: 0.12, CI: 0.15, BF: 0.08, TG: 0.10,
};

const COUNTRY_LABELS: Record<string, string> = {
  BJ: 'Bénin', CI: 'Côte d\'Ivoire', BF: 'Burkina Faso', TG: 'Togo',
};

interface ROICalculatorProps {
  /** Pre-fill with the property price */
  propertyPrice?: number;
  /** Pre-fill with the estimated monthly rent */
  estimatedRent?: number;
  /** Country code for growth rate */
  country?: string;
  /** Compact mode (for embedding in a sidebar) */
  compact?: boolean;
}

export default function ROICalculator({
  propertyPrice = 25_000_000,
  estimatedRent,
  country = 'BJ',
  compact = false,
}: ROICalculatorProps) {
  const [price, setPrice] = useState(propertyPrice);
  const [rent, setRent] = useState(estimatedRent || Math.round(propertyPrice * 0.07 / 12));
  const [charges, setCharges] = useState(Math.round((estimatedRent || Math.round(propertyPrice * 0.07 / 12)) * 0.15));
  const [vacancyPct, setVacancyPct] = useState(5); // 5% default
  const [propertyTax, setPropertyTax] = useState(Math.round(propertyPrice * 0.005)); // 0.5% annual
  const [selectedCountry, setSelectedCountry] = useState(country);

  const calc = useMemo(() => {
    const annualRentGross = rent * 12;
    const vacancyLoss = annualRentGross * (vacancyPct / 100);
    const annualRentNet = annualRentGross - vacancyLoss;
    const annualCharges = charges * 12;
    const totalAnnualCosts = annualCharges + propertyTax + vacancyLoss;
    const annualCashflow = annualRentNet - annualCharges - propertyTax;
    const monthlyCashflow = annualCashflow / 12;

    const grossYield = price > 0 ? (annualRentGross / price) * 100 : 0;
    const netYield = price > 0 ? (annualCashflow / price) * 100 : 0;
    const paybackYears = annualCashflow > 0 ? price / annualCashflow : null;

    const growthRate = COUNTRY_GROWTH[selectedCountry] ?? 0.10;
    const projectedValue5y = price * Math.pow(1 + growthRate, 5);
    const projectedGain5y = projectedValue5y - price;
    const projectedGainPct = ((projectedValue5y / price) - 1) * 100;

    // Total return over 5 years = cashflow + capital gain
    const totalReturn5y = annualCashflow * 5 + projectedGain5y;
    const totalReturnPct = (totalReturn5y / price) * 100;

    return {
      annualRentGross,
      annualRentNet,
      annualCharges,
      totalAnnualCosts,
      annualCashflow,
      monthlyCashflow,
      grossYield,
      netYield,
      paybackYears,
      projectedValue5y,
      projectedGain5y,
      projectedGainPct,
      totalReturn5y,
      totalReturnPct,
      growthRate,
    };
  }, [price, rent, charges, vacancyPct, propertyTax, selectedCountry]);

  const fmt = (n: number) => `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FCFA`;
  const fmtPct = (n: number) => `${(Math.round(n * 10) / 10)}%`;

  // Yield color coding
  const yieldColor = (y: number) => y >= 8 ? '#00A651' : y >= 5 ? '#D4AF37' : '#ef4444';

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${compact ? '' : 'shadow-sm'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-[#003087] to-[#0047b3]">
        <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
        <div>
          <h3 className="font-display text-sm font-bold text-white">Calculateur ROI locatif</h3>
          <p className="text-[10px] text-white/70">Rendement brut/net, cashflow, plus-value à 5 ans</p>
        </div>
      </div>

      <div className={`p-4 ${compact ? '' : 'lg:p-6'} space-y-4`}>
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Prix d'achat (FCFA)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              step={500_000}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Loyer mensuel (FCFA)</label>
            <input
              type="number"
              value={rent}
              onChange={(e) => setRent(Number(e.target.value) || 0)}
              step={10_000}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono font-bold focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Charges/mois (FCFA)</label>
            <input
              type="number"
              value={charges}
              onChange={(e) => setCharges(Number(e.target.value) || 0)}
              step={5_000}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Taxe foncière/an (FCFA)</label>
            <input
              type="number"
              value={propertyTax}
              onChange={(e) => setPropertyTax(Number(e.target.value) || 0)}
              step={10_000}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Taux de vacance: {vacancyPct}%</label>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={vacancyPct}
              onChange={(e) => setVacancyPct(Number(e.target.value))}
              className="w-full accent-[#003087]"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Pays (croissance)</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-[#003087]"
            >
              {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label} (+{Math.round((COUNTRY_GROWTH[code] || 0.1) * 100)}%/an)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-[#003087]/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="w-3.5 h-3.5 text-[#003087]" />
              <p className="text-[10px] text-gray-500">Rendement brut</p>
            </div>
            <p className="font-mono-data font-bold text-lg" style={{ color: yieldColor(calc.grossYield) }}>
              {fmtPct(calc.grossYield)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#00A651]/5">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#00A651]" />
              <p className="text-[10px] text-gray-500">Rendement net</p>
            </div>
            <p className="font-mono-data font-bold text-lg" style={{ color: yieldColor(calc.netYield) }}>
              {fmtPct(calc.netYield)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#D4AF37]/5">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet className="w-3.5 h-3.5 text-[#D4AF37]" />
              <p className="text-[10px] text-gray-500">Cashflow mensuel</p>
            </div>
            <p className={`font-mono-data font-bold text-lg ${calc.monthlyCashflow >= 0 ? 'text-[#00A651]' : 'text-red-500'}`}>
              {calc.monthlyCashflow >= 0 ? '+' : ''}{fmt(calc.monthlyCashflow)}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-[10px] text-gray-500">Rentabilité (années)</p>
            </div>
            <p className="font-mono-data font-bold text-lg text-[#0a2a5e]">
              {calc.paybackYears ? `${Math.round(calc.paybackYears)} ans` : '—'}
            </p>
          </div>
        </div>

        {/* 5-year projection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-2xl bg-gradient-to-br from-[#003087] to-[#0047b3] text-white"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Coins className="w-4 h-4 text-[#D4AF37]" />
            <p className="text-xs font-semibold">Projection à 5 ans</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-white/60 mb-0.5">Valeur estimée</p>
              <p className="font-mono-data font-bold text-sm">{fmt(calc.projectedValue5y)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 mb-0.5">Plus-value</p>
              <p className="font-mono-data font-bold text-sm text-[#D4AF37]">+{fmt(calc.projectedGain5y)}</p>
              <p className="text-[10px] text-[#D4AF37]">+{fmtPct(calc.projectedGainPct)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/60 mb-0.5">Retour total</p>
              <p className="font-mono-data font-bold text-sm text-[#00A651]">+{fmt(calc.totalReturn5y)}</p>
              <p className="text-[10px] text-[#00A651]">+{fmtPct(calc.totalReturnPct)}</p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/50 text-center">
            Croissance {COUNTRY_LABELS[selectedCountry]}: {Math.round(calc.growthRate * 100)}%/an · Cashflow 5 ans + plus-value
          </div>
        </motion.div>

        {/* Breakdown */}
        {!compact && (
          <div className="text-[10px] text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Loyer annuel brut</span>
              <span className="font-mono">{fmt(calc.annualRentGross)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>− Vacance ({vacancyPct}%)</span>
              <span className="font-mono">−{fmt(calc.annualRentGross - calc.annualRentNet)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>− Charges annuelles</span>
              <span className="font-mono">−{fmt(calc.annualCharges)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>− Taxe foncière</span>
              <span className="font-mono">−{fmt(propertyTax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-[#0a2a5e] pt-1 border-t">
              <span className="flex items-center gap-1">Cashflow annuel <ArrowRight className="w-3 h-3" /></span>
              <span className={`font-mono ${calc.annualCashflow >= 0 ? 'text-[#00A651]' : 'text-red-500'}`}>
                {calc.annualCashflow >= 0 ? '+' : ''}{fmt(calc.annualCashflow)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
