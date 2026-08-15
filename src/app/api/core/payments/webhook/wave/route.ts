import { NextRequest, NextResponse } from "next/server";
import { WaveProvider, PaymentOrchestrator } from "@/lib/core/payment-providers";
import { db } from "@/lib/db";

/**
 * POST /api/core/payments/webhook/wave
 * 
 * Wave webhook handler for Senegal mobile money payments.
 * Processes payment completion and failure events.
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const result = await WaveProvider.handleWebhook(payload);

    if (result.status === "completed" && result.paymentId) {
      const payment = await db.payment.findFirst({
        where: { providerId: result.paymentId, provider: "wave" },
      });

      if (payment && payment.status !== "completed") {
        await PaymentOrchestrator.completePayment(payment.id, {
          provider: "wave",
          providerId: result.paymentId,
          status: "completed",
          amountFcfa: result.amountFcfa,
          paidAt: new Date(),
          providerData: result.providerData,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook/wave] Error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
