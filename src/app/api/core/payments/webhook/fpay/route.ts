import { NextRequest, NextResponse } from "next/server";
import { FPayProvider, PaymentOrchestrator } from "@/lib/core/payment-providers";
import { Api } from "@/lib/core";
import { db } from "@/lib/db";

/**
 * POST /api/core/payments/webhook/fpay
 * 
 * FPay webhook handler for Orange Money, MTN, Moov payments.
 * Processes payment SUCCESS and FAILED events.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const result = await FPayProvider.handleWebhook(payload);

    if (result.status === "completed" && result.paymentId) {
      const payment = await db.payment.findFirst({
        where: { providerId: result.paymentId, provider: "fpay" },
      });

      if (payment && payment.status !== "completed") {
        await PaymentOrchestrator.completePayment(payment.id, {
          provider: "fpay",
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
        where: { providerId: result.paymentId, provider: "fpay" },
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
    console.error("[webhook/fpay] Error:", err);
    return Api.internalError("Webhook processing failed");
  }
}
