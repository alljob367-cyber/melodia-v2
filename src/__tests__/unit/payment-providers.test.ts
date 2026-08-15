/**
 * MELODIA TESTS — PaymentOrchestrator Unit Tests
 * 
 * Tests provider routing and webhook parsing.
 * Actual API calls to Stripe/Wave/FPay are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    payment: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userCredits: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    creditTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn((fns) => Promise.all(Array.isArray(fns) ? fns : [fns])),
  },
}));

// Mock EventBus
vi.mock("@/lib/core/event-bus", () => ({
  EventBus: {
    emit: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock fetch for all payment providers
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Set required env vars
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.WAVE_API_KEY = "wave_test_123";
process.env.WAVE_BUSINESS_ID = "biz_123";
process.env.FPAY_API_KEY = "fpay_test_123";
process.env.FPAY_MERCHANT_ID = "merchant_123";
process.env.NEXTAUTH_URL = "http://localhost:3000";

import {
  PaymentOrchestrator,
  StripeProvider,
  WaveProvider,
  FPayProvider,
} from "@/lib/core/payment-providers";

// ============ TESTS ============

describe("PaymentOrchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCheckout - provider routing", () => {
    it("routes to StripeProvider for provider='stripe'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: "cs_stripe_123",
          url: "https://checkout.stripe.com/session",
          expires_at: Math.floor(Date.now() / 1000) + 1800,
        }),
      });

      const result = await PaymentOrchestrator.createCheckout("stripe", {
        userId: "user-1",
        amountFcfa: 5000,
        credits: 50,
        packId: "pack-1",
        packName: "Starter Pack",
        description: "50 credits",
      });

      expect(result.provider).toBe("stripe");
      expect(result.checkoutId).toBe("cs_stripe_123");
      expect(result.checkoutUrl).toBeDefined();
    });

    it("routes to WaveProvider for provider='wave'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: "wave_session_123",
          waveLaunchUrl: "https://pay.wave.com/session",
        }),
      });

      const result = await PaymentOrchestrator.createCheckout("wave", {
        userId: "user-1",
        amountFcfa: 5000,
        credits: 50,
        packId: "pack-1",
        description: "50 credits",
      });

      expect(result.provider).toBe("wave");
      expect(result.checkoutId).toBe("wave_session_123");
    });

    it("routes to FPayProvider for provider='fpay'", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          transactionId: "fpay_tx_123",
          paymentUrl: "https://pay.fpay.co/session",
        }),
      });

      const result = await PaymentOrchestrator.createCheckout("fpay", {
        userId: "user-1",
        amountFcfa: 5000,
        credits: 50,
        packId: "pack-1",
        description: "50 credits",
        phoneNumber: "+22177123456",
        mobileProvider: "orange",
      });

      expect(result.provider).toBe("fpay");
      expect(result.checkoutId).toBe("fpay_tx_123");
    });

    it("returns manual checkout for provider='manual'", async () => {
      const result = await PaymentOrchestrator.createCheckout("manual", {
        userId: "user-1",
        amountFcfa: 5000,
        credits: 50,
        packId: "pack-1",
        description: "Manual credits",
      });

      expect(result.provider).toBe("manual");
      expect(result.checkoutId).toContain("manual-");
      expect(result.status).toBe("pending");
    });

    it("throws for unsupported provider", async () => {
      await expect(
        PaymentOrchestrator.createCheckout("paypal" as any, {
          userId: "user-1",
          amountFcfa: 5000,
          credits: 50,
          description: "test",
        })
      ).rejects.toThrow(/Provider de paiement non supporté/);
    });
  });

  describe("verifyPayment - provider routing", () => {
    it("routes to Stripe for verification", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "complete",
          metadata: { amountFcfa: "5000" },
        }),
      });

      const result = await PaymentOrchestrator.verifyPayment("stripe", "cs_123");
      expect(result.provider).toBe("stripe");
    });

    it("routes to Wave for verification", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          paymentStatus: "completed",
          amount: 5000,
        }),
      });

      const result = await PaymentOrchestrator.verifyPayment("wave", "ws_123");
      expect(result.provider).toBe("wave");
    });

    it("routes to FPay for verification", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: "SUCCESS",
          amount: 5000,
        }),
      });

      const result = await PaymentOrchestrator.verifyPayment("fpay", "ft_123");
      expect(result.provider).toBe("fpay");
    });

    it("returns completed for manual verification", async () => {
      const result = await PaymentOrchestrator.verifyPayment("manual", "manual-123");
      expect(result.provider).toBe("manual");
      expect(result.status).toBe("completed");
    });
  });
});

describe("StripeProvider.handleWebhook", () => {
  it("handles checkout.session.completed", async () => {
    const payload = JSON.stringify({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_123",
          metadata: { internalPaymentId: "pay-1", amountFcfa: "5000" },
        },
      },
    });

    const result = await StripeProvider.handleWebhook(payload, "sig_123");
    expect(result.eventType).toBe("payment.completed");
    expect(result.paymentId).toBe("pay-1");
    expect(result.status).toBe("completed");
    expect(result.amountFcfa).toBe(5000);
  });

  it("handles checkout.session.expired", async () => {
    const payload = JSON.stringify({
      type: "checkout.session.expired",
      data: {
        object: {
          id: "cs_expired",
          metadata: { internalPaymentId: "pay-2" },
        },
      },
    });

    const result = await StripeProvider.handleWebhook(payload, "sig_123");
    expect(result.eventType).toBe("payment.expired");
    expect(result.status).toBe("failed");
  });

  it("handles unknown event type", async () => {
    const payload = JSON.stringify({
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_123" } },
    });

    const result = await StripeProvider.handleWebhook(payload, "sig_123");
    expect(result.eventType).toBe("payment_intent.succeeded");
    expect(result.status).toBe("pending");
  });
});

describe("WaveProvider.handleWebhook", () => {
  it("handles completed Wave checkout", async () => {
    const payload = JSON.stringify({
      type: "checkout.session.completed",
      data: {
        id: "ws_123",
        metadata: { internalPaymentId: "pay-3" },
        amount: 5000,
      },
    });

    const result = await WaveProvider.handleWebhook(payload);
    expect(result.eventType).toBe("payment.completed");
    expect(result.status).toBe("completed");
    expect(result.amountFcfa).toBe(5000);
  });
});

describe("FPayProvider.handleWebhook", () => {
  it("handles SUCCESS status", async () => {
    const payload = JSON.stringify({
      status: "SUCCESS",
      transactionId: "ft_123",
      metadata: { internalPaymentId: "pay-4" },
      amount: 5000,
    });

    const result = await FPayProvider.handleWebhook(payload);
    expect(result.eventType).toBe("payment.completed");
    expect(result.status).toBe("completed");
    expect(result.amountFcfa).toBe(5000);
  });

  it("handles FAILED status", async () => {
    const payload = JSON.stringify({
      status: "FAILED",
      transactionId: "ft_456",
      metadata: { internalPaymentId: "pay-5" },
      amount: 5000,
    });

    const result = await FPayProvider.handleWebhook(payload);
    expect(result.eventType).toBe("payment.failed");
    expect(result.status).toBe("failed");
  });

  it("handles CANCELLED status", async () => {
    const payload = JSON.stringify({
      status: "CANCELLED",
      transactionId: "ft_789",
      metadata: { internalPaymentId: "pay-6" },
      amount: 3000,
    });

    const result = await FPayProvider.handleWebhook(payload);
    expect(result.eventType).toBe("payment.failed");
    expect(result.status).toBe("failed");
  });

  it("handles PENDING status", async () => {
    const payload = JSON.stringify({
      status: "PENDING",
      transactionId: "ft_pending",
    });

    const result = await FPayProvider.handleWebhook(payload);
    expect(result.eventType).toBe("payment.pending");
    expect(result.status).toBe("pending");
  });
});

describe("FCFA to USD conversion", () => {
  it("Stripe converts FCFA to USD cents correctly (1 USD ≈ 600 FCFA)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: "cs_test",
        url: "https://checkout.stripe.com/test",
        expires_at: Math.floor(Date.now() / 1000) + 1800,
      }),
    });

    await StripeProvider.createCheckout({
      userId: "user-1",
      amountFcfa: 6000, // 6000 FCFA = $10.00
      credits: 50,
      description: "Test pack",
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];
    const body = callArgs[1]?.body as string;
    // 6000 FCFA / 600 = $10.00 → 1000 cents
    expect(body).toContain("1000");
  });
});
