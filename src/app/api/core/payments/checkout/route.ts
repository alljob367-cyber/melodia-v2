import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { PaymentOrchestrator } from "@/lib/core/payment-providers";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * POST /api/core/payments/checkout
 * 
 * Create a payment checkout session with a provider (Stripe/Wave/FPay).
 * Returns a checkout URL for the user to complete payment.
 * 
 * Pipeline: Auth → Core → Permission → Create Payment → Create Checkout → Return URL
 */
const checkoutSchema = z.object({
  packId: z.string(),
  provider: z.enum(["stripe", "wave", "fpay", "manual"]),
  // Mobile-specific fields
  phoneNumber: z.string().optional(),     // For Wave/FPay
  mobileProvider: z.enum(["orange", "mtn", "moov"]).optional(), // For FPay
  // Redirect URLs
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = checkoutSchema.parse(body);

    // Initialize Core and check permission
    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("PURCHASE_CREDITS");

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

    // Create pending payment record
    const idempotencyKey = `checkout-${token.sub}-${pack.id}-${Date.now()}`;
    const payment = await db.payment.create({
      data: {
        userId: token.sub,
        amountFcfa: pack.price,
        credits: pack.credits,
        type: "credit_pack",
        provider: data.provider,
        status: "pending",
        packId: pack.id,
        idempotencyKey,
        metadata: JSON.stringify({
          packName: pack.name,
          packPlan: pack.plan,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    // Create checkout with the provider
    const checkout = await PaymentOrchestrator.createCheckout(data.provider, {
      userId: token.sub,
      amountFcfa: pack.price,
      credits: pack.credits,
      packId: pack.id,
      packName: pack.name,
      description: `Pack ${pack.name}: ${pack.credits} crédits Melodia`,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      metadata: { internalPaymentId: payment.id },
      phoneNumber: data.phoneNumber,
      mobileProvider: data.mobileProvider,
    });

    // Update payment with checkout ID
    await db.payment.update({
      where: { id: payment.id },
      data: {
        providerId: checkout.checkoutId,
        metadata: JSON.stringify({
          packName: pack.name,
          packPlan: pack.plan,
          checkoutId: checkout.checkoutId,
          checkoutUrl: checkout.checkoutUrl,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amountFcfa: pack.price,
        credits: pack.credits,
        provider: data.provider,
        status: "pending",
      },
      checkout: {
        provider: checkout.provider,
        checkoutId: checkout.checkoutId,
        checkoutUrl: checkout.checkoutUrl,
        expiresAt: checkout.expiresAt,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "Permission refusée : " + err.message }, { status: 403 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/payments/checkout] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
