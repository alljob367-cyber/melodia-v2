import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/me/credits - Get user credits
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    const credits = await db.userCredits.findUnique({
      where: { userId },
    });

    if (!credits) {
      return NextResponse.json({ error: "Crédits non trouvés" }, { status: 404 });
    }

    // Get recent transactions
    const transactions = await db.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      credits: {
        songsRemaining: credits.songsRemaining,
        coversRemaining: credits.coversRemaining,
        totalSongsUsed: credits.totalSongsUsed,
        totalCoversUsed: credits.totalCoversUsed,
        storageUsedMb: credits.storageUsedMb,
      },
      transactions,
    });
  } catch (error) {
    console.error("Get credits error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
