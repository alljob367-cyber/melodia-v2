import { NextResponse } from "next/server";
import { db } from "@/lib/db";

let seedPromise: Promise<any> | null = null;

async function ensureSeeded() {
  // Quick check: does admin user exist?
  try {
    const admin = await db.user.findUnique({
      where: { email: "admin@melodia.ai" },
      select: { id: true },
    });
    if (admin) return true;
  } catch {
    // DB might not be ready yet
  }

  // If we're already seeding, wait for it
  if (seedPromise) {
    await seedPromise;
    return true;
  }

  // Seed the database
  seedPromise = seedDatabase();
  try {
    await seedPromise;
    return true;
  } catch (e) {
    seedPromise = null;
    return false;
  }
}

async function seedDatabase() {
  const bcrypt = await import("bcryptjs");

  // Create pricing packs
  const packs = [
    {
      id: "pack-decouverte", name: "Découverte", plan: "decouverte",
      price: 2000, credits: 20, songsLimit: 3, coversLimit: 3, videosLimit: 0,
      features: JSON.stringify(["3 chansons IA/mois", "3 pochettes IA/mois", "Paroles IA illimitées", "Audio standard 128kbps", "Téléchargement MP3", "Partage social"]),
      isPopular: false, sortOrder: 1,
    },
    {
      id: "pack-production", name: "Production Musicale", plan: "production",
      price: 5000, credits: 50, songsLimit: 8, coversLimit: 8, videosLimit: 0,
      features: JSON.stringify(["8 chansons IA/mois", "8 pochettes IA/mois", "Paroles IA illimitées", "Composition IA", "Audio HQ 320kbps", "Voix & chant IA", "MP3 + WAV", "Mix & Master basique", "5 GB stockage"]),
      isPopular: false, sortOrder: 2,
    },
    {
      id: "pack-artiste", name: "Artiste Actif", plan: "artiste",
      price: 10000, credits: 100, songsLimit: 15, coversLimit: 15, videosLimit: 0,
      features: JSON.stringify(["15 chansons IA/mois", "15 pochettes IA/mois", "Paroles & Composition IA", "Audio HQ 320kbps", "Voix IA premium", "Mix & Master avancé", "Pochettes premium", "2 générations parallèles", "15 GB stockage", "Support prioritaire"]),
      isPopular: true, sortOrder: 3,
    },
    {
      id: "pack-video", name: "Vidéo", plan: "video",
      price: 15000, credits: 150, songsLimit: 20, coversLimit: 20, videosLimit: 3,
      features: JSON.stringify(["20 chansons IA/mois", "20 pochettes IA/mois", "3 clips vidéo IA/mois", "Storyboard IA", "Audio HQ 320kbps", "Voix IA premium", "Mix & Master avancé", "3 générations parallèles", "25 GB stockage", "Support prioritaire"]),
      isPopular: false, sortOrder: 4,
    },
    {
      id: "pack-professionnel", name: "Artiste Professionnel", plan: "professionnel",
      price: 25000, credits: 250, songsLimit: 50, coversLimit: 50, videosLimit: 10,
      features: JSON.stringify(["50 chansons IA/mois", "50 pochettes IA/mois", "10 clips vidéo IA/mois", "Storyboard & Scénario IA", "Audio studio 320kbps", "Voix IA premium + harmonies", "Mix & Master professionnel", "Modèles IA exclusifs", "Pages cadeaux", "5 générations parallèles", "50 GB stockage", "Support VIP"]),
      isPopular: false, sortOrder: 5,
    },
    {
      id: "pack-label", name: "Label / Studio", plan: "label",
      price: 50000, credits: 500, songsLimit: 999, coversLimit: 999, videosLimit: 30,
      features: JSON.stringify(["Chansons IA illimitées", "Pochettes IA illimitées", "30 clips vidéo IA/mois", "Studio vidéo complet", "Multi-artistes (jusqu'à 10)", "Tous modèles IA exclusifs", "Mix & Master professionnel", "Distribution & partage", "API accès", "10 générations parallèles", "100 GB stockage", "Account manager dédié", "Support 24/7"]),
      isPopular: false, sortOrder: 6,
    },
  ];

  for (const pack of packs) {
    await db.creditPack.upsert({ where: { id: pack.id }, update: pack, create: pack });
  }

  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@melodia.ai" },
    update: { password: adminHash },
    create: { email: "admin@melodia.ai", name: "Admin MELODIA", password: adminHash, role: "admin", plan: "label" },
  });

  // Demo user
  const demoHash = await bcrypt.hash("demo123", 10);
  const demo = await db.user.upsert({
    where: { email: "jean@example.com" },
    update: { password: demoHash },
    create: { email: "jean@example.com", name: "Jean Paul", password: demoHash, role: "user", plan: "artiste" },
  });

  // Credits
  await db.userCredits.upsert({
    where: { userId: demo.id }, update: {},
    create: { userId: demo.id, credits: 100, songsRemaining: 15, coversRemaining: 15, videosRemaining: 0, totalSongsUsed: 0, totalCoversUsed: 0, totalVideosUsed: 0, totalCreditsUsed: 0, storageUsedMb: 0 },
  });
  await db.userCredits.upsert({
    where: { userId: admin.id }, update: {},
    create: { userId: admin.id, credits: 500, songsRemaining: 999, coversRemaining: 999, videosRemaining: 30, totalSongsUsed: 0, totalCoversUsed: 0, totalVideosUsed: 0, totalCreditsUsed: 0, storageUsedMb: 0 },
  });

  console.log("[auto-seed] ✅ Database seeded");
}

export async function GET() {
  try {
    const seeded = await ensureSeeded();
    return NextResponse.json({
      status: seeded ? "ok" : "degraded",
      service: "MELODIA API",
      version: "1.0.0",
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
