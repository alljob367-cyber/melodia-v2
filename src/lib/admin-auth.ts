import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Verify that the current request comes from an admin user.
 * Returns null if admin, or a NextResponse error if not.
 * Use at the start of every /api/admin/* route handler.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 }
    );
  }

  if ((session.user as any)?.role !== "admin") {
    return NextResponse.json(
      { error: "Accès réservé à l'administration" },
      { status: 403 }
    );
  }

  return null; // Admin authenticated — proceed
}
