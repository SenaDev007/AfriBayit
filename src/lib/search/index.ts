// AfriBayit — Main Search Orchestrator
// Combines filters, builder, and result shaping

import { db } from '@/lib/db';
import { SearchFilters } from './filters';
import { buildWhereClause, buildOrderBy, buildPagination } from './builder';
import { Prisma } from '@prisma/client';

export interface SearchResult {
  properties: SearchResultProperty[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  facets: SearchFacets;
}

export interface SearchResultProperty {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  description: string;
  images: string[];
  features: string[];
  lat: number | null;
  lng: number | null;
  verified: boolean;
  geoTrust: boolean;
  geoTrustLevel: string | null;
  premium: boolean;
  investmentScore: number | null;
  walkScore: number | null;
  views: number;
  hasVR: boolean;
  hasDroneView: boolean;
  publishedAt: string | null;
  createdAt: string;
  agent?: {
    id: string;
    name: string;
    avatar: string | null;
    company: string | null;
    certified: boolean;
  };
}

export interface SearchFacets {
  types: { value: string; count: number }[];
  transactions: { value: string; count: number }[];
  countries: { value: string; count: number }[];
  cities: { value: string; count: number }[];
  priceRange: { min: number; max: number };
}

export async function searchProperties(filters: SearchFilters): Promise<SearchResult> {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderBy(filters.sortBy || 'newest');
  const { skip, take } = buildPagination(filters);

  const [propertiesRaw, total, facets] = await Promise.all([
    db.property.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true,
            professionalProfile: {
              select: {
                agencyName: true,
                credibilityScore: true,
              },
            },
          },
        },
      },
    }),
    db.property.count({ where }),
    computeFacets(where),
  ]);

  const properties = propertiesRaw.map(shapeProperty);

  return {
    properties,
    pagination: {
      page: filters.page || 1,
      limit: filters.limit || 24,
      total,
      pages: Math.ceil(total / take),
    },
    facets,
  };
}

function shapeProperty(p: Record<string, unknown>): SearchResultProperty {
  const owner = p.owner as Record<string, unknown> | null;
  let images: string[] = [];
  try { images = p.images ? JSON.parse(p.images as string) : []; } catch { images = []; }
  let features: string[] = [];
  try { features = p.features ? JSON.parse(p.features as string) : []; } catch { features = []; }

  return {
    id: p.id as string,
    title: p.title as string,
    type: p.type as string,
    transaction: p.transaction as string,
    price: p.price as number,
    currency: p.currency as string,
    surface: p.surface as number,
    rooms: p.rooms as number,
    bedrooms: p.bedrooms as number,
    bathrooms: p.bathrooms as number,
    city: p.city as string,
    country: p.country as string,
    quartier: p.quartier as string,
    description: p.description as string,
    images,
    features,
    lat: p.lat as number | null,
    lng: p.lng as number | null,
    verified: p.verified as boolean,
    geoTrust: p.geoTrust as boolean,
    geoTrustLevel: p.geoTrustLevel as string | null,
    premium: p.premium as boolean,
    investmentScore: p.investmentScore as number | null,
    walkScore: p.walkScore as number | null,
    views: p.views as number,
    hasVR: p.hasVR as boolean,
    hasDroneView: p.hasDroneView as boolean,
    publishedAt: p.publishedAt as string | null,
    createdAt: p.createdAt as string,
    agent: owner
      ? {
          id: owner.id as string,
          name: owner.name as string,
          avatar: owner.avatar as string | null,
          company: (owner.professionalProfile as Record<string, unknown> | null)?.agencyName as string | null,
          certified: owner.verified as boolean,
        }
      : undefined,
  };
}

async function computeFacets(baseWhere: Prisma.PropertyWhereInput): Promise<SearchFacets> {
  const [types, transactions, countries, cities, priceAgg] = await Promise.all([
    db.property.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: { type: true },
    }),
    db.property.groupBy({
      by: ['transaction'],
      where: baseWhere,
      _count: { transaction: true },
    }),
    db.property.groupBy({
      by: ['country'],
      where: baseWhere,
      _count: { country: true },
    }),
    db.property.groupBy({
      by: ['city'],
      where: baseWhere,
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take: 20,
    }),
    db.property.aggregate({
      where: baseWhere,
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  return {
    types: types.map(t => ({ value: t.type, count: t._count.type })),
    transactions: transactions.map(t => ({ value: t.transaction, count: t._count.transaction })),
    countries: countries.map(c => ({ value: c.country, count: c._count.country })),
    cities: cities.map(c => ({ value: c.city, count: c._count.city })),
    priceRange: {
      min: priceAgg._min.price || 0,
      max: priceAgg._max.price || 0,
    },
  };
}
