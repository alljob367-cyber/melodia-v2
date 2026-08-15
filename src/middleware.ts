import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkRateLimit } from "@/lib/security/rate-limit";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/api/auth", "/api/signup", "/api/health"];

// Webhook routes — called by payment providers, NOT by users
const webhookRoutes = ["/api/core/payments/webhook"];

// Routes that require admin role
const adminRoutes = ["/admin", "/api/admin", "/api/seed"];

// ============ RATE LIMIT CONFIGURATION ============

interface RouteRateLimit {
  windowMs: number;
  max: number;
}

const RATE_LIMITS: Record<string, RouteRateLimit> = {
  // AI generation: 5 per minute (expensive)
  "/api/core/generate": { windowMs: 60_000, max: 5 },
  "/api/generate": { windowMs: 60_000, max: 5 },
  // Credit purchase: 3 per minute
  "/api/core/credits/purchase": { windowMs: 60_000, max: 3 },
  // Auth: 10 per minute
  "/api/auth": { windowMs: 60_000, max: 10 },
  // Signup: 3 per hour
  "/api/signup": { windowMs: 3_600_000, max: 3 },
  // Media upload: 10 per minute
  "/api/core/media/upload": { windowMs: 60_000, max: 10 },
};

// Default API rate limit: 100 per minute
const DEFAULT_API_LIMIT: RouteRateLimit = { windowMs: 60_000, max: 100 };

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

  // ============ RATE LIMITING ============
  // Apply rate limits to API routes
  if (pathname.startsWith("/api/")) {
    // Find matching rate limit config
    let rateLimitConfig: RouteRateLimit | null = null;
    for (const [route, config] of Object.entries(RATE_LIMITS)) {
      if (pathname.startsWith(route)) {
        rateLimitConfig = config;
        break;
      }
    }

    // Apply rate limit (default for API routes if no specific config)
    if (rateLimitConfig || pathname.startsWith("/api/core/")) {
      const config = rateLimitConfig || DEFAULT_API_LIMIT;
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                 request.headers.get("x-real-ip") || 
                 "unknown";
      const key = `${ip}:${pathname}`;
      
      const rateResult = await checkRateLimit(key, config);
      
      if (!rateResult.allowed) {
        // Log rate limit violation to DB (fire-and-forget)
        try {
          const { db } = await import("@/lib/db");
          await db.rateLimitLog.create({
            data: {
              userId: "anonymous", // Will be updated after auth check
              ipAddress: ip,
              endpoint: pathname,
              allowed: false,
              remaining: 0,
              limit: config.max,
              windowMs: config.windowMs,
            },
          }).catch(() => {}); // Don't block on DB failure
        } catch {}

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

  // Get the decoded NextAuth JWT token (handles JWE decryption automatically)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No valid session — redirect to login or return 401
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection — check role from decoded token
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
