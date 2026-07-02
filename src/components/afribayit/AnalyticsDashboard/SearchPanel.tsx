'use client';

import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { SearchAppearanceRow } from './types';

interface SearchPanelProps {
  searchAppearances: SearchAppearanceRow[];
}

export default function SearchPanel({ searchAppearances }: SearchPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 flex items-center gap-2"><Search className="w-5 h-5 text-[#009CDE]" /> Apparitions en recherche</h3>
        <p className="text-sm text-gray-500 mb-4">Mots-clés par lesquels vos biens apparaissent dans les résultats de recherche.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 text-gray-500 font-medium">Mot-clé</th><th className="text-right py-2 text-gray-500 font-medium">Apparitions</th><th className="text-right py-2 text-gray-500 font-medium">Clics</th><th className="text-right py-2 text-gray-500 font-medium">CTR</th></tr></thead>
            <tbody>
              {searchAppearances.map((kw) => (
                <tr key={kw.keyword} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium text-[#2C2E2F]">{kw.keyword}</td>
                  <td className="py-3 text-right font-mono">{kw.appearances}</td>
                  <td className="py-3 text-right font-mono text-[#003087]">{kw.clicks}</td>
                  <td className="py-3 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${kw.ctr >= 17 ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>{kw.ctr}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
