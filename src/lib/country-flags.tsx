import React from 'react';
import { CountryFlag } from '@/components/ui/CountryFlag';

/**
 * Drapeaux nationaux partagés (sept. 2026).
 *
 * Historique : chaque page admin déclarait sa propre map d'emojis
 * `COUNTRY_FLAGS = { BJ: '🇧🇯', … }`. Windows (Edge / Chrome / Brave) ne
 * rend jamais les emojis de drapeaux — Segoe UI Emoji n'a aucun glyphe de
 * drapeau national — donc les drapeaux étaient invisibles sur desktop.
 *
 * Désormais les valeurs sont des éléments <CountryFlag /> (SVG /public/flags)
 * interpolables partout en JSX : <CountryFlag code={country} /> {name}
 *
 * ⚠️ Ne PAS utiliser dans une template literal string —
 * utiliser <CountryFlag code={code} /> directement dans ce cas.
 */
export const COUNTRY_FLAGS: Record<string, React.ReactNode> = {
  BJ: <CountryFlag code="BJ" />,
  CI: <CountryFlag code="CI" />,
  BF: <CountryFlag code="BF" />,
  TG: <CountryFlag code="TG" />,
  SN: <CountryFlag code="SN" />,
  ML: <CountryFlag code="ML" />,
  NE: <CountryFlag code="NE" />,
  GN: <CountryFlag code="GN" />,
  NG: <CountryFlag code="NG" />,
  KE: <CountryFlag code="KE" />,
  ET: <CountryFlag code="ET" />,
  CD: <CountryFlag code="CD" />,
};

/** Drapeau d'un pays par code ISO, rendu direct en JSX : {countryFlagNode(c)} */
export function countryFlagNode(code?: string | null): React.ReactNode {
  if (!code) return null;
  return <CountryFlag code={code} />;
}
