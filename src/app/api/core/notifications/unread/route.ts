import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * GET /api/core/notifications/unread
 * Returns the count of unread notifications and the list.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

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

  return NextResponse.json({ count, notifications });
}
