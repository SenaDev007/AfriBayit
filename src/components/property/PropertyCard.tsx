"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, COUNTRY_LABELS } from "@/lib/utils";
import type { PropertyCard as PropertyCardType } from "@/types";

interface PropertyCardProps {
  property: PropertyCardType;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [imgError, setImgError] = useState(false);

  const primaryImage = property.images?.[0];
  const formattedPrice = formatCurrency(property.price, property.currency);

  const listingBadgeVariant =
    property.listingType === "SALE"
      ? "primary"
      : property.listingType === "SHORT_TERM_RENTAL"
      ? "gold"
      : "success";

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm card-hover">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100">
        {primaryImage && !imgError ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#0070BA] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={listingBadgeVariant} size="sm">
            {LISTING_TYPE_LABELS[property.listingType] || property.listingType}
          </Badge>
          {property.owner?.isPremium && (
            <span className="badge-premium">Premium</span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={async (e) => {
            e.preventDefault();
            setIsFavorited(!isFavorited);
            try {
              await fetch("/api/favorites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: property.id }),
              });
            } catch { /* silent */ }
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
          aria-label={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <svg
            className={`w-4 h-4 transition-colors ${isFavorited ? "text-red-500 fill-red-500" : "text-gray-500"}`}
            fill={isFavorited ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Investment score */}
        {property.investmentScore !== undefined && property.investmentScore > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/90 rounded-lg px-2 py-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-[#FFB900]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold text-gray-700">
              Score {property.investmentScore.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <Link href={`/properties/${property.slug}`}>
        <div className="p-4">
          {/* Location */}
          <p className="text-xs text-[#0070BA] font-medium mb-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            {property.district ? `${property.district}, ` : ""}{property.city}
            {property.country && ` · ${COUNTRY_LABELS[property.country]?.split(" ")[1] || property.country}`}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2 mb-2">
            {property.title}
          </h3>

          {/* Specs */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            {property.surface && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                {property.surface} m²
              </span>
            )}
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {property.bedrooms} ch.
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                </svg>
                {property.bathrooms} sdb
              </span>
            )}
            <span className="flex items-center gap-1">
              {PROPERTY_TYPE_LABELS[property.type] || property.type}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-[#003087]">
                {formattedPrice}
              </p>
              {property.listingType === "LONG_TERM_RENTAL" && (
                <p className="text-xs text-gray-400">/mois</p>
              )}
              {property.listingType === "SHORT_TERM_RENTAL" && (
                <p className="text-xs text-gray-400">/nuit</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {property.viewCount.toLocaleString()}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
