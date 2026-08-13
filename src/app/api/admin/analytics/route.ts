import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const [totalUsers, totalSongs, totalAIRequests, recentEvents] = await Promise.all([
      db.user.count(),
      db.song.count(),
      db.aIRequestLog.count(),
      db.analyticsEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const completedSongs = await db.song.count({ where: { status: "completed" } });
    const generatingSongs = await db.song.count({ where: { status: "generating" } });

    // AI cost calculation
    const aiLogs = await db.aIRequestLog.findMany();
    const totalAICost = aiLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

    return NextResponse.json({
      analytics: {
        totalUsers,
        totalSongs,
        completedSongs,
        generatingSongs,
        totalAIRequests,
        totalAICost: totalAICost.toFixed(2),
        recentEvents,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
