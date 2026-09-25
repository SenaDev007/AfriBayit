import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import {
  runDataMigration,
  type MigrationReport,
} from '@/lib/migrations/apply-data-migration';
import {
  DIRECTORY_ARTISANS,
  DIRECTORY_ARTISAN_USERS,
  DIRECTORY_NOTARIES,
  DIRECTORY_NOTARY_USERS,
} from '@/lib/migrations/directory-data';

/**
 * POST /api/admin/migrate — patch idempotent de la base de production (P1).
 *
 * Répond au constat de l'audit Manus : la base de production a été seedée
 * avec une ancienne version (1 artisan, 1 notaire, images dupliquées,
 * enregistrements dupliqués ×4). Un re-seed complet (`prisma db seed`) est
 * destructif et donc exclu en production : cet endpoint applique uniquement
 * des upserts ciblés et des soft-deletes réversibles.
 *
 * Actions (body JSON, toutes optionnelles — par défaut tout est appliqué) :
 *  - `directory: true` — alimente les annuaires :
 *        · upsert des comptes utilisateurs dédiés (@artisan/@notaire.afribayit.com)
 *        · upsert des profils Artisan (clé unique : userId)
 *        · upsert des profils Notary (clé unique : licenseNumber)
 *  - `images: true` — déduplique les tableaux `images` (Json) de
 *        Property / Hotel / Guesthouse / ShortTermRental en préservant l'ordre.
 *  - `records: true` — soft-supprime les enregistrements dupliqués
 *        (properties, hotels, guesthouses, locations courte durée,
 *        groupes, événements, posts) + hard-delete des reviews en double.
 *
 * Idempotent : rejouable sans effet de bord. Les COUNTRY_ADMIN ne
 * touchent que leur pays.
 */

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const countryFilter = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : null;

    const [artisans, notaries] = await Promise.all([
      db.artisan.count({ where: countryFilter ? { country: countryFilter } : {} }),
      db.notary.count({ where: countryFilter ? { country: countryFilter } : {} }),
    ]);

    return NextResponse.json({
      mode: 'preview',
      scope: countryFilter ?? 'GLOBAL',
      current: { artisans, notaries },
      pending: {
        directoryUsers: (countryFilter
          ? [...DIRECTORY_ARTISAN_USERS, ...DIRECTORY_NOTARY_USERS].filter((u) => u.country === countryFilter)
          : [...DIRECTORY_ARTISAN_USERS, ...DIRECTORY_NOTARY_USERS]
        ).length,
        artisans: (countryFilter ? DIRECTORY_ARTISANS.filter((a) => a.country === countryFilter) : DIRECTORY_ARTISANS).length,
        notaries: (countryFilter ? DIRECTORY_NOTARIES.filter((n) => n.country === countryFilter) : DIRECTORY_NOTARIES).length,
        recordsDedup: [
          'property', 'hotel', 'guesthouse', 'shortTermRental',
          'communityGroup', 'communityEvent', 'communityPost', 'review',
        ],
      },
      hint: 'POST /api/admin/migrate avec { "directory": true, "images": true, "records": true } pour appliquer.',
    });
  } catch (error) {
    console.error('Migrate preview error:', error);
    return NextResponse.json({ error: 'Migration preview failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const countryFilter = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : null;

    let body: { directory?: boolean; images?: boolean; records?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const report: MigrationReport = await runDataMigration({
      directory: body.directory !== false,
      images: body.images !== false,
      records: body.records !== false,
      invalidateCaches: true,
      countryFilter,
    });

    return NextResponse.json({
      mode: 'applied',
      durationMs: Date.now() - startedAt,
      ...report,
      message: 'Migration appliquée avec succès (idempotente — rejouable sans risque).',
    });
  } catch (error) {
    console.error('Migrate apply error:', error);
    return NextResponse.json({ error: 'Migration failed', detail: String(error) }, { status: 500 });
  }
}
