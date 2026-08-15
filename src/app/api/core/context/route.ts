import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, Api } from "@/lib/core";

/**
 * GET /api/core/context
 * Returns the full UserContext for the authenticated user.
 * Frontend uses this to hydrate MelodiaProvider.
 * Uses core.initialize() + core.getContext() per the Core pattern.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const context = core.getContext();

    return Api.ok({ context });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
