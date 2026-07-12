'use client';

/**
 * InvestmentOpportunities — CDC §5.1.1 "Score d'investissement propriétaire : algorithme 0-100"
 *
 * Displays the top investment opportunities as cards with:
 *   - Property image + investment score badge (0-100)
 *   - Price, surface, price/m²
 *   - Estimated monthly rent + gross yield
 *   - 5-year projected gain
 *   - Click → /property/[id]
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTopOpportunities } from '@/hooks/useInvestment';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, MapPin, Maximize, Coins, ArrowUpRight, Brain } from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

export default function InvestmentOpportunities({ limit = 6 }: { limit?: number }) {
  const { data, isLoading } = useTopOpportunities(limit);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    );
  }

  const opportunities = data?.opportunities || [];

  if (opportunities.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border text-center">
        <div className="w-16 h-16 rounded-full bg-[#003087]/5 flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="w-8 h-8 text-[#003087]" />
        </div>
        <h3 className="font-display text-xl font-bold text-gray-700 mb-2">
          Aucune opportunité d&apos;investissement
        </h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Les biens d&apos;investissement apparaîtront ici dès qu&apos;ils seront publiés.
          Chaque bien reçoit un score d&apos;investissement 0-100 calculé par notre algorithme IA.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {opportunities.map((op, i) => (
        <OpportunityCard key={op.id} opportunity={op} index={i} />
      ))}
    </div>
  );
}

function OpportunityCard({ opportunity, index }: { opportunity: any; index: number }) {
  const score = opportunity.investmentScore || 0;
  const scoreColor = score >= 80 ? '#00A651' : score >= 60 ? '#D4AF37' : score >= 40 ? '#009CDE' : '#9ca3af';
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Bon' : score >= 40 ? 'Moyen' : 'Faible';

  const roi = opportunity.roi;
  const pricePerSqm = opportunity.surface > 0 ? Math.round(opportunity.price / opportunity.surface) : 0;
  const firstImage = opportunity.images?.[0] || 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=450&fit=crop';

  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        href={`/property/${opportunity.id}`}
        className="block bg-white rounded-3xl border overflow-hidden hover:shadow-lg hover:border-[#003087]/20 transition-all group"
      >
        {/* Image with score badge */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <ImageWithFallback
            src={firstImage}
            alt={opportunity.title}
            fill
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Score badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md bg-white/90 shadow-sm">
            <Brain className="w-3.5 h-3.5" style={{ color: scoreColor }} />
            <span className="font-mono-data font-bold text-sm" style={{ color: scoreColor }}>{score}</span>
            <span className="text-[9px] font-semibold text-gray-500">/100</span>
          </div>
          {/* Score label */}
          <div
            className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: scoreColor }}
          >
            {scoreLabel}
          </div>
          {/* Trust badges */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {opportunity.verified && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-[#00A651]/80 backdrop-blur-sm">
                ✓ Vérifié
              </span>
            )}
            {opportunity.geoTrust && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white bg-[#003087]/80 backdrop-blur-sm">
                GeoTrust
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-display font-bold text-sm text-[#2C2E2F] truncate mb-1">
            {opportunity.title}
          </h3>
          <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-3">
            <MapPin className="w-3 h-3" />
            {opportunity.city}, {opportunity.country} · {opportunity.quartier}
          </p>

          {/* Price + price/m² */}
          <div className="flex items-baseline justify-between mb-3">
            <p className="font-mono-data font-bold text-lg text-[#D4AF37]">
              {fmt(opportunity.price)} <span className="text-xs">{opportunity.currency}</span>
            </p>
            <p className="text-[10px] text-gray-400">{fmt(pricePerSqm)} FCFA/m²</p>
          </div>

          {/* ROI estimates */}
          {roi && (
            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-gray-50">
              <div>
                <p className="text-[9px] text-gray-400 mb-0.5">Loyer est.</p>
                <p className="font-mono-data font-bold text-xs text-[#2C2E2F]">{fmt(roi.estimatedMonthlyRent)}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 mb-0.5">Rendement</p>
                <p className="font-mono-data font-bold text-xs text-[#00A651]">{roi.grossYield}%</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-400 mb-0.5">+5 ans</p>
                <p className="font-mono-data font-bold text-xs text-[#D4AF37] flex items-center justify-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  +{roi.projectedGainPct5y}%
                </p>
              </div>
            </div>
          )}

          {/* Property specs */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-[10px] text-gray-400">
            {opportunity.bedrooms > 0 && <span>{opportunity.bedrooms} ch.</span>}
            {opportunity.bathrooms > 0 && <span>{opportunity.bathrooms} sdb</span>}
            <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{opportunity.surface} m²</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
