import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { buildUserContext } from "@/lib/core";

/**
 * GET /api/core/context
 * Returns the full UserContext for the authenticated user.
 * Frontend uses this to hydrate MelodiaProvider.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const context = await buildUserContext(token.sub);
  if (!context) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  return NextResponse.json({ context });
}
