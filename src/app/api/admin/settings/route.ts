import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// FIX #10: Store settings in database instead of in-memory (lost on serverless cold start)
const SETTINGS_ID = "global";

async function getSettings() {
  // Try to load from DB, fallback to defaults
  try {
    const row = await db.$queryRawUnsafe(
      `SELECT value FROM "_melodia_settings" WHERE id = $1 LIMIT 1`,
      SETTINGS_ID
    );
    if (Array.isArray(row) && row.length > 0 && row[0].value) {
      return JSON.parse(row[0].value);
    }
  } catch {
    // Table might not exist yet — use defaults
  }

  return {
    siteName: "MELODIA",
    defaultPlan: "basic",
    maxSongsBasic: 2,
    maxSongsPro: 20,
    maxSongsStudio: 100,
    maintenanceMode: false,
    demoMode: true,
    aiModel: "melodia-v1",
    maxConcurrentGenerations: 3,
  };
}

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    const current = await getSettings();
    const updated = { ...current, ...body };

    // Try to persist to DB; if table doesn't exist, just return in-memory for this request
    try {
      await db.$executeRawUnsafe(
        `CREATE TABLE IF NOT EXISTS "_melodia_settings" (id TEXT PRIMARY KEY, value TEXT NOT NULL)`
      );
      await db.$executeRawUnsafe(
        `INSERT INTO "_melodia_settings" (id, value) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET value = $2`,
        SETTINGS_ID,
        JSON.stringify(updated)
      );
    } catch {
      // If DB persist fails, settings are only valid for this request
    }

    return NextResponse.json({ settings: updated, message: "Paramètres mis à jour" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
