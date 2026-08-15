import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ============ ROUTE CONFIGURATION ============

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/api/auth", "/api/signup", "/api/health"];

// Webhook routes — called by payment providers, NOT by users
const webhookRoutes = ["/api/core/payments/webhook"];

// Routes that require admin role
const adminRoutes = ["/admin", "/api/admin", "/api/seed"];

// ============ IN-MEMORY RATE LIMITING (lightweight, no Redis/DB) ============

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries every 60s
let lastCleanup = Date.now();
function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  "/api/core/generate": { windowMs: 60_000, max: 5 },
  "/api/generate": { windowMs: 60_000, max: 5 },
  "/api/core/credits/purchase": { windowMs: 60_000, max: 3 },
  "/api/auth": { windowMs: 60_000, max: 10 },
  "/api/signup": { windowMs: 3_600_000, max: 3 },
  "/api/core/media/upload": { windowMs: 60_000, max: 10 },
};

const DEFAULT_API_LIMIT: RateLimitConfig = { windowMs: 60_000, max: 100 };

function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupStore();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt: resetTime });
    return { allowed: true, remaining: config.max - 1, resetTime };
  }

  entry.count++;
  const remaining = Math.max(0, config.max - entry.count);
  return { allowed: entry.count <= config.max, remaining, resetTime: entry.resetAt };
}

// ============ MIDDLEWARE ============

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow webhook routes (called by payment providers, not users — no auth)
  if (webhookRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files, Next.js internals, and logo assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/melodia-logo")
  ) {
    return NextResponse.next();
  }

  // ============ RATE LIMITING (in-memory, no DB/Redis) ============
  if (pathname.startsWith("/api/")) {
    let rateLimitConfig: RateLimitConfig | null = null;
    for (const [route, config] of Object.entries(RATE_LIMITS)) {
      if (pathname.startsWith(route)) {
        rateLimitConfig = config;
        break;
      }
    }

    if (rateLimitConfig || pathname.startsWith("/api/core/")) {
      const config = rateLimitConfig || DEFAULT_API_LIMIT;
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
                 request.headers.get("x-real-ip") ||
                 "unknown";
      const key = `${ip}:${pathname}`;

      const rateResult = checkRateLimit(key, config);

      if (!rateResult.allowed) {
        return NextResponse.json(
          { error: "Trop de requêtes. Réessayez dans un instant." },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": String(config.max),
              "X-RateLimit-Remaining": String(rateResult.remaining),
              "X-RateLimit-Reset": String(Math.ceil(rateResult.resetTime / 1000)),
              "Retry-After": String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)),
            },
          }
        );
      }
    }
  }

  // ============ AUTH CHECK ============
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    const role = token.role as string | undefined;
    if (role !== "admin") {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Accès réservé à l'administration" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|melodia-logo-.*\\.png).*)"],
};
