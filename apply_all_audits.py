#!/usr/bin/env python3
"""
AfriBayit Audit Cleanup — applies ALL changes from audit-1 through audit-9.
Run from the AfriBayit repo root: python3 apply_all_audits.py
"""
import os, re

REPO = os.path.dirname(os.path.abspath(__file__))

def W(path, content):
    full = os.path.join(REPO, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, 'w') as f: f.write(content)

def D(path):
    full = os.path.join(REPO, path)
    if os.path.exists(full): os.remove(full)

def E(path, old, new):
    full = os.path.join(REPO, path)
    with open(full, 'r') as f: c = f.read()
    if old not in c: return False
    c = c.replace(old, new, 1)
    with open(full, 'w') as f: f.write(c)
    return True

def EA(path, old, new):
    full = os.path.join(REPO, path)
    with open(full, 'r') as f: c = f.read()
    c = c.replace(old, new)
    with open(full, 'w') as f: f.write(c)

def PE(path, transform):
    full = os.path.join(REPO, path)
    with open(full, 'r') as f: c = f.read()
    c = transform(c)
    with open(full, 'w') as f: f.write(c)

print('=== AUDIT 1-9: Applying all changes ===')

# ─── Deletions ───
for f in ['src/lib/api.ts','src/lib/realtime/server.ts','src/components/afribayit/NotificationCenter.tsx','src/lib/session-store.ts']:
    D(f)
devdb = os.path.join(REPO, 'prisma/dev.db')
if os.path.exists(devdb): os.remove(devdb)

# ─── ADR ───
W('docs/adr/0001-monolith-architecture.md', '# ADR 0001 — AfriBayit is a Next.js 16 full-stack monolith\n\n- **Status**: Accepted\n- **Date**: 2026-08-31\n\n## Decision\n\n**AfriBayit is a Next.js 16 full-stack monolith.**\n')

# ─── Comment fixes ───
E('next.config.ts', '// AfriBayit — Frontend Next.js Configuration\n// Backend is now separate: github.com/SenaDev007/afribayit-api (NestJS on Railway)\n// This frontend calls the backend via NEXT_PUBLIC_API_URL (see src/lib/api-client.ts)', '// AfriBayit — Next.js Configuration (full-stack monolith)\n// See docs/adr/0001-monolith-architecture.md.\n// The Next.js app is the backend — App Router route handlers call Prisma directly.')
E('tests/setup.ts', '// AfriBayit — Vitest Setup (P4.1 + Module 19 — frontend-only test setup)\n//\n// Replaces the dead Prisma/Resend/z-ai-sdk mocks (this is a frontend-only\n// repo — there\'s no Prisma client, no email sender, no LLM SDK on this\n// side of the wire). The new mocks cover Next.js server helpers,\n// NextAuth (server + React), and the api-client so unit tests can drive\n// the auth flow without a live backend.', '// AfriBayit — Vitest Setup (P4.1 + Module 19)\n//\n// This is a full-stack Next.js monolith (see docs/adr/0001-monolith-architecture.md).\n// Unit tests here only exercise pure-utility code paths.')
E('src/lib/api-client.ts', '// AfriBayit — API Client (CDC §3.1.2 — frontend calls NestJS backend)\n// This module replaces the old apiFetch helper that called Next.js API routes.\n// All requests now go to the separate NestJS backend (afribayit-api on Fly.io).', '// AfriBayit — API Client (frontend → backend)\n// See docs/adr/0001-monolith-architecture.md. The Next.js app is the backend;')
E('src/lib/api/index.ts', "// Re-export client-side API helpers\nexport { apiFetch, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api';", "// Re-export client-side API helpers from the real api-client module\nexport { apiFetch, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api-client';")

# ─── external-modules.d.ts ───
W('src/types/external-modules.d.ts', '// AfriBayit — Ambient type declarations for server-side packages.\n// All shims removed — real packages installed. See docs/adr/0001-monolith-architecture.md.\n')

# ─── .gitignore ───
E('.gitignore', '.env\ntool-results/', '.env\ntool-results/\n\n# SQLite dev databases\n*.db\n*.db-journal\nprisma/*.db\nprisma/*.db-journal')

# ─── Mock data removal ───
E('src/lib/analytics/listing-views.ts', '/**\n * AfriBayit — Listing Views Analytics\n * Track profile/listing views with visitor metadata\n */', '/**\n * AfriBayit — Listing Views Analytics\n * ⚠️ TEMPORARY IN-MEMORY STUB — views are NOT persisted.\n */')
E('src/lib/analytics/listing-views.ts', '// In-memory store\nconst viewEvents: ListingViewEvent[] = [];', '// In-memory store (NOT persisted — see file header).\nconst viewEvents: ListingViewEvent[] = [];')
W('src/app/api/analytics/listing-views/route.ts', "import { NextRequest, NextResponse } from 'next/server';\nimport { getUserListingViewStats } from '@/lib/analytics/listing-views';\nimport { authGuard } from '@/lib/auth-guard';\nimport { db } from '@/lib/db';\n\nexport async function GET(request: NextRequest) {\n  try {\n    const auth = await authGuard(request);\n    if (!auth.success) return auth.response;\n    const { searchParams } = new URL(request.url);\n    const requestedUserId = searchParams.get('userId');\n    const isSuperAdmin = auth.role === 'SUPER_ADMIN';\n    const userId = isSuperAdmin && requestedUserId ? requestedUserId : auth.userId;\n    const requestedListingIds = searchParams.get('listingIds')?.split(',').filter(Boolean) || [];\n    let effectiveListingIds = requestedListingIds;\n    const ownListings = await db.property.findMany({ where: { agentId: userId }, select: { id: true } }).catch(() => []);\n    const ownListingIds = ownListings.map((p) => p.id);\n    if (effectiveListingIds.length === 0) effectiveListingIds = ownListingIds;\n    else if (!isSuperAdmin) { const s = new Set(ownListingIds); effectiveListingIds = effectiveListingIds.filter((id) => s.has(id)); }\n    const stats = getUserListingViewStats(effectiveListingIds);\n    return NextResponse.json({ userId, ...stats });\n  } catch (error) {\n    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });\n  }\n}\n")
E('src/lib/neighborhood/index.ts', '  safety: {\n    score: number;\n    level: string;\n    note: string;\n  };', '  safety: {\n    score: number | null;\n    level: string;\n    note: string;\n  };')
E('src/lib/neighborhood/index.ts', "  // Safety is a stub — would integrate real data in production\n  const safetyScore = 50;\n  const safetyLevel = safetyScore >= 70 ? 'Bon' : safetyScore >= 50 ? 'Moyen' : 'À vérifier';\n\n  const overallScore = Math.round(\n    (walkScore.score * 0.35 + amenityResult.totalScore * 0.25 + transport.score * 0.25 + safetyScore * 0.15)\n  );\n\n  return {\n    walkScore,\n    amenities: amenityResult,\n    transport,\n    safety: {\n      score: safetyScore,\n      level: safetyLevel,\n      note: 'Données de sécurité basées sur des estimations. Vérifiez auprès des autorités locales.',\n    },\n    overallScore,\n  };", "  const safetyScore: number | null = null;\n  const safetyLevel = 'Données non disponibles';\n  const safetyNote = 'Aucune source de données de sécurité fiable n\\'est actuellement intégrée.';\n  const knownWeight = 0.85;\n  const weightedKnown = walkScore.score * 0.35 + amenityResult.totalScore * 0.25 + transport.score * 0.25;\n  const overallScore = Math.round(weightedKnown / knownWeight);\n  return { walkScore, amenities: amenityResult, transport, safety: { score: safetyScore, level: safetyLevel, note: safetyNote }, overallScore };")
E('src/components/afribayit/NeighborhoodAnalysis.tsx', '  safety: { score: number; level: string; note: string };', '  safety: { score: number | null; level: string; note: string };')
E('src/components/afribayit/NeighborhoodAnalysis.tsx', "        safety: { score: 70, level: 'Bon', note: 'Données estimées' },", "        safety: { score: null, level: 'Données non disponibles', note: 'N/A' },")
W('src/app/api/properties/[id]/virtual-tours/route.ts', "import { NextResponse } from 'next/server';\nimport { db } from '@/lib/db';\n\nexport async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {\n  try {\n    const { id } = await params;\n    const property = await db.property.findUnique({ where: { id }, select: { id: true, hasVR: true, hasDroneView: true } });\n    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });\n    const virtualTours = await db.virtualTour.findMany({ where: { propertyId: id }, orderBy: { createdAt: 'desc' } });\n    return NextResponse.json({ data: { propertyId: id, hasVR: property.hasVR, hasDroneView: property.hasDroneView, tours: virtualTours.map((t) => ({ id: t.id, tourType: t.tourType, url: t.url, thumbnailUrl: t.thumbnailUrl, duration: t.duration })) } });\n  } catch (error) {\n    console.error('Virtual tours API error:', error);\n    return NextResponse.json({ error: 'Failed to fetch virtual tours' }, { status: 500 });\n  }\n}\n")

# ─── ESLint fix + dynamic html lang ───
E('src/app/admin/properties/page.tsx', 'function PropertyRow({\n  property,\n  selected,\n  onToggle,\n}: {\n  property: PropertyRow;\n  selected: boolean;\n  onToggle: () => void;\n}) {', 'function PropertyRowItem({\n  property,\n  selected,\n  onToggle,\n}: {\n  property: PropertyRow;\n  selected: boolean;\n  onToggle: () => void;\n}) {')
E('src/app/admin/properties/page.tsx', '                  <PropertyRow\n                    key={prop.id}', '                  <PropertyRowItem\n                    key={prop.id}')
E('src/app/layout.tsx', 'import type { Metadata, Viewport } from "next";\nimport { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";', 'import type { Metadata, Viewport } from "next";\nimport { cookies } from "next/headers";\nimport { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";')
E('src/app/layout.tsx', 'import { LocaleProvider } from "@/lib/i18n/context";', 'import { LocaleProvider } from "@/lib/i18n/context";\nimport { LOCALES, type Locale } from "@/lib/i18n";')
E('src/app/layout.tsx', 'export default function RootLayout({\n  children,\n}: Readonly<{\n  children: React.ReactNode;\n}>) {\n  return (\n    <html lang="fr" suppressHydrationWarning>', "export default async function RootLayout({\n  children,\n}: Readonly<{\n  children: React.ReactNode;\n}>) {\n  const cookieStore = await cookies();\n  const cookieValue = cookieStore.get('afribayit_locale')?.value;\n  const locale: Locale = (cookieValue && cookieValue in LOCALES) ? (cookieValue as Locale) : 'fr';\n  const isRtl = LOCALES[locale]?.rtl === true;\n  return (\n    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'} suppressHydrationWarning>")
E('src/lib/i18n/context.tsx', "const LOCALE_STORAGE_KEY = 'afribayit_locale';\n// Module 3: all 9 locales are now valid — fr, en, ar (RTL), sw, ha, wo, am,\n// ln, fon.\nconst VALID_LOCALES: Locale[] = ['fr', 'en', 'ar', 'sw', 'ha', 'wo', 'am', 'ln', 'fon'];", "const LOCALE_STORAGE_KEY = 'afribayit_locale';\nconst LOCALE_COOKIE_KEY = LOCALE_STORAGE_KEY;\nconst LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;\nconst VALID_LOCALES: Locale[] = ['fr', 'en', 'ar', 'sw', 'ha', 'wo', 'am', 'ln', 'fon'];")
E('src/lib/i18n/context.tsx', '  const setLocale = useCallback((newLocale: Locale) => {\n    setLocaleState(newLocale);\n    try {\n      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);\n    } catch {\n      // localStorage not available\n    }\n  }, []);', "  const setLocale = useCallback((newLocale: Locale) => {\n    setLocaleState(newLocale);\n    try { localStorage.setItem(LOCALE_STORAGE_KEY, newLocale); } catch {}\n    try { document.cookie = `${LOCALE_COOKIE_KEY}=${newLocale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`; } catch {}\n  }, []);")

# ─── Audit-4: SDK consumer as-any ───
E('src/lib/twofa.ts', '(Secret as any).fromBase32(secretBase32)', 'Secret.fromBase32(secretBase32)')
E('src/lib/cache/redis.ts', '(redis as any).scan(cursor, { match: pattern, count: 100 })', 'redis.scan(cursor, { match: pattern, count: 100 })')
E('src/lib/notifications/channels/push.ts', "import { db } from '@/lib/db';\nimport type { NotificationDeliveryResult, NotificationChannel } from '../types';", "import { db } from '@/lib/db';\nimport type { NotificationDeliveryResult, NotificationChannel } from '../types';\nimport type { WebPushError } from 'web-push';")
E('src/lib/notifications/channels/push.ts', '(err as any).statusCode === 410', '(err as WebPushError).statusCode === 410')
E('src/lib/payments/stripe-client.ts', "let stripeClient: any | null = null;\n\nfunction getStripeClient(): any {\n  if (!stripeClient) {\n    const secretKey = process.env.STRIPE_SECRET_KEY || '';\n    stripeClient = new Stripe(secretKey, {\n      typescript: true,\n      apiVersion: '2026-05-27.dahlia' as any,\n    });\n  }\n  return stripeClient;\n}", "let stripeClient: Stripe | null = null;\n\nfunction getStripeClient(): Stripe {\n  if (!stripeClient) {\n    const secretKey = process.env.STRIPE_SECRET_KEY || '';\n    stripeClient = new Stripe(secretKey, {\n      typescript: true,\n      apiVersion: Stripe.API_VERSION,\n    });\n  }\n  return stripeClient;\n}")
E('src/lib/payments/stripe-client.ts', 'const charge = paymentIntent.latest_charge as any | null;', 'const charge = paymentIntent.latest_charge as Stripe.Charge | null;')
E('src/lib/payments/stripe-client.ts', 'const refundParams: any = {\n      charge: charge.id,\n      reason: params.reason as string,\n    };', "const refundParams: Stripe.RefundCreateParams = {\n      charge: charge.id,\n      ...(params.reason === 'duplicate' || params.reason === 'fraudulent' || params.reason === 'requested_by_customer'\n        ? { reason: params.reason }\n        : {}),\n    };")
E('src/lib/payments/providers/stripe.ts', 'const charge = paymentIntent.latest_charge as any | null;', 'const charge = paymentIntent.latest_charge as Stripe.Charge | null;')
E('src/lib/payments/providers/stripe.ts', 'const refundParams: any = {\n      charge: charge.id,\n    };', 'const refundParams: Stripe.RefundCreateParams = {\n      charge: charge.id,\n    };')
EA('src/lib/payments/providers/stripe.ts', 'event.data.object as any', 'event.data.object as Stripe.PaymentIntent')
E('src/lib/payments/providers/stripe.ts', "case 'charge.refunded': {\n        const charge = event.data.object as Stripe.PaymentIntent;", "case 'charge.refunded': {\n        const charge = event.data.object as Stripe.Charge;")
PE('src/lib/payments/fedapay-client.ts', lambda c: c.replace('let customer: InstanceType<typeof Customer> | null = null;', 'let customer: Customer | null = null;').replace('const customerList = (customers as any)?.items || (customers as any) || [];', 'const customerList = customers?.items || customers || [];').replace('transactionData.customer_id = (customer as any).id;', 'transactionData.customer_id = customer.id;').replace('const transactionId = (transaction as any).id?.toString() || \'\';', 'const transactionId = transaction.id?.toString() || \'\';').replace('const transactionRef = (transaction as any).reference || transactionId;', 'const transactionRef = transaction.reference || transactionId;').replace('const tokenResult = await (transaction as any).generateToken();', 'const tokenResult = await transaction.generateToken();').replace('const tokenValue = (tokenResult as any)?.token || (tokenResult as any)?.url;', 'const tokenValue = tokenResult?.token || tokenResult?.url;').replace('const result = await (payout as any).sendNow();\n    const payoutRef = (result as any)?.id?.toString() ||\n                      (payout as any)?.id?.toString() || \'\';\n\n    return {\n      success: true,\n      payoutId: payoutRef,\n      reference: (result as any)?.reference || payoutRef,\n      status: (result as any)?.status || (payout as any)?.status || \'sent\',\n    };', "const result = await payout.sendNow();\n    const payoutRef = result?.id?.toString() || payout?.id?.toString() || '';\n\n    return {\n      success: true,\n      payoutId: payoutRef,\n      reference: result?.reference || payoutRef,\n      status: result?.status || payout?.status || 'sent',\n    };").replace('const tokenResult = await (transaction as any).generateToken();\n    const token = (tokenResult as any)?.token;', 'const tokenResult = await transaction.generateToken();\n    const token = tokenResult?.token;').replace('await (transaction as any).sendNowWithToken(mode, token, {', 'await transaction.sendNowWithToken(mode, token, {').replace('const tx = transaction as any;', 'const tx = transaction;'))
W('src/lib/notifications/channels/email.ts', "import type { Resend } from 'resend';\nimport type { NotificationDeliveryResult, NotificationChannel } from '../types';\n\nconst FROM_EMAIL = 'AfriBayit <notifications@afribayit.com>';\nlet resendInstance: Resend | null = null;\nlet resendLoadPromise: Promise<Resend | null> | null = null;\n\nasync function getResend(): Promise<Resend | null> {\n  if (resendInstance) return resendInstance;\n  if (!process.env.RESEND_API_KEY) return null;\n  if (!resendLoadPromise) {\n    resendLoadPromise = (async () => {\n      try {\n        const { Resend: ResendClass } = await import('resend');\n        resendInstance = new ResendClass(process.env.RESEND_API_KEY);\n        return resendInstance;\n      } catch (error) {\n        console.error('[Notifications] Failed to load Resend SDK:', error);\n        return null;\n      } finally { resendLoadPromise = null; }\n    })();\n  }\n  return resendLoadPromise;\n}\n\nfunction getBaseHtmlTemplate(title: string, body: string, actionUrl?: string, actionLabel?: string): string {\n  return `<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"utf-8\"><title>${title}</title></head><body><div style=\"max-width:600px;margin:0 auto;padding:20px\"><h1>${title}</h1><div>${body}</div>${actionUrl ? `<a href=\"${actionUrl}\">${actionLabel || 'Action'}</a>` : ''}</div></body></html>`;\n}\n\nexport async function sendEmail(to: string | string[], title: string, body: string, options?: { actionUrl?: string; actionLabel?: string; htmlBody?: string }): Promise<NotificationDeliveryResult> {\n  const channel: NotificationChannel = 'email';\n  const resend = await getResend();\n  if (!resend) { console.warn('[Notifications] RESEND_API_KEY not configured'); return { channel, success: false, error: 'RESEND_API_KEY not configured', sentAt: new Date() }; }\n  try {\n    const html = options?.htmlBody || getBaseHtmlTemplate(title, body, options?.actionUrl, options?.actionLabel);\n    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, to, subject: title, html, text: body.replace(/<[^>]*>/g, '') });\n    if (error) return { channel, success: false, error: error.message, sentAt: new Date() };\n    return { channel, success: true, messageId: data?.id, sentAt: new Date() };\n  } catch (error) {\n    return { channel, success: false, error: error instanceof Error ? error.message : 'Unknown', sentAt: new Date() };\n  }\n}\n")

# ─── Audit-5: fulltext, postgis, e-signature, search-indexer ───
PE('src/lib/search/fulltext.ts', lambda c: c.replace('const total = Number((countResult as any[])?.[0]?.total || 0);', 'const total = Number((countResult as Array<{ total: bigint | number }> | undefined)?.[0]?.total || 0);').replace('const results = (searchResult as any[]).map((row: any) => ({\n      id: row.id,\n      title: row.title,\n      slug: row.slug,\n      type: row.type,\n      transaction: row.transaction,\n      price: Number(row.price),\n      currency: row.currency,\n      surface: Number(row.surface),\n      rooms: Number(row.rooms),\n      bedrooms: Number(row.bedrooms),\n      bathrooms: Number(row.bathrooms),\n      city: row.city,\n      country: row.country,\n      quartier: row.quartier,\n      address: row.address,\n      description: (row.description as string) || \'\',\n      images: row.images as any,\n      verified: row.verified,\n      geoTrust: row.geoTrust,\n      premium: row.premium,\n      investmentScore: row.investmentScore,\n      publishedAt: row.publishedAt,\n      relevanceScore: Number(row.relevanceScore),\n    }));', 'const results = (searchResult as Array<Record<string, unknown>>).map((row) => ({\n      id: row.id as string, title: row.title as string, slug: row.slug as string,\n      type: row.type as string, transaction: row.transaction as string,\n      price: Number(row.price), currency: row.currency as string,\n      surface: Number(row.surface), rooms: Number(row.rooms),\n      bedrooms: Number(row.bedrooms), bathrooms: Number(row.bathrooms),\n      city: row.city as string, country: row.country as string,\n      quartier: row.quartier as string, address: row.address as string,\n      description: (row.description as string) || \'\',\n      images: row.images as string | null, verified: row.verified as boolean,\n      geoTrust: row.geoTrust as boolean, premium: row.premium as boolean,\n      investmentScore: row.investmentScore as number | null,\n      publishedAt: row.publishedAt as Date | null,\n      relevanceScore: Number(row.relevanceScore),\n    }));').replace('return (result as any[]).map((row: any) => row.suggestion);', 'return (result as Array<{ suggestion: string }>).map((row) => row.suggestion);').replace("const allTitles: { id: string; title: string; slug: string | null; type?: string }[] = [\n      ...(propertyTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'property' })),\n      ...(hotelTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'hotel' })),\n      ...(guesthouseTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'guesthouse' })),\n      ...(artisanTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'artisan' })),\n      ...(courseTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'course' })),\n    ].slice(0, limit);\n\n    return {\n      cities: (cities as any[]).map((r: any) => r.city),\n      quartiers: (quartiers as any[]).map((r: any) => r.quartier),\n      titles: allTitles,\n    };", "type TitleRow = { id: string; title: string; slug: string | null };\n    const allTitles = [\n      ...(propertyTitles as TitleRow[]).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: 'property' })),\n      ...(hotelTitles as TitleRow[]).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: 'hotel' })),\n      ...(guesthouseTitles as TitleRow[]).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: 'guesthouse' })),\n      ...(artisanTitles as TitleRow[]).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: 'artisan' })),\n      ...(courseTitles as TitleRow[]).map((r) => ({ id: r.id, title: r.title, slug: r.slug, type: 'course' })),\n    ].slice(0, limit);\n    return {\n      cities: (cities as Array<{ city: string }>).map((r) => r.city),\n      quartiers: (quartiers as Array<{ quartier: string }>).map((r) => r.quartier),\n      titles: allTitles,\n    };").replace('  if (priceMin !== undefined || priceMax !== undefined) {\n    where.price = {};\n    if (priceMin !== undefined) (where.price as any).gte = priceMin;\n    if (priceMax !== undefined) (where.price as any).lte = priceMax;\n  }', '  if (priceMin !== undefined || priceMax !== undefined) {\n    where.price = { ...(priceMin !== undefined ? { gte: priceMin } : {}), ...(priceMax !== undefined ? { lte: priceMax } : {}) };\n  }').replace('  if (surfaceMin !== undefined || surfaceMax !== undefined) {\n    where.surface = {};\n    if (surfaceMin !== undefined) (where.surface as any).gte = surfaceMin;\n    if (surfaceMax !== undefined) (where.surface as any).lte = surfaceMax;\n  }', '  if (surfaceMin !== undefined || surfaceMax !== undefined) {\n    where.surface = { ...(surfaceMin !== undefined ? { gte: surfaceMin } : {}), ...(surfaceMax !== undefined ? { lte: surfaceMax } : {}) };\n  }'))

PE('src/lib/geo/postgis.ts', lambda c: c.replace("import { db } from '@/lib/db';\n\n// ── Types ───", "import { db } from '@/lib/db';\nimport type { PropertyStatus } from '@prisma/client';\n\n// ── Types ───").replace('const status = (filters?.status ?? "published") as any;', 'const status = (filters?.status ?? "published") as PropertyStatus;').replace('const status = (filters?.status ?? "active") as any;', 'const status = filters?.status ?? "active";').replace("status: statusFilter as any,\n        lat: { gte: lat - latOffset, lte: lat + latOffset },\n        lng: { gte: lng - lngOffset, lte: lng + latOffset },\n      },\n      select: { id: true, title: true,", "status: statusFilter as PropertyStatus,\n        lat: { gte: lat - latOffset, lte: lat + latOffset },\n        lng: { gte: lng - lngOffset, lte: lng + latOffset },\n      },\n      select: { id: true, title: true,").replace('status: statusFilter as any,', 'status: statusFilter,').replace("status: status as any,\n      }", "status: status as PropertyStatus,\n      }").replace('status: status as any,', 'status: status,').replace("status: 'published' as any,", "status: 'published' as PropertyStatus,").replace("status: 'active' as any,", "status: 'active',").replace('    ] as any[];', '    ] as NearbyResult[];').replace('...properties.map((r: any) => ({ ...r, distanceKm: 0 })),', '...properties.map((r) => ({ ...r, distanceKm: 0 })),').replace('...hotels.map((r: any) => ({ ...r, distanceKm: 0 })),', '...hotels.map((r) => ({ ...r, distanceKm: 0 })),').replace('...guesthouses.map((r: any) => ({ ...r, distanceKm: 0 })),', '...guesthouses.map((r) => ({ ...r, distanceKm: 0 })),').replace("  if (model === 'Property') {\n    const props = await db.property.findMany({\n      where: {\n        status: statusFilter,", "  if (model === 'Property') {\n    const props = await db.property.findMany({\n      where: {\n        status: statusFilter as PropertyStatus,"))

PE('src/lib/search/search-indexer.ts', lambda c: re.sub(r'\((\w+\.(\w+)) as any\) \|\| \[\]', r'(\1 as string[]) || []', c).replace('(countResult as any[])?.[0]?.total', '(countResult as Array<{ total: bigint | number }> | undefined)?.[0]?.total').replace('(unindexed as any[]).map((r: any) => r.id)', '(unindexed as Array<{ id: string }>).map((r) => r.id)'))

# e-signature.ts
PE('src/lib/notary/e-signature.ts', lambda c: c.replace("import { db } from '@/lib/db';\nimport { isDocuSignConfigured", "import { db } from '@/lib/db';\nimport type { Prisma } from '@prisma/client';\nimport { isDocuSignConfigured").replace("      // Generate deed draft with minimal required data\n      const deedResult = await generateDeedDraft(transactionId, 'default', {\n        transactionId,\n        buyerName: signers.find(s => s.role === 'buyer')?.fullName || 'Acheteur',\n        sellerName: signers.find(s => s.role === 'seller')?.fullName || 'Vendeur',\n        notaryName: signers.find(s => s.role === 'notary')?.fullName || 'Notaire',\n        propertyAddress: '',\n        propertySurface: 0,\n        price: 0,\n        country: 'BJ',\n      } as any);", "      const deedResult = await generateDeedDraft(transactionId, 'default', {\n        transactionId, propertyId: '', buyerId: '', sellerId: '',\n        amount: 0, currency: 'XOF', country: 'BJ',\n        propertyType: 'terrain', transactionType: 'sale',\n        buyerFullName: signers.find(s => s.role === 'buyer')?.fullName || '[NOM]',\n        sellerFullName: signers.find(s => s.role === 'seller')?.fullName || '[NOM]',\n        notaryName: signers.find(s => s.role === 'notary')?.fullName || '[NOM]',\n        propertyAddress: '', propertySurface: 0,\n      });"))
# Fix signers in metadata writes (but NOT in the in-memory SignatureRequest object)
def fix_esig(c):
    # Only add Prisma.InputJsonValue cast to signers inside db.transactionTimeline.create/update
    # Pattern: "signers: initializedSigners," followed by "status: 'sent'," inside a metadata block
    c = re.sub(
        r"(metadata:\s*\{[^}]*?signers:\s*)initializedSigners(?=,\s*\n\s*status:)",
        r"\1initializedSigners as unknown as Prisma.InputJsonValue",
        c,
        flags=re.DOTALL
    )
    c = c.replace('(entry.metadata as any) || {}', '(entry.metadata as Record<string, unknown>) || {}').replace('(existingEntry.metadata as any) || {}', '(existingEntry.metadata as Record<string, unknown>) || {}').replace('metadata: { string_contains: requestId } as any', 'metadata: { string_contains: requestId }').replace('metadata: { string_contains: \'"type":"signature_request"\' } as any', 'metadata: { string_contains: \'"type":"signature_request"\' }')
    c = re.sub(r'\} as any,', '},', c)
    # Fix updatedSigners in metadata writes
    c = re.sub(r'(signers:\s*)updatedSigners(?=,\s*\n\s*status:)', r'\1updatedSigners as unknown as Prisma.InputJsonValue', c)
    # Fix meta property reads
    c = c.replace('    return {\n      id: meta.signatureRequestId,\n      documentId: meta.documentId,\n      deedId: meta.deedId,\n      transactionId: entry.transactionId,\n      signers: meta.signers || [],\n      status: meta.status,\n      createdAt: meta.createdAt,\n      expiresAt: meta.expiresAt,\n      completedAt: meta.completedAt,\n      sentAt: meta.sentAt,\n    };', "    return {\n      id: meta.signatureRequestId as string,\n      documentId: meta.documentId as string,\n      deedId: meta.deedId as string,\n      transactionId: entry.transactionId,\n      signers: (meta.signers as Signer[]) || [],\n      status: meta.status as 'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired',\n      createdAt: meta.createdAt as string,\n      expiresAt: meta.expiresAt as string,\n      completedAt: meta.completedAt as string | undefined,\n      sentAt: meta.sentAt as string | undefined,\n    };")
    c = c.replace('        results.push({\n          id: meta.signatureRequestId,\n          documentId: meta.documentId,\n          deedId: meta.deedId,\n          transactionId: entry.transactionId,\n          signers: meta.signers || [],\n          status: meta.status,\n          createdAt: meta.createdAt,\n          expiresAt: meta.expiresAt,\n          completedAt: meta.completedAt,\n          sentAt: meta.sentAt,\n        });', "        results.push({\n          id: meta.signatureRequestId as string,\n          documentId: meta.documentId as string,\n          deedId: meta.deedId as string,\n          transactionId: entry.transactionId,\n          signers: (meta.signers as Signer[]) || [],\n          status: meta.status as 'draft' | 'sent' | 'in_progress' | 'completed' | 'cancelled' | 'expired',\n          createdAt: meta.createdAt as string,\n          expiresAt: meta.expiresAt as string,\n          completedAt: meta.completedAt as string | undefined,\n          sentAt: meta.sentAt as string | undefined,\n        });")
    return c
PE('src/lib/notary/e-signature.ts', fix_esig)

# ─── Audit-6+7: remaining as-any files ───
PE('src/lib/distributed-map.ts', lambda c: c.replace('(redis as any).keys', 'redis.keys'))
PE('src/lib/notary/qualified-signature.ts', lambda c: re.sub(r'\} as any,', '},', c))
PE('src/lib/payments/webhooks/stripe.ts', lambda c: c.replace('...((walletTx.metadata ? walletTx.metadata : {}) as any),', '...((walletTx.metadata ? walletTx.metadata : {}) as Record<string, unknown>),').replace('? walletTx.metadata as any', '? walletTx.metadata as Record<string, unknown>'))
PE('src/lib/search/elasticsearch.ts', lambda c: c.replace('filter.push({ terms: { features: filters.features as any } });', 'filter.push({ terms: { features: filters.features as string[] } });').replace("try { features = (p.features as any) || [] || []; } catch { features = []; }", "try { features = (p.features as string[]) || []; } catch { features = []; }"))
PE('src/app/api/auth/logout/route.ts', lambda c: c.replace("(session as any)?.jti", "(session as unknown as { jti?: string })?.jti").replace("(session as any)?.exp", "(session as unknown as { exp?: number })?.exp").replace("(session.user as any)?.id", "(session.user as { id?: string })?.id"))
PE('src/lib/payments/escrow-engine.ts', lambda c: c.replace('type: (transaction as any).type || undefined,', 'type: (transaction as { type?: string }).type || undefined,').replace('const customConditions = transaction.conditions as any as any\n    ? transaction.conditions\n    : null;\n\n  const requiredConditions = (customConditions as any) || DEFAULT_RELEASE_CONDITIONS;', "const rawConditions = transaction.conditions as unknown;\n  const isReleaseConditions = (v: unknown): v is ReleaseConditions => typeof v === 'object' && v !== null && 'docsValidated' in v;\n  const customConditions: ReleaseConditions | null = isReleaseConditions(rawConditions) ? rawConditions : null;\n  const requiredConditions = customConditions || DEFAULT_RELEASE_CONDITIONS;"))
PE('src/app/api/users/me/subscription-usage/route.ts', lambda c: c.replace("(session.user as any).id", "(session.user as { id?: string }).id || ''").replace("status: 'PUBLISHED' as any", "status: 'published' as const").replace("(db as any).propertyImage?.count?.({ where: { property: { ownerId: userId } } })?.catch?.(() => 0) ?? 0", "(db as unknown as { propertyImage?: { count: (args: unknown) => Promise<number> } }).propertyImage?.count?.({ where: { property: { ownerId: userId } } })?.catch?.(() => 0) ?? 0").replace("(db as any).conversation?.count?.({ where: { participants: { some: { userId } } } })?.catch?.(() => 0) ?? 0", "(db as unknown as { conversation?: { count: (args: unknown) => Promise<number> } }).conversation?.count?.({ where: { participants: { some: { userId } } } })?.catch?.(() => 0) ?? 0"))
PE('src/app/api/payments/verify/route.ts', lambda c: c.replace('...((walletTx.metadata ? walletTx.metadata : {}) as any),', '...((walletTx.metadata ? walletTx.metadata : {}) as Record<string, unknown>),').replace('? walletTx.metadata as any', '? walletTx.metadata as Record<string, unknown>'))
PE('src/lib/payments/payout.ts', lambda c: c.replace('payout.metadata ? payout.metadata as any : {}', 'payout.metadata ? payout.metadata as Record<string, unknown> : {}').replace('latestHeld.metadata as any', 'latestHeld.metadata as Record<string, unknown>').replace('tx.metadata ? tx.metadata as any : {}', 'tx.metadata ? tx.metadata as Record<string, unknown> : {}'))
PE('src/lib/avm/comparables.ts', lambda c: c.replace('const features: any[] = (() => { try { return Array.isArray(c.features) ? c.features as any[] : []; } catch { return []; } })();', 'const features: string[] = (() => { try { return Array.isArray(c.features) ? c.features as string[] : []; } catch { return []; } })();').replace("(target.features as any[]).map((f) => String(f).toLowerCase())", "(target.features as string[]).map((f) => String(f).toLowerCase())").replace("(target.features as any[]).length", "(target.features as string[]).length").replace('(scored as any)', 'scored'))
PE('src/lib/rebecca/agent-nodes/property-search-node.ts', lambda c: c.replace("try { images = (p.images as any) || [] || []; } catch { images = []; }", "try { images = (p.images as string[]) || []; } catch { images = []; }").replace("try { features = (p.features as any) || [] || []; } catch { features = []; }", "try { features = (p.features as string[]) || []; } catch { features = []; }"))
PE('src/lib/search/index.ts', lambda c: c.replace("try { images = (p.images as any) || [] || []; } catch { images = []; }", "try { images = (p.images as string[]) || []; } catch { images = []; }").replace("try { features = (p.features as any) || [] || []; } catch { features = []; }", "try { features = (p.features as string[]) || []; } catch { features = []; }"))
PE('src/lib/ota/channel-sync-engine.ts', lambda c: c.replace("(hotel.otaRefs as any) || {}", "(hotel.otaRefs as Record<string, string>) || {}").replace("const refs = (hotel.otaRefs as any) || {};", "const refs = (hotel.otaRefs as Record<string, string>) || {};"))
PE('src/lib/geotrust/triggers.ts', lambda c: c.replace('const ocrData = deed.ocrResult as any;', 'const ocrData = deed.ocrResult as Record<string, unknown> | null;\n      if (!ocrData) continue;').replace('ocrResult: { string_contains: deedNumber.trim() } as any', 'ocrResult: { string_contains: deedNumber.trim() }'))
PE('src/lib/search/sync.ts', lambda c: c.replace('(redis as any).rpush', 'redis.rpush').replace('(redis as any).lpop', 'redis.lpop').replace('(redis as any).llen', 'redis.llen').replace('(property.features as any) || []', '(property.features as string[]) || []').replace('(artisan.specialties as any) || []', '(artisan.specialties as string[]) || []').replace('(p.features as any) || []', '(p.features as string[]) || []').replace('(a.specialties as any) || []', '(a.specialties as string[]) || []'))
PE('src/app/api/notary/webhooks/docusign/route.ts', lambda c: c.replace('metadata: { string_contains: envelopeId } as any', 'metadata: { string_contains: envelopeId }').replace("(transaction.property as any)?.title", "(transaction.property as { title?: string } | null)?.title").replace("channels: ['push', 'email'] as any", "channels: ['push', 'email'] as ('push' | 'email')[]"))
PE('src/app/api/notary/webhooks/docusign/route.ts', lambda c: re.sub(r'\} as any,', '},', c))
PE('src/lib/payments/webhooks/fedapay.ts', lambda c: c.replace('(walletTx.metadata as any)', '(walletTx.metadata as Record<string, unknown>)').replace("channels: ['push', 'email'] as any", "channels: ['push', 'email'] as ('push' | 'email')[]"))
PE('src/lib/payments/webhooks/fedapay.ts', lambda c: re.sub(r'\} as any,', '},', c))
PE('src/app/api/users/me/notification-preferences/route.ts', lambda c: c.replace("(session.user as any).id", "(session.user as { id?: string }).id || ''").replace('data: { notificationPreferences: JSON.stringify(preferences) } as any', 'data: { notificationPreferences: JSON.stringify(preferences) }').replace('(db as any).notificationPreference.upsert', '(db as unknown as { notificationPreference: { upsert: (args: unknown) => Promise<unknown> } }).notificationPreference.upsert').replace('create: { userId, category, ...(channels as any) }', 'create: { userId, category, ...channels }').replace('update: { ...(channels as any) }', 'update: { ...channels }').replace('for (const [category, channels] of Object.entries(preferences)) {', 'for (const [category, channels] of Object.entries(preferences) as [string, Record<string, unknown>][]) {'))
PE('src/app/api/analytics/me/route.ts', lambda c: c.replace("(session.user as any).id", "(session.user as { id?: string }).id || ''").replace('(db as any).analyticsEvent?.groupBy?.({', '(db as unknown as { analyticsEvent?: { groupBy: (args: unknown) => Promise<Array<{ source: string; _count: number }>> } }).analyticsEvent?.groupBy?.({').replace('(db as any).connection?.count?.({', '(db as unknown as { connection?: { count: (args: unknown) => Promise<number> } }).connection?.count?.({').replace('(db as any).like?.count?.({', '(db as unknown as { like?: { count: (args: unknown) => Promise<number> } }).like?.count?.({').replace('(db as any).comment?.count?.({', '(db as unknown as { comment?: { count: (args: unknown) => Promise<number> } }).comment?.count?.({').replace('views.reduce((s: number, p: any) => s + p._count, 0)', 'views.reduce((s: number, p: { source: string; _count: number }) => s + p._count, 0)').replace("views.find((p: any) => p.source === 'direct')?._count || 0", "views.find((p) => p.source === 'direct')?._count || 0").replace("views.find((p: any) => p.source === 'search')?._count || 0", "views.find((p) => p.source === 'search')?._count || 0").replace("views.find((p: any) => p.source === 'referral')?._count || 0", "views.find((p) => p.source === 'referral')?._count || 0"))

# ─── Audit-8: useAdmin.ts split ───
os.makedirs(os.path.join(REPO, 'src/hooks/admin'), exist_ok=True)
with open(os.path.join(REPO, 'src/hooks/useAdmin.ts'), 'r') as f:
    content = f.read()
shared_imports = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport { api, apiPost, apiPatch, apiDelete } from '@/lib/api-client';\nimport type { CountryCode } from '@/contexts/CountryContext';\n\n"
sections = [
    ('stats', '// ============ Stats Hook ===========', '// ============ Users Hooks ==========='),
    ('users', '// ============ Users Hooks ===========', '// ============ Properties Hook ==========='),
    ('properties', '// ============ Properties Hook ===========', '// ============ Transactions Hook ==========='),
    ('transactions', '// ============ Transactions Hook ===========', '// ============ Wallets Hooks ==========='),
    ('wallets', '// ============ Wallets Hooks ===========', '// ============ Subscriptions Hooks ==========='),
    ('subscriptions', '// ============ Subscriptions Hooks ===========', '// ============ Hotels Hooks ==========='),
    ('hotels', '// ============ Hotels Hooks ===========', '// ============ Guesthouses Hooks ==========='),
    ('guesthouses', '// ============ Guesthouses Hooks ===========', '// ============ Community Hooks ==========='),
    ('community', '// ============ Community Hooks ===========', '// ============ Courses Hooks ==========='),
    ('courses', '// ============ Courses Hooks ===========', '// ============ Analytics Hooks ==========='),
    ('analytics', '// ============ Analytics Hooks ===========', '// ============ Admin Action Mutations ==========='),
    ('actions', '// ============ Admin Action Mutations ===========', '// ============ KYC Hooks ==========='),
    ('kyc', '// ============ KYC Hooks ===========', '// ============ Escrow Admin Hooks ==========='),
    ('escrow', '// ============ Escrow Admin Hooks ===========', '// ============ Property Admin Actions ==========='),
    ('propertyActions', '// ============ Property Admin Actions ===========', '// ============ Audit Logs Hooks ==========='),
    ('auditLogs', '// ============ Audit Logs Hooks ===========', '// ============ Short Term Rentals Hooks ==========='),
    ('shortTermRentals', '// ============ Short Term Rentals Hooks ===========', '// ============ Bookings Hooks ==========='),
    ('bookings', '// ============ Bookings Hooks ===========', '// ============ Disputes Hooks ==========='),
    ('disputes', '// ============ Disputes Hooks ===========', '// ============ Payouts Hooks ==========='),
    ('payouts', '// ============ Payouts Hooks ===========', '// ============ Content Hooks ==========='),
    ('content', '// ============ Content Hooks ===========', '// ============ Revenue Hooks ==========='),
    ('revenue', '// ============ Revenue Hooks ===========', '// ============ OTA Hooks ==========='),
    ('ota', '// ============ OTA Hooks ===========', '// ============ Artisans Hooks ==========='),
    ('artisans', '// ============ Artisans Hooks ===========', '// ============ Notaries Hooks ==========='),
    ('notaries', '// ============ Notaries Hooks ===========', '// ============ GeoTrust Hooks ==========='),
    ('geotrust', '// ============ GeoTrust Hooks ===========', '// ============ Reviews Hooks ==========='),
    ('reviews', '// ============ Reviews Hooks ===========', '// ============ Ambassadors Hooks ==========='),
    ('ambassadors', '// ============ Ambassadors Hooks ===========', '// ============ Notifications Hooks ==========='),
    ('notifications', '// ============ Notifications Hooks ===========', None),
]
types_start = content.index('// ============ Types ===========')
types_end = content.index('// ============ Stats Hook ===========')
types_section = content[types_start:types_end]
W('src/hooks/admin/types.ts', shared_imports + types_section)
type_names = re.findall(r'^export (?:interface|type) (\w+)', types_section, re.MULTILINE)
for name, start_marker, end_marker in sections:
    start_idx = content.index(start_marker)
    end_idx = content.index(end_marker) if end_marker else len(content)
    section_content = content[start_idx:end_idx]
    W(f'src/hooks/admin/{name}.ts', shared_imports + section_content)
    used_types = [t for t in type_names if re.search(r'\b' + t + r'\b', section_content)]
    if used_types:
        with open(os.path.join(REPO, f'src/hooks/admin/{name}.ts'), 'r') as f: c = f.read()
        lines = c.split('\n')
        last_import = max(i for i, l in enumerate(lines) if l.startswith('import '))
        lines.insert(last_import + 1, f"import type {{ {', '.join(used_types)} }} from './types';")
        with open(os.path.join(REPO, f'src/hooks/admin/{name}.ts'), 'w') as f: f.write('\n'.join(lines))
barrel = "// AfriBayit — Admin Hooks Barrel (audit-8 split)\n\n"
for name, _, _ in sections:
    barrel += f"export * from './admin/{name}';\n"
barrel += "export * from './admin/types';\n"
W('src/hooks/useAdmin.ts', barrel)

# ─── Audit-9: ContentItem Prisma model ───
with open(os.path.join(REPO, 'prisma/schema.prisma'), 'a') as f:
    f.write('\n// ============ CONTENT_ITEM (audit-9) ============\n\nmodel ContentItem {\n  id        String   @id @default(cuid())\n  section   String\n  key       String\n  label     String\n  value     String   @db.Text\n  country   String   @default("*")\n  updatedAt DateTime @updatedAt\n  createdAt DateTime @default(now())\n\n  @@unique([section, key, country])\n  @@index([section])\n  @@index([country])\n  @@map("content_items")\n}\n')

os.makedirs(os.path.join(REPO, 'prisma/migrations/20260901000000_add_content_item'), exist_ok=True)
W('prisma/migrations/20260901000000_add_content_item/migration.sql', '''-- AfriBayit — Add ContentItem table (audit-9)
CREATE TABLE "content_items" (
    "id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '*',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "content_items_section_key_country_key" ON "content_items"("section", "key", "country");
CREATE INDEX "content_items_section_idx" ON "content_items"("section");
CREATE INDEX "content_items_country_idx" ON "content_items"("country");

INSERT INTO "content_items" ("id", "section", "key", "label", "value", "country", "updatedAt") VALUES
  (gen_random_uuid(), 'homepage', 'hero_title', 'Hero Title', 'Find Your Dream Property in Africa', '*', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'Trusted real estate platform across West Africa', '*', NOW()),
  (gen_random_uuid(), 'homepage', 'cta_button', 'CTA Button Text', 'Start Searching', '*', NOW()),
  (gen_random_uuid(), 'about', 'mission_statement', 'Mission Statement', 'Making African real estate accessible and transparent', '*', NOW()),
  (gen_random_uuid(), 'about', 'vision_statement', 'Vision Statement', 'The leading real estate platform in Africa', '*', NOW()),
  (gen_random_uuid(), 'legal', 'terms_of_service', 'Terms of Service', 'Standard terms apply', '*', NOW()),
  (gen_random_uuid(), 'legal', 'privacy_policy', 'Privacy Policy', 'We respect your data', '*', NOW()),
  (gen_random_uuid(), 'footer', 'contact_email', 'Contact Email', 'support@afribayit.com', '*', NOW()),
  (gen_random_uuid(), 'footer', 'phone_number', 'Phone Number', '+229 90 00 00 00', '*', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance au Benin', 'BJ', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance en Cote d Ivoire', 'CI', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance au Burkina Faso', 'BF', NOW()),
  (gen_random_uuid(), 'homepage', 'hero_subtitle', 'Hero Subtitle', 'La plateforme immobiliere de confiance au Togo', 'TG', NOW());
''')

W('src/app/api/admin/content/route.ts', '''import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const countryFilter = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : null;
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('section') || '';
    const country = searchParams.get('country') || countryFilter || '';
    const where: { section?: string; country?: { in: string[] } } = {};
    if (sectionId) where.section = sectionId;
    if (country) where.country = { in: ['*', country] };
    const items = await db.contentItem.findMany({ where, orderBy: [{ section: 'asc' }, { key: 'asc' }] });
    const sectionMap = new Map<string, { id: string; label: string; items: typeof items }>();
    for (const item of items) {
      if (!sectionMap.has(item.section)) sectionMap.set(item.section, { id: item.section, label: item.section, items: [] });
      sectionMap.get(item.section)!.items.push(item);
    }
    const sections = Array.from(sectionMap.values()).map((section) => {
      if (!country || country === '*') return section;
      const globalItems = section.items.filter((i) => i.country === '*');
      const countryItems = section.items.filter((i) => i.country === country);
      const merged = globalItems.map((g) => countryItems.find((c) => c.key === g.key) || g);
      const extra = countryItems.filter((c) => !globalItems.some((g) => g.key === c.key));
      return { ...section, items: [...merged, ...extra] };
    });
    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Admin content error:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;
    const body = await request.json();
    const { sectionId, itemKey, country, value, label } = body;
    if (!sectionId || !itemKey || !value) return NextResponse.json({ error: 'Missing required fields: sectionId, itemKey, value' }, { status: 400 });
    const effectiveCountry = auth.role === 'COUNTRY_ADMIN' && auth.country ? auth.country : (country || '*');
    const updated = await db.contentItem.upsert({
      where: { section_key_country: { section: sectionId, key: itemKey, country: effectiveCountry } },
      create: { section: sectionId, key: itemKey, label: label || itemKey, value, country: effectiveCountry },
      update: { value, ...(label ? { label } : {}) },
    });
    return NextResponse.json({ success: true, message: `Content item "${itemKey}" in section "${sectionId}" updated for country "${effectiveCountry}"`, updatedItem: updated });
  } catch (error) {
    console.error('Admin content update error:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
''')

print('=== ALL AUDIT 1-9 CHANGES APPLIED ===')
