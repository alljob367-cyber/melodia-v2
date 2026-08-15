import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { PaymentOrchestrator } from "@/lib/core/payment-providers";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * POST /api/core/payments/verify
 * 
 * Verify a payment with the provider and complete it if successful.
 * Used for polling after redirect-based checkout (Stripe/Wave/FPay).
 * 
 * Pipeline: Auth → Find Payment → Verify with Provider → Complete → Add Credits → Emit
 */
const verifySchema = z.object({
  paymentId: z.string(),     // Our internal payment ID
  checkoutId: z.string(),    // Provider's checkout/session ID
  provider: z.enum(["stripe", "wave", "fpay", "manual"]),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = verifySchema.parse(body);

    // Find the payment record
    const payment = await db.payment.findUnique({
      where: { id: data.paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Paiement non trouvé" }, { status: 404 });
    }

    if (payment.userId !== token.sub) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (payment.status === "completed") {
      // Already completed — return current state
      const wallet = await db.userCredits.findUnique({ where: { userId: token.sub } });
      return NextResponse.json({
        success: true,
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

      return NextResponse.json({
        success: true,
        status: "completed",
        credits: result.credits,
        wallet: result.wallet,
      });
    }

    // Payment still pending or failed
    return NextResponse.json({
      success: false,
      status: verification.status,
      message: verification.status === "pending"
        ? "Paiement en cours de traitement. Réessayez dans quelques instants."
        : verification.status === "expired"
        ? "Le paiement a expiré. Veuillez réessayer."
        : "Le paiement a échoué. Veuillez réessayer.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/payments/verify] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
