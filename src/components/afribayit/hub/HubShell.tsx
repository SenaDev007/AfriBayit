'use client';

/**
 * HubShell — cadre applicatif partagé pour les hubs professionnels
 * (Artisans, Notaires, GeoTrust), calqué sur la structure LinkedIn :
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │ Barre de recherche sticky (titre + recherche + CTA)  │
 *   ├────────────┬──────────────────────────┬──────────────┤
 *   │ Rail de    │ Contenu principal        │ Rail         │
 *   │ filtres    │ (résultats / profils)    │ d'insights   │
 *   └────────────┴──────────────────────────┴──────────────┘
 *
 * Zéro animation 3D, zéro framer-motion — transitions CSS sobres,
 * style « annuaire professionnel » conforme à la palette AfriBayit.
 */

import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface HubShellProps {
  /** Titre du hub (ex. « Répertoire des Artisans ») */
  title: string;
  /** Sous-titre descriptif affiché sous le titre */
  subtitle?: string;
  /** Icône du hub affichée dans la barre */
  icon?: React.ReactNode;
  /** Valeur de la recherche contrôlée */
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  /** Badge pays actif (contexte CountryContext) */
  countryLabel?: string;
  /** Bouton d'action principal (droite de la barre) */
  actions?: React.ReactNode;
  /** Rail gauche : filtres / navigation */
  sidebar?: React.ReactNode;
  /** Contenu principal */
  children: React.ReactNode;
  /** Rail droit : insights, stats, outils */
  aside?: React.ReactNode;
}

export default function HubShell({
  title,
  subtitle,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  countryLabel,
  actions,
  sidebar,
  children,
  aside,
}: HubShellProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  return (
    <section className="min-h-screen pb-24 bg-cream">
      {/* ── Barre sticky du hub ─────────────────────────────────── */}
      <div className="sticky top-16 sm:top-18 z-30 bg-white/95 backdrop-blur border-b border-primary-pale shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center gap-3 py-3">
            {/* Titre + icône */}
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="shrink-0 w-10 h-10 rounded-xl bg-primary-pale flex items-center justify-center text-primary-deep">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-serif text-lg font-bold text-primary-deep leading-tight truncate">{title}</h1>
                {subtitle && <p className="text-[11px] text-gray-text truncate hidden sm:block">{subtitle}</p>}
              </div>
              {countryLabel && (
                <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full bg-primary-pale text-primary-deep border border-primary-green/20 text-[11px] font-semibold shrink-0">
                  {countryLabel}
                </span>
              )}
            </div>

            {/* Recherche */}
            {onSearchChange && (
              <div className="relative flex-1 md:max-w-md md:ml-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder ?? 'Rechercher…'}
                  className="w-full pl-10 pr-9 py-2.5 rounded-full border border-primary-pale bg-cream text-sm outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green transition-colors"
                />
                {searchValue && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-deep"
                    aria-label="Effacer la recherche"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 md:ml-auto shrink-0">
              {sidebar && (
                <button
                  onClick={() => setMobileFiltersOpen((v) => !v)}
                  className="md:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full border border-primary-pale bg-white text-primary-deep text-sm font-semibold"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtres
                </button>
              )}
              {actions}
            </div>
          </div>
        </div>
      </div>

      {/* ── Corps 3 colonnes ────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Rail de filtres mobile (repliable) */}
        {sidebar && mobileFiltersOpen && (
          <div className="md:hidden mb-4 bg-white rounded-2xl border border-primary-pale shadow-sm p-4">
            {sidebar}
          </div>
        )}

        {/* Grille responsive : 1 colonne (mobile) → 2 colonnes (md) → 3 colonnes (lg).
            Le contenu principal n'est rendu qu'UNE seule fois — les rails sont
            masqués par CSS aux petites tailles ; le panneau « Filtres » mobile
            affiche une copie contrôlée depuis le parent. */}
        <div className="md:grid md:grid-cols-[248px_minmax(0,1fr)] lg:grid-cols-[248px_minmax(0,1fr)_312px] gap-5 items-start">
          {/* Rail gauche — masqué sous md (le panneau « Filtres » le remplace) */}
          {sidebar && (
            <aside className="hidden md:block sticky top-[148px] sm:top-[164px] max-h-[calc(100vh-176px)] overflow-y-auto pr-1 space-y-4">
              {sidebar}
            </aside>
          )}

          {/* Colonne principale — instance unique */}
          <main className="min-w-0 space-y-4">{children}</main>

          {/* Rail droit — masqué sous lg */}
          {aside && (
            <aside className="hidden lg:block sticky top-[148px] sm:top-[164px] max-h-[calc(100vh-176px)] overflow-y-auto space-y-4">
              {aside}
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Sous-composants réutilisables du système de hub ──────────────── */

/** Carte de section du rail (filtres, insights…) */
export function HubPanel({
  title,
  titleIcon,
  children,
  footer,
}: {
  title?: string;
  titleIcon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
      {title && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-primary-pale/70">
          {titleIcon && <span className="text-primary-deep">{titleIcon}</span>}
          <h3 className="text-[11px] font-bold text-primary-deep uppercase tracking-wider">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-primary-pale/70 bg-cream/60">{footer}</div>}
    </div>
  );
}

/** Groupe de filtres à cases à cocher (type « Tous les filtres » LinkedIn) */
export function HubFilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { value: string; label: string; count?: number }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, 5);
  const hasMore = options.length > 5;

  return (
    <div className="mb-4 last:mb-0">
      <p className="text-xs font-bold text-primary-deep mb-2">{label}</p>
      <div className="space-y-1">
        {visible.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className="w-full flex items-center gap-2.5 px-1.5 py-1.5 rounded-lg hover:bg-primary-pale/60 transition-colors text-left group"
            >
              <span
                className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  checked ? 'bg-primary-deep border-primary-deep' : 'border-gray-300 bg-white group-hover:border-primary-green'
                }`}
              >
                {checked && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2.5 6.5L5 9l4.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className={`text-xs truncate ${checked ? 'text-primary-deep font-semibold' : 'text-gray-text'}`}>
                {opt.label}
              </span>
              {opt.count !== undefined && (
                <span className="ml-auto text-[10px] text-gray-400 font-mono-data shrink-0">{opt.count}</span>
              )}
            </button>
          );
        })}
        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] font-semibold text-primary-green hover:text-primary-deep px-1.5 pt-1"
          >
            {expanded ? 'Réduire' : `Voir plus (${options.length - 5})`}
          </button>
        )}
      </div>
    </div>
  );
}

/** Carte profil « LinkedIn » — bandeau, avatar, identité, actions */
export function HubProfileCard({
  banner,
  avatar,
  name,
  verified,
  verifiedLabel,
  headline,
  location,
  chips,
  stats,
  actions,
  onClick,
  children,
  badge,
}: {
  banner?: React.ReactNode;
  avatar: React.ReactNode;
  name: string;
  verified?: boolean;
  verifiedLabel?: string;
  headline?: string;
  location?: React.ReactNode;
  chips?: { label: string; tone?: 'default' | 'gold' | 'green' | 'red' | 'blue' }[];
  stats?: { label: string; value: string; icon?: React.ReactNode }[];
  actions?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const toneClasses: Record<string, string> = {
    default: 'bg-primary-pale text-primary-deep border-primary-green/20',
    gold: 'bg-accent-pale text-accent-dark border-accent-yellow/40',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <article
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-primary-pale shadow-sm hover:shadow-md hover:border-primary-green/30 transition-all overflow-hidden ${
      onClick ? 'cursor-pointer' : ''
      }`}
    >
      {badge}
      {banner}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0">{avatar}</div>

          {/* Identité */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-bold text-primary-deep text-[15px] leading-snug">{name}</h3>
              {verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-pale text-primary-deep border border-primary-green/30 text-[10px] font-bold">
                  <svg viewBox="0 0 16 16" className="w-3 h-3 fill-primary-green" aria-hidden>
                    <path d="M8 0l2.05 1.18 2.36-.02.72 2.25 1.94 1.34-.94 2.17.94 2.17-1.94 1.34-.72 2.25-2.36-.02L8 16l-2.05-1.18-2.36.02-.72-2.25L0.93 11.25l.94-2.17-.94-2.17 1.94-1.34.72-2.25 2.36.02L8 0z" opacity="0" />
                    <path d="M6.5 11.2L3.8 8.5l1.2-1.2 1.5 1.5 3.9-3.9 1.2 1.2-5.1 5.1z" />
                  </svg>
                  {verifiedLabel ?? 'Vérifié'}
                </span>
              )}
            </div>
            {headline && <p className="text-[13px] text-gray-text font-medium mt-0.5 truncate">{headline}</p>}
            {location && <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">{location}</div>}

            {/* Chips compétences */}
            {chips && chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {chips.slice(0, 4).map((c) => (
                  <span
                    key={c.label}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${toneClasses[c.tone ?? 'default']}`}
                  >
                    {c.label}
                  </span>
                ))}
                {chips.length > 4 && (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cream text-gray-text border border-primary-pale">
                    +{chips.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
                {stats.map((s) => (
                  <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-gray-text">
                    {s.icon && <span className="text-gray-400">{s.icon}</span>}
                    <span className="font-bold text-primary-deep font-mono-data">{s.value}</span>
                    <span className="text-gray-400">{s.label}</span>
                  </span>
                ))}
              </div>
            )}

            {children}
          </div>

          {/* Actions */}
          {actions && <div className="shrink-0 flex flex-col gap-2 sm:flex-row items-stretch sm:items-center">{actions}</div>}
        </div>
      </div>
    </article>
  );
}

/** Compteur de résultats + tri, en tête de la colonne principale */
export function HubResultsHeader({
  count,
  total,
  sort,
  onSortChange,
  children,
}: {
  count: number;
  total?: number;
  sort?: string;
  onSortChange?: (v: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-primary-pale shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
      <p className="text-sm font-bold text-primary-deep">
        {count} résultat{count !== 1 ? 's' : ''}
        {total !== undefined && count !== total && <span className="text-gray-400 font-normal"> sur {total}</span>}
      </p>
      {children}
      {onSortChange && (
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Trier par</label>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-semibold text-primary-deep bg-cream border border-primary-pale rounded-full px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer"
          >
            <option value="pertinence">Pertinence</option>
            <option value="note">Note</option>
            <option value="missions">Missions</option>
            <option value="avis">Avis</option>
          </select>
        </div>
      )}
    </div>
  );
}
