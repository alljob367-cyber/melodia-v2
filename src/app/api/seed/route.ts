import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

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

    // V4 Seed pricing packs
    const packs = [
      {
        id: "pack-decouverte",
        name: "Découverte",
        plan: "decouverte",
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
        id: "pack-production",
        name: "Production Musicale",
        plan: "production",
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
        id: "pack-artiste-actif",
        name: "Artiste Actif",
        plan: "artiste_actif",
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
        id: "pack-video-studio",
        name: "Vidéo Studio",
        plan: "video_studio",
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
        id: "pack-artiste-pro",
        name: "Artiste Professionnel",
        plan: "artiste_pro",
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
      update: { password: adminHashedPw },
      create: {
        email: "admin@melodia.ai",
        name: "Admin MELODIA",
        password: adminHashedPw,
        role: "admin",
        plan: "label",
      },
    });

    // Create demo user — password from env or fallback
    const demoPassword = process.env.DEMO_SEED_PASSWORD || "demo123";
    const demoHashedPw = await bcrypt.hash(demoPassword, 10);
    const demoUser = await db.user.upsert({
      where: { email: "jean@example.com" },
      update: { password: demoHashedPw },
      create: {
        email: "jean@example.com",
        name: "Jean Paul",
        password: demoHashedPw,
        role: "user",
        plan: "production",
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

    // FIX #8: Never return plaintext passwords in response
    return NextResponse.json({
      status: "seeded",
      message: "Database seeded successfully",
      admin: "admin@melodia.ai (password set)",
      demo: "jean@example.com (password set)",
    });
  } catch (error: any) {
    console.error("[seed] Error:", error);
    return NextResponse.json(
      { status: "error", message: error.message || "Seed failed" },
      { status: 500 }
    );
  }
}
