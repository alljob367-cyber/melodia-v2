import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, Api } from "@/lib/core";

/**
 * GET /api/core/subscriptions/current
 * Returns the user's current subscription details.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const subscription = await core.getCurrentSubscription();

    return Api.ok({ subscription });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
