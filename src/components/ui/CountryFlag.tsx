import React from 'react';
import { FLAG_ARTS, FLAG_ART_XX } from './flag-art';

/**
 * CountryFlag — drapeau pays en SVG INLINE (aucune requête réseau).
 *
 * Contexte (oct. 2026) : deux itérations précédentes.
 *   1. Emojis (🇧🇯) → Windows (Edge, Chrome, Brave) ne rend JAMAIS les emojis
 *      de drapeaux (aucun glyphe dans Segoe UI Emoji) → invisibles sur desktop.
 *   2. <img src="/flags/x.svg"> → fichiers valides et servis en 200, MAIS le
 *      rendu restait dépendant du réseau, du cache HTTP et du service worker ;
 *      certains clients desktop voyaient une image cassée.
 *
 * Solution finale : le SVG est EMBEDDÉ dans le DOM (module flag-art.ts généré
 * depuis public/flags/*.svg). Zéro requête réseau, zéro dépendance au cache,
 * zéro interférence possible du service worker — le drapeau s'affiche sur
 * tous les navigateurs et toutes les plateformes, définitivement.
 *
 * Usage :
 *   <CountryFlag code="BJ" />                      → taille texte (1em, ratio 4:3)
 *   <CountryFlag code={property.country} />        → code dynamique
 *   <CountryFlag code="BJ" className="w-5 h-auto" />
 *
 * Codes inconnus/vides → aucun rendu (null), jamais d'emoji.
 * Code valide sans SVG dédié → globe neutre (FLAG_ART_XX).
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

export interface CountryFlagProps {
  /** Code ISO-3166 alpha-2 (BJ, CI, …) — insensible à la casse. */
  code?: string | null;
  className?: string;
  /** Hauteur visuelle ; largeur = hauteur × 4/3 (ratio drapeau). Défaut 1em (hauteur de ligne). */
  size?: string;
  /** Texte alternatif ; défaut = nom du pays. */
  alt?: string;
  /** Attribut title (tooltip) — rend le drapeau annoncé par les lecteurs d'écran. */
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
  const art = FLAG_ARTS[iso] ?? FLAG_ART_XX;
  const label = alt ?? COUNTRY_FLAG_LABELS[iso] ?? iso;
  const hasLabel = Boolean(title ?? alt);
  return (
    <svg
      viewBox={art.viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden={hasLabel ? undefined : true}
      role={hasLabel ? 'img' : undefined}
      aria-label={title ?? (hasLabel ? label : undefined)}
      className={`country-flag inline-block shrink-0 align-[-0.15em] rounded-[2px] ${className}`}
      style={{ width: `calc(${size} * 4 / 3)`, height: size }}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {art.nodes}
    </svg>
  );
}

export default CountryFlag;
