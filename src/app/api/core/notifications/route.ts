import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, NotificationService } from "@/lib/core";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * GET /api/core/notifications
 * List the authenticated user's notifications (paginated).
 *
 * Query params:
 *   page  — page number (default 1)
 *   limit — items per page (default 20, max 100)
 */
const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit } = listNotificationsQuerySchema.parse(queryParams);

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

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/notifications GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PATCH /api/core/notifications
 * Mark all notifications as read.
 *
 * Body: { action: "markAllRead" }
 */
const markAllReadSchema = z.object({
  action: z.literal("markAllRead"),
});

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    markAllReadSchema.parse(body);

    await NotificationService.markAllRead(token.sub);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Action invalide. Utilisez { action: \"markAllRead\" }" },
        { status: 400 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/notifications PATCH] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
