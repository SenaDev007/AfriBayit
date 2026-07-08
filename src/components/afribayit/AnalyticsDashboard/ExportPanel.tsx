'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Coins,
  Crown,
  Download,
  Eye,
  FileText,
  Heart,
  MapPin,
  Search,
  Trophy,
  UserPlus,
} from 'lucide-react';

interface ExportPanelProps {
  onExport: (format: 'csv' | 'pdf') => void;
}

export default function ExportPanel({ onExport }: ExportPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="bg-white rounded-3xl p-6 shadow-sm border max-w-2xl mx-auto text-center">
        <Download className="w-10 h-10 mx-auto mb-3 text-[#003087]" />
        <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">Exporter vos données</h3>
        <p className="text-sm text-gray-500 mb-6">Téléchargez vos statistiques et données analytiques au format de votre choix.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button onClick={() => onExport('csv')} className="p-4 border-2 border-[#00A651]/20 rounded-2xl hover:border-[#00A651] hover:bg-[#00A651]/5 transition-all">
            <FileText className="w-6 h-6 mx-auto mb-2 text-[#00A651]" />
            <h4 className="font-display text-base font-bold text-[#2C2E2F]">CSV</h4>
            <p className="text-xs text-gray-500 mt-1">Compatible Excel, Google Sheets</p>
          </button>
          <button onClick={() => onExport('pdf')} className="p-4 border-2 border-[#003087]/20 rounded-2xl hover:border-[#003087] hover:bg-[#003087]/5 transition-all">
            <FileText className="w-6 h-6 mx-auto mb-2 text-[#003087]" />
            <h4 className="font-display text-base font-bold text-[#2C2E2F]">PDF</h4>
            <p className="text-xs text-gray-500 mt-1">Rapport formaté prêt à imprimer</p>
          </button>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-left">
          <p className="text-xs text-gray-500 mb-2">Données incluses dans l&apos;export :</p>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li className="flex items-center gap-2"><Coins className="w-4 h-4 text-[#D4AF37]" /> Revenus et transactions</li>
            <li className="flex items-center gap-2"><Eye className="w-4 h-4 text-[#003087]" /> Vues de profil (origines + évolution)</li>
            <li className="flex items-center gap-2"><Search className="w-4 h-4 text-[#009CDE]" /> Apparitions en recherche</li>
            <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00A651]" /> Entonnoir de conversion</li>
            <li className="flex items-center gap-2"><Trophy className="w-4 h-4 text-[#D4AF37]" /> Classement et performance</li>
            <li className="flex items-center gap-2"><UserPlus className="w-4 h-4 text-[#003087]" /> Connexions et abonnés</li>
            <li className="flex items-center gap-2"><Heart className="w-4 h-4 text-[#D93025]" /> Engagement contenu</li>
            <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#D93025]" /> Performance par zone</li>
            <li className="flex items-center gap-2"><Crown className="w-4 h-4 text-[#D4AF37]" /> ROI Premium</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
