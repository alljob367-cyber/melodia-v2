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
      try {
        // Direct DB seed — no HTTP call (works reliably on Vercel serverless)
        const adminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123";
        const adminHashedPw = await bcrypt.hash(adminPassword, 10);
        const adminUser = await db.user.upsert({
          where: { email: "admin@melodia.ai" },
          update: { password: adminHashedPw, plan: "label" },
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
        console.log("[auth] Admin user seeded successfully");
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

          console.log("[auth] Login successful:", credentials.email);
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
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
