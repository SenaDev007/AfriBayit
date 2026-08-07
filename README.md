# AfriBayit — Frontend (Next.js 16)

> « Où l'Afrique trouve sa maison. Où les rêves deviennent adresses. »

This repository contains the **frontend only** of the AfriBayit real-estate
platform. It is a Next.js 16 (App Router) + React 19 + TypeScript 5
application that talks to a separate NestJS backend over HTTP.

The backend lives in another repo (`afribayit-api`) and is deployed to
Fly.io. This repo does **not** include Prisma, server-side business logic,
or any direct database access — those concerns belong to the backend.

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5 strict
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york), Framer Motion 12
- **State**: TanStack Query 5 (server state), Zustand 5 (client state)
- **Auth**: NextAuth.js v4 (credentials + Google + Facebook)
- **Realtime**: Pusher (`pusher-js`) — lazy-loaded singleton client
- **i18n**: 4 locales shipped (`fr`, `en`, `wo`, `fon`) — CDC §3.3 plans 9
- **PWA**: service worker (`public/sw.js`) — app-shell cache, SWR images,
  network-first API
- **Observability**: Sentry (`@sentry/nextjs`) — wrapped via `src/lib/sentry.ts`
- **Tests**: Vitest (unit, jsdom) + Playwright (e2e)

## Getting Started

```bash
# 1. Install dependencies
npm ci

# 2. Configure environment
cp .env.example .env
# Edit .env — at minimum set:
#   NEXT_PUBLIC_API_URL          backend base URL (e.g. https://afribayit-api.fly.dev)
#   NEXTAUTH_SECRET              random 32+ char string
#   NEXTAUTH_URL                 http://localhost:3000 (dev)
#   NEXT_PUBLIC_PUSHER_KEY       Pusher app key (optional — realtime no-ops without it)
#   NEXT_PUBLIC_PUSHER_CLUSTER   Pusher cluster (default: eu)
#   GOOGLE_CLIENT_ID / SECRET    OAuth (optional in dev)
#   FACEBOOK_CLIENT_ID / SECRET  OAuth (optional in dev)

# 3. Start the dev server
npm run dev
# → http://localhost:3000
```

No database setup is required — the frontend talks to the backend over
HTTP via `NEXT_PUBLIC_API_URL`.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Strict TypeScript check (`tsc --noEmit`) |
| `npm test` | Unit tests (Vitest + jsdom) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run test:e2e:ui` | Playwright with UI |

## Project Structure

```
afribayit/                       # frontend repo (this repo)
├── src/
│   ├── app/                     # App Router pages + layouts
│   │   ├── (public pages)      # /, /search, /property/[id], /auth, …
│   │   ├── admin/              # admin dashboard pages
│   │   ├── pro/[slug]/         # public professional profiles
│   │   ├── layout.tsx          # root layout (providers + SW registration)
│   │   └── globals.css         # Tailwind base + brand tokens
│   ├── components/
│   │   ├── afribayit/          # business components (Hero, Footer, …)
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── admin/              # AdminHeader, AdminSidebar
│   │   └── providers/          # NextAuth, ReactQuery, AppShell, SW
│   ├── hooks/                  # React Query hooks (useProperties, …)
│   ├── stores/                 # Zustand stores (authStore, uiStore, …)
│   ├── lib/
│   │   ├── api-client.ts       # apiFetch + typed helpers (api.get/post/…)
│   │   ├── sentry.ts           # captureError / captureWarning
│   │   ├── webauthn.ts         # biometric register/auth (4-endpoint flow)
│   │   ├── signout.ts          # signOutAndClear() — 4-step cleanup
│   │   ├── i18n/               # fr/en/wo/fon dictionaries + translate()
│   │   └── constants.ts        # COUNTRY_NAMES, geoServiceLabel, …
│   └── middleware.ts           # routing + auth middleware
├── public/
│   ├── sw.js                   # service worker (cache strategies)
│   ├── manifest.json           # PWA manifest
│   ├── logo.svg, logo.png
│   └── icons/                  # PWA icons
├── tests/
│   ├── unit/                   # Vitest unit tests (i18n, signout, …)
│   ├── e2e/                    # Playwright e2e tests
│   └── setup.ts                # Vitest setup (mocks for next-auth, …)
├── .github/workflows/ci.yml    # CI: typecheck → unit → build → e2e → CodeQL
├── vitest.config.ts            # jsdom env, frontend-only coverage
├── playwright.config.ts
└── next.config.ts
```

## API Client

All HTTP requests go through `src/lib/api-client.ts`:

```ts
import { api } from '@/lib/api-client';

// GET
const data = await api.get('/properties?country=BJ');

// POST with body
await api.post('/auth/login', { email, password });

// File upload (FormData)
await api.upload('/kyc/submit', formData);
```

The client:
- Adds the `Authorization: Bearer <token>` header from in-memory storage
  (synced to `localStorage.afribayit_access_token`).
- Adds the `X-Country-Code` header for multitenancy (BJ/CI/BF/TG).
- Rewrites `/api/...` paths to `/...` (the backend doesn't use the
  `/api/` prefix).
- Throws `ApiError` (with `statusCode`) on non-2xx responses.
- Calls `setAccessToken(null)` on 401 — the caller decides whether to
  redirect to `/auth/login`.

## Auth

Auth is handled by NextAuth.js v4 with three providers:
- **Credentials** (email + password, with optional 2FA TOTP)
- **Google** OAuth
- **Facebook** OAuth

The access token returned by the backend's `/auth/login` endpoint is
stored in memory + `localStorage` and attached to all subsequent API
requests by `api-client.ts`.

Sign-out is centralised in `src/lib/signout.ts`:

```ts
import { signOutAndClear } from '@/lib/signout';

await signOutAndClear({ callbackUrl: '/auth/login' });
// → calls /auth/logout, clears localStorage, drops in-memory token,
//   calls NextAuth signOut(). Resilient to failures.
```

## Realtime (Pusher)

`src/hooks/useRealtime.ts` lazy-loads `pusher-js` and exposes three hooks:

```ts
import {
  useRealtimeNotifications,
  useRealtimeTyping,
  useRealtimePresence,
} from '@/hooks/useRealtime';

// 1. Notifications — private-user-${userId} channel
useRealtimeNotifications(userId, {
  onNewNotification: (data) => { … },
  onCountUpdate: ({ unreadCount }) => { … },
});

// 2. Typing indicators — private-conversation-${id} channel
const { isTyping, broadcastTyping, broadcastStopTyping } =
  useRealtimeTyping(conversationId, userId);

// 3. Presence — presence-${roomName} channel
const { onlineUsers, count } = useRealtimePresence('room-name');
```

The Pusher client is created with `{ cluster, forceTLS: true }` and uses
the `/api/realtime/auth` endpoint for private channel authentication.
When no hooks are listening, the singleton disconnects to free the
WebSocket.

## PWA / Service Worker

- `public/sw.js` registers three cache strategies:
  - **App shell** (HTML, JS, CSS): cache-first, falls back to `/offline`.
  - **Images**: stale-while-revalidate.
  - **API** (`/api/*`, `/auth/*`): network-first, never caches auth responses.
- `src/components/providers/ServiceWorkerRegistration.tsx` registers
  `/sw.js` in **production only** and surfaces `updatefound` /
  `controllerchange` events via window CustomEvents so the UI can prompt
  the user to refresh.
- Old caches are cleaned up on activate.

## WebAuthn (Biometric Auth)

`src/lib/webauthn.ts` implements the 4-endpoint WebAuthn flow:

```ts
import { isBiometricSupported, registerBiometric, authenticateBiometric } from '@/lib/webauthn';

if (isBiometricSupported()) {
  await registerBiometric({ id, email, name });    // /auth/webauthn/register/{begin,finish}
  await authenticateBiometric(email);                // /auth/webauthn/auth/{begin,finish}
}
```

Base64url helpers (`base64urlToBuffer`, `bufferToBase64url`) are exported
for re-use. All functions are SSR-safe (return `false`/`null` when
`window` or `PublicKeyCredential` is unavailable).

## i18n

- 4 locales shipped: `fr` (default), `en`, `wo` (Wolof), `fon` (Fon).
- CDC §3.3 plans 9 locales including Arabic (RTL) — not yet implemented.
- Access via the `useLocale()` hook or the `translate(locale, key)`
  function from `src/lib/i18n/index.ts`.
- Fallback chain: requested locale → `fr` → raw key.

## Tests

### Unit Tests (Vitest + jsdom)

```bash
npm test                    # run once
npm run test:watch          # watch mode
npm run test:coverage       # with coverage (./coverage/)
```

The test setup (`tests/setup.ts`) mocks `next/headers`, `next-auth`,
`next-auth/react`, and `@/lib/api-client` so unit tests can drive the
auth flow without a live backend. jsdom polyfills `matchMedia`,
`IntersectionObserver`, and `ResizeObserver`.

Coverage thresholds are set to 0 — the focus is on test **presence** and
correctness, not coverage percentage.

### E2E Tests (Playwright)

```bash
npm run test:e2e            # run all e2e tests
npm run test:e2e:ui         # with Playwright UI
```

Playwright auto-starts the dev server. Tests cover the auth flow,
protected route redirects, and the escrow 2FA security fix.

## CI/CD

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every
PR and push:

1. **TypeScript & Lint** — `tsc --noEmit` + ESLint (blocking)
2. **Unit Tests** — Vitest + coverage upload
3. **Build** — production build verification
4. **E2E Tests** — Playwright (on PRs and `main`)
5. **CodeQL** — SAST security-extended queries
6. **Dependency Audit** — `npm audit --audit-level=high` (blocking on
   high/critical vulnerabilities)

The CI does **not** run `prisma generate` — there is no Prisma client in
this repo.

## Deployment

### Vercel (recommended)

1. Connect this GitHub repo to Vercel.
2. Set the environment variables (see `.env.example`).
3. Build command: `npm run build` (auto-detected by Vercel).
4. Production deploys trigger automatically on push to `main`.

### Self-hosted (Docker + Caddy)

```bash
docker build -t afribayit-frontend .
docker-compose up -d
```

The included `Dockerfile` uses Next.js's `standalone` output mode. Pair
with a reverse proxy (Caddy / nginx) for TLS termination.

## Brand Colours

| Role | Hex | Usage |
|---|---|---|
| Dark Blue | `#003087` | Primary, navy backgrounds, headers |
| Light Blue | `#009CDE` | Accent, innovation, secondary CTA |
| Gold | `#D4AF37` | Highlights, prices, premium |
| Green | `#00A651` | Success, availability |
| Charcoal | `#2C2E2F` | Body text, artisans |

## Documentation

- **CDC V4** — `AfriBayit_CDC_V4.pdf` — full specification (117 pages).
- **Worklog** — `worklog.md` — chronological development history.

## Team

- Chef de Projet: Stevens T. AKPOVI
- Architecte Solution: Dawes S. AKPOVI
- Directeur Technique: Judicaël A. KOUAME

## License

Proprietary — AfriBayit Technologies. All rights reserved.
Confidential — internal use only.
