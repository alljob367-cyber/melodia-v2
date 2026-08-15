import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore } from "@/lib/core";
import { CreditEngine, estimateCost } from "@/lib/core/credit-engine";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * POST /api/core/credits/purchase
 * 
 * Credit purchase pipeline through MelodiaCore.
 * In production, this would integrate with Stripe/Wave/FPay.
 * For now, it simulates an immediate credit addition.
 * 
 * Pipeline: Auth → Core → Permission → Select Pack → Create Payment → Add Credits → Emit
 */
const purchaseSchema = z.object({
  packId: z.string(), // Credit pack to purchase
  paymentProvider: z.enum(["stripe", "wave", "fpay", "orange_money", "manual"]).default("manual"),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = purchaseSchema.parse(body);

    // Initialize Core
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // Check permission
    core.requirePermission("PURCHASE_CREDITS" as any);

    // Find the credit pack
    const pack = await db.creditPack.findFirst({
      where: { id: data.packId, isActive: true },
    });

    if (!pack) {
      return NextResponse.json(
        { error: "Pack de crédits non trouvé ou inactif" },
        { status: 404 }
      );
    }

    const idempotencyKey = `purchase-${token.sub}-${pack.id}-${Date.now()}`;

    // Create Payment record
    const payment = await db.payment.create({
      data: {
        userId: token.sub,
        amountFcfa: pack.price,
        credits: pack.credits,
        type: "credit_pack",
        provider: data.paymentProvider,
        status: "completed", // In production, this would be "pending" until provider confirms
        packId: pack.id,
        idempotencyKey,
        metadata: JSON.stringify({
          packName: pack.name,
          packPlan: pack.plan,
          purchasedAt: new Date().toISOString(),
        }),
      },
    });

    // Add credits to user wallet (atomic transaction)
    await db.$transaction([
      db.userCredits.update({
        where: { userId: token.sub },
        data: {
          credits: { increment: pack.credits },
          songsRemaining: { increment: pack.songsLimit },
          coversRemaining: { increment: pack.coversLimit },
          videosRemaining: { increment: pack.videosLimit },
          totalCreditsPurchased: { increment: pack.credits },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId: token.sub,
          type: "credit",
          category: "purchase",
          amount: pack.credits,
          description: `Achat pack ${pack.name}: ${pack.credits} crédits (${pack.price} FCFA)`,
          packId: pack.id,
          paymentId: payment.id,
          idempotencyKey: `credit-${idempotencyKey}`,
        },
      }),
    ]);

    // Emit event
    const { EventBus } = await import("@/lib/core/event-bus");
    await EventBus.emit({
      event: "CREDITS_PURCHASED",
      entityType: "payment",
      entityId: payment.id,
      userId: token.sub,
      data: {
        packId: pack.id,
        packName: pack.name,
        credits: pack.credits,
        priceFcfa: pack.price,
        provider: data.paymentProvider,
      },
    });

    // Get updated wallet
    const wallet = await CreditEngine.getWallet(token.sub);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amountFcfa: pack.price,
        credits: pack.credits,
        provider: data.paymentProvider,
        status: "completed",
      },
      wallet,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/credits/purchase] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
