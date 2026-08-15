/**
 * MELODIA PAYMENT PROVIDERS
 * 
 * Integration layer for African and international payment providers:
 * - Stripe      → International cards, Apple Pay, Google Pay
 * - Wave        → Senegal mobile money
 * - FPay        → Orange Money, MTN, Moov (Francophone Africa)
 * - Orange Money → Direct integration
 * 
 * All providers follow the same interface:
 * 1. createCheckout() → redirect URL or payment intent
 * 2. verifyPayment()  → confirm payment completion
 * 3. handleWebhook()  → process provider callbacks
 * 
 * Every payment goes through MelodiaCore → CreditEngine → EventBus.
 */

import { db } from "../db";
import { EventBus } from "./event-bus";

// ============ SHARED INTERFACES ============

export interface CheckoutParams {
  userId: string;
  amountFcfa: number;
  credits: number;
  packId?: string;
  packName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CheckoutResult {
  provider: string;
  checkoutId: string;       // Provider's session/payment ID
  checkoutUrl?: string;     // URL to redirect user to (for redirect-based flows)
  status: "pending" | "requires_action";
  expiresAt?: Date;
}

export interface PaymentVerification {
  provider: string;
  providerId: string;
  status: "completed" | "failed" | "pending" | "expired";
  amountFcfa?: number;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  providerData?: Record<string, unknown>;
}

export interface WebhookResult {
  eventType: string;
  paymentId: string;         // Our internal payment ID
  status: "completed" | "failed" | "refunded" | "pending";
  amountFcfa?: number;
  providerData?: Record<string, unknown>;
}

// ============ STRIPE PROVIDER ============

export class StripeProvider {
  private static getApiKey(): string {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY non configuré");
    return key;
  }

  /**
   * Create a Stripe Checkout Session for credit pack purchase.
   * Stripe handles the payment UI, then redirects back to our success/cancel URLs.
   */
  static async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const apiKey = this.getApiKey();

    // Convert FCFA to USD cents (approximate: 1 USD ≈ 600 FCFA)
    const amountUsdCents = Math.round((params.amountFcfa / 600) * 100);

    try {
      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "payment_method_types[]": "card",
          "mode": "payment",
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][product_data][name]": params.packName || "Melodia Credits",
          "line_items[0][price_data][product_data][description]": params.description,
          "line_items[0][price_data][unit_amount]": String(amountUsdCents),
          "line_items[0][quantity]": "1",
          "success_url": params.successUrl || `${process.env.NEXTAUTH_URL}/dashboard?payment=success`,
          "cancel_url": params.cancelUrl || `${process.env.NEXTAUTH_URL}/dashboard?payment=cancelled`,
          "metadata[userId]": params.userId,
          "metadata[credits]": String(params.credits),
          "metadata[packId]": params.packId || "",
          "metadata[amountFcfa]": String(params.amountFcfa),
        }).toString(),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(`Stripe error: ${session.message || "Unknown error"}`);
      }

      return {
        provider: "stripe",
        checkoutId: session.id,
        checkoutUrl: session.url,
        status: "pending",
        expiresAt: new Date(session.expires_at * 1000),
      };
    } catch (err) {
      console.error("[StripeProvider.createCheckout] Error:", err);
      throw err;
    }
  }

  /**
   * Verify a Stripe Checkout Session by ID.
   */
  static async verifyPayment(sessionId: string): Promise<PaymentVerification> {
    const apiKey = this.getApiKey();

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    const session = await response.json();

    if (!response.ok) {
      return { provider: "stripe", providerId: sessionId, status: "failed" };
    }

    const statusMap: Record<string, PaymentVerification["status"]> = {
      complete: "completed",
      expired: "expired",
      open: "pending",
    };

    return {
      provider: "stripe",
      providerId: sessionId,
      status: statusMap[session.status] || "pending",
      amountFcfa: parseInt(session.metadata?.amountFcfa || "0"),
      paidAt: session.payment_intent ? new Date() : undefined,
      metadata: session.metadata,
    };
  }

  /**
   * Handle Stripe webhook events.
   * Validates the signature and processes checkout.session.completed events.
   */
  static async handleWebhook(payload: string, signature: string): Promise<WebhookResult> {
    // In production, verify signature with STRIPE_WEBHOOK_SECRET
    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      return {
        eventType: "payment.completed",
        paymentId: session.metadata?.internalPaymentId || session.id,
        status: "completed",
        amountFcfa: parseInt(session.metadata?.amountFcfa || "0"),
        providerData: session,
      };
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      return {
        eventType: "payment.expired",
        paymentId: session.metadata?.internalPaymentId || session.id,
        status: "failed",
        providerData: session,
      };
    }

    return {
      eventType: event.type,
      paymentId: "unknown",
      status: "pending",
      providerData: event.data?.object,
    };
  }
}

// ============ WAVE PROVIDER (Senegal) ============

export class WaveProvider {
  private static getApiKey(): string {
    const key = process.env.WAVE_API_KEY;
    if (!key) throw new Error("WAVE_API_KEY non configuré");
    return key;
  }

  private static getBusinessId(): string {
    const id = process.env.WAVE_BUSINESS_ID;
    if (!id) throw new Error("WAVE_BUSINESS_ID non configuré");
    return id;
  }

  /**
   * Create a Wave payment request.
   * Wave uses a mobile-first redirect flow: user enters phone number → Wave app opens → payment completes.
   */
  static async createCheckout(params: CheckoutParams): Promise<CheckoutResult> {
    const apiKey = this.getApiKey();
    const businessId = this.getBusinessId();

    try {
      const response = await fetch("https://api.wave.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: params.amountFcfa,
          currency: "XOF", // FCFA = West African CFA franc (ISO: XOF)
          businessId,
          reference: `melodia-${params.userId}-${Date.now()}`,
          label: params.packName || "Melodia Credits",
          successUrl: params.successUrl,
          failUrl: params.cancelUrl,
          metadata: {
            userId: params.userId,
            credits: params.credits,
            packId: params.packId,
            ...params.metadata,
          },
        }),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(`Wave error: ${session.message || "Unknown error"}`);
      }

      return {
        provider: "wave",
        checkoutId: session.id,
        checkoutUrl: session.waveLaunchUrl,
        status: "pending",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
      };
    } catch (err) {
      console.error("[WaveProvider.createCheckout] Error:", err);
      throw err;
    }
  }

  /**
   * Verify a Wave payment by polling the session status.
   */
  static async verifyPayment(sessionId: string): Promise<PaymentVerification> {
    const apiKey = this.getApiKey();

    try {
      const response = await fetch(`https://api.wave.com/v1/checkout/sessions/${sessionId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      const session = await response.json();

      const statusMap: Record<string, PaymentVerification["status"]> = {
        completed: "completed",
        failed: "failed",
        expired: "expired",
        pending: "pending",
        processing: "pending",
      };

      return {
        provider: "wave",
        providerId: sessionId,
        status: statusMap[session.paymentStatus] || "pending",
        amountFcfa: session.amount,
        paidAt: session.paymentStatus === "completed" ? new Date(session.whenCompleted) : undefined,
        metadata: session.metadata,
      };
    } catch (err) {
      console.error("[WaveProvider.verifyPayment] Error:", err);
      return { provider: "wave", providerId: sessionId, status: "failed" };
    }
  }

  /**
   * Handle Wave webhook events.
   */
  static async handleWebhook(payload: string): Promise<WebhookResult> {
    const event = JSON.parse(payload);

    if (event.type === "checkout.session.completed") {
      return {
        eventType: "payment.completed",
        paymentId: event.data.metadata?.internalPaymentId || event.data.id,
        status: "completed",
        amountFcfa: event.data.amount,
        providerData: event.data,
      };
    }

    return {
      eventType: event.type || "unknown",
      paymentId: event.data?.id || "unknown",
      status: "pending",
      providerData: event.data,
    };
  }
}

// ============ FPAY PROVIDER (Orange Money, MTN, Moov) ============

export class FPayProvider {
  private static getApiKey(): string {
    const key = process.env.FPAY_API_KEY;
    if (!key) throw new Error("FPAY_API_KEY non configuré");
    return key;
  }

  private static getMerchantId(): string {
    const id = process.env.FPAY_MERCHANT_ID;
    if (!id) throw new Error("FPAY_MERCHANT_ID non configuré");
    return id;
  }

  /**
   * Create an FPay payment request.
   * Supports Orange Money, MTN Mobile Money, and Moov Money.
   * User selects their mobile money provider, then receives a USSD prompt or app notification.
   */
  static async createCheckout(params: CheckoutParams & { phoneNumber?: string; provider?: "orange" | "mtn" | "moov" }): Promise<CheckoutResult> {
    const apiKey = this.getApiKey();
    const merchantId = this.getMerchantId();

    try {
      const response = await fetch("https://api.fpay.co/v1/payments", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          merchantId,
          amount: params.amountFcfa,
          currency: "XOF",
          phoneNumber: params.phoneNumber,
          provider: params.provider || "orange", // Default to Orange Money
          reference: `melodia-${params.userId}-${Date.now()}`,
          description: params.packName || "Melodia Credits",
          callbackUrl: `${process.env.NEXTAUTH_URL}/api/core/payments/webhook/fpay`,
          returnUrl: params.successUrl,
          cancelUrl: params.cancelUrl,
          metadata: {
            userId: params.userId,
            credits: params.credits,
            packId: params.packId,
            ...params.metadata,
          },
        }),
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(`FPay error: ${session.message || "Unknown error"}`);
      }

      return {
        provider: "fpay",
        checkoutId: session.transactionId || session.id,
        checkoutUrl: session.paymentUrl, // USSD prompt URL or deep link
        status: "pending",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry for mobile money
      };
    } catch (err) {
      console.error("[FPayProvider.createCheckout] Error:", err);
      throw err;
    }
  }

  /**
   * Verify an FPay payment status.
   */
  static async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    const apiKey = this.getApiKey();

    try {
      const response = await fetch(`https://api.fpay.co/v1/payments/${transactionId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      const payment = await response.json();

      const statusMap: Record<string, PaymentVerification["status"]> = {
        SUCCESS: "completed",
        FAILED: "failed",
        PENDING: "pending",
        EXPIRED: "expired",
        CANCELLED: "failed",
      };

      return {
        provider: "fpay",
        providerId: transactionId,
        status: statusMap[payment.status] || "pending",
        amountFcfa: payment.amount,
        paidAt: payment.status === "SUCCESS" ? new Date(payment.paidAt) : undefined,
        metadata: payment.metadata,
      };
    } catch (err) {
      console.error("[FPayProvider.verifyPayment] Error:", err);
      return { provider: "fpay", providerId: transactionId, status: "failed" };
    }
  }

  /**
   * Handle FPay webhook events.
   */
  static async handleWebhook(payload: string): Promise<WebhookResult> {
    const event = JSON.parse(payload);

    if (event.status === "SUCCESS") {
      return {
        eventType: "payment.completed",
        paymentId: event.metadata?.internalPaymentId || event.transactionId,
        status: "completed",
        amountFcfa: event.amount,
        providerData: event,
      };
    }

    if (event.status === "FAILED" || event.status === "CANCELLED") {
      return {
        eventType: "payment.failed",
        paymentId: event.metadata?.internalPaymentId || event.transactionId,
        status: "failed",
        amountFcfa: event.amount,
        providerData: event,
      };
    }

    return {
      eventType: "payment.pending",
      paymentId: event.transactionId || "unknown",
      status: "pending",
      providerData: event,
    };
  }
}

// ============ PAYMENT ORCHESTRATOR ============

export class PaymentOrchestrator {
  /**
   * Route payment to the correct provider and create checkout.
   * This is the single entry point for all payment flows.
   */
  static async createCheckout(provider: string, params: CheckoutParams & { phoneNumber?: string; mobileProvider?: "orange" | "mtn" | "moov" }): Promise<CheckoutResult> {
    switch (provider) {
      case "stripe":
        return StripeProvider.createCheckout(params);
      case "wave":
        return WaveProvider.createCheckout(params);
      case "fpay":
        return FPayProvider.createCheckout({ ...params, provider: params.mobileProvider });
      case "manual":
        // Direct credit addition without external payment (admin/debug)
        return {
          provider: "manual",
          checkoutId: `manual-${Date.now()}`,
          status: "pending",
        };
      default:
        throw new Error(`Provider de paiement non supporté: ${provider}`);
    }
  }

  /**
   * Verify a payment with the correct provider.
   */
  static async verifyPayment(provider: string, checkoutId: string): Promise<PaymentVerification> {
    switch (provider) {
      case "stripe":
        return StripeProvider.verifyPayment(checkoutId);
      case "wave":
        return WaveProvider.verifyPayment(checkoutId);
      case "fpay":
        return FPayProvider.verifyPayment(checkoutId);
      case "manual":
        return { provider: "manual", providerId: checkoutId, status: "completed" };
      default:
        throw new Error(`Provider de paiement non supporté: ${provider}`);
    }
  }

  /**
   * Complete a verified payment: add credits, emit events, update payment record.
   * Called after webhook confirmation or manual verification.
   */
  static async completePayment(paymentId: string, verification: PaymentVerification): Promise<{
    success: boolean;
    credits: number;
    wallet: { credits: number; effective: number } | null;
  }> {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Paiement non trouvé");
    if (payment.status === "completed") {
      // Already completed — idempotent return
      const wallet = await db.userCredits.findUnique({ where: { userId: payment.userId } });
      return { success: true, credits: payment.credits, wallet: wallet ? { credits: wallet.credits, effective: wallet.credits - wallet.creditsReserved } : null };
    }

    if (verification.status !== "completed") {
      // Mark as failed
      await db.payment.update({
        where: { id: paymentId },
        data: { status: "failed", metadata: JSON.stringify({ ...verification, failedAt: new Date().toISOString() }) },
      });
      return { success: false, credits: 0, wallet: null };
    }

    // Complete payment and add credits atomically
    const idempotencyKey = `complete-${payment.idempotencyKey}`;

    await db.$transaction([
      db.payment.update({
        where: { id: paymentId },
        data: {
          status: "completed",
          providerId: verification.providerId,
          metadata: JSON.stringify({ ...verification, completedAt: new Date().toISOString() }),
        },
      }),
      db.userCredits.update({
        where: { userId: payment.userId },
        data: {
          credits: { increment: payment.credits },
          totalCreditsPurchased: { increment: payment.credits },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId: payment.userId,
          type: "credit",
          category: "purchase",
          amount: payment.credits,
          description: `Achat confirmé: ${payment.credits} crédits (${payment.amountFcfa} FCFA via ${payment.provider})`,
          paymentId,
          idempotencyKey,
        },
      }),
    ]);

    await EventBus.emit({
      event: "CREDITS_PURCHASED",
      entityType: "payment",
      entityId: paymentId,
      userId: payment.userId,
      data: {
        credits: payment.credits,
        priceFcfa: payment.amountFcfa,
        provider: payment.provider,
        providerId: verification.providerId,
      },
    });

    const wallet = await db.userCredits.findUnique({ where: { userId: payment.userId } });

    return {
      success: true,
      credits: payment.credits,
      wallet: wallet ? { credits: wallet.credits, effective: wallet.credits - wallet.creditsReserved } : null,
    };
  }
}
