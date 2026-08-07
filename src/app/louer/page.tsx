'use client';

/**
 * Page /louer — Louer un bien immobilier en Afrique de l'Ouest
 * Compact hero + conversational AI search + property grid + advanced tools
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TransactionPageShell from '@/components/afribayit/TransactionPageShell';
import PropertyGrid, { type PropertyListItem } from '@/components/afribayit/PropertyGrid';
import AdvancedFeaturesSection from '@/components/afribayit/AdvancedFeaturesSection';
import ConversationalSearchBar from '@/components/afribayit/ConversationalSearchBar';
import { useTranslation } from '@/lib/i18n/use-translate';

export default function LouerPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<PropertyListItem[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const handlePropertiesLoaded = useCallback((props: PropertyListItem[]) => {
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
      activeTab="louer"
      hero={{
        badge: t('transactionPages.louer.badge', 'Location longue durée'),
        title: t(
          'transactionPages.louer.title',
          'Louez votre prochain chez-vous en toute sérénité'
        ),
        subtitle: t(
          'transactionPages.louer.subtitle',
          'Appartements, villas et bureaux à louer avec bail numérique sécurisé. Paiement Mobile Money intégré et dépôt de garantie protégé par Escrow.'
        ),
        backgroundImage:
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&h=900&fit=crop',
        stats: [
          { value: 0, suffix: '+', label: t('transactionPages.louer.statPropertiesForRent', 'Biens à louer') },
          { value: 0, suffix: '', label: t('transactionPages.louer.statCountriesCovered', 'Pays couverts') },
          { value: 0, suffix: '+', label: t('transactionPages.louer.statCertifiedAgents', 'Agents certifiés') },
          { value: 0, suffix: '+', label: t('transactionPages.louer.statLandlords', 'Bailleurs') },
        ],
        ctaLabel: t('transactionPages.louer.ctaLabel', 'Voir les biens à louer'),
        ctaHref: '#properties',
      }}
    >
      {/* Conversational AI search */}
      <section className="py-12 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ConversationalSearchBar transaction="location" />
        </div>
      </section>

      {/* Properties */}
      <div id="properties">
        <PropertyGrid
          transaction="location"
          emptyMessage={t(
            'transactionPages.louer.emptyMessage',
            'Aucun bien à louer pour le moment'
          )}
          onPropertiesLoaded={handlePropertiesLoaded}
          compareIds={compareIds}
          onToggleCompare={handleToggleCompare}
        />
      </div>

      {/* Advanced features: map + comparator (no financing for rental) */}
      <AdvancedFeaturesSection
        transaction="location"
        properties={properties}
        onSelectProperty={handleSelectProperty}
        compareIds={compareIds}
        onToggleCompare={handleToggleCompare}
      />
    </TransactionPageShell>
  );
}
