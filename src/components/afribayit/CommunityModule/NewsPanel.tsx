'use client';

import { motion } from 'framer-motion';
import { Newspaper } from 'lucide-react';

export default function NewsPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Newspaper className="w-5 h-5 text-[#003087]" />
        <h3 className="font-display text-base font-bold text-[#2C2E2F]">Actualités immobilières</h3>
      </div>
      {/* Show empty state since this should be dynamic from API */}
      <div className="text-center py-12">
        <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-semibold mb-1">Actualités bientôt disponibles</p>
        <p className="text-sm text-gray-400">Les actualités immobilières pour votre pays seront bientôt publiées par notre équipe éditoriale.</p>
      </div>
    </motion.div>
  );
}
