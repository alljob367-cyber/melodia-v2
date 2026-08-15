import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { Api } from "@/lib/core/api-responses";

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
    const [count, notifications] = await Promise.all([
      db.notification.count({
        where: { userId: token.sub, isRead: false },
      }),
      db.notification.findMany({
        where: { userId: token.sub, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return Api.ok({ count, notifications });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
