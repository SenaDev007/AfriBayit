'use client';

import { motion } from 'framer-motion';
import { formatDate } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import { Award, Download, RefreshCcw } from 'lucide-react';
import type { CertificateItem } from './types';
import { easeOut } from './types';

interface CertificationsPanelProps {
  user: { id: string } | null;
  certificatesLoading: boolean;
  certificates: CertificateItem[];
  onLogin: () => void;
  onGoToCatalogue: () => void;
}

export default function CertificationsPanel({
  user, certificatesLoading, certificates, onLogin, onGoToCatalogue,
}: CertificationsPanelProps) {
  if (!user) {
    return (
      <div className="text-center py-16">
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-2">Connectez-vous</h3>
        <p className="text-sm text-gray-500 mb-4">Veuillez vous connecter pour voir vos certifications</p>
        <button onClick={onLogin} className="px-6 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors">
          Se connecter
        </button>
      </div>
    );
  }

  if (certificatesLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
          <Award className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-2">Aucun certificat obtenu</h3>
        <p className="text-sm text-gray-500 mb-4">Complétez des formations certifiantes pour obtenir vos certificats</p>
        <button onClick={onGoToCatalogue} className="px-6 py-2.5 bg-[#D4AF37] text-[#003087] rounded-lg text-sm font-bold hover:bg-[#e5c349] transition-colors">
          Voir les formations certifiantes
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {certificates.map((cert, i) => (
        <motion.div
          key={cert.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, ease: easeOut }}
          className="bg-white rounded-xl overflow-hidden shadow-sm border"
        >
          {/* Certificate header with gold accent */}
          <div className="h-2 bg-gradient-to-r from-[#D4AF37] to-[#c9a22e]" />
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-1">
                  {cert.courseTitle || cert.course?.title || 'Formation'}
                </h3>
                <p className="text-xs text-gray-500 mb-1">Certificat #{cert.certificateId}</p>
                <p className="text-xs text-gray-400">Délivré le {formatDate(cert.issuedAt)}</p>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  if (cert.downloadUrl) {
                    window.open(cert.downloadUrl, '_blank');
                  } else {
                    toast({ title: 'Bientôt', description: 'Le téléchargement sera bientôt disponible.' });
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#003087] text-white rounded-lg text-xs font-semibold hover:bg-[#0047b3] transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger
              </button>
              <button
                onClick={() => {
                  toast({ title: 'Partagé !', description: 'Lien de certificat copié dans le presse-papier.' });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Partager
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
