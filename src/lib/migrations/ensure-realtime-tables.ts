/**
 * ensure-realtime-tables.ts — DDL idempotent pour le chat temps réel.
 *
 * Crée la table `channel_messages` (chat Discord-like des canaux Communauté)
 * si elle n'existe pas encore, + ses index. Appelé :
 *   - au build Vercel (scripts/migrate-production.ts, AVANT la migration de
 *     données — never fails the build) ;
 *   - par POST /api/admin/migrate (déclencheur manuel admin).
 *
 * Pourquoi du DDL manuel plutôt que `prisma migrate deploy` : le pipeline de
 * production n'exécute pas de migrations de schéma ; cette approche CREATE
 * TABLE IF NOT EXISTS est additive, idempotente et sans aucun risque pour
 * les données existantes. Le client Prisma est regénéré à l'install
 * (postinstall: prisma generate) et fait ses jointures sur les colonnes —
 * la contrainte FK n'est pas requise pour `include`.
 */

import type { PrismaClient } from '@prisma/client';

export interface DdlStatementResult {
  sql: string;
  ok: boolean;
  error?: string;
}

const STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS "channel_messages" (
     "id"        TEXT NOT NULL,
     "channelKey" TEXT NOT NULL,
     "authorId"  TEXT NOT NULL,
     "content"   TEXT NOT NULL,
     "country"   TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "channel_messages_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "channel_messages_channelKey_createdAt_idx" ON "channel_messages" ("channelKey", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "channel_messages_channelKey_country_createdAt_idx" ON "channel_messages" ("channelKey", "country", "createdAt")`,
];

/**
 * Exécute le DDL. Ne JAMAIS lancer d'exception — chaque statement est
 * try/catch et le rapport indique ce qui a été appliqué.
 */
export async function ensureRealtimeTables(db: PrismaClient): Promise<{
  applied: number;
  failed: number;
  results: DdlStatementResult[];
}> {
  const results: DdlStatementResult[] = [];
  for (const sql of STATEMENTS) {
    try {
      await db.$executeRawUnsafe(sql);
      results.push({ sql: sql.slice(0, 60), ok: true });
    } catch (error) {
      // 42P07 = table exists déjà, 42710 = index existe déjà → OK idempotent
      const code = (error as { code?: string })?.code;
      if (code === '42P07' || code === '42710') {
        results.push({ sql: sql.slice(0, 60), ok: true });
      } else {
        results.push({
          sql: sql.slice(0, 60),
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  return {
    applied: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
