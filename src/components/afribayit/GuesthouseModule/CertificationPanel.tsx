'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { easeOut, certificationProcessSteps } from './constants';
import type { GuesthouseDetail } from './types';

interface CertificationPanelProps {
  activeDetail: GuesthouseDetail | undefined;
}

export default function CertificationPanel({ activeDetail }: CertificationPanelProps) {
  return (
    <motion.div
      key="certification"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-6">Certification Guesthouse</h3>
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          {certificationProcessSteps.map((s, i) => (
            <div key={s.step} className="flex items-start shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  i < 2 ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
                }`}>
                  {s.icon}
                </div>
                <p className={`text-[10px] font-medium mt-1 text-center w-20 ${i < 2 ? 'text-[#00A651]' : 'text-gray-400'}`}>{s.title}</p>
              </div>
              {i < certificationProcessSteps.length - 1 && (
                <div className={`w-6 h-0.5 mt-6 shrink-0 ${i < 1 ? 'bg-[#00A651]' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Certification status for current guesthouse */}
        {activeDetail && (
          <div className={`p-4 rounded-2xl mb-4 ${
            activeDetail.certificationStatus === 'certified' ? 'bg-[#00A651]/5' :
            activeDetail.certificationStatus === 'pending' ? 'bg-[#D4AF37]/5' :
            'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {activeDetail.certificationStatus === 'certified' ? (
                <CheckCircle className="w-4 h-4 text-[#00A651]" />
              ) : activeDetail.certificationStatus === 'pending' ? (
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-500" />
              )}
              <p className="text-sm text-[#0a2a5e] font-semibold">
                {activeDetail.certificationStatus === 'certified'
                  ? 'Guesthouse certifiée'
                  : activeDetail.certificationStatus === 'pending'
                  ? 'En cours de certification'
                  : 'Non certifiée'}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {activeDetail.certificationStatus === 'certified'
                ? 'Cette guesthouse a passé avec succès l\'inspection AfriBayit.'
                : activeDetail.certificationStatus === 'pending'
                ? 'Votre demande est en cours de traitement. L\'inspection sera planifiée sous 5 jours ouvrés.'
                : 'Soumettez votre demande de certification pour rassurer vos futurs clients.'}
            </p>
          </div>
        )}

        {!activeDetail && (
          <div className="p-4 bg-[#D4AF37]/5 rounded-2xl">
            <p className="text-sm text-[#0a2a5e] font-semibold mb-1">En cours de certification</p>
            <p className="text-xs text-gray-500">Votre demande est en cours de traitement. L&apos;inspection sera planifiée sous 5 jours ouvrés.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
