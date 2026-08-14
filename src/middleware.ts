import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup", "/api/auth", "/api/signup", "/api/health"];

// Routes that require admin role
const adminRoutes = ["/admin", "/api/admin"];

export async function middleware(request: NextRequest) {
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

  // Get the decoded NextAuth JWT token (handles JWE decryption automatically)
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET, // MUST be set in production
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
      // Redirect non-admin users to their dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|melodia-logo-.*\\.png).*)"],
};
