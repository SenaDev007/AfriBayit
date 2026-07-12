'use client';

import { motion } from 'framer-motion';
import { Star, Store, MapPin, ShieldCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { SERVICES_ITEMS, easeOut } from './constants';

interface MarketplacePanelProps {
  contactingService: string | null;
  onContactService: (id: string, provider: string) => void;
}

export default function MarketplacePanel({ contactingService, onContactService }: MarketplacePanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-[#2C2E2F]">Marketplace de services</h3>
            <p className="text-xs text-gray-500">Annuaire peer-to-peer des professionnels de l&apos;écosystème — notation par la communauté</p>
          </div>
        </div>
        {/* CDC §5.7.1 info */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00A651]" />
          Photographes, architectes, experts financiers — notation par la communauté AfriBayit
        </div>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SERVICES_ITEMS.map((svc, i) => (
          <motion.div
            key={svc.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, ease: easeOut }}
            className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-[#D4AF37]/20 transition-all overflow-hidden group"
          >
            {/* Gradient top border */}
            <div className="h-1 bg-gradient-to-r from-[#D4AF37] via-[#003087] to-[#00A651] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-5">
              {/* Category + rating */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 bg-[#003087]/5 text-[#003087] rounded-full text-[10px] font-bold">{svc.category}</span>
                <span className="flex items-center gap-1 text-xs text-[#D4AF37] font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {svc.rating}
                </span>
              </div>
              {/* Title */}
              <h4 className="font-semibold text-sm text-[#2C2E2F] mb-2 group-hover:text-[#003087] transition-colors">{svc.title}</h4>
              {/* Provider */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] text-xs font-bold shrink-0">
                  {svc.provider[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#2C2E2F]">{svc.provider}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {svc.city}
                  </p>
                </div>
              </div>
              {/* Price + actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="font-mono text-sm font-bold text-[#00A651]">
                  {new Intl.NumberFormat('fr-FR').format(svc.price)} <span className="text-xs text-gray-400">FCFA</span>
                </span>
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
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
