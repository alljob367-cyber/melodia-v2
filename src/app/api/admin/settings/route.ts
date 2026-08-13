import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

// Simple in-memory settings store (in production, use database)
let settings = {
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

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const body = await req.json();
    settings = { ...settings, ...body };
    return NextResponse.json({ settings, message: "Paramètres mis à jour" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
