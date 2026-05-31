'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PropertyData, formatPrice, getPropertyTypeLabel, getTransactionLabel, timeAgo } from '@/lib/afribayit-utils';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

interface PropertyCardProps {
  property: PropertyData;
  index?: number;
  onSelect: (id: string) => void;
  compact?: boolean;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

export default function PropertyCard({ property, index = 0, onSelect, compact = false }: PropertyCardProps) {
  // Compute price label from the data
  const priceLabel = formatPrice(property.price, property.transaction);

  // Fallback image if no images available
  const primaryImage = property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: easeOut }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      className="group cursor-pointer rounded-3xl bg-white border border-gray-100 overflow-hidden card-shadow hover:shadow-xl transition-all"
      onClick={() => onSelect(property.id)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <ImageWithFallback
          src={primaryImage}
          alt={property.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          fallbackType="property"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {property.premium && (
            <span className="px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full shadow-lg">
              Premium
            </span>
          )}
          <span className={`px-3 py-1 text-[10px] font-bold rounded-full shadow-sm ${
            property.transaction === 'achat'
              ? 'bg-[#003087] text-white'
              : property.transaction === 'location'
                ? 'bg-[#00A651] text-white'
                : 'bg-[#D4AF37] text-white'
          }`}>
            {getTransactionLabel(property.transaction)}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {property.verified && (
            <span className="px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-semibold rounded-full flex items-center gap-1 shadow-sm">
              <svg className="w-3 h-3 text-[#00A651]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Vérifié
            </span>
          )}
          {property.geoTrust && (
            <span className="px-2 py-1 bg-white/90 backdrop-blur text-[10px] font-semibold rounded-full flex items-center gap-1 shadow-sm">
              <svg className="w-3 h-3 text-[#009CDE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              GeoTrust
            </span>
          )}
        </div>
        {/* Heart */}
        <button
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          onClick={(e) => { e.stopPropagation(); }}
        >
          <svg className="w-4 h-4 text-gray-400 hover:text-[#D93025] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className={compact ? 'p-4' : 'p-5'}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-medium text-[#003087] bg-[#003087]/5 px-2 py-0.5 rounded-full">
            {getPropertyTypeLabel(property.type)}
          </span>
          <span className="text-[10px] text-gray-400">•</span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {property.views}
          </span>
          {property.createdAt && (
            <>
              <span className="text-[10px] text-gray-400">•</span>
              <span className="text-[10px] text-gray-400">Publié {timeAgo(property.createdAt)}</span>
            </>
          )}
        </div>

        <h3 className={`font-display font-bold text-[#2C2E2F] mb-1 group-hover:text-[#003087] transition-colors ${compact ? 'text-base' : 'text-lg'}`}>
          {property.title}
        </h3>

        <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {property.quartier}, {property.city}, {property.country}
        </p>

        {/* Features */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              {property.bedrooms} ch.
            </span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {property.bathrooms} sdb
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            {property.surface} m²
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="font-mono-data text-lg font-bold text-[#D4AF37]">
            {priceLabel}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
