import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { buildUserContext } from "@/lib/core";
import { Api } from "@/lib/core/api-responses";

/**
 * GET /api/core/context
 * Returns the full UserContext for the authenticated user.
 * Frontend uses this to hydrate MelodiaProvider.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const context = await buildUserContext(token.sub);
    if (!context) {
      return Api.notFound("Utilisateur");
    }

    return Api.ok({ context });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
