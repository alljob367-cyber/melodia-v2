import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, Api } from "@/lib/core";

/**
 * GET /api/core/notifications/unread
 * Returns the count of unread notifications and the list.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const { count, notifications } = await core.getUnreadNotifications();

    return Api.ok({ count, notifications });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
