'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// Interest rates per country (% annual)
const COUNTRY_RATES: Record<string, number> = {
  BJ: 8.0,
  CI: 7.5,
  BF: 9.0,
  TG: 8.5,
};

const COUNTRY_BANKS: Record<string, { name: string; url: string }[]> = {
  BJ: [
    { name: 'Banque Atlantique Bénin', url: '#' },
    { name: 'BOA Bénin', url: '#' },
    { name: 'Ecobank Bénin', url: '#' },
  ],
  CI: [
    { name: 'Banque Atlantique Côte d\'Ivoire', url: '#' },
    { name: 'SGBCI', url: '#' },
    { name: 'Ecobank Côte d\'Ivoire', url: '#' },
  ],
  BF: [
    { name: 'Banque Atlantique Burkina', url: '#' },
    { name: 'BOA Burkina', url: '#' },
    { name: 'Ecobank Burkina', url: '#' },
  ],
  TG: [
    { name: 'Banque Atlantique Togo', url: '#' },
    { name: 'Ecobank Togo', url: '#' },
    { name: 'UTB', url: '#' },
  ],
};

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface FinancingSimulatorProps {
  propertyPrice?: number;
  country?: string;
  onClose?: () => void;
}

export default function FinancingSimulator({
  propertyPrice = 25000000,
  country = 'BJ',
  onClose,
}: FinancingSimulatorProps) {
  const [price, setPrice] = useState(propertyPrice);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [interestRate, setInterestRate] = useState(COUNTRY_RATES[country] || 8);
  const [duration, setDuration] = useState(15);
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [showSchedule, setShowSchedule] = useState(false);

  const calculations = useMemo(() => {
    const downPayment = price * (downPaymentPct / 100);
    const loanAmount = price - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = duration * 12;

    let monthlyPayment: number;
    if (monthlyRate === 0) {
      monthlyPayment = loanAmount / totalMonths;
    } else {
      monthlyPayment =
        loanAmount *
        (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalCost = monthlyPayment * totalMonths;
    const totalInterest = totalCost - loanAmount;

    // Amortization schedule
    const schedule: AmortizationRow[] = [];
    let balance = loanAmount;
    for (let month = 1; month <= totalMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      schedule.push({
        month,
        payment: Math.round(monthlyPayment),
        principal: Math.round(principalPayment),
        interest: Math.round(interestPayment),
        balance: Math.max(0, Math.round(balance)),
      });
    }

    // Comparison for different durations
    const durationComparison = [5, 10, 15, 20, 25]
      .filter(d => d <= 25)
      .map(d => {
        const months = d * 12;
        let mp: number;
        if (monthlyRate === 0) {
          mp = loanAmount / months;
        } else {
          mp =
            loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
        }
        return {
          duration: d,
          monthlyPayment: Math.round(mp),
          totalCost: Math.round(mp * months),
          totalInterest: Math.round(mp * months - loanAmount),
        };
      });

    return {
      downPayment: Math.round(downPayment),
      loanAmount: Math.round(loanAmount),
      monthlyPayment: Math.round(monthlyPayment),
      totalCost: Math.round(totalCost),
      totalInterest: Math.round(totalInterest),
      schedule,
      durationComparison,
    };
  }, [price, downPaymentPct, interestRate, duration]);

  const banks = COUNTRY_BANKS[selectedCountry] || [];

  const formatXOF = (n: number) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

  return (
    <div className="bg-white rounded-3xl border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-[#003087] to-[#0047b3]">
        <div>
          <h2 className="font-display text-xl font-bold text-white">
            Simulateur de Financement
          </h2>
          <p className="text-sm text-white/70">Calculez votre mensualité de crédit immobilier</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-5">
            {/* Country */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Pays</label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setInterestRate(COUNTRY_RATES[e.target.value] || 8);
                }}
                className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:border-[#003087] transition-colors"
              >
                <option value="BJ">Bénin</option>
                <option value="CI">Côte d'Ivoire</option>
                <option value="BF">Burkina Faso</option>
                <option value="TG">Togo</option>
              </select>
            </div>

            {/* Property Price */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Prix du bien (FCFA)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                min={0}
                step={500000}
                className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:border-[#003087] transition-colors"
              />
            </div>

            {/* Down Payment */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Apport personnel : {downPaymentPct}% ({formatXOF(calculations.downPayment)})
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={downPaymentPct}
                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                className="w-full accent-[#003087]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>90%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Taux d&apos;intérêt annuel (%)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                min={0}
                max={25}
                step={0.5}
                className="w-full px-4 py-3 rounded-xl border bg-gray-50 text-sm outline-none focus:border-[#003087] transition-colors"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Taux moyen {selectedCountry} : {COUNTRY_RATES[selectedCountry]}%
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">
                Durée du crédit : {duration} ans
              </label>
              <input
                type="range"
                min={5}
                max={25}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-[#003087]"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>5 ans</span>
                <span>15 ans</span>
                <span>25 ans</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#003087] to-[#0047b3] rounded-2xl p-6 text-white">
              <p className="text-sm text-white/70 mb-1">Mensualité estimée</p>
              <p className="font-mono-data text-3xl font-bold">
                {formatXOF(calculations.monthlyPayment)}
              </p>
              <p className="text-xs text-white/60 mt-1">/mois pendant {duration} ans</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 mb-1">Montant du prêt</p>
                <p className="font-semibold text-sm">{formatXOF(calculations.loanAmount)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 mb-1">Apport personnel</p>
                <p className="font-semibold text-sm">{formatXOF(calculations.downPayment)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 mb-1">Coût total du crédit</p>
                <p className="font-semibold text-sm">{formatXOF(calculations.totalCost + calculations.downPayment)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-500 mb-1">Intérêts totaux</p>
                <p className="font-semibold text-sm text-[#D4AF37]">{formatXOF(calculations.totalInterest)}</p>
              </div>
            </div>

            {/* Duration Comparison Table */}
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-2">Comparaison par durée</h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-left text-gray-500">Durée</th>
                      <th className="px-3 py-2 text-right text-gray-500">Mensualité</th>
                      <th className="px-3 py-2 text-right text-gray-500">Intérêts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.durationComparison.map(dc => (
                      <tr
                        key={dc.duration}
                        className={`border-t ${dc.duration === duration ? 'bg-[#003087]/5 font-semibold' : ''}`}
                      >
                        <td className="px-3 py-2">{dc.duration} ans</td>
                        <td className="px-3 py-2 text-right">{formatXOF(dc.monthlyPayment)}</td>
                        <td className="px-3 py-2 text-right text-[#D4AF37]">{formatXOF(dc.totalInterest)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Amortization Schedule */}
        <div className="mt-6">
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            className="text-sm text-[#003087] font-semibold hover:underline"
          >
            {showSchedule ? 'Masquer' : 'Afficher'} le tableau d&apos;amortissement
          </button>
          
          {showSchedule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 overflow-x-auto rounded-xl border max-h-96 overflow-y-auto"
            >
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Mois</th>
                    <th className="px-3 py-2 text-right text-gray-500">Mensualité</th>
                    <th className="px-3 py-2 text-right text-gray-500">Capital</th>
                    <th className="px-3 py-2 text-right text-gray-500">Intérêts</th>
                    <th className="px-3 py-2 text-right text-gray-500">Solde restant</th>
                  </tr>
                </thead>
                <tbody>
                  {calculations.schedule
                    .filter((_, i) => i % 12 === 0 || i === calculations.schedule.length - 1)
                    .map(row => (
                      <tr key={row.month} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{row.month}</td>
                        <td className="px-3 py-2 text-right">{formatXOF(row.payment)}</td>
                        <td className="px-3 py-2 text-right">{formatXOF(row.principal)}</td>
                        <td className="px-3 py-2 text-right text-[#D4AF37]">{formatXOF(row.interest)}</td>
                        <td className="px-3 py-2 text-right">{formatXOF(row.balance)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>

        {/* Bank Partners */}
        {banks.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-xs font-semibold text-gray-700 mb-3">Banques partenaires au {selectedCountry === 'BJ' ? 'Bénin' : selectedCountry === 'CI' ? 'Côte d\'Ivoire' : selectedCountry === 'BF' ? 'Burkina Faso' : 'Togo'}</h3>
            <div className="flex flex-wrap gap-2">
              {banks.map(bank => (
                <a
                  key={bank.name}
                  href={bank.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-50 rounded-xl text-xs font-medium text-gray-600 hover:bg-[#003087]/5 hover:text-[#003087] transition-colors border"
                >
                  {bank.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
