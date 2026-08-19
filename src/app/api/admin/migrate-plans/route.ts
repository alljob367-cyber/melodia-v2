import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

/**
 * One-time migration: fix old plan names in DB.
 * Old (V3): decouverte, production, artiste_actif, video_studio
 * New (V4): basic, artist_starter, artist_production, video_creator
 */
const PLAN_MIGRATION: Record<string, string> = {
  decouverte: "basic",
  production: "artist_starter",
  artiste_actif: "artist_production",
  video_studio: "video_creator",
};

export async function POST() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    let totalMigrated = 0;

    // Migrate User plans
    for (const [oldPlan, newPlan] of Object.entries(PLAN_MIGRATION)) {
      const result = await db.user.updateMany({
        where: { plan: oldPlan },
        data: { plan: newPlan },
      });
      if (result.count > 0) {
        totalMigrated += result.count;
      }
    }

    // Migrate Subscription plans
    for (const [oldPlan, newPlan] of Object.entries(PLAN_MIGRATION)) {
      const result = await db.subscription.updateMany({
        where: { plan: oldPlan },
        data: { plan: newPlan },
      });
      if (result.count > 0) {
        totalMigrated += result.count;
      }
    }

    // Migrate CreditPack plan field
    for (const [oldPlan, newPlan] of Object.entries(PLAN_MIGRATION)) {
      const result = await db.creditPack.updateMany({
        where: { plan: oldPlan },
        data: { plan: newPlan },
      });
      if (result.count > 0) {
        totalMigrated += result.count;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration: ${totalMigrated} records updated`,
      totalMigrated,
    });
  } catch (error) {
    console.error("[migrate] Error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
