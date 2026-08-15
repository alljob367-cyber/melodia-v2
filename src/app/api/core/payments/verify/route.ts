import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { PaymentOrchestrator } from "@/lib/core/payment-providers";
import { db } from "@/lib/db";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/payments/verify
 * 
 * Verify a payment with the provider and complete it if successful.
 * Used for polling after redirect-based checkout (Stripe/Wave/FPay).
 * 
 * Pipeline: Auth → Find Payment → Verify with Provider → Complete → Add Credits → Emit
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.VerifyPaymentSchema.parse(body);

    // Find the payment record
    const payment = await db.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!payment) {
      return Api.notFound("Paiement");
    }

    if (payment.userId !== token.sub) {
      return Api.forbidden("Accès refusé");
    }

    if (payment.status === "completed") {
      // Already completed — return current state
      const wallet = await db.userCredits.findUnique({ where: { userId: token.sub } });
      return Api.ok({
        status: "completed",
        credits: payment.credits,
        wallet: wallet ? { credits: wallet.credits, effective: wallet.credits - wallet.creditsReserved } : null,
      });
    }

    // Verify with provider
    const verification = await PaymentOrchestrator.verifyPayment(data.provider, data.checkoutId);

    if (verification.status === "completed") {
      // Complete the payment and add credits
      const result = await PaymentOrchestrator.completePayment(payment.id, verification);

      return Api.ok({
        status: "completed",
        credits: result.credits,
        wallet: result.wallet,
      });
    }

    // Payment still pending or failed
    const message = verification.status === "pending"
      ? "Paiement en cours de traitement. Réessayez dans quelques instants."
      : verification.status === "expired"
      ? "Le paiement a expiré. Veuillez réessayer."
      : "Le paiement a échoué. Veuillez réessayer.";

    return Api.ok({
      status: verification.status,
      message,
    });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
