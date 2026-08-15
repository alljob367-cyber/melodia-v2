import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * GET /api/story-analysis/[id]
 * Get story analysis for a song (auth required)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check — story analysis requires authentication
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentification requise" } },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    const analysis = await db.storyAnalysis.findUnique({
      where: { songId: id },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Analyse non trouvée" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { analysis } });
  } catch (error) {
    console.error("Story analysis error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Erreur serveur" } },
      { status: 500 }
    );
  }
}
