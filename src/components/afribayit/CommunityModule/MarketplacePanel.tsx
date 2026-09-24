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
      <div className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 rounded-xl bg-accent-yellow/15 flex items-center justify-center">
            <Store className="w-5 h-5 text-accent-yellow" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-primary-deep">Marketplace de services</h3>
            <p className="text-xs text-gray-text">Annuaire peer-to-peer des professionnels de l&apos;écosystème — notation par la communauté</p>
          </div>
        </div>
        {/* CDC §5.7.1 info */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
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
            className="bg-white rounded-3xl shadow-lg border border-primary-pale hover:shadow-xl hover:border-accent-yellow/40 transition-all overflow-hidden group"
          >
            {/* Gradient top border */}
            <div className="h-1 bg-gradient-to-r from-accent-yellow via-primary-deep to-primary-green opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-5">
              {/* Category + rating */}
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 bg-primary-pale text-primary-deep border border-primary-green/20 rounded-full text-[10px] font-bold">{svc.category}</span>
                <span className="flex items-center gap-1 text-xs text-accent-dark font-semibold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {svc.rating}
                </span>
              </div>
              {/* Title */}
              <h4 className="font-semibold text-sm text-primary-deep mb-2 group-hover:text-primary-green transition-colors">{svc.title}</h4>
              {/* Provider */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary-pale flex items-center justify-center text-primary-deep text-xs font-bold shrink-0">
                  {svc.provider[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-primary-deep">{svc.provider}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />
                    {svc.city}
                  </p>
                </div>
              </div>
              {/* Price + actions */}
              <div className="flex items-center justify-between pt-3 border-t border-primary-pale/60">
                <span className="font-mono text-sm font-bold text-green-600">
                  {new Intl.NumberFormat('fr-FR').format(svc.price)} <span className="text-xs text-gray-400">FCFA</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onContactService(svc.id, svc.provider)}
                    disabled={contactingService === svc.id}
                    className="px-3 py-1.5 rounded-full bg-primary-green text-white text-xs font-bold hover:bg-primary-deep transition-all disabled:opacity-60 shadow-md"
                  >
                    {contactingService === svc.id ? 'Envoi...' : 'Contacter'}
                  </button>
                  <button
                    onClick={() => toast({ title: 'Réservation', description: 'Fonctionnalité de réservation bientôt disponible.' })}
                    className="px-3 py-1.5 rounded-full border border-accent-yellow text-accent-dark text-xs font-bold hover:bg-accent-yellow/10 transition-colors"
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
