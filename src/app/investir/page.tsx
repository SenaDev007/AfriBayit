'use client';

/**
 * Page /investir — Investir dans l'immobilier en Afrique de l'Ouest
 * Compact hero + conversational AI search + property grid + advanced tools
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid from '@/components/afribayit/PropertyGrid';
import AdvancedFeaturesSection from '@/components/afribayit/AdvancedFeaturesSection';
import ConversationalSearchBar from '@/components/afribayit/ConversationalSearchBar';

export default function InvestirPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handlePropertiesLoaded = useCallback((props: any[]) => {
    setProperties(props);
  }, []);

  const handleToggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }, []);

  const handleSelectProperty = useCallback((id: string) => {
    router.push(`/property/${id}`);
  }, [router]);

  return (
    <TransactionPageShell
      activeTab="investir"
      hero={{
        badge: 'Investissement immobilier',
        title: 'Investissez dans l\'immobilier ouest-africain en pleine croissance',
        subtitle: 'Terrains et biens à fort potentiel avec score d\'investissement IA, prédictions de prix ML et analyse de quartier. Le marché immobilier africain croît de 10-15% par an.',
        backgroundImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: 'Opportunités' },
          { value: 0, suffix: '', label: 'Pays couverts' },
          { value: 12, suffix: '%', label: 'Croissance annuelle' },
          { value: 8, suffix: '%', label: 'Rendement moyen' },
        ],
        ctaLabel: 'Voir les opportunités',
        ctaHref: '#properties',
      }}
    >
      {/* Conversational AI search */}
      <section className="py-8 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConversationalSearchBar transaction="investissement" />
        </div>
      </section>

      {/* Properties */}
      <div id="properties">
        <PropertyGrid
          transaction="investissement"
          emptyMessage="Aucune opportunité d'investissement pour le moment"
          onPropertiesLoaded={handlePropertiesLoaded}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      </div>

      {/* Advanced features: map, comparator, financing simulator */}
      <AdvancedFeaturesSection
        transaction="investissement"
        properties={properties}
        onSelectProperty={handleSelectProperty}
        showFinancing
        compareIds={compareIds}
        onToggleCompare={handleToggleCompare}
      />
    </TransactionPageShell>
  );
}
