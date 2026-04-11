import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/rateLimit";

const PROTECTED_PATHS = ["/dashboard", "/properties/new", "/artisans/register", "/kyc", "/admin"];
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

// Subdomain → country mapping (multitenancy §5 CDC)
// bj.afribayit.com → BJ, ci.afribayit.com → CI, etc.
const SUBDOMAIN_COUNTRIES: Record<string, string> = {
  bj: "BJ",
  ci: "CI",
  bf: "BF",
  tg: "TG",
};

function detectCountryFromSubdomain(req: Request): string | null {
  const host = req.headers.get("host") ?? "";
  const subdomain = host.split(".")[0].toLowerCase();
  return SUBDOMAIN_COUNTRIES[subdomain] ?? null;
}

// Auth-level rate limited routes (§10.2.1 CDC)
const AUTH_RATE_ROUTES = [
  "/api/auth/",
  "/api/register",
];

// Sensitive routes: 10 req/hour (§10.2.1 CDC)
const SENSITIVE_RATE_ROUTES = [
  "/api/kyc",
  "/api/escrow",
];

function getIP(req: Request): string {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const { pathname } = nextUrl;
  const isLoggedIn = !!session?.user;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // ── Auth redirects ──────────────────────────────────────────
  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  // ── Rate limiting (API routes only) ─────────────────────────
  if (pathname.startsWith("/api/")) {
    const ip = getIP(req);
    const userId = session?.user?.id;

    let rl: ReturnType<typeof RATE_LIMITS.auth> | null = null;

    if (AUTH_RATE_ROUTES.some((r) => pathname.startsWith(r))) {
      rl = RATE_LIMITS.auth(ip);
    } else if (SENSITIVE_RATE_ROUTES.some((r) => pathname.startsWith(r))) {
      rl = RATE_LIMITS.sensitive(userId ?? ip);
    } else if (userId) {
      rl = RATE_LIMITS.user(userId);
    } else {
      rl = RATE_LIMITS.public(ip);
    }

    if (rl && !rl.success) {
      return new NextResponse(
        JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rl.retryAfter),
          },
        }
      );
    }
  }

  // ── Security headers (§10.1 CDC) ────────────────────────────
  const response = NextResponse.next();
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ── Multitenancy: inject country from subdomain ──────────────
  const country = detectCountryFromSubdomain(req);
  if (country) {
    response.headers.set("x-afribayit-country", country);
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
