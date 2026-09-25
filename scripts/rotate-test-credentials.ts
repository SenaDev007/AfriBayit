/**
 * rotate-test-credentials.ts — TEST CREDENTIAL ROTATION (audit security ④).
 *
 * Context (Manus audit): the demo/test account credentials were leaked in
 * shared documents. Before any REAL user data lands in the database, every
 * test account must receive a fresh, strong, RANDOM password — unknown to
 * anyone until deliberately shared through the secure channel.
 *
 * What it does:
 *  1. Identifies test accounts by their seed email domains
 *     (@afribayit.com, @afribayit.bf, @artisan.afribayit.com,
 *      @notary.afribayit.com, @example.com — see prisma/seed.ts and
 *      src/lib/migrations/directory-data.ts).
 *  2. Generates a cryptographically random password per account
 *     (crypto.randomBytes — upper/lower/digit/symbol guaranteed).
 *  3. Stores ONLY the Argon2id hash in the database (same hasher as the
 *     login flow: src/lib/security/password.ts).
 *  4. Writes the plaintext credentials to a 0600 local file — never to
 *     stdout (build logs are public on Vercel), never to git.
 *
 * Safety guarantees:
 *  - NEVER fails the build (exit 0 pattern shared with migrate-production.ts).
 *  - No-op without DATABASE_URL (UI-only builds, PR previews).
 *  - Honours CREDENTIALS_ROTATE_SKIP=1 to opt out.
 *  - REFUSES to run when PRODUCTION_DATA=1 (real users present) unless
 *    --force is passed — protects real accounts from accidental rotation.
 *
 * Usage:
 *   DATABASE_URL=postgres://… npx tsx scripts/rotate-test-credentials.ts
 *   npx tsx scripts/rotate-test-credentials.ts --force      # override guards
 *   npx tsx scripts/rotate-test-credentials.ts --dry-run    # report only
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ── Minimal .env loader (same contract as migrate-production.ts) ──────────
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
    // .env is optional
  }
}

// ── Random password generator (guaranteed complexity, no ambiguous chars) ─
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%^&*()-_=+';
const ALL = UPPER + LOWER + DIGITS + SYMBOLS;

function generatePassword(length = 16): string {
  const pick = (charset: string): string => {
    const idx = crypto.randomInt(charset.length);
    return charset[idx];
  };
  // One char from each class first → complexity guaranteed…
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  // …then fill with uniform random picks and shuffle (Fisher–Yates).
  while (chars.length < length) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// ── Test-account email domains (single list, mirrored in .gitignore docs) ─
const TEST_EMAIL_DOMAINS = [
  '@afribayit.com',
  '@afribayit.bf',
  '@artisan.afribayit.com',
  '@notary.afribayit.com',
  '@example.com',
] as const;

function isTestAccount(email: string): boolean {
  return TEST_EMAIL_DOMAINS.some((d) => email.toLowerCase().endsWith(d));
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  if (process.env.CREDENTIALS_ROTATE_SKIP === '1') {
    console.info('[credentials] CREDENTIALS_ROTATE_SKIP=1 — skipping.');
    return 0;
  }

  if (process.env.PRODUCTION_DATA === '1' && !force) {
    console.warn(
      '[credentials] PRODUCTION_DATA=1 — real user data detected. Test-credential rotation REFUSED (use --force to override).'
    );
    return 0;
  }

  loadDotEnvIfPresent();

  if (!process.env.DATABASE_URL) {
    console.info('[credentials] No DATABASE_URL — skipping (build without DB access).');
    return 0;
  }

  // Late imports: DB + hasher only when actually rotating.
  const { PrismaClient } = (await import('@prisma/client')) as typeof import('@prisma/client');
  const { hashPassword } = await import('../src/lib/security/password');
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, password: true },
    });
    const testUsers = users.filter((u) => isTestAccount(u.email));

    if (testUsers.length === 0) {
      console.info('[credentials] No test accounts found — nothing to rotate.');
      return 0;
    }

    const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const outFile = path.join(process.cwd(), `test-credentials-${dateTag}.txt`);
    const lines: string[] = [
      'AfriBayit — TEST CREDENTIALS (rotated)',
      `Generated: ${new Date().toISOString()}`,
      'Scope: seed/demo accounts only (domains: ' + TEST_EMAIL_DOMAINS.join(', ') + ')',
      '',
      'IMPORTANT — handling rules:',
      '  1. Store this file in the team vault (never in git, never in email).',
      '  2. Share each credential only with the person who needs it.',
      '  3. Delete this file once the credentials have been transmitted.',
      '  4. Rotate again before connecting any REAL user data (audit requirement).',
      '',
      'EMAIL\tPASSWORD\tROLE\tNAME',
    ];
    let rotated = 0;
    let skipped = 0;

    for (const u of testUsers) {
      const password = generatePassword(16);
      if (dryRun) {
        skipped++;
        continue;
      }
      const hash = await hashPassword(password);
      await prisma.user.update({
        where: { id: u.id },
        data: { password: hash },
      });
      lines.push(`${u.email}\t${password}\t${u.role}\t${u.name ?? ''}`);
      rotated++;
    }

    if (!dryRun) {
      fs.writeFileSync(outFile, lines.join('\n') + '\n', { mode: 0o600 });
      try {
        fs.chmodSync(outFile, 0o600);
      } catch {
        // chmod is best-effort (e.g. on some filesystems)
      }
      console.info(
        `[credentials] Rotated ${rotated}/${testUsers.length} test accounts. ` +
          `Plaintext written to ${outFile} (mode 0600) — NOT printed to stdout.`
      );
    } else {
      console.info(
        `[credentials] DRY-RUN: ${testUsers.length} test accounts would be rotated (${skipped} simulated). No database change, no file written.`
      );
    }
    return 0;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    // NEVER fail the build because of credential rotation: log and move on.
    console.warn(
      '[credentials] Skipped after error (non-blocking):',
      error instanceof Error ? error.message : String(error)
    );
    process.exit(0);
  });
