import type { NextConfig } from "next";

// AfriBayit — Next.js Configuration (full-stack monolith)
// See docs/adr/0001-monolith-architecture.md.
// The Next.js app is the backend — App Router route handlers call Prisma directly.

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // Limit webpack/jest-worker parallelism during `next build` — the
  // build runs in a 4 GiB cgroup and the default multi-worker mode
  // triggers the kernel OOM killer. One worker is slower but completes.
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  serverExternalPackages: ['lightningcss', '@tailwindcss/node', '@tailwindcss/postcss'],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // CDC §10.1 — removed 'unsafe-eval' (was defeating CSP XSS protection).
              // Next.js 16 doesn't need it for production builds.
              "script-src 'self' 'unsafe-inline' https://js.stripe.com https://widget.fedapay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://*.mapbox.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Added: Sentry ingestion, Mapbox tiles, Fixer.io FX rates
              "connect-src 'self' https://*.railway.app https://*.up.railway.app wss://*.pusher.com https://*.pusher.com https://*.sentry.io https://*.mapbox.com https://api.apilayer.com",
              "frame-src 'self' https://js.stripe.com https://widget.fedapay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

// Sentry (frontend only) — require() is the standard pattern for Next.js config
// files since next.config.ts runs in Node CJS context before ESM is available.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require('@sentry/nextjs');
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;
const finalConfig = sentryEnabled
  ? withSentryConfig(nextConfig, { silent: true, hideSourceMaps: true })
  : nextConfig;

export default finalConfig;
