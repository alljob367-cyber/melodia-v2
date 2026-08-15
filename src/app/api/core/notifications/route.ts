import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, NotificationService } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";
import { db } from "@/lib/db";

/**
 * GET /api/core/notifications
 * List the authenticated user's notifications (paginated).
 *
 * Query params:
 *   page  — page number (default 1)
 *   limit — items per page (default 20, max 100)
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit } = ApiSchemas.ListNotificationsSchema.parse(queryParams);

    const where = { userId: token.sub };
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      db.notification.count({ where }),
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return Api.paginated(notifications, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}

/**
 * PATCH /api/core/notifications
 * Mark all notifications as read.
 *
 * Body: { action: "markAllRead" }
 */
export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    ApiSchemas.MarkNotificationsSchema.parse(body);

    await NotificationService.markAllRead(token.sub);

    return Api.ack();
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
