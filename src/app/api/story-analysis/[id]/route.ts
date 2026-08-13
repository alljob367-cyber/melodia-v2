import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/story-analysis/[id]
 * Get story analysis for a song
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const analysis = await db.storyAnalysis.findUnique({
      where: { songId: id },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analyse non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Story analysis error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
