'use client';

import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallbackType?: 'property' | 'hotel' | 'guesthouse' | 'avatar' | 'course' | 'generic';
  onClick?: () => void;
  width?: number;
  height?: number;
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
  height
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(() => {
    if (!src || src.trim() === '') return FALLBACK_IMAGES[fallbackType];
    return src;
  });
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse rounded-inherit" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        onLoad={() => setIsLoading(false)}
        loading="lazy"
        crossOrigin="anonymous"
      />
    </div>
  );
}
