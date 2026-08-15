import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { NotificationService } from "@/lib/core";
import { Api } from "@/lib/core";
import { db } from "@/lib/db";

/**
 * PATCH /api/core/notifications/[id]
 * Mark a single notification as read.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    // Verify the notification belongs to the user
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return Api.notFound("Notification");
    }

    if (notification.userId !== token.sub) {
      return Api.forbidden("Accès refusé");
    }

    const updated = await NotificationService.markRead(id);

    return Api.ok({ notification: updated });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
