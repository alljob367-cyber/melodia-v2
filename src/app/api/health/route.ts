import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Check critical env vars
    const envChecks: Record<string, boolean> = {
      DATABASE_URL: !!(process.env.DATABASE_URL || process.env.POSTGRES_URL),
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      VERCEL_URL: !!process.env.VERCEL_URL,
      NODE_ENV: !!process.env.NODE_ENV,
    };

    const missingEnvs = Object.entries(envChecks)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    // Check DB connectivity
    let dbOk = false;
    let dbError = "";
    try {
      await db.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch (err: any) {
      dbOk = false;
      dbError = err?.message || "unknown error";
    }

    // Check if admin user exists
    let adminExists = false;
    let userCount = 0;
    if (dbOk) {
      try {
        const admin = await db.user.findUnique({
          where: { email: "admin@melodia.ai" },
          select: { id: true, role: true, plan: true },
        });
        adminExists = !!admin;
        userCount = await db.user.count();
      } catch {
        // ignore
      }
    }

    // Compute NEXTAUTH_URL
    let nextauthUrl = process.env.NEXTAUTH_URL || "(not set)";
    if (process.env.VERCEL_URL) {
      nextauthUrl = `https://${process.env.VERCEL_URL}`;
    }

    const isHealthy = dbOk && missingEnvs.length === 0;

    return NextResponse.json({
      status: isHealthy ? "ok" : dbOk ? "degraded" : "error",
      service: "MELODIA API",
      version: "1.0.1",
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV || "(not set)",
        NEXTAUTH_URL: nextauthUrl,
        VERCEL_URL: process.env.VERCEL_URL || "(not set)",
        missingEnvs: missingEnvs.length > 0 ? missingEnvs : undefined,
      },
      database: {
        ok: dbOk,
        error: dbError || undefined,
        adminExists,
        userCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
