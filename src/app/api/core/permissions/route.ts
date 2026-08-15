import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore } from "@/lib/core";
import { Api } from "@/lib/core";

/**
 * GET /api/core/permissions
 * Returns all permissions for the current user's plan.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    return Api.ok({
      plan: core.context.plan,
      permissions: core.context.permissions,
      usageLimits: core.context.usageLimits,
    });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
