import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/songs/[id] - Get a single song with lyrics
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const song = await db.song.findUnique({
      where: { id },
      include: { lyrics: true },
    });

    if (!song) {
      return NextResponse.json({ error: "Chanson introuvable" }, { status: 404 });
    }

    return NextResponse.json({ song });
  } catch (error) {
    console.error("Get song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/songs/[id] - Update a song
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const song = await db.song.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ song });
  } catch (error) {
    console.error("Update song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/songs/[id] - Delete a song
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.song.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete song error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
