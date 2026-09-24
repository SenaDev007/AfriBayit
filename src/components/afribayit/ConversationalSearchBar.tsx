'use client';

/**
 * ConversationalSearchBar — CDC §5.1.1 "Recherche IA conversationnelle"
 *
 * Allows users to search properties using natural language queries like:
 * "Villa 4 chambres à Cotonou, budget 50M FCFA"
 *
 * Integrates with Rebecca AI backend (/rebecca/agent) which parses the query
 * and returns structured filters that redirect to /search with the right params.
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, Loader2, Mic } from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import VoiceSearchButton from './VoiceSearchButton';

const easeOut = [0.16, 1, 0.3, 1] as const;

const SUGGESTIONS = [
  'Villa 4 chambres à Cotonou, budget 50M FCFA',
  'Appartement à louer à Abidjan, 2 chambres',
  'Terrain à Ouagadougou, moins de 15M FCFA',
  'Studio meublé à Lomé pour séjour court',
];

interface ConversationalSearchBarProps {
  /** Default transaction type for the page (achat, location, investissement) */
  transaction?: string;
  /** Compact mode for inline placement */
  compact?: boolean;
}

export default function ConversationalSearchBar({
  transaction = 'achat',
  compact = false,
}: ConversationalSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    async (searchQuery?: string) => {
      const q = (searchQuery ?? query).trim();
      if (!q) return;

      setLoading(true);
      setError(null);

      try {
        // Try Rebecca AI agent first — it parses natural language into filters
        const result = await apiPost<{
          response?: string;
          filters?: {
            type?: string;
            transaction?: string;
            city?: string;
            country?: string;
            minPrice?: number;
            maxPrice?: number;
            bedrooms?: number;
          };
          redirect?: string;
        }>('/rebecca/agent', { query: q });

        // If the AI returned structured filters, build a search URL
        if (result.filters) {
          const f = result.filters;
          const params = new URLSearchParams();
          if (f.type) params.set('type', f.type);
          if (f.transaction) params.set('tab', f.transaction);
          else if (transaction) params.set('tab', transaction);
          if (f.city) params.set('city', f.city);
          if (f.country) params.set('country', f.country);
          if (f.minPrice) params.set('minPrice', String(f.minPrice));
          if (f.maxPrice) params.set('maxPrice', String(f.maxPrice));
          if (f.bedrooms) params.set('bedrooms', String(f.bedrooms));
          router.push(`/search?${params.toString()}`);
          return;
        }

        // Fallback: redirect to search with the raw query as q param
        // The search page can use it for text search
        const route =
          transaction === 'location'
            ? '/louer'
            : transaction === 'investissement'
              ? '/investir'
              : transaction === 'location_courte_duree'
                ? '/short-term'
                : '/acheter';
        router.push(`${route}?q=${encodeURIComponent(q)}`);
      } catch (err) {
        // If Rebecca API fails, fall back to the transaction page with the query
        const route =
          transaction === 'location'
            ? '/louer'
            : transaction === 'investissement'
              ? '/investir'
              : '/acheter';
        router.push(`${route}?q=${encodeURIComponent(q)}`);
      } finally {
        setLoading(false);
      }
    },
    [query, router, transaction],
  );

  const handleVoiceTranscript = useCallback(
    (text: string) => {
      setQuery(text);
      handleSearch(text);
    },
    [handleSearch],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setShowSuggestions(false);
      handleSearch(suggestion);
    },
    [handleSearch],
  );

  return (
    <div className={`w-full ${compact ? '' : 'max-w-3xl mx-auto'}`}>
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="flex items-center gap-2 p-2 rounded-full bg-white border border-primary-pale shadow-lg focus-within:border-primary-green focus-within:ring-2 focus-within:ring-primary-green/30 transition-all"
        >
          {/* AI icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0 bg-primary-pale">
            <Sparkles className="w-5 h-5 text-primary-deep" />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
                setShowSuggestions(false);
              }
            }}
            placeholder="Décrivez votre bien idéal... ex: Villa 4 chambres à Cotonou, budget 50M FCFA"
            className="flex-1 bg-transparent outline-none text-sm sm:text-base text-primary-deep placeholder:text-gray-text/50"
            disabled={loading}
          />

          {/* Voice search */}
          <VoiceSearchButton onTranscript={handleVoiceTranscript} currentQuery={query} />

          {/* Submit button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              handleSearch();
              setShowSuggestions(false);
            }}
            disabled={loading || !query.trim()}
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 bg-primary-green hover:bg-primary-deep shadow-md hover:shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Rechercher</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* AI badge */}
        {!compact && (
          <div className="flex items-center justify-center gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30">
              <Sparkles className="w-3 h-3" />
              Propulsé par Rebecca IA
            </span>
            <span className="text-xs text-gray-text/50">·</span>
            <span className="text-xs text-gray-text/70">Recherche en langage naturel</span>
          </div>
        )}

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && !query && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-xl border border-primary-pale overflow-hidden z-20"
            >
              <div className="p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-text/60 mb-2 px-2">
                  Essayez ces exemples
                </p>
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 py-2.5 rounded-2xl hover:bg-primary-pale/50 transition-colors flex items-center gap-3 group"
                  >
                    <Sparkles className="w-4 h-4 text-primary-green/40 group-hover:text-accent-yellow transition-colors shrink-0" />
                    <span className="text-sm text-gray-text">{suggestion}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-xs text-red-500 text-center"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
