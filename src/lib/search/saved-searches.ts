// AfriBayit — Saved Searches Manager
// Save, load, and manage user search profiles

import { db } from '@/lib/db';
import { SearchFilters } from './filters';
import { buildWhereClause } from './builder';

export async function saveSearch(
  userId: string,
  filters: SearchFilters,
  name: string
) {
  return db.savedSearch.create({
    data: {
      userId,
      name,
      filters: JSON.stringify(filters),
    },
  });
}

export async function getSavedSearches(userId: string) {
  const searches = await db.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return searches.map(s => ({
    ...s,
    filters: JSON.parse(s.filters) as SearchFilters,
  }));
}

export async function getSavedSearch(id: string, userId: string) {
  const search = await db.savedSearch.findFirst({
    where: { id, userId },
  });
  if (!search) return null;
  return {
    ...search,
    filters: JSON.parse(search.filters) as SearchFilters,
  };
}

export async function deleteSavedSearch(id: string, userId: string) {
  return db.savedSearch.deleteMany({
    where: { id, userId },
  });
}

export async function checkNewMatches(searchId: string, userId: string) {
  const search = await getSavedSearch(searchId, userId);
  if (!search) return 0;

  const where = buildWhereClause(search.filters);
  
  // Only count properties published after last check
  if (search.lastCheckedAt) {
    (where as Record<string, unknown>).publishedAt = {
      gte: search.lastCheckedAt,
    };
  }

  const count = await db.property.count({ where });

  // Update lastCheckedAt
  await db.savedSearch.update({
    where: { id: searchId },
    data: {
      lastCheckedAt: new Date(),
      newMatches: count,
    },
  });

  return count;
}
