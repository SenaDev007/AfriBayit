"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MonthlyPoint {
  month: string;
  transactions: number;
  montant: number;
}

interface ChartByType {
  name: string;
  value: number;
}

interface ChartByState {
  name: string;
  count: number;
  amount: number;
}

interface Props {
  monthly: MonthlyPoint[];
  propertiesByType: ChartByType[];
  escrowByState: ChartByState[];
}

// ─── Colors ──────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#0070BA", "#003087", "#D4AF37", "#00A651", "#E11D48", "#7C3AED", "#EA580C", "#0891B2"];
const AREA_COLOR = "#0070BA";
const BAR_COLOR = "#D4AF37";
const BAR_COLOR2 = "#0070BA";

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
          {p.name} : <strong>{typeof p.value === "number" && p.name.includes("montant") ? `${p.value.toLocaleString("fr-FR")} KFCFA` : p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardCharts({ monthly, propertiesByType, escrowByState }: Props) {
  const hasMonthly = monthly.some((m) => m.transactions > 0 || m.montant > 0);
  const hasTypes = propertiesByType.length > 0;
  const hasEscrow = escrowByState.length > 0;

  return (
    <div className="space-y-6">
      {/* Area Chart — transactions mensuelles */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-800">Activité — 6 derniers mois</h3>
            <p className="text-xs text-gray-400 mt-0.5">Transactions escrow par mois (en KFCFA)</p>
          </div>
        </div>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthly} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={AREA_COLOR} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={AREA_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={45} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="montant"
                name="Montant"
                stroke={AREA_COLOR}
                strokeWidth={2.5}
                fill="url(#colorMontant)"
                dot={{ fill: AREA_COLOR, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="transactions"
                name="Nb transactions"
                stroke="#D4AF37"
                strokeWidth={2}
                fill="transparent"
                dot={{ fill: "#D4AF37", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">
            Aucune transaction ces 6 derniers mois
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart — escrow par état */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-1">Escrow par état</h3>
          <p className="text-xs text-gray-400 mb-4">Nombre et montant (KFCFA)</p>
          {hasEscrow ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={escrowByState} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Nb" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="amount" name="montant KFCFA" fill={BAR_COLOR2} radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">
              Aucun escrow pour l&apos;instant
            </div>
          )}
        </div>

        {/* Pie Chart — biens par type */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-1">Mes annonces par type</h3>
          <p className="text-xs text-gray-400 mb-4">Répartition du portefeuille</p>
          {hasTypes ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={propertiesByType}
                  dataKey="value"
                  nameKey="name"
                  cx="45%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={35}
                  paddingAngle={3}
                >
                  {propertiesByType.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any, n: any) => [v, n]} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">
              Aucune annonce publiée
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
