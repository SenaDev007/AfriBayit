'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Building2, KeyRound, Hotel, ChevronRight, MapPin, BedDouble, Bath, Ruler, Verified } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';
import type { PropertyListItem } from '@/components/afribayit/PropertyGrid';
import { useCountry } from '@/contexts/CountryContext';

type PropertiesResponse =
  | { properties: PropertyListItem[]; pagination?: unknown }
  | PropertyListItem[];

/**
 * Section Catalogue — portage du design Win-Agro Products.tsx sur AfriBayit :
 * 3 cartes catégories (icône, badge compteur, hook, puces, CTA catalogue),
 * puis une grille de biens réels aux cartes « card-shimmer » Win-Agro.
 */

interface PropertyRow {
  id: string;
  title: string;
  type?: string;
  city?: string;
  country?: string;
  price?: number;
  transaction?: string;
  bedrooms?: number;
  bathrooms?: number;
  surface?: number;
  images?: string[];
  verified?: boolean;
  premium?: boolean;
}

const CATEGORIES = [
  {
    key: 'vente',
    title: 'Achat Immobilier',
    hook: 'Des biens vérifiés — pas des promesses de brochure.',
    icon: Building2,
    href: '/acheter',
    preview: [
      'Villas, appartements, terrains et bureaux titrés',
      'Vérification GeoTrust des titres fonciers avant publication',
      'Fonds sécurisés en séquestre jusqu\u2019à la signature',
      'Négociation accompagnée par nos agents certifiés',
    ],
    badge: 'Titres vérifiés',
  },
  {
    key: 'location',
    title: 'Location Longue Durée',
    hook: 'Ton prochain chez-toi, sans dépôt de garantie envolé.',
    icon: KeyRound,
    href: '/louer',
    preview: [
      'Baux digitalisés conformes au droit local de chaque pays',
      'Dépôts de garantie protégés sous séquestre',
      'Propriétaires vérifiés KYC obligatoirement',
      'État des lieux documenté et daté à l\u2019entrée',
    ],
    badge: 'Baux sécurisés',
  },
  {
    key: 'sejours',
    title: 'Séjours & Hôtellerie',
    hook: 'Ta villa idéale existe aussi pour un week-end.',
    icon: Hotel,
    href: '/sejours',
    preview: [
      'Hôtels, guesthouses et locations courte durée certifiés',
      'Avis authentifiés de voyageurs réels',
      'Réservation instantanée, annulation transparente',
      'Check-in QR et conciergerie Rebecca IA 24h/24',
    ],
    badge: 'Adresses inspectées',
  },
];

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-primary-pale bg-white shadow-lg">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-6">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    </div>
  );
}

function formatPrice(price?: number, transaction?: string): string {
  if (price == null) return 'Prix sur demande';
  const formatted = new Intl.NumberFormat('fr-FR').format(price);
  if (transaction === 'achat' || transaction === 'vente' || transaction === 'investissement') return `${formatted} FCFA`;
  return `${formatted} FCFA/mois`;
}

export default function Catalog() {
  const router = useRouter();
  const { selectedCountry } = useCountry();

  const { data, isPending } = useQuery<PropertiesResponse>({
    queryKey: ['landing-properties', selectedCountry],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '6');
      params.set('page', '1');
      if (selectedCountry) params.set('country', selectedCountry);
      const res = await api.get<PropertiesResponse>(`/properties?${params.toString()}`);
      return res;
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  const properties: PropertyRow[] = (Array.isArray(data) ? data : data?.properties ?? []).slice(0, 6);

  return (
    <section id="catalogue" className="py-24 bg-cream relative overflow-hidden">
      {/* Couche de texture */}
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* En-tête */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3"
          >
            Notre Catalogue
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold text-primary-deep leading-tight"
          >
            Biens vérifiés. Adresses légitimes.
          </motion.h2>

          <p className="text-primary-green font-serif text-lg sm:text-xl font-bold mt-2">
            Chaque annonce est contrôlée avant d&apos;être publiée.
          </p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base text-gray-text font-sans mt-4 max-w-2xl mx-auto"
          >
            Cliquez sur une catégorie pour explorer les annonces disponibles, filtrer par pays et contacter directement
            les propriétaires ou agents vérifiés.
          </motion.p>

          <motion.div
            animate={{ scaleX: [0, 1, 1, 0], transformOrigin: ['0% 50%', '0% 50%', '100% 50%', '100% 50%'] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1], ease: 'easeInOut' }}
            className="h-1 w-16 bg-accent-yellow mx-auto mt-6 rounded-full"
          />
        </div>

        {/* Grille de catégories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {CATEGORIES.map((category, index) => {
            const CatIcon = category.icon;
            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                whileHover={{
                  y: -10,
                  scale: 1.03,
                  borderColor: 'rgba(0, 156, 222, 0.4)',
                  boxShadow: '0 20px 25px -5px rgba(0, 48, 135, 0.1), 0 8px 10px -6px rgba(0, 48, 135, 0.1)',
                }}
                onClick={() => router.push(category.href)}
                className="rounded-3xl bg-white border border-primary-pale shadow-lg p-8 flex flex-col justify-between transition-all duration-300 group card-shimmer cursor-pointer"
              >
                <div>
                  {/* En-tête de catégorie */}
                  <div className="flex items-center gap-4 mb-4">
                    <span className="p-3 bg-primary-pale rounded-2xl group-hover:scale-110 transition-transform duration-300 flex items-center justify-center text-primary-deep">
                      <CatIcon className="w-8 h-8 text-primary-deep" />
                    </span>
                    <div className="flex-1">
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary-deep leading-tight">
                        {category.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary-green bg-primary-pale px-2 py-0.5 rounded-full inline-block">
                          {category.badge}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="font-sans font-bold text-primary-green text-sm leading-relaxed mb-6 italic">
                    {category.hook}
                  </p>

                  <div className="w-full h-px bg-primary-pale my-4" />

                  {/* Puces d'aperçu */}
                  <ul className="space-y-3 mb-8">
                    {category.preview.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-text font-sans">
                        <span className="text-accent-dark font-black mt-0.5">▪</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA pied de carte */}
                <div className="mt-auto">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-full bg-primary-green group-hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md transition-all duration-300 btn-shimmer"
                  >
                    Voir le catalogue
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Biens en vedette — données réelles */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary-pale text-primary-deep text-xs font-sans font-bold uppercase tracking-wider mb-3">
                Biens en vedette
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-primary-deep">
                Les adresses qui font parler
              </h3>
            </div>
            <button
              onClick={() => router.push('/search')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary-green hover:bg-primary-deep text-white text-sm font-sans font-bold shadow-md transition-colors cursor-pointer btn-shimmer"
            >
              Voir tous les biens
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isPending ? (
              <>
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
                <PropertyCardSkeleton />
              </>
            ) : properties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="col-span-full text-center py-16 rounded-3xl bg-white border border-primary-pale"
              >
                <Building2 className="w-12 h-12 text-primary-pale mx-auto mb-4" />
                <p className="font-serif text-xl font-bold text-primary-deep mb-2">
                  Les nouvelles annonces arrivent bientôt
                </p>
                <p className="text-sm text-gray-text font-sans max-w-md mx-auto">
                  Les propriétaires publient chaque jour. Reviens consulter le catalogue ou publie ta propre annonce
                  dès maintenant.
                </p>
              </motion.div>
            ) : (
              properties.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.08, ease: 'easeOut' }}
                  whileHover={{
                    y: -10,
                    scale: 1.02,
                    borderColor: 'rgba(0, 156, 222, 0.4)',
                    boxShadow: '0 20px 25px -5px rgba(0, 48, 135, 0.1), 0 8px 10px -6px rgba(0, 48, 135, 0.1)',
                  }}
                  onClick={() => router.push(`/property/${property.id}`)}
                  className="rounded-3xl bg-white border border-primary-pale shadow-lg overflow-hidden flex flex-col transition-all duration-300 group card-shimmer cursor-pointer"
                >
                  {/* Image du bien */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {property.images && property.images.length > 0 ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-pale flex items-center justify-center">
                        <Building2 className="w-12 h-12 text-primary-deep/30" />
                      </div>
                    )}
                    {(property.verified || property.premium) && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-sans font-black text-primary-green shadow-sm flex items-center gap-1">
                        <Verified className="w-3 h-3" /> {property.premium ? 'PREMIUM' : 'VÉRIFIÉ'}
                      </div>
                    )}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-primary-deep/90 backdrop-blur-sm text-white text-xs font-sans font-bold shadow-md">
                      {formatPrice(property.price, property.transaction)}
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="p-6 flex flex-col flex-1">
                    <h4 className="font-serif text-lg font-bold text-primary-deep leading-tight group-hover:text-primary-green transition-colors">
                      {property.title}
                    </h4>
                    <p className="flex items-center gap-1.5 text-xs text-gray-text font-sans mt-2">
                      <MapPin className="w-3.5 h-3.5 text-primary-green shrink-0" />
                      {property.city || 'Ville'}{property.country ? `, ${property.country}` : ''}
                    </p>

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-primary-pale text-xs text-gray-text font-sans">
                      {property.bedrooms != null && (
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4 text-primary-green" /> {property.bedrooms} ch.
                        </span>
                      )}
                      {property.bathrooms != null && (
                        <span className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-primary-green" /> {property.bathrooms} sdb
                        </span>
                      )}
                      {property.surface != null && (
                        <span className="flex items-center gap-1.5">
                          <Ruler className="w-4 h-4 text-primary-green" /> {property.surface} m²
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
