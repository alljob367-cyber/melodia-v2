import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { db } from "@/lib/db";
import { EventBus } from "@/lib/core/event-bus";
import { z } from "zod";
import { Api } from "@/lib/core/api-responses";

/**
 * POST /api/core/subscriptions/change
 * 
 * Plan change pipeline through MelodiaCore.
 * Handles both upgrade and downgrade.
 * 
 * Pipeline: Auth → Core → Permission → Validate Plan → Update User → Update Subscription → Emit
 */
const changePlanSchema = z.object({
  newPlan: z.enum(["basic", "artist_starter", "artist_production", "video_creator", "artist_pro", "label"]),
});

// Plan prices in FCFA
const PLAN_PRICES: Record<string, number> = {
  basic: 2000,
  artist_starter: 5000,
  artist_production: 10000,
  video_creator: 15000,
  artist_pro: 25000,
  label: 50000,
};

// Plan credit allocations
const PLAN_CREDITS: Record<string, { credits: number; songs: number; covers: number; videos: number }> = {
  basic: { credits: 20, songs: 3, covers: 3, videos: 0 },
  artist_starter: { credits: 50, songs: 8, covers: 8, videos: 0 },
  artist_production: { credits: 100, songs: 15, covers: 15, videos: 0 },
  video_creator: { credits: 150, songs: 20, covers: 20, videos: 3 },
  artist_pro: { credits: 250, songs: 50, covers: 50, videos: 10 },
  label: { credits: 500, songs: 999, covers: 999, videos: 30 },
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = changePlanSchema.parse(body);

    // Initialize Core
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // Check permission
    core.requirePermission("CHANGE_PLAN");

    const currentPlan = core.getContext().plan;

    // Validate: can't change to same plan
    if (currentPlan === data.newPlan) {
      return Api.badRequest("Vous êtes déjà sur ce plan");
    }

    const isUpgrade = PLAN_PRICES[data.newPlan] > PLAN_PRICES[currentPlan];
    const allocation = PLAN_CREDITS[data.newPlan];

    // Update user plan
    await db.user.update({
      where: { id: token.sub },
      data: { plan: data.newPlan },
    });

    // Update or create subscription
    await db.subscription.upsert({
      where: { userId: token.sub },
      update: {
        plan: data.newPlan,
        status: "active",
        amountFcfa: PLAN_PRICES[data.newPlan],
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
      create: {
        userId: token.sub,
        plan: data.newPlan,
        status: "active",
        amountFcfa: PLAN_PRICES[data.newPlan],
        interval: "month",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Update credit allocation
    // On upgrade: add the new allocation. On downgrade: just update remaining limits.
    if (isUpgrade) {
      await db.userCredits.update({
        where: { userId: token.sub },
        data: {
          songsRemaining: allocation.songs,
          coversRemaining: allocation.covers,
          videosRemaining: allocation.videos,
        },
      });
    } else {
      // Downgrade: reduce remaining to new plan limits if exceeded
      const wallet = await db.userCredits.findUnique({ where: { userId: token.sub } });
      if (wallet) {
        await db.userCredits.update({
          where: { userId: token.sub },
          data: {
            songsRemaining: Math.min(wallet.songsRemaining, allocation.songs),
            coversRemaining: Math.min(wallet.coversRemaining, allocation.covers),
            videosRemaining: Math.min(wallet.videosRemaining, allocation.videos),
          },
        });
      }
    }

    // Create payment record
    await db.payment.create({
      data: {
        userId: token.sub,
        amountFcfa: PLAN_PRICES[data.newPlan],
        credits: 0,
        type: "subscription",
        provider: "manual", // In production: stripe/wave/fpay
        status: "completed",
        metadata: JSON.stringify({
          fromPlan: currentPlan,
          toPlan: data.newPlan,
          isUpgrade,
          changedAt: new Date().toISOString(),
        }),
      },
    });

    // Emit event
    await EventBus.emit({
      event: "PLAN_CHANGED",
      entityType: "subscription",
      entityId: token.sub,
      userId: token.sub,
      data: {
        fromPlan: currentPlan,
        toPlan: data.newPlan,
        isUpgrade,
        newPriceFcfa: PLAN_PRICES[data.newPlan],
      },
    });

    // Refresh context
    const newContext = await (await import("@/lib/core/user-context")).buildUserContext(token.sub);

    return Api.ok({
      planChange: {
        from: currentPlan,
        to: data.newPlan,
        isUpgrade,
        newPriceFcfa: PLAN_PRICES[data.newPlan],
      },
      context: newContext,
    });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
