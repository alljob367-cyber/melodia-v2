import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

// GET /api/songs/[id] - Get a single song with lyrics (ownership check)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify ownership: get userId from JWT token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const song = await db.song.findUnique({
      where: { id },
      include: { lyrics: true },
    });

    if (!song) {
      return NextResponse.json({ error: "Chanson introuvable" }, { status: 404 });
    }

    // Allow admin to access any song, but regular users only their own
    if (song.userId !== token.sub && token.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ song });
  } catch (error) {
    console.error("Get song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/songs/[id] - Update a song (whitelist + ownership check)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify ownership
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const existingSong = await db.song.findUnique({ where: { id }, select: { userId: true } });
    if (!existingSong) {
      return NextResponse.json({ error: "Chanson introuvable" }, { status: 404 });
    }
    if (existingSong.userId !== token.sub && token.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await req.json();

    // FIX #12: Whitelist allowed fields — prevent mass assignment
    const { title, mood, theme, language, isPublic } = body;
    const safeData: Record<string, any> = {};
    if (title !== undefined) safeData.title = title;
    if (mood !== undefined) safeData.mood = mood;
    if (theme !== undefined) safeData.theme = theme;
    if (language !== undefined) safeData.language = language;
    if (isPublic !== undefined) safeData.isPublic = isPublic;

    const song = await db.song.update({
      where: { id },
      data: safeData,
    });

    return NextResponse.json({ song });
  } catch (error) {
    console.error("Update song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/songs/[id] - Delete a song (ownership check)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify ownership
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const existingSong = await db.song.findUnique({ where: { id }, select: { userId: true } });
    if (!existingSong) {
      return NextResponse.json({ error: "Chanson introuvable" }, { status: 404 });
    }
    if (existingSong.userId !== token.sub && token.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await db.song.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
