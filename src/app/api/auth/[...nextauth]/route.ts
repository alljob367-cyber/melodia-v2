import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

// Build the NextAuth config (shared between requests)
function getNextAuthConfig(request?: NextRequest) {
  // When behind a reverse proxy (Caddy), determine NEXTAUTH_URL from request headers
  // This ensures cookies and redirects use the correct external origin
  let nextAuthUrl = process.env.NEXTAUTH_URL;

  if (request) {
    const xForwardedHost = request.headers.get("x-forwarded-host");
    const xForwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const host = request.headers.get("host");

    if (xForwardedHost) {
      nextAuthUrl = `${xForwardedProto}://${xForwardedHost}`;
    } else if (host && !host.startsWith("localhost")) {
      nextAuthUrl = `${xForwardedProto}://${host}`;
    }
  }

  // Set NEXTAUTH_URL for this request context so NextAuth uses it
  if (nextAuthUrl) {
    process.env.NEXTAUTH_URL = nextAuthUrl;
  }

  return {
    providers: [
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Mot de passe", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            return null;
          }

          // Verify password with bcrypt
          const passwordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
          };
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = (user as any).role;
          token.plan = (user as any).plan;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.sub;
          (session.user as any).role = token.role;
          (session.user as any).plan = token.plan;
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    session: {
      strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "melodia-secret-dev-key-2026",
  };
}

// Create a dynamic handler that adapts to the request origin
async function dynamicHandler(request: NextRequest) {
  // Determine the correct NEXTAUTH_URL from proxy headers before handling
  const xForwardedHost = request.headers.get("x-forwarded-host");
  const xForwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host");

  if (xForwardedHost) {
    process.env.NEXTAUTH_URL = `${xForwardedProto}://${xForwardedHost}`;
  } else if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    // If accessed via a non-localhost host, use it
    const proto = request.headers.get("x-forwarded-proto") ||
      (request.nextUrl.protocol === "https:" ? "https" : "http");
    process.env.NEXTAUTH_URL = `${proto}://${host}`;
  }
  // Otherwise, keep the default NEXTAUTH_URL from .env (http://localhost:3000)

  const handler = NextAuth(getNextAuthConfig(request));
  return handler(request);
}

export { dynamicHandler as GET, dynamicHandler as POST };
