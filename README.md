# AfriBayit — La Plateforme Immobilière Africaine

> « Où l'Afrique trouve sa maison. Où les rêves deviennent adresses. »

Plateforme immobilière pan-africaine de nouvelle génération combinant intelligence artificielle, transactions sécurisées (escrow) et expérience utilisateur premium. Lancement sur 4 pays pilotes : Bénin, Côte d'Ivoire, Burkina Faso, Togo.

## Stack Technique

- **Frontend** : Next.js 16 (App Router), React 19, TypeScript 5 strict, Tailwind CSS 4, shadcn/ui (new-york), Framer Motion 12, React Query 5, Zustand 5
- **Backend** : Prisma 6, PostgreSQL (Neon), NextAuth 4, Zod 4, z-ai-web-dev-sdk (IA Rebecca)
- **Paiements** : Stripe + FedaPay (Mobile Money), escrow engine, payouts J+1
- **Infrastructure** : Vercel, Cloudflare R2 (storage), Upstash Redis (cache), Sentry (monitoring), Resend (email), Africa's Talking (SMS/USSD), Pusher (realtime)
- **Tests** (P4) : Vitest (unit), Playwright (e2e), CodeQL (SAST)

## Démarrage Rapide

```bash
# 1. Installer les dépendances
npm ci

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs (DATABASE_URL, NEXTAUTH_SECRET, OAuth, etc.)

# 3. Générer le client Prisma
npm run postinstall  # = prisma generate

# 4. Démarrer la base de données
npm run db:push  # ou npm run db:migrate pour les migrations

# 5. (Optionnel) Seeder les données de dev
npm run db:seed

# 6. Lancer le serveur de développement
npm run dev
# → http://localhost:3000
```

## Scripts Disponibles

| Script | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build production (`prisma generate && next build`) |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification TypeScript stricte (`tsc --noEmit`) |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests unitaires en mode watch |
| `npm run test:coverage` | Tests unitaires avec couverture |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run test:e2e:ui` | Tests e2e avec UI Playwright |
| `npm run db:push` | Synchroniser le schema Prisma avec la DB |
| `npm run db:migrate` | Créer une migration Prisma |
| `npm run db:reset` | Reset complet de la DB |
| `npm run db:seed` | Seeder les données de dev |
| `npm run db:studio` | Prisma Studio (GUI DB) |

## Structure du Projet

```
afribayit/
├── prisma/
│   ├── schema.prisma         # 78 modèles, 4 pays pilotes
│   ├── migrations/           # Migrations + RLS policies
│   └── seed.ts               # Données de développement
├── src/
│   ├── app/                  # App Router
│   │   ├── (pages publiques) # /, /search, /property/[id], /auth, etc.
│   │   ├── admin/            # 47 pages admin (31 globales + 16 par pays)
│   │   ├── api/              # 219 routes API
│   │   ├── loading.tsx       # Loading state global
│   │   ├── not-found.tsx     # 404 branded
│   │   ├── sitemap.ts        # Sitemap dynamique
│   │   ├── robots.ts         # robots.txt dynamique
│   │   ├── layout.tsx        # Layout racine (ThemeProvider, NextAuth, etc.)
│   │   └── globals.css       # Styles globaux + tokens CDC §2
│   ├── components/
│   │   ├── afribayit/        # 59 composants métier
│   │   ├── ui/               # 53 composants shadcn/ui
│   │   ├── admin/            # AdminHeader, AdminSidebar
│   │   └── providers/        # NextAuth, ReactQuery, AppShell
│   ├── lib/                  # 204 fichiers logique métier
│   │   ├── design/tokens.ts  # Tokens design (palette logo #003366/#3399FF/#FFCC00)
│   │   ├── auth.ts           # NextAuth config
│   │   ├── auth-guard.ts     # authGuard helper (RS256 JWT + NextAuth session)
│   │   ├── twofa.ts          # TOTP RFC 6238
│   │   ├── otp.ts            # OTP email (Resend) + SMS (Africa's Talking)
│   │   ├── payments/         # Stripe, FedaPay, escrow-engine, payouts
│   │   ├── security/         # RBAC, RLS, rate-limiter, anti-scraping, fraud-detector
│   │   ├── rebecca/          # Agent IA (8 nœuds, guardrails, RAG, multi-canal)
│   │   ├── search/           # Elasticsearch + Postgres FTS fallback
│   │   ├── tenant/           # Multitenancy par pays (config, db-tenant, db-rls)
│   │   └── ...               # 52 sous-dossiers au total
│   ├── hooks/                # 63 hooks React Query (41 admin + 22 métier)
│   ├── stores/               # Zustand (authStore, uiStore, searchStore)
│   └── middleware.ts         # Routing par pays + auth middleware
├── tests/                    # P4 — Tests
│   ├── unit/                 # Vitest unit tests
│   ├── e2e/                  # Playwright e2e tests
│   └── setup.ts              # Vitest setup
├── public/                   # Static assets (logo, manifest, sw.js, icons)
├── .github/workflows/ci.yml  # CI/CD: typecheck + tests + build + CodeQL + audit
├── vitest.config.ts          # P4.1 — Vitest config
├── playwright.config.ts      # P4.2 — Playwright config
└── next.config.ts            # P1.6 — Security headers (CSP, HSTS, etc.)
```

## Charte Graphique

Le logo officiel AfriBayit utilise la palette **PayPal + touche gold** :

| Rôle | Hex | Usage |
|---|---|---|
| **Dark Blue** | `#003366` | Principal, backgrounds navy, headers (corps "Afri", lettre A) |
| **Light Blue** | `#3399FF` | Accent, innovation, CTA secondaire (corps "Bayit", lettre B) |
| **Gold vif** | `#FFCC00` | Accents, highlights, prix, particules (pointe du A) |
| Bronze gold | `#D4AF37` | Hover/accents sombres (variant conservé) |

> **Note** : Le CDC V4 §2.1 mentionnait `#003087 / #D4AF37 / #009CDE` mais le logo réel utilise `#003366 / #3399FF / #FFCC00`. Les tokens ont été alignés sur le logo en juillet 2026. Le CDC devrait être mis à jour en V4.1 pour refléter la palette réelle.

## Sécurité

Ce projet implémente une sécurité multicouche (CDC §10) :

- **Auth** : NextAuth (credentials + Google + Facebook), 2FA TOTP RFC 6238, OTP email/SMS
- **RBAC** : 14 rôles, `authGuard` appliqué sur toutes les routes admin (défense en profondeur)
- **RLS** : PostgreSQL Row-Level Security par pays (BJ/CI/BF/TG)
- **Headers** : CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Anti-fraud** : 5 checks parallèles (price anomaly, duplicate listings, photo hash, seller reputation, document consistency)
- **Escrow** : State machine 8 états, 2FA obligatoire pour libération, ledger atomique, hash chaining SHA-256

Voir `AUDIT_REPORT.md` pour l'audit complet de sécurité (juillet 2026).

## Multitenancy par Pays

Le projet suit le modèle **shared DB with `country` field + RLS** :

- 4 pays pilotes : Bénin (BJ), Côte d'Ivoire (CI), Burkina Faso (BF), Togo (TG)
- Sous-domaines : `bj./ci./bf./tg.afribayit.com` (Phase 1)
- Routing middleware : `src/middleware.ts` (357 lignes)
- Tenant client : `src/lib/db-tenant.ts` injecte automatiquement `where: { country }`
- RLS policies : `prisma/migrations/rls.sql` (8 tables + extension prévue)

## Tests

### Tests Unitaires (Vitest)

```bash
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # With coverage report (./coverage/)
```

Coverage cible : 60% sur modules critiques (escrow-engine, auth, payments, security).

### Tests E2E (Playwright)

```bash
npm run test:e2e            # Run all e2e tests
npm run test:e2e:ui         # With Playwright UI
```

Les tests e2e nécessitent un serveur de dev démarré (Playwright le lance automatiquement).

## CI/CD

Le workflow GitHub Actions (`.github/workflows/ci.yml`) exécute sur chaque PR/push :

1. **TypeScript & Lint** — `tsc --noEmit` + ESLint (blocking)
2. **Unit Tests** — Vitest + coverage upload
3. **Build** — Vérification du build production
4. **E2E Tests** — Playwright (sur PR et main)
5. **CodeQL** — SAST security-extended queries
6. **Dependency Audit** — `npm audit --audit-level=high`

## Déploiement

### Vercel (recommandé)

1. Connecter le repo GitHub à Vercel
2. Configurer les variables d'environnement (voir `.env.example`)
3. Build command : `npm run build`
4. Deploy automatiquement sur `main`

### Self-hosted (Docker + Caddy)

```bash
docker build -t afribayit .
docker-compose up -d
# Configurer Caddyfile pour TLS automatique
```

## Documentation

- **CDC V4** : `AfriBayit_CDC_V4.pdf` — Cahier des charges (117 pages, 16 sections)
- **Audit Report** : `AfriBayit_Audit_Rapport_Conformite_CDC_V4.pdf` — Audit complet (juillet 2026)
- **Worklog** : `worklog.md` — Historique des sessions de développement

## Équipe

- **Chef de Projet** : Stevens T. AKPOVI
- **Architecte Solution** : Dawes S. AKPOVI
- **Directeur Technique** : Judicaël A. KOUAME

## Licence

Propriété intellectuelle AfriBayit Technologies — Tous droits réservés.
Document confidentiel — Usage interne uniquement.
