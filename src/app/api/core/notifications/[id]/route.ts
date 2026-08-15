import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { NotificationService } from "@/lib/core";
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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify the notification belongs to the user
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification non trouvée" },
        { status: 404 }
      );
    }

    if (notification.userId !== token.sub) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const updated = await NotificationService.markRead(id);

    return NextResponse.json({ success: true, notification: updated });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/notifications/[id] PATCH] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
