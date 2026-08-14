import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

// GET /api/me/credits - Get credits for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // FIX #15: Get userId from JWT token, not from query string
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const userId = token.sub;

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

    const responseData = {
      credits: {
        credits: credits.credits,
        songsRemaining: credits.songsRemaining,
        coversRemaining: credits.coversRemaining,
        videosRemaining: credits.videosRemaining,
        totalSongsUsed: credits.totalSongsUsed,
        totalCoversUsed: credits.totalCoversUsed,
        totalVideosUsed: credits.totalVideosUsed,
        totalCreditsUsed: credits.totalCreditsUsed,
        storageUsedMb: credits.storageUsedMb,
      },
      transactions,
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Get credits error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
