import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = (page - 1) * limit;

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

    // FIX #24: Paginate AI logs + use aggregate for cost instead of loading all records
    const aiLogs = await db.aIRequestLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    // Use aggregate for total cost (much more efficient than loading all records)
    const costAggregation = await db.aIRequestLog.aggregate({
      _sum: { cost: true },
    });
    const totalAICost = costAggregation._sum.cost || 0;

    return NextResponse.json({
      analytics: {
        totalUsers,
        totalSongs,
        completedSongs,
        generatingSongs,
        totalAIRequests,
        totalAICost: totalAICost.toFixed(2),
        recentEvents,
        aiLogs,
        page,
        hasMore: totalAIRequests > offset + limit,
      },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
