# AfriBayit — Full-Stack Platform (Next.js 16)

> « Où l'Afrique trouve sa maison. Où les rêves deviennent adresses. »

This repository is a **full-stack Next.js 16 monolith** implementing the
AfriBayit pan-African real-estate platform (CDC V4 compliant). It contains
the web frontend, the API layer (App Router route handlers), the Prisma
schema, server-side business logic, and all integrations.

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5 strict
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york), Framer Motion 12
- **State**: TanStack Query 5 (server state), Zustand 5 (client state)
- **Auth**: NextAuth.js v4 (credentials + Google + Facebook) + RS256 JWT
- **Database**: PostgreSQL 16 (Neon) + Prisma 6 ORM, with PostGIS spatial
  indexes and Row-Level Security per country tenant
- **Cache**: Upstash Redis (rate-limiting, sessions, API cache)
- **Search**: Elasticsearch 8 (auto-fallback to Prisma `contains`)
- **Realtime**: Pusher (`pusher-js`) — lazy-loaded singleton client
- **Payments**: FedaPay (Mobile Money UEMOA — BJ/CI/BF/TG) + Stripe (international)
  with escrow engine, J+1 payouts, webhook idempotency
- **Storage**: Cloudflare R2 (presigned URLs for file upload)
- **Email**: Resend (transactional)
- **SMS/USSD**: Africa's Talking (USSD + SMS)
- **i18n**: 9 locales shipped (`fr`, `en`, `ar` RTL, `sw`, `ha`, `wo`, `am`,
  `ln`, `fon`) — CDC §3.3 spec (2 complete, 2 partial, 5 stubs)
- **PWA**: `manifest.webmanifest` + `public/sw.js` (registered via
  `ServiceWorkerRegistration.tsx` in production) + `/offline` fallback
- **Observability**: Sentry (`@sentry/nextjs`)
- **Tests**: Vitest (unit, jsdom) + Playwright (e2e)

## Getting Started

```bash
npm ci   # runs `prisma generate` as postinstall
cp .env.example .env   # edit with your DATABASE_URL, NEXTAUTH_SECRET, FEDAPAY keys, etc.
npx prisma migrate deploy
npx prisma db seed   # optional — inserts demo data
npm run dev           # → http://localhost:3000
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint (warnings non-blocking) |
| `npm run typecheck` | Strict TypeScript check (`tsc --noEmit`) |
| `npm test` | Unit tests (Vitest + jsdom) — 236 tests |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:migrate` | Deploy migrations (`prisma migrate deploy`) |
| `npm run db:studio` | Prisma Studio GUI |

## Architecture

### Multi-tenancy (CDC §3.2)

Three defense layers per country (BJ/CI/BF/TG/SN):
1. **Prisma `$extends`** auto-filter (`db-tenant.ts`) — injects `where: { country }`
2. **PostgreSQL RLS** (`db-rls.ts` + 17 tables with RLS policies)
3. **App-level guard** (`security/tenant-guard.ts`) — fallback

### Escrow & Payments (CDC §7B + §5.0bis)

- **State machine**: CREATED → FUNDED → DOCS_VALIDATED → GEOTRUST_VALIDATED
  → NOTARY_ASSIGNED → NOTARY_IN_PROGRESS → DEED_SIGNED → ANDF_REGISTERED → RELEASED
- **SHA-256 hash-chained ledger** for immutable audit trail
- **FedaPay**: Mobile Money (MTN, Orange, Moov) + card payments
- **Payouts**: J+1 Mobile Money, KYC tier limits, retry + wallet refund
- **Webhook idempotency**: `WebhookEvent` table prevents duplicate processing

### Rebecca AI Agent (CDC §8)

Multi-agent orchestrator with 5 specialist nodes (property-search, financial,
legal, neighborhood, escrow) + guardrails + prompt-injection detection.

## Deployment

- **Frontend + API**: Vercel (Edge Network)
- **Database**: Neon PostgreSQL (serverless)
- **Cache**: Upstash Redis (serverless)
- **CDN/DNS**: Cloudflare (WAF + DDoS)

Required production env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`
(≥16 chars), `FEDAPAY_SECRET_KEY`, `FEDAPAY_PUBLIC_KEY`, `FEDAPAY_SANDBOX=false`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

## License

Proprietary — © AfriBayit Technologies 2025. All rights reserved.
