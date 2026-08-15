import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/**
 * GET /api/core/subscriptions/current
 * Returns the user's current subscription details.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const subscription = await db.subscription.findUnique({
    where: { userId: token.sub },
  });

  if (!subscription) {
    // Auto-create basic subscription if none exists
    const user = await db.user.findUnique({
      where: { id: token.sub },
      select: { plan: true },
    });

    return NextResponse.json({
      subscription: {
        plan: user?.plan || "basic",
        status: "active",
        amountFcfa: 0,
        interval: "month",
      },
    });
  }

  return NextResponse.json({ subscription });
}
