/**
 * AfriBayit — Réinitialisation / création du compte propriétaire back-office.
 *
 * Usage :
 *   DATABASE_URL="postgresql://…n.neon.tech/AfriBayit?sslmode=require" \
 *     npx tsx scripts/reset-owner-account.ts [email] [--name="Prénom Nom"] [--role=admin]
 *
 * Comportement :
 *   - Si le compte n'existe pas → création complète (email vérifié, 2FA off)
 *   - S'il existe → réinitialisation du mot de passe uniquement (rôle conservé
 *     sauf si --role passé explicitement)
 *   - Mot de passe aléatoire 16 caractères (classes mixtes, sans caractères
 *     ambigus), hashé en Argon2id avec les paramètres OWASP de src/lib/auth.ts
 *     (memoryCost 64 Mo, timeCost 3, parallelism 4) — compatible verifyPassword
 *   - Le mot de passe en clair n'est JAMAIS loggé : il est écrit dans un
 *     fichier 0600 passé en argument --out= (défaut : /tmp/afribayit-owner-credentials.txt)
 *
 * Aucune URL de base de données n'est incluse dans ce fichier (env uniquement).
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { writeFileSync, chmodSync } from 'fs';

const prisma = new PrismaClient();

// ─── Paramètres Argon2id — DOIVENT rester alignés sur src/lib/auth.ts ──────
const ARGON2ID_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

// Charset sans caractères ambigus (0/O, 1/l/I, etc.) pour limiter les fautes
// de frappe lors de la recopie manuelle.
const PASSWORD_CHARSET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789-@#%&+*=!?';

function generatePassword(length = 16): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARSET[bytes[i] % PASSWORD_CHARSET.length];
  }
  // Garantir au moins un caractère de chaque classe
  if (!/[A-Z]/.test(out)) out = 'A' + out.slice(1);
  if (!/[a-z]/.test(out)) out = out.slice(0, -1) + 'q';
  if (!/[0-9]/.test(out)) out = out.slice(0, -2) + '7' + out.slice(-1);
  return out;
}

function arg(name: string, fallback?: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

async function main() {
  const positional = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const email = (positional[0] || arg('email') || '').trim().toLowerCase();
  const name = arg('name');
  const role = arg('role');
  const outFile = arg('out', '/tmp/afribayit-owner-credentials.txt');

  if (!email || !email.includes('@')) {
    console.error('Usage: npx tsx scripts/reset-owner-account.ts <email> [--name="Prénom Nom"] [--role=admin] [--out=fichier]');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgres')) {
    console.error('DATABASE_URL (postgresql://…) requis — aucune action effectuée.');
    process.exit(1);
  }

  const password = generatePassword(16);
  const hash = await argon2.hash(password, ARGON2ID_OPTIONS);

  const existing = await prisma.user.findUnique({ where: { email } });

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { email },
      data: {
        password: hash,
        ...(role ? { role } : {}),
        twoFactorEnabled: false, // connexion simple par mot de passe
      },
    });
    console.log(`[reset] Compte existant mis à jour : ${email} (rôle conservé : ${user.role})`);
  } else {
    const finalRole = role || 'admin'; // défaut : admin plateforme (accès back-office complet)
    user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0].split('.').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' '),
        password: hash,
        role: finalRole,
        emailVerified: new Date(),
        verified: true,
        twoFactorEnabled: false,
        preferredLanguage: 'fr',
        currency: 'XOF',
      },
    });
    console.log(`[create] Compte créé : ${email} — rôle ${finalRole}`);
  }

  const payload = [
    `AfriBayit — Identifiants back-office (généré le ${new Date().toISOString()})`,
    `Email : ${user.email}`,
    `Rôle  : ${user.role}`,
    `Mot de passe : ${password}`,
    ``,
    `⚠️  À changer après la première connexion (Paramètres → Mot de passe).`,
    `⚠️  Fichier à supprimer après transmission. Ne jamais committer.`,
  ].join('\n');
  writeFileSync(outFile, payload, { mode: 0o600 });
  chmodSync(outFile, 0o600);

  console.log(`[ok]   Mot de passe écrit dans ${outFile} (chmod 600)`);
  console.log(`[info] Hash Argon2id (${hash.length} car.) appliqué — compatible verifyPassword() de src/lib/auth.ts`);
}

main()
  .catch((e) => { console.error('ERREUR:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
