'use client';

import React from 'react';

/**
 * CountryFlag — drapeau pays en SVG local (/public/flags/<iso>.svg).
 *
 * Contexte (sept. 2026) : les drapeaux étaient affichés en emoji (🇧🇯, 🇨🇮…).
 * Windows (Edge, Chrome, Brave…) ne rend JAMAIS les emojis de drapeaux —
 * la police Segoe UI Emoji ne contient aucun glyphe de drapeau national —
 * donc les drapeaux étaient invisibles sur desktop et visibles uniquement
 * sur mobile (Android/iOS). Ce composant rend une image SVG identique sur
 * tous les navigateurs et toutes les plateformes.
 *
 * Usage :
 *   <CountryFlag code="BJ" />                      → taille texte (1em, ratio 4:3)
 *   <CountryFlag code={property.country} />        → code dynamique
 *   <CountryFlag code="BJ" className="w-5 h-auto" />
 *
 * Codes inconnus/vides → aucun rendu (null), jamais d'emoji.
 * Pays non couvert par /flags/ → fallback globe neutre (/flags/xx.svg).
 */

export const COUNTRY_FLAG_LABELS: Record<string, string> = {
  BJ: 'Bénin',
  CI: 'Côte d’Ivoire',
  BF: 'Burkina Faso',
  TG: 'Togo',
  SN: 'Sénégal',
  ML: 'Mali',
  NE: 'Niger',
  GN: 'Guinée',
  NG: 'Nigeria',
  KE: 'Kenya',
  ET: 'Éthiopie',
  CD: 'RD Congo',
  SA: 'Arabie saoudite',
  GB: 'Royaume-Uni',
  FR: 'France',
};

/** Pays disposant d'un SVG dédié dans /public/flags/. */
const SUPPORTED = new Set(Object.keys(COUNTRY_FLAG_LABELS));

export interface CountryFlagProps {
  /** Code ISO-3166 alpha-2 (BJ, CI, …) — insensible à la casse. */
  code?: string | null;
  className?: string;
  /** Hauteur visuelle ; largeur = hauteur × 4/3 (ratio drapeau). Défaut 1em (hauteur de ligne). */
  size?: string;
  /** Texte alternatif ; défaut = nom du pays. */
  alt?: string;
  /** Attribut title (tooltip). */
  title?: string;
}

export function CountryFlag({
  code,
  className = '',
  size = '1em',
  alt,
  title,
}: CountryFlagProps) {
  const iso = (code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso)) return null;
  const slug = iso.toLowerCase();
  const src = SUPPORTED.has(iso) ? `/flags/${slug}.svg` : '/flags/xx.svg';
  const label = alt ?? COUNTRY_FLAG_LABELS[iso] ?? iso;
  return (
    <img
      src={src}
      alt={label}
      title={title ?? undefined}
      aria-label={title ?? label}
      role={title ? undefined : 'presentation'}
      className={`country-flag inline-block shrink-0 object-contain align-[-0.15em] rounded-[2px] ${className}`}
      style={{ width: `calc(${size} * 4 / 3)`, height: size }}
      draggable={false}
    />
  );
}

export default CountryFlag;
