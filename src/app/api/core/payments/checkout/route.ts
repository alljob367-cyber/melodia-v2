import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { PaymentOrchestrator } from "@/lib/core/payment-providers";
import { db } from "@/lib/db";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/payments/checkout
 * 
 * Create a payment checkout session with a provider (Stripe/Wave/FPay).
 * Returns a checkout URL for the user to complete payment.
 * 
 * Pipeline: Auth → Core → Permission → Create Payment → Create Checkout → Return URL
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.CheckoutSchema.parse(body);

    // Initialize Core and check permission
    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("PURCHASE_CREDITS");

    // Find the credit pack
    const pack = await db.creditPack.findFirst({
      where: { id: data.packId, isActive: true },
    });

    if (!pack) {
      return Api.notFound("Pack de crédits");
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

    return Api.ok({
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
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
