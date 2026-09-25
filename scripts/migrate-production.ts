/**
 * migrate-production.ts — build-time data migration runner (audit P0/P1).
 *
 * Executed automatically at the end of `npm run build` (see package.json):
 * applies the shared, idempotent data migration to the DATABASE_URL
 * database — directories (annuaires artisans/notaires), image-array
 * dedup, and record-level deduplication (soft-delete).
 *
 * Guarantees:
 *  - NEVER fails the build: every error is caught and logged, exit 0.
 *  - Idempotent: safe to re-run on every deploy (upserts + guarded writes).
 *  - No-op without DATABASE_URL (e.g. plain UI builds, PR previews).
 *  - Honours MIGRATION_SKIP=1 to opt out entirely.
 *
 * Manual usage (same effect as the authenticated POST /api/admin/migrate):
 *   DATABASE_URL=postgres://… npx tsx scripts/migrate-production.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Minimal .env loader (no dependency) — only fills MISSING vars ────────
// At build time (Vercel) env vars are already injected; locally, a .env
// file is honoured so the script can be run by hand.
function loadDotEnvIfPresent(): void {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const raw = fs.readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env) || !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env is optional — ignore any read error
  }
}

async function main(): Promise<number> {
  if (process.env.MIGRATION_SKIP === '1') {
    console.info('[migration] MIGRATION_SKIP=1 — skipping.');
    return 0;
  }

  loadDotEnvIfPresent();

  if (!process.env.DATABASE_URL) {
    console.info('[migration] No DATABASE_URL — skipping (build without DB access).');
    return 0;
  }

  // Late import: only touch Prisma when we actually have a database.
  const { runDataMigration } = await import('../src/lib/migrations/apply-data-migration');

  console.info('[migration] Running idempotent data migration (directories, images, records)…');
  const startedAt = Date.now();
  const report = await runDataMigration({
    directory: true,
    images: true,
    records: true,
    invalidateCaches: true,
    countryFilter: null, // build-time = global scope
  });

  const lines: string[] = [
    `[migration] Done in ${Date.now() - startedAt}ms (scope: ${report.scope}).`,
  ];
  if (report.directory) {
    lines.push(
      `[migration] Directory: ${report.directory.artisansUpserted} artisans + ${report.directory.notariesUpserted} notaries upserted (${report.directory.before.artisans}/${report.directory.before.notaries} → ${report.directory.after.artisans}/${report.directory.after.notaries}).`
    );
  }
  if (report.images) {
    lines.push(
      `[migration] Images: ${report.images.duplicatesRemoved} duplicates removed across ${report.images.recordsUpdated} records (${report.images.imagesScanned} scanned).`
    );
  }
  if (report.records) {
    for (const r of report.records) {
      const removed = r.hardDeleted ?? r.duplicatesSoftDeleted;
      lines.push(
        `[migration] Records/${r.model}: ${removed} duplicates removed (${r.scanned} live rows scanned).`
      );
    }
  }
  lines.push(`[migration] Caches invalidated: ${report.cachesInvalidated ? 'yes' : 'no'}.`);
  console.info(lines.join('\n'));

  return 0;
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    // NEVER fail the build because of a data migration: log and move on.
    console.warn(
      '[migration] Skipped after error (non-blocking):',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(0);
  });
