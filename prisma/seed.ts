import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding Melodia Up To Africa...");

  // ============ 6 PRICING PLANS (FCFA) — Unified Plan Names ============
  const packs = [
    {
      name: "Basic",
      plan: "basic",
      price: 2000,
      credits: 20,
      songsLimit: 3,
      coversLimit: 3,
      videosLimit: 0,
      features: JSON.stringify([
        "3 chansons IA/mois",
        "3 pochettes IA/mois",
        "Paroles IA illimitées",
        "Audio standard 128kbps",
        "Téléchargement MP3",
        "Partage social",
      ]),
      isPopular: false,
      sortOrder: 1,
    },
    {
      name: "Artist Starter",
      plan: "artist_starter",
      price: 5000,
      credits: 50,
      songsLimit: 8,
      coversLimit: 8,
      videosLimit: 0,
      features: JSON.stringify([
        "8 chansons IA/mois",
        "8 pochettes IA/mois",
        "Paroles IA illimitées",
        "Composition IA",
        "Audio HQ 320kbps",
        "Voix & chant IA",
        "MP3 + WAV",
        "Mix & Master basique",
        "5 GB stockage",
      ]),
      isPopular: false,
      sortOrder: 2,
    },
    {
      name: "Artist Production",
      plan: "artist_production",
      price: 10000,
      credits: 100,
      songsLimit: 15,
      coversLimit: 15,
      videosLimit: 0,
      features: JSON.stringify([
        "15 chansons IA/mois",
        "15 pochettes IA/mois",
        "Paroles & Composition IA",
        "Audio HQ 320kbps",
        "Voix IA premium",
        "Mix & Master avancé",
        "Pochettes premium",
        "AI Producer",
        "2 générations parallèles",
        "15 GB stockage",
        "Support prioritaire",
      ]),
      isPopular: true,
      sortOrder: 3,
    },
    {
      name: "Video Creator",
      plan: "video_creator",
      price: 15000,
      credits: 150,
      songsLimit: 20,
      coversLimit: 20,
      videosLimit: 3,
      features: JSON.stringify([
        "20 chansons IA/mois",
        "20 pochettes IA/mois",
        "3 clips vidéo IA/mois",
        "Storyboard IA",
        "Audio HQ 320kbps",
        "Voix IA premium",
        "Mix & Master avancé",
        "3 générations parallèles",
        "25 GB stockage",
        "Support prioritaire",
      ]),
      isPopular: false,
      sortOrder: 4,
    },
    {
      name: "Artist Pro",
      plan: "artist_pro",
      price: 25000,
      credits: 250,
      songsLimit: 50,
      coversLimit: 50,
      videosLimit: 10,
      features: JSON.stringify([
        "50 chansons IA/mois",
        "50 pochettes IA/mois",
        "10 clips vidéo IA/mois",
        "Storyboard & Scénario IA",
        "Audio studio 320kbps",
        "Voix IA premium + harmonies",
        "Mix & Master professionnel",
        "Modèles IA exclusifs",
        "Pages cadeaux",
        "5 générations parallèles",
        "50 GB stockage",
        "Support VIP",
      ]),
      isPopular: false,
      sortOrder: 5,
    },
    {
      name: "Label / Studio",
      plan: "label",
      price: 50000,
      credits: 500,
      songsLimit: 999,
      coversLimit: 999,
      videosLimit: 30,
      features: JSON.stringify([
        "Chansons IA illimitées",
        "Pochettes IA illimitées",
        "30 clips vidéo IA/mois",
        "Studio vidéo complet",
        "Multi-artistes (jusqu'à 10)",
        "Tous modèles IA exclusifs",
        "Mix & Master professionnel",
        "Distribution & partage",
        "API accès",
        "10 générations parallèles",
        "100 GB stockage",
        "Account manager dédié",
        "Support 24/7",
      ]),
      isPopular: false,
      sortOrder: 6,
    },
  ];

  for (const pack of packs) {
    await db.creditPack.upsert({
      where: { id: `pack-${pack.plan}` },
      update: pack,
      create: { id: `pack-${pack.plan}`, ...pack },
    });
  }

  // ============ ADMIN USER ============
  const adminHashedPw = await bcrypt.hash("admin123", 10);
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

  // ============ DEMO USER ============
  const demoHashedPw = await bcrypt.hash("demo123", 10);
  const demoUser = await db.user.upsert({
    where: { email: "jean@example.com" },
    update: { password: demoHashedPw },
    create: {
      email: "jean@example.com",
      name: "Jean Paul",
      password: demoHashedPw,
      role: "user",
      plan: "artist_production",
    },
  });

  // Create credits for demo user (Artist Production plan)
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
      totalCreditsPurchased: 0,
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
      totalCreditsPurchased: 0,
      storageUsedMb: 0,
    },
  });

  // ============ Create Subscriptions for existing users ============
  // Admin subscription
  await db.subscription.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      plan: "label",
      status: "active",
      amountFcfa: 50000,
      interval: "month",
    },
  });

  // Demo subscription
  await db.subscription.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      plan: "artist_production",
      status: "active",
      amountFcfa: 10000,
      interval: "month",
    },
  });

  console.log("✅ Seed completed!");
  console.log("Plans: Basic (2000), Artist Starter (5000), Artist Production (10000), Video Creator (15000), Artist Pro (25000), Label (50000)");
  console.log("Admin: admin@melodia.ai / admin123");
  console.log("Demo: jean@example.com / demo123");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
