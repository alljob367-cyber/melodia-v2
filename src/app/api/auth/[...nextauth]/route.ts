import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Auto-seed check: ensure admin user exists before any auth attempt
let seedChecked = false;
async function ensureSeed() {
  if (seedChecked) return;
  try {
    const admin = await db.user.findUnique({
      where: { email: "admin@melodia.ai" },
      select: { id: true },
    });
    if (!admin) {
      console.log("[auth] No admin user found, seeding directly...");
      // Seed directly instead of HTTP call (works on Vercel serverless)
      try {
        const { GET: seedHandler } = await import("@/app/api/seed/route");
        await seedHandler();
      } catch (seedErr) {
        console.error("[auth] Seed failed:", seedErr);
      }
    }
    seedChecked = true;
  } catch {
    // DB not ready, will retry next time
  }
}

// Dynamic NEXTAUTH_URL: use VERCEL_URL on Vercel, otherwise env var
function getNextauthUrl() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

const handler = NextAuth({
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

        // Ensure DB is seeded before attempting auth
        await ensureSeed();

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) {
            console.log("[auth] User not found:", credentials.email);
            return null;
          }

          const passwordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordValid) {
            console.log("[auth] Invalid password for:", credentials.email);
            return null;
          }

          console.log("[auth] ✅ Login successful:", credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
          };
        } catch (error) {
          console.error("[auth] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET, // MUST be set in production — no hardcoded fallback
});

export { handler as GET, handler as POST };
