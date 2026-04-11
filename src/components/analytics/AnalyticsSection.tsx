"use client";

import { useEffect, useState } from "react";
import DashboardCharts from "./DashboardCharts";
import { Download } from "lucide-react";

interface ChartsData {
  monthly: { month: string; transactions: number; montant: number }[];
  propertiesByType: { name: string; value: number }[];
  escrowByState: { name: string; count: number; amount: number }[];
}

export default function AnalyticsSection() {
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setCharts(d.charts ?? null))
      .catch(() => {});
  }, []);

  async function handleExportCSV() {
    setExporting(true);
    try {
      const res = await fetch("/api/analytics/export?format=csv");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `afribayit-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  }

  function handleExportPDF() {
    window.print();
  }

  return (
    <div>
      {/* Section header with export buttons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">Analytiques</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={13} />
            {exporting ? "Export..." : "CSV"}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={13} />
            PDF
          </button>
        </div>
      </div>

      {charts ? (
        <DashboardCharts
          monthly={charts.monthly}
          propertiesByType={charts.propertiesByType}
          escrowByState={charts.escrowByState}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
