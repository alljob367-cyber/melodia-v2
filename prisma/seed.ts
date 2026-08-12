import { db } from "@/lib/db";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create credit packs
  const packs = [
    {
      name: "Pack Basic",
      plan: "basic",
      price: 2000,
      songsLimit: 2,
      coversLimit: 2,
      features: JSON.stringify(["2 chansons IA/mois", "2 pochettes IA/mois", "Audio standard 128kbps", "Téléchargement MP3", "Partage"]),
      isPopular: false,
      sortOrder: 1,
    },
    {
      name: "Pack Pro",
      plan: "pro",
      price: 5000,
      songsLimit: 20,
      coversLimit: 20,
      features: JSON.stringify(["20 chansons IA/mois", "20 pochettes IA/mois", "Audio HQ 320kbps", "Voix & chant IA", "Clips vidéo courts", "3 générations parallèles", "MP3 + WAV", "10 GB stockage", "Support prioritaire"]),
      isPopular: true,
      sortOrder: 2,
    },
    {
      name: "Pack Studio",
      plan: "studio",
      price: 10000,
      songsLimit: 100,
      coversLimit: 100,
      features: JSON.stringify(["Production avancée illimitée", "Pochettes premium", "Audio HQ 320kbps", "Studio vidéo complet", "Voix IA premium", "Modèles IA exclusifs", "Tous formats", "Pages cadeaux", "Support VIP"]),
      isPopular: false,
      sortOrder: 3,
    },
  ];

  for (const pack of packs) {
    await db.creditPack.upsert({
      where: { id: `pack-${pack.plan}` },
      update: pack,
      create: { id: `pack-${pack.plan}`, ...pack },
    });
  }

  // Create demo admin user
  const adminUser = await db.user.upsert({
    where: { email: "admin@melodia.ai" },
    update: {},
    create: {
      email: "admin@melodia.ai",
      name: "Admin MELODIA",
      password: "admin123",
      role: "admin",
      plan: "studio",
    },
  });

  // Create demo regular user
  const demoUser = await db.user.upsert({
    where: { email: "jean@example.com" },
    update: {},
    create: {
      email: "jean@example.com",
      name: "Jean Paul",
      password: "demo123",
      role: "user",
      plan: "basic",
    },
  });

  // Create credits for demo user
  await db.userCredits.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      songsRemaining: 2,
      coversRemaining: 2,
      totalSongsUsed: 0,
      totalCoversUsed: 0,
      storageUsedMb: 0,
    },
  });

  console.log("✅ Seed completed!");
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
