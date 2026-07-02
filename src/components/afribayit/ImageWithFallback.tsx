'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackType?: 'property' | 'hotel' | 'guesthouse' | 'avatar' | 'course' | 'generic';
  onClick?: () => void;
  width?: number;
  height?: number;
  fill?: boolean; // P3.5 — support next/image fill mode
  sizes?: string; // P3.5 — responsive sizes
  priority?: boolean; // P3.5 — for above-the-fold images
}

const FALLBACK_IMAGES: Record<string, string> = {
  property: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&q=80',
  hotel: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop&q=80',
  guesthouse: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=600&fit=crop&q=80',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&q=80',
  course: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop&q=80',
  generic: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&q=80',
};

// Inline SVG data URI as ultimate fallback
const SVG_FALLBACK = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="none"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="14">Image indisponible</text></svg>')}`;

export default function ImageWithFallback({
  src,
  alt,
  className = '',
  fallbackType = 'generic',
  onClick,
  width,
  height,
  fill = false,
  sizes,
  priority = false,
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (!src || src.trim() === '') return FALLBACK_IMAGES[fallbackType];
    return src;
  });
  const [hasError, setHasError] = useState(false);
  const [usedSvgFallback, setUsedSvgFallback] = useState(false);

  const handleError = () => {
    if (usedSvgFallback) return; // Already at ultimate fallback

    if (!hasError) {
      // First error: try the Unsplash fallback
      setHasError(true);
      setImgSrc(FALLBACK_IMAGES[fallbackType]);
    } else {
      // Second error: use SVG data URI fallback
      setUsedSvgFallback(true);
      setImgSrc(SVG_FALLBACK);
    }
  };

  // SVG data URI can't be optimized by next/image — fall back to <img> for that case
  if (usedSvgFallback || imgSrc.startsWith('data:')) {
    return (
      <div className={`relative ${className}`} onClick={onClick}>
        <img
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // P3.5 — use next/image for optimization (responsive srcset, lazy loading, blur placeholder)
  return (
    <div className={`relative ${className}`} onClick={onClick}>
      <Image
        src={imgSrc}
        alt={alt}
        width={fill ? undefined : width || 400}
        height={fill ? undefined : height || 300}
        fill={fill}
        sizes={sizes || (fill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined)}
        priority={priority}
        className={`object-cover transition-opacity duration-300 ${onClick ? 'cursor-pointer' : ''}`}
        onError={handleError}
        unoptimized // Allow remote images without explicit domains config
      />
    </div>
  );
}
