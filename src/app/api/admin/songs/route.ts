import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const songs = await db.song.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
      take: 50,
    });

    return NextResponse.json({ songs });
  } catch (error) {
    console.error("Admin songs error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
