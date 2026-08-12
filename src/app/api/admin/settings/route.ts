import { NextRequest, NextResponse } from "next/server";

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
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    settings = { ...settings, ...body };
    return NextResponse.json({ settings, message: "Paramètres mis à jour" });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
