import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// ============ ENV VALIDATION (log once at module load) ============
const missingEnvs: string[] = [];
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  missingEnvs.push("DATABASE_URL or POSTGRES_URL");
}
if (!process.env.NEXTAUTH_SECRET) {
  missingEnvs.push("NEXTAUTH_SECRET");
}
if (missingEnvs.length > 0) {
  console.error(`[auth] ❌ CRITICAL: Missing env vars: ${missingEnvs.join(", ")}. Login will FAIL.`);
}

// ============ NEXTAUTH_URL ============
// On Vercel, VERCEL_URL is auto-set. We build the https URL from it.
// NEXTAUTH uses this to set the cookie domain — if wrong, cookies won't work.
function getNextauthUrl(): string {
  // 1. Explicit NEXTAUTH_URL (highest priority)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  // 2. Vercel auto-injected URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // 3. Local dev fallback
  return "http://localhost:3000";
}

const NEXTAUTH_URL = getNextauthUrl();
console.log(`[auth] NEXTAUTH_URL = ${NEXTAUTH_URL}`);

// ============ AUTO-SEED ============
// Auto-seed check: ensure admin user exists before any auth attempt
let seedChecked = false;
async function ensureSeed() {
  if (seedChecked) return;
  seedChecked = true; // Set early to avoid concurrent re-seeds

  try {
    const admin = await db.user.findUnique({
      where: { email: "admin@melodia.ai" },
      select: { id: true },
    });
    if (!admin) {
      console.log("[auth] No admin user found, seeding directly...");
      try {
        const adminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123";
        const adminHashedPw = await bcrypt.hash(adminPassword, 10);
        const adminUser = await db.user.upsert({
          where: { email: "admin@melodia.ai" },
          update: { password: adminHashedPw, plan: "label", role: "admin" },
          create: {
            email: "admin@melodia.ai",
            name: "Admin MELODIA",
            password: adminHashedPw,
            role: "admin",
            plan: "label",
          },
        });
        await db.userCredits.upsert({
          where: { userId: adminUser.id },
          update: {},
          create: {
            userId: adminUser.id,
            credits: 500,
            songsRemaining: 999,
            coversRemaining: 999,
            videosRemaining: 30,
            totalSongsUsed: 0,
            totalCoversUsed: 0,
            totalVideosUsed: 0,
            totalCreditsUsed: 0,
            storageUsedMb: 0,
          },
        });
        await db.subscription.upsert({
          where: { userId: adminUser.id },
          update: {},
          create: {
            userId: adminUser.id,
            plan: "label",
            status: "active",
            amountFcfa: 50000,
            interval: "month",
          },
        });
        console.log("[auth] Admin user seeded successfully");
      } catch (seedErr) {
        console.error("[auth] Seed failed:", seedErr);
      }
    }
  } catch (dbErr) {
    console.error("[auth] DB not reachable during seed check:", dbErr);
  }
}

// ============ NEXTAUTH CONFIG ============
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[auth] Missing credentials");
          return null;
        }

        // Check critical env vars
        if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
          console.error("[auth] ❌ DATABASE_URL not set — cannot authenticate");
          throw new Error("DATABASE_URL not configured");
        }

        // Ensure DB is seeded before attempting auth
        await ensureSeed();

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
          });

          if (!user) {
            console.log(`[auth] User not found: ${credentials.email}`);
            return null;
          }

          if (!user.password) {
            console.log(`[auth] User has no password (OAuth-only?): ${credentials.email}`);
            return null;
          }

          const passwordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordValid) {
            console.log(`[auth] Invalid password for: ${credentials.email}`);
            return null;
          }

          if (!user.isActive) {
            console.log(`[auth] User account deactivated: ${credentials.email}`);
            return null;
          }

          console.log(`[auth] ✅ Login successful: ${credentials.email} (role=${user.role}, plan=${user.plan})`);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
          };
        } catch (error) {
          console.error("[auth] Authorize error:", error);
          throw error; // Re-throw so NextAuth returns a 500, not a silent failure
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-next-auth" : "next-auth"}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
