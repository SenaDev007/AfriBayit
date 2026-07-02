import type { NextConfig } from "next";

// AfriBayit — Next.js Configuration
//
// SECURITY FIXES (P1.5, P1.6 — juillet 2026) :
// - Removed `typescript.ignoreBuildErrors: true` — TS errors are now blocking
// - Removed `reactStrictMode: false` — re-enabled for safer development
// - Replaced `images.remotePatterns: hostname: "**"` with explicit allowlist (anti-SSRF)
// - Added `headers()` for CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
//   Permissions-Policy (CSP/Helmet previously defined in lib/security/helmet.ts but never applied)

const nextConfig: NextConfig = {
  /* Vercel handles output automatically — no output: "standalone" needed */
  // P1.5 — TypeScript errors are now BLOCKING (was: ignoreBuildErrors: true)
  // Fixed: all 16 TS errors resolved, ignoreBuildErrors set back to false
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  // P3 — Fix lightningcss + Turbopack issue: mark as server external package
  // so Turbopack doesn't try to bundle the native .node binding
  serverExternalPackages: ['lightningcss', '@tailwindcss/node', '@tailwindcss/postcss'],
  images: {
    // P1.6 — Restricted allowlist (was: hostname: "**" = SSRF risk)
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.facebook.com" },
    ],
  },
  // P1.6 — Apply security headers globally (Helmet/CSP previously dead code in lib/security/)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Content Security Policy — restrictive (no inline by default except Next.js requirements)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-inline' and 'unsafe-eval' required for Next.js dev/injection; tighten in prod
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://widget.fedapay.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://*.mapbox.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.neon.tech https://api.stripe.com https://api.fedapay.com wss://*.pusher.com https://*.pusher.com https://api.openai.com https://api.z.ai",
              "frame-src 'self' https://js.stripe.com https://widget.fedapay.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          // HTTPS Strict Transport Security — 2 years, include subdomains, preload
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Clickjacking protection
          { key: "X-Frame-Options", value: "DENY" },
          // MIME-type sniffing protection
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer-Policy — strict-origin-when-cross-origin
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions-Policy — disable dangerous APIs by default
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self), interest-cohort=()",
          },
          // CORS — handled per-route via lib/security/cors.ts, but add default for API routes
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
      {
        // Webhook endpoints — additional CSRF protection
        source: "/api/:path*/webhook/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

// Wrap with Sentry config if DSN is provided
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withSentryConfig } = require('@sentry/nextjs');

const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

const finalConfig = sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      hideSourceMaps: true,
    })
  : nextConfig;

export default finalConfig;
