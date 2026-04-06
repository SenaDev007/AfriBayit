"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface CreditCalculatorProps {
  price: number;
  currency: string;
}

export default function CreditCalculator({ price, currency }: CreditCalculatorProps) {
  const [downPayment, setDownPayment] = useState(Math.round(price * 0.2));
  const [duration, setDuration] = useState(20);
  const [rate, setRate] = useState(8);

  const principal = price - downPayment;
  const monthlyRate = rate / 100 / 12;
  const months = duration * 12;
  const monthly =
    monthlyRate === 0
      ? principal / months
      : (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
        (Math.pow(1 + monthlyRate, months) - 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        💰 Simulateur de crédit
      </h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500">Apport personnel</label>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="input-afri mt-1 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Durée (années)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input-afri mt-1 text-sm"
          >
            {[10, 15, 20, 25, 30].map((y) => (
              <option key={y} value={y}>{y} ans</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Taux d&apos;intérêt (%)</label>
          <input
            type="number"
            value={rate}
            step={0.1}
            onChange={(e) => setRate(Number(e.target.value))}
            className="input-afri mt-1 text-sm"
          />
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Mensualité estimée</p>
          <p className="text-xl font-bold text-[#003087]">
            {isFinite(monthly) && monthly > 0
              ? formatCurrency(Math.round(monthly), currency)
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
