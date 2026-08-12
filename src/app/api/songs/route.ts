import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/songs - List songs for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

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
    const body = await req.json();
    const { userId, title, style, mood, theme, language } = body;

    if (!userId || !title || !style) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const song = await db.song.create({
      data: {
        userId,
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

// DELETE /api/songs - Delete a song
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get("id");

    if (!songId) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await db.song.delete({ where: { id: songId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
