'use client';

import { motion } from 'framer-motion';
import { Star, Store } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SERVICES_ITEMS, easeOut } from './constants';

interface MarketplacePanelProps {
  contactingService: string | null;
  onContactService: (id: string, provider: string) => void;
}

export default function MarketplacePanel({ contactingService, onContactService }: MarketplacePanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Store className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="font-display text-base font-bold text-[#2C2E2F]">Marketplace de services</h3>
        <span className="text-xs text-gray-400">Services peer-to-peer entre professionnels</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES_ITEMS.map((svc, i) => (
          <motion.div
            key={svc.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ease: easeOut }}
            className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-[#003087]/10 text-[#003087] rounded-full text-[10px] font-bold">{svc.category}</span>
              <span className="flex items-center gap-1 text-xs text-[#D4AF37]"><Star className="w-3 h-3" />{svc.rating}</span>
            </div>
            <h4 className="font-semibold text-sm text-[#2C2E2F] mb-1">{svc.title}</h4>
            <p className="text-xs text-gray-500 mb-2">Par {svc.provider} · {svc.city}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="font-mono text-sm font-bold text-[#00A651]">{new Intl.NumberFormat('fr-FR').format(svc.price)} FCFA</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onContactService(svc.id, svc.provider)}
                  disabled={contactingService === svc.id}
                  className="px-3 py-1.5 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60"
                >
                  {contactingService === svc.id ? 'Envoi...' : 'Contacter'}
                </button>
                <button
                  onClick={() => toast({ title: 'Réservation', description: 'Fonctionnalité de réservation bientôt disponible.' })}
                  className="px-3 py-1.5 border border-[#D4AF37] text-[#D4AF37] rounded-full text-xs font-semibold hover:bg-[#D4AF37]/5 transition-colors"
                >
                  Réserver
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
