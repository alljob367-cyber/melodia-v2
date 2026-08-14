import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // FIX #21: Health check should NOT trigger auto-seed
    // Just check if DB is reachable
    let dbOk = false;
    try {
      await db.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    // Check if admin exists (read-only, no seeding)
    let seeded = false;
    if (dbOk) {
      try {
        const admin = await db.user.findUnique({
          where: { email: "admin@melodia.ai" },
          select: { id: true },
        });
        seeded = !!admin;
      } catch {
        seeded = false;
      }
    }

    return NextResponse.json({
      status: dbOk ? (seeded ? "ok" : "degraded") : "error",
      service: "MELODIA API",
      version: "1.0.0",
      db: dbOk,
      seeded,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: error.message,
    }, { status: 500 });
  }
}
