import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Diagnostic: log which DATABASE_URL is being used (only at first instantiation)
if (!globalForPrisma.prisma) {
  const dbUrl = process.env.DATABASE_URL || "(not set)";
  const isPostgres = dbUrl.startsWith("postgresql") || dbUrl.startsWith("postgres");
  console.log(`[db] DATABASE_URL: ${isPostgres ? "✅ PostgreSQL" : "❌ NOT PostgreSQL"} - ${dbUrl.substring(0, 40)}...`);
}

// Only log queries in development — not in production (performance + security)
const logLevel = process.env.NODE_ENV === 'development' 
  ? ['query' as const] 
  : ['warn' as const, 'error' as const];

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
