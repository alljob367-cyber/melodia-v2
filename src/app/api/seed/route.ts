import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

/**
 * Seed the database with initial data (admin, demo user, credit packs).
 * This is called automatically on first auth attempt.
 * Seed is idempotent — safe to call multiple times.
 */
export async function GET() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.user.findUnique({
      where: { email: "admin@melodia.ai" },
    });

    if (existingAdmin) {
      return NextResponse.json({
        status: "already_seeded",
        message: "Database already has admin user",
      });
    }

    // V4 Seed pricing packs — plan names MUST match prisma schema & permission-engine
    const packs = [
      {
        id: "pack-basic",
        name: "Découverte",
        plan: "basic",
        price: 2000,
        credits: 20,
        songsLimit: 2,
        coversLimit: 2,
        videosLimit: 0,
        features: JSON.stringify([
          "Audio Studio", "MELO IA", "Jusqu'à 2 créations musicales", "Jusqu'à 2 pochettes",
          "Paroles IA", "MP3", "Download & Share", "Media Library", "1 génération parallèle",
        ]),
        isPopular: false,
        sortOrder: 1,
      },
      {
        id: "pack-artist-starter",
        name: "Production Musicale",
        plan: "artist_starter",
        price: 5000,
        credits: 60,
        songsLimit: 8,
        coversLimit: 8,
        videosLimit: 0,
        features: JSON.stringify([
          "Audio Studio complet", "MELO AI Producteur", "Création musicale", "Pochettes IA",
          "Voice IA", "MP3 + WAV", "Mix & Master basique", "5 GB stockage", "2 générations parallèles",
        ]),
        isPopular: false,
        sortOrder: 2,
      },
      {
        id: "pack-artist-production",
        name: "Artiste Actif",
        plan: "artist_production",
        price: 10000,
        credits: 120,
        songsLimit: 15,
        coversLimit: 15,
        videosLimit: 0,
        features: JSON.stringify([
          "Tout Production Musicale", "Voice Premium", "Mix avancé & Mastering",
          "Pochettes premium", "Artist Studio", "Identité artistique", "Concepts visuels",
          "15 GB stockage", "2 générations parallèles", "Support prioritaire",
        ]),
        isPopular: true,
        sortOrder: 3,
      },
      {
        id: "pack-video-creator",
        name: "Vidéo Studio",
        plan: "video_creator",
        price: 15000,
        credits: 180,
        songsLimit: 20,
        coversLimit: 20,
        videosLimit: 3,
        features: JSON.stringify([
          "Audio Studio + Cover Studio", "Video Studio", "AI Video Director",
          "Storyboard IA", "Clips selon crédits", "25 GB stockage", "3 générations parallèles",
        ]),
        isPopular: false,
        sortOrder: 4,
      },
      {
        id: "pack-artist-pro",
        name: "Artiste Professionnel",
        plan: "artist_pro",
        price: 25000,
        credits: 350,
        songsLimit: 50,
        coversLimit: 50,
        videosLimit: 10,
        features: JSON.stringify([
          "Audio Pro + Cover Pro", "Video Studio", "Artist Studio complet",
          "Voice + harmonies", "Mix Pro & Mastering Pro", "AI Video Director",
          "Modèles premium", "Pages artiste", "50 GB stockage", "5 générations parallèles", "Support VIP",
        ]),
        isPopular: false,
        sortOrder: 5,
      },
      {
        id: "pack-label",
        name: "Label / Studio",
        plan: "label",
        price: 50000,
        credits: 800,
        songsLimit: 200,
        coversLimit: 200,
        videosLimit: 30,
        features: JSON.stringify([
          "Multi-artistes (10)", "Audio Pro + Cover Pro", "Video Studio", "Artist Studio",
          "Crédits partagés", "Projets multiples", "Analytics", "API access",
          "100 GB stockage", "10 générations parallèles", "Support prioritaire",
        ]),
        isPopular: false,
        sortOrder: 6,
      },
    ];

    for (const pack of packs) {
      await db.creditPack.upsert({
        where: { id: pack.id },
        update: pack,
        create: pack,
      });
    }

    // Create admin user — password from env or fallback (change in production!)
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

    // Create demo user
    const demoPassword = process.env.DEMO_SEED_PASSWORD || "demo123";
    const demoHashedPw = await bcrypt.hash(demoPassword, 10);
    const demoUser = await db.user.upsert({
      where: { email: "jean@example.com" },
      update: { password: demoHashedPw, plan: "artist_starter" },
      create: {
        email: "jean@example.com",
        name: "Jean Paul",
        password: demoHashedPw,
        role: "user",
        plan: "artist_starter",
      },
    });

    // Create credits for demo user
    await db.userCredits.upsert({
      where: { userId: demoUser.id },
      update: {},
      create: {
        userId: demoUser.id,
        credits: 100,
        songsRemaining: 15,
        coversRemaining: 15,
        videosRemaining: 0,
        totalSongsUsed: 0,
        totalCoversUsed: 0,
        totalVideosUsed: 0,
        totalCreditsUsed: 0,
        storageUsedMb: 0,
      },
    });

    // Create credits for admin
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

    return NextResponse.json({
      status: "seeded",
      message: "Database seeded successfully",
      admin: "admin@melodia.ai (password set)",
      demo: "jean@example.com (password set)",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Seed failed";
    console.error("[seed] Error:", error);
    return NextResponse.json(
      { status: "error", message },
      { status: 500 }
    );
  }
}
