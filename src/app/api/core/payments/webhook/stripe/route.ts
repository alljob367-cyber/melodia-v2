import { NextRequest, NextResponse } from "next/server";
import { StripeProvider, PaymentOrchestrator } from "@/lib/core/payment-providers";
import { Api } from "@/lib/core";
import { db } from "@/lib/db";

/**
 * POST /api/core/payments/webhook/stripe
 * 
 * Stripe webhook handler.
 * Processes checkout.session.completed and checkout.session.expired events.
 * Validates the Stripe-Signature header.
 * 
 * ⚠️ This route must be excluded from auth middleware (it's called by Stripe, not the user).
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    const result = await StripeProvider.handleWebhook(payload, signature);

    if (result.status === "completed" && result.paymentId) {
      const payment = await db.payment.findFirst({
        where: { providerId: result.paymentId, provider: "stripe" },
      });

      if (payment && payment.status !== "completed") {
        await PaymentOrchestrator.completePayment(payment.id, {
          provider: "stripe",
          providerId: result.paymentId,
          status: "completed",
          amountFcfa: result.amountFcfa,
          paidAt: new Date(),
          providerData: result.providerData,
        });
      }
    }

    if (result.status === "failed" && result.paymentId) {
      const payment = await db.payment.findFirst({
        where: { providerId: result.paymentId, provider: "stripe" },
      });
      if (payment && payment.status === "pending") {
        await db.payment.update({
          where: { id: payment.id },
          data: { status: "failed" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/stripe] Error:", err);
    return Api.internalError("Webhook processing failed");
  }
}
