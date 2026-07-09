'use client';

import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Check, ClipboardList, Copy, ExternalLink, Eye, Heart, Lock,
  Map, Share2, Star,
} from 'lucide-react';
import { easeOut } from './types';

interface AgentData {
  name: string;
  avatar?: string;
  company?: string;
  certified?: boolean;
  rating?: number;
  reviews?: number;
  listings?: number;
  phone?: string;
}

interface PropertySidebarProps {
  priceLabel: string;
  transaction: string;
  hasVR: boolean;
  onOpenVRTour: () => void;
  isFavorite: boolean;
  isAuthenticated: boolean;
  onToggleFavorite: () => void;
  showShareMenu: boolean;
  setShowShareMenu: (v: boolean) => void;
  onShare: (platform: string) => void;
  copied: boolean;
  agent: AgentData | undefined;
  showPhone: boolean;
  setShowPhone: (v: boolean) => void;
  verified: boolean;
  geoTrust: boolean;
  onPurchase?: (propertyId: string) => void;
  onContactAgent?: () => void;
  property?: any;
}

const SHARE_PLATFORMS = [
  { id: 'WhatsApp', label: 'WhatsApp', hover: 'hover:bg-green-50', svg: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { id: 'Facebook', label: 'Facebook', hover: 'hover:bg-blue-50', svg: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id: 'Twitter', label: 'X (Twitter)', hover: 'hover:bg-gray-100', svg: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#000000"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { id: 'Telegram', label: 'Telegram', hover: 'hover:bg-sky-50', svg: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0088cc"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
];

export default function PropertySidebar({
  priceLabel,
  transaction,
  hasVR,
  onOpenVRTour,
  isFavorite,
  isAuthenticated,
  onToggleFavorite,
  showShareMenu,
  setShowShareMenu,
  onShare,
  copied,
  agent,
  showPhone,
  setShowPhone,
  verified,
  geoTrust,
  onPurchase,
  onContactAgent,
  property,
}: PropertySidebarProps) {
  const trustBadges = [
    { icon: <Check className="w-4 h-4" />, text: 'Documents vérifiés', active: verified },
    { icon: <Map className="w-4 h-4" />, text: 'GeoTrust certifié', active: geoTrust },
    { icon: <Eye className="w-4 h-4" />, text: 'Visite VR disponible', active: hasVR },
    { icon: <Lock className="w-4 h-4" />, text: 'Escrow sécurisé', active: true },
    { icon: <ClipboardList className="w-4 h-4" />, text: 'Assistance notariale', active: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
      className="lg:sticky lg:top-24"
    >
      {/* Price Box */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border mb-4">
        <div className="mb-4">
          <p className="font-mono-data text-3xl sm:text-4xl font-bold text-[#D4AF37] mb-1">
            {priceLabel}
          </p>
          {transaction === 'location' && (
            <p className="text-xs text-gray-400">Charges comprises si indiqué</p>
          )}
        </div>

        {/* Escrow Badge */}
        <div className="flex items-center gap-2 p-3 bg-[#00A651]/5 rounded-2xl mb-5">
          <div className="w-8 h-8 rounded-full bg-[#00A651]/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-[#00A651]">Escrow Sécurisé</p>
            <p className="text-[10px] text-gray-500">Fonds protégés jusqu&apos;à signature</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          {/* VR Tour Button — prominent if hasVR */}
          {hasVR && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={onOpenVRTour}
              className="w-full py-3.5 bg-[#003087] hover:bg-[#0047b3] text-white rounded-full font-semibold text-sm shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-[#D4AF37]" />
              Visite virtuelle 360°
            </motion.button>
          )}

          {/* Buy button — initiates a purchase transaction */}
          {transaction === 'achat' && onPurchase && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPurchase?.(property?.id || '')}
              className="w-full py-3.5 bg-[#00A651] hover:bg-[#008f47] text-white rounded-full font-semibold text-sm shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Acheter ce bien
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onContactAgent?.()}
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full font-semibold text-sm shadow-lg transition-colors"
          >
            Demander une visite
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onContactAgent?.()}
            className="w-full py-3.5 bg-transparent border-2 border-[#003087] text-[#003087] rounded-full font-semibold text-sm hover:bg-[#003087] hover:text-white transition-colors"
          >
            Contacter l&apos;agent
          </motion.button>
        </div>

        {/* Share & Favorite Row */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          {/* Favorite Button */}
          <button
            onClick={isAuthenticated ? onToggleFavorite : undefined}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors ${
              isFavorite
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={!isAuthenticated ? 'Connectez-vous' : isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Enregistré' : 'Enregistrer'}
          </button>

          {/* Share Button */}
          <div className="relative flex-1">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 rounded-full text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>

            {/* Share Dropdown */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-2xl shadow-xl border p-2 z-50"
                >
                  {/* Native Share (mobile) */}
                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <button
                      onClick={() => onShare('Native')}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Partager...</span>
                    </button>
                  )}
                  {SHARE_PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onShare(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 ${p.hover} rounded-xl transition-colors text-left`}
                    >
                      {p.svg}
                      <span className="text-sm text-gray-700">{p.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => onShare('Lien')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[#00A651]" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="text-sm text-gray-700">
                      {copied ? 'Lien copié !' : 'Copier le lien'}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Agent Card */}
      {agent && (
        <div className="bg-white rounded-3xl p-5 shadow-sm border mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-[#D4AF37] relative">
              <ImageWithFallback
                src={agent.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                alt={agent.name}
                className="absolute inset-0 w-full h-full"
                fallbackType="avatar"
                fill
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-[#2C2E2F]">{agent.name}</h3>
                {agent.certified && (
                  <span className="px-1.5 py-0.5 bg-[#009CDE]/10 text-[#009CDE] text-[9px] font-bold rounded-full">Certifié</span>
                )}
              </div>
              <p className="text-xs text-gray-500">{agent.company || 'Agent immobilier'}</p>
            </div>
          </div>
          {(agent.rating !== undefined && agent.rating > 0) && (
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-current" />
                {agent.rating} ({agent.reviews})
              </span>
              {agent.listings !== undefined && <span>{agent.listings} annonces</span>}
            </div>
          )}
          {agent.phone && (
            <button
              onClick={() => setShowPhone(!showPhone)}
              className="w-full py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
            >
              {showPhone ? agent.phone : 'Voir le numéro'}
            </button>
          )}
        </div>
      )}

      {/* Trust Badges */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border">
        <h3 className="text-sm font-semibold text-[#2C2E2F] mb-3">Garanties AfriBayit</h3>
        <div className="space-y-2.5">
          {trustBadges.map((badge) => (
            <div key={badge.text} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                badge.active ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-gray-100 text-gray-400'
              }`}>
                {badge.icon}
              </span>
              <span className={`text-xs ${badge.active ? 'text-gray-700' : 'text-gray-400'}`}>{badge.text}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
