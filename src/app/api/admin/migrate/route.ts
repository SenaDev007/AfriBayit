import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { toJsonInput, parseJsonArray } from '@/lib/db-helpers';
import {
  DIRECTORY_ARTISANS,
  DIRECTORY_ARTISAN_USERS,
  DIRECTORY_NOTARIES,
  DIRECTORY_NOTARY_USERS,
  type DirectoryUserSeed,
} from '@/lib/migrations/directory-data';

/**
 * POST /api/admin/migrate — patch idempotent de la base de production (P1).
 *
 * Répond au constat de l'audit Manus : la base de production a été seedée
 * avec une ancienne version (1 artisan, 1 notaire, images dupliquées).
 * Un re-seed complet (`prisma db seed`) est destructif et donc exclu en
 * production : cet endpoint applique uniquement des upserts ciblés.
 *
 * Actions (body JSON, toutes optionnelles — par défaut tout est appliqué) :
 *  - `directory: true` — alimente les annuaires :
 *        · upsert des comptes utilisateurs dédiés (@artisan/@notaire.afribayit.com)
 *        · upsert des profils Artisan (clé unique : userId)
 *        · upsert des profils Notary (clé unique : licenseNumber)
 *  - `images: true` — déduplique les tableaux `images` (Json) de
 *        Property / Hotel / Guesthouse en préservant l'ordre.
 *
 * Idempotent : rejouable sans effet de bord. Les COUNTRY_ADMIN ne
 * touchent que leur pays.
 */

const daysAgo = (days: number): Date => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

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

async function migrateDirectory(countryFilter: string | null) {
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

type ImageBearingModel = 'property' | 'hotel' | 'guesthouse';

async function dedupeImages(countryFilter: string | null) {
  const models: ImageBearingModel[] = ['property', 'hotel', 'guesthouse'];
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

async function directoryCounts(countryFilter: string | null) {
  const where = countryFilter ? { country: countryFilter } : {};
  const [artisans, notaries] = await Promise.all([
    db.artisan.count({ where }),
    db.notary.count({ where }),
  ]);
  return { artisans, notaries };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const countryFilter = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : null;

    const before = await directoryCounts(countryFilter);
    return NextResponse.json({
      mode: 'preview',
      scope: countryFilter ?? 'GLOBAL',
      current: before,
      pending: {
        directoryUsers: (countryFilter
          ? [...DIRECTORY_ARTISAN_USERS, ...DIRECTORY_NOTARY_USERS].filter((u) => u.country === countryFilter)
          : [...DIRECTORY_ARTISAN_USERS, ...DIRECTORY_NOTARY_USERS]
        ).length,
        artisans: (countryFilter ? DIRECTORY_ARTISANS.filter((a) => a.country === countryFilter) : DIRECTORY_ARTISANS).length,
        notaries: (countryFilter ? DIRECTORY_NOTARIES.filter((n) => n.country === countryFilter) : DIRECTORY_NOTARIES).length,
      },
      hint: 'POST /api/admin/migrate avec { "directory": true, "images": true } pour appliquer.',
    });
  } catch (error) {
    console.error('Migrate preview error:', error);
    return NextResponse.json({ error: 'Migration preview failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const countryFilter = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : null;

    let body: { directory?: boolean; images?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const runDirectory = body.directory !== false;
    const runImages = body.images !== false;

    const before = await directoryCounts(countryFilter);

    let directoryReport: Record<string, number> | null = null;
    let imagesReport: Record<string, number> | null = null;

    if (runDirectory) {
      directoryReport = await migrateDirectory(countryFilter);
    }
    if (runImages) {
      imagesReport = await dedupeImages(countryFilter);
    }

    const after = await directoryCounts(countryFilter);

    return NextResponse.json({
      mode: 'applied',
      scope: countryFilter ?? 'GLOBAL',
      before,
      after,
      directory: directoryReport,
      images: imagesReport,
      message: 'Migration appliquée avec succès (idempotente — rejouable sans risque).',
    });
  } catch (error) {
    console.error('Migrate apply error:', error);
    return NextResponse.json({ error: 'Migration failed', detail: String(error) }, { status: 500 });
  }
}
