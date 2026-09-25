/**
 * Shared data-migration engine (audit Manus P0/P1 — data reliability).
 *
 * One source of truth used by BOTH:
 *  - `POST /api/admin/migrate`  (authenticated admin trigger / re-trigger)
 *  - `scripts/migrate-production.ts` (Vercel build-time auto-apply —
 *    idempotent, never fails the build)
 *
 * Why this exists: the production database was seeded with an OLD seed
 * version, executed 4 times. Consequences observed live (audit Manus):
 *   - annuaires vides : 1 artisan / 1 notaire au lieu de 24 / 12
 *   - images dupliquées dans les tableaux `images` (Json)
 *   - enregistrements dupliqués ×4 : properties (48 = 12×4), hotels,
 *     guesthouses, groupes, événements, posts communautaires, reviews
 *
 * Strategy — strictly NON-destructive:
 *   - directories  : upserts idempotents (clés : email / userId / licenseNumber)
 *   - images       : déduplication dans le tableau en préservant l'ordre
 *   - records      : soft-delete (`deletedAt`) du doublon le plus récent,
 *                    on conserve l'enregistrement le plus ANCIEN de chaque
 *                    groupe (clé métier). Aucune ligne n'est physiquement
 *                    supprimée → réversible, aucun risque FK.
 *   - reviews      : hard-delete des doublons (le modèle Review n'a pas de
 *                    colonne deletedAt ; aucune table ne référence Review)
 *
 * Idempotent : rejouable sans effet de bord. Les COUNTRY_ADMIN ne touchent
 * que leur pays (scope pays appliqué aux upserts et aux soft-deletes).
 */

import { db } from '@/lib/db';
import { toJsonInput, parseJsonArray } from '@/lib/db-helpers';
import {
  DIRECTORY_ARTISANS,
  DIRECTORY_ARTISAN_USERS,
  DIRECTORY_NOTARIES,
  DIRECTORY_NOTARY_USERS,
  type DirectoryUserSeed,
} from '@/lib/migrations/directory-data';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface MigrationOptions {
  /** Alimenter les annuaires artisans/notaires (upserts). Default: true */
  directory?: boolean;
  /** Dédupliquer les tableaux d'images (Json). Default: true */
  images?: boolean;
  /** Soft-supprimer les enregistrements dupliqués (properties, hotels,
   *  guesthouses, locations courte durée, communauté, reviews). Default: true */
  records?: boolean;
  /** Invalider les caches applicatifs après migration. Default: true */
  invalidateCaches?: boolean;
  /** Restriction pays (COUNTRY_ADMIN). null = global */
  countryFilter?: string | null;
}

export interface MigrationReport {
  appliedAt: string;
  scope: string;
  directory: {
    usersUpserted: number;
    artisansUpserted: number;
    notariesUpserted: number;
    before: { artisans: number; notaries: number };
    after: { artisans: number; notaries: number };
  } | null;
  images: {
    imagesScanned: number;
    duplicatesRemoved: number;
    recordsUpdated: number;
  } | null;
  records: {
    model: string;
    scanned: number;
    duplicatesSoftDeleted: number;
    hardDeleted?: number;
  }[] | null;
  cachesInvalidated: boolean;
}

const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

// ─────────────────────────────────────────────────────────────────────────
// 1. Annuaires (artisans + notaires) — upserts idempotents
// ─────────────────────────────────────────────────────────────────────────

function userUpsertData(u: DirectoryUserSeed) {
  return {
    email: u.email,
    phone: u.phone,
    name: u.name,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    country: u.country,
    city: u.city,
    kycLevel: u.kycLevel,
    score: u.score,
    reputation: u.reputation,
    bio: u.bio,
    verified: u.verified,
    preferredLanguage: u.preferredLanguage,
    currency: u.currency,
    avatar: null,
  };
}

export async function migrateDirectory(countryFilter: string | null) {
  const artisanUsers = countryFilter
    ? DIRECTORY_ARTISAN_USERS.filter((u) => u.country === countryFilter)
    : DIRECTORY_ARTISAN_USERS;
  const notaryUsers = countryFilter
    ? DIRECTORY_NOTARY_USERS.filter((u) => u.country === countryFilter)
    : DIRECTORY_NOTARY_USERS;
  const artisans = countryFilter
    ? DIRECTORY_ARTISANS.filter((a) => a.country === countryFilter)
    : DIRECTORY_ARTISANS;
  const notaries = countryFilter
    ? DIRECTORY_NOTARIES.filter((n) => n.country === countryFilter)
    : DIRECTORY_NOTARIES;

  const emailToId = new Map<string, string>();

  // 1. Upsert users (artisans + notaires)
  for (const u of [...artisanUsers, ...notaryUsers]) {
    const data = userUpsertData(u);
    const user = await db.user.upsert({
      where: { email: u.email },
      update: data,
      create: data,
    });
    emailToId.set(u.email, user.id);
  }

  // 2. Upsert artisan profiles — clé unique : userId
  let artisansUpserted = 0;
  for (const a of artisans) {
    const userId = emailToId.get(a.userEmail);
    if (!userId) continue;
    const data = {
      userId,
      trade: a.trade,
      specialties: toJsonInput(a.specialties),
      certified: a.certified,
      kybValid: a.kybValid,
      available: a.available,
      emergency: a.emergency,
      priceRange: a.priceRange,
      dailyRate: a.dailyRate,
      portfolio: toJsonInput(a.portfolio),
      rating: a.rating,
      reviews: a.reviews,
      zone: a.zone,
      city: a.city,
      country: a.country,
      subscriptionTier: a.subscriptionTier,
      responseTime: a.responseTime,
      completedMissions: a.completedMissions,
    };
    await db.artisan.upsert({
      where: { userId },
      update: data,
      create: data,
    });
    artisansUpserted++;
  }

  // 3. Upsert notary profiles — clé unique : licenseNumber.
  //    Garde-fou : si le porteur possède déjà une étude (userId unique),
  //    on met à jour cette étude au lieu d'en créer une seconde.
  let notariesUpserted = 0;
  for (const n of notaries) {
    const userId = emailToId.get(n.userEmail);
    if (!userId) continue;

    const existingByUser = await db.notary.findFirst({ where: { userId } });
    const data = {
      userId,
      licenseNumber: n.licenseNumber,
      chamberName: n.chamberName,
      specialty: n.specialty,
      certificationLevel: n.certificationLevel,
      country: n.country,
      zone: n.zone,
      available: n.available,
      rating: n.rating,
      missions: n.missions,
      subscriptionTier: n.subscriptionTier,
      conventionSigned: n.conventionSigned,
      conventionUrl: n.conventionUrl ?? null,
      certified: n.certified,
      certifiedAt: daysAgo(n.certifiedDaysAgo),
    };

    if (existingByUser && existingByUser.licenseNumber !== n.licenseNumber) {
      // le compte porte déjà une étude sous un autre numéro → mise à jour
      await db.notary.update({ where: { id: existingByUser.id }, data });
      notariesUpserted++;
    } else {
      await db.notary.upsert({
        where: { licenseNumber: n.licenseNumber },
        update: data,
        create: data,
      });
      notariesUpserted++;
    }
  }

  return {
    usersUpserted: emailToId.size,
    artisansUpserted,
    notariesUpserted,
  };
}

async function directoryCounts(countryFilter: string | null) {
  const where = countryFilter ? { country: countryFilter } : {};
  const [artisans, notaries] = await Promise.all([
    db.artisan.count({ where }),
    db.notary.count({ where }),
  ]);
  return { artisans, notaries };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. Déduplication des tableaux d'images (Json)
// ─────────────────────────────────────────────────────────────────────────

type ImageBearingModel = 'property' | 'hotel' | 'guesthouse' | 'shortTermRental';

export async function dedupeImages(countryFilter: string | null) {
  const models: ImageBearingModel[] = ['property', 'hotel', 'guesthouse', 'shortTermRental'];
  let imagesScanned = 0;
  let duplicatesRemoved = 0;
  let recordsUpdated = 0;

  for (const modelName of models) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (db as any)[modelName];
    if (!model?.findMany || !model?.update) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records: any[] = await model.findMany({
      select: { id: true, images: true, ...(countryFilter ? { country: true } : {}) },
    });

    for (const rec of records) {
      if (countryFilter && rec.country !== countryFilter) continue;
      const images = parseJsonArray<string>(rec.images);
      if (images.length === 0) continue;

      imagesScanned += images.length;
      const seen = new Set<string>();
      const unique = images.filter((url) => {
        if (typeof url !== 'string' || seen.has(url)) return false;
        seen.add(url);
        return true;
      });

      if (unique.length < images.length) {
        duplicatesRemoved += images.length - unique.length;
        await model.update({
          where: { id: rec.id },
          data: { images: toJsonInput(unique) },
        });
        recordsUpdated++;
      }
    }
  }

  return { imagesScanned, duplicatesRemoved, recordsUpdated };
}

// ─────────────────────────────────────────────────────────────────────────
// 3. Déduplication des enregistrements (soft-delete du doublon le + récent)
// ─────────────────────────────────────────────────────────────────────────

interface RecordDedupSpec {
  /** Nom du modèle Prisma (clé sur db) */
  modelName: string;
  /** Champs nécessaires au calcul de la clé métier (select minimal) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyFields: string[];
  /** Clé métier de groupement — deux lignes avec la même clé = doublons */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyOf: (record: any) => string;
  /** Le modèle porte-t-il une colonne `country` (scope COUNTRY_ADMIN) */
  hasCountry?: boolean;
}

const RECORD_DEDUP_SPECS: RecordDedupSpec[] = [
  {
    modelName: 'property',
    keyFields: ['title', 'city', 'transaction', 'price', 'agentId'],
    // agentId inclus : deux annonces du même titre/ville/prix par des agents
    // DIFFÉRENTS ne sont pas des doublons (même clé = même seed rejoué).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${r.title}|${r.city}|${r.transaction}|${r.price}|${r.agentId ?? ''}`,
    hasCountry: true,
  },
  {
    modelName: 'hotel',
    keyFields: ['name', 'city', 'ownerId'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${r.name}|${r.city}|${r.ownerId ?? ''}`,
    hasCountry: true,
  },
  {
    modelName: 'guesthouse',
    keyFields: ['name', 'city', 'ownerId'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${r.name}|${r.city}|${r.ownerId ?? ''}`,
    hasCountry: true,
  },
  {
    modelName: 'shortTermRental',
    keyFields: ['title', 'city', 'hostId'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${r.title}|${r.city}|${r.hostId ?? ''}`,
    hasCountry: true,
  },
  {
    modelName: 'communityGroup',
    keyFields: ['name', 'type'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${(r.name ?? '').trim().toLowerCase()}|${r.type ?? ''}`,
    hasCountry: true,
  },
  {
    modelName: 'communityEvent',
    keyFields: ['title', 'eventType', 'city', 'country', 'organizerId'],
    // organizerId inclus : même intitulé par des organisateurs différents =
    // événements distincts (ex : meetups mensuels récurrents).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${(r.title ?? '').trim().toLowerCase()}|${r.eventType ?? ''}|${r.city ?? ''}|${r.country ?? ''}|${r.organizerId ?? ''}`,
    hasCountry: true,
  },
  {
    modelName: 'communityPost',
    keyFields: ['title', 'authorId'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyOf: (r: any) => `${(r.title ?? '').trim().toLowerCase()}|${r.authorId ?? ''}`,
  },
];

/**
 * Générique : regroupe les lignes vivantes (deletedAt null) par clé métier,
 * conserve la plus ancienne (createdAt minimum) et marque `deletedAt` sur
 * les autres. Strictement idempotent :
 *  - les lignes déjà soft-supprimées sont exclues du groupement ;
 *  - une ligne saine n'est jamais marquée deux fois.
 */
async function softDeleteDuplicates(
  spec: RecordDedupSpec,
  countryFilter: string | null
): Promise<{ scanned: number; duplicatesSoftDeleted: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (db as any)[spec.modelName];
  if (!model?.findMany || !model?.update) return { scanned: 0, duplicatesSoftDeleted: 0 };

  const select: Record<string, boolean> = {
    id: true,
    createdAt: true,
    deletedAt: true,
    ...(spec.hasCountry ? { country: true } : {}),
  };
  for (const f of spec.keyFields) select[f] = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const records: any[] = await model.findMany({
    select,
    ...(spec.hasCountry && countryFilter
      ? { where: { country: countryFilter } }
      : {}),
  });

  // Grouper les lignes vivantes par clé métier
  const groups = new Map<string, { id: string; createdAt: Date }[]>();
  let scanned = 0;
  for (const rec of records) {
    if (rec.deletedAt) continue;
    scanned++;
    const key = spec.keyOf(rec);
    const bucket = groups.get(key) ?? [];
    bucket.push({ id: rec.id, createdAt: rec.createdAt });
    groups.set(key, bucket);
  }

  let duplicatesSoftDeleted = 0;
  for (const bucket of groups.values()) {
    if (bucket.length <= 1) continue;

    // Conserver le plus ancien ; soft-supprimer les autres
    const sorted = [...bucket].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (const dupe of sorted.slice(1)) {
      try {
        await model.update({
          where: { id: dupe.id },
          data: { deletedAt: new Date() },
        });
        duplicatesSoftDeleted++;
      } catch (error) {
        // Ligne référencée / verrou concurrent → journaliser, continuer
        console.warn(
          `[migration] soft-delete ${spec.modelName}/${dupe.id} skipped:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  return { scanned, duplicatesSoftDeleted };
}

/**
 * Déduplication des reviews (HARD delete) :
 * le modèle Review n'a pas de colonne deletedAt et aucune table ne le
 * référence (il ne référence que User) → supprimer physiquement les
 * doublons est sûr et évite de fausser les moyennes de notes.
 */
async function hardDeleteDuplicateReviews(countryFilter: string | null) {
  const reviews = await db.review.findMany({
    select: {
      id: true,
      reviewerId: true,
      targetId: true,
      targetType: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
    ...(countryFilter ? { where: { country: countryFilter } } : {}),
  });

  const groups = new Map<string, { id: string; createdAt: Date }[]>();
  let scanned = 0;
  for (const r of reviews) {
    scanned++;
    const key = `${r.reviewerId}|${r.targetId}|${r.targetType}|${r.rating}|${(r.comment ?? '').slice(0, 120)}`;
    const bucket = groups.get(key) ?? [];
    bucket.push({ id: r.id, createdAt: r.createdAt });
    groups.set(key, bucket);
  }

  let hardDeleted = 0;
  for (const bucket of groups.values()) {
    if (bucket.length <= 1) continue;
    const sorted = [...bucket].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    for (const dupe of sorted.slice(1)) {
      try {
        await db.review.delete({ where: { id: dupe.id } });
        hardDeleted++;
      } catch (error) {
        console.warn(
          `[migration] review delete ${dupe.id} skipped:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  return { scanned, hardDeleted };
}

export async function deduplicateRecords(countryFilter: string | null) {
  const results: {
    model: string;
    scanned: number;
    duplicatesSoftDeleted: number;
    hardDeleted?: number;
  }[] = [];

  for (const spec of RECORD_DEDUP_SPECS) {
    const res = await softDeleteDuplicates(spec, countryFilter);
    results.push({
      model: spec.modelName,
      scanned: res.scanned,
      duplicatesSoftDeleted: res.duplicatesSoftDeleted,
    });
  }

  const reviewsResult = await hardDeleteDuplicateReviews(countryFilter);
  results.push({
    model: 'review',
    scanned: reviewsResult.scanned,
    duplicatesSoftDeleted: 0,
    hardDeleted: reviewsResult.hardDeleted,
  });

  return results;
}

// ─────────────────────────────────────────────────────────────────────────
// Orchestrateur
// ─────────────────────────────────────────────────────────────────────────

export async function runDataMigration(options: MigrationOptions = {}): Promise<MigrationReport> {
  const {
    directory = true,
    images = true,
    records = true,
    invalidateCaches = true,
    countryFilter = null,
  } = options;

  const before = await directoryCounts(countryFilter);

  let directoryReport: Awaited<ReturnType<typeof migrateDirectory>> | null = null;
  let imagesReport: Awaited<ReturnType<typeof dedupeImages>> | null = null;
  let recordsReport: Awaited<ReturnType<typeof deduplicateRecords>> | null = null;

  if (directory) {
    directoryReport = await migrateDirectory(countryFilter);
  }
  if (images) {
    imagesReport = await dedupeImages(countryFilter);
  }
  if (records) {
    recordsReport = await deduplicateRecords(countryFilter);
  }

  const after = await directoryCounts(countryFilter);

  // Invalider les caches applicatifs (stats, listes) pour que l'effet soit
  // visible immédiatement côté visiteurs. Import dynamique : évite de tirer
  // la couche Redis dans les contextes où elle n'est pas configurée.
  let cachesInvalidated = false;
  if (invalidateCaches) {
    try {
      const { invalidatePropertyCache, invalidateStatsCache } = await import('@/lib/cache');
      await Promise.all([
        invalidatePropertyCache(countryFilter ?? undefined),
        invalidateStatsCache(countryFilter ?? undefined),
      ]);
      cachesInvalidated = true;
    } catch (error) {
      console.warn('[migration] cache invalidation skipped:', error instanceof Error ? error.message : String(error));
    }
  }

  return {
    appliedAt: new Date().toISOString(),
    scope: countryFilter ?? 'GLOBAL',
    directory: directoryReport
      ? { ...directoryReport, before, after }
      : null,
    images: imagesReport,
    records: recordsReport,
    cachesInvalidated,
  };
}
