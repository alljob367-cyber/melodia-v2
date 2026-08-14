import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getToken } from "next-auth/jwt";

// GET /api/songs - List songs for the authenticated user
export async function GET(req: NextRequest) {
  try {
    // FIX #13: Get userId from JWT token, not from query string
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Admin can see all songs, regular users only their own
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const userId = (token.role === "admin" && requestedUserId) ? requestedUserId : token.sub;

    const songs = await db.song.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { lyrics: true },
    });

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Get songs error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/songs - Create a new song
export async function POST(req: NextRequest) {
  try {
    // FIX #14: Get userId from JWT token, not from request body
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { title, style, mood, theme, language } = body;

    if (!title || !style) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Always use the authenticated user's ID
    const song = await db.song.create({
      data: {
        userId: token.sub,
        title,
        style,
        mood: mood || null,
        theme: theme || null,
        language: language || "fr",
        status: "draft",
      },
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error("Create song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/songs - Delete a song (ownership check)
export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const songId = searchParams.get("id");

    if (!songId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    // Verify ownership
    const song = await db.song.findUnique({ where: { id: songId }, select: { userId: true } });
    if (!song) {
      return NextResponse.json({ error: "Chanson introuvable" }, { status: 404 });
    }
    if (song.userId !== token.sub && token.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    await db.song.delete({ where: { id: songId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
