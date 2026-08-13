import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        credits: true,
        _count: { select: { songs: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
