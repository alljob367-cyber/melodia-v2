import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/api/auth", "/api/signup", "/api/health"];

// Routes that require admin role
const adminRoutes = ["/admin", "/api/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
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

  // Check for auth token
  const sessionToken = request.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    // For API routes, return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    // For page routes, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin route protection — check session role via next-auth session token
  // The JWT token contains the role; we decode it to check
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    try {
      // Decode the JWT payload (base64) to check the role
      // Format: header.payload.signature
      const parts = sessionToken.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(parts[1], "base64url").toString("utf-8")
        );
        const role = payload?.role || payload?.user?.role;

        if (role !== "admin") {
          // Non-admin trying to access admin route
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { error: "Accès réservé à l'administration" },
              { status: 403 }
            );
          }
          // Redirect non-admin users to their dashboard
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      } else {
        // Invalid token format — deny access
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Token invalide" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      // Token decode failed — deny admin access
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Token invalide" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|melodia-logo-.*\\.png).*)"],
};
