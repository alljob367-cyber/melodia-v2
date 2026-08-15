/**
 * MELODIA TESTS — CreditEngine Flow Integration Tests
 * 
 * Tests the complete credit pipeline:
 * 1. ESTIMATE cost
 * 2. CHECK balance
 * 3. RESERVE credits
 * 4. CONSUME on success / REFUND on failure
 * 
 * Verifies idempotency: operations called twice produce the same result.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============ MOCK DB (inline to avoid hoisting issues) ============

vi.mock("@/lib/db", () => ({
  db: {
    userCredits: {
      findUnique: vi.fn().mockResolvedValue({
        credits: 100, creditsReserved: 0,
        songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
        totalCreditsPurchased: 200, totalCreditsUsed: 50,
        userId: "user-1",
      }),
      update: vi.fn().mockResolvedValue({}),
    },
    creditTransaction: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "ct-1" }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    },
    generation: {
      update: vi.fn().mockResolvedValue({}),
    },
    eventLog: {
      create: vi.fn().mockResolvedValue({ id: "log-1" }),
    },
    $transaction: vi.fn((fns: any) => {
      if (Array.isArray(fns)) return Promise.all(fns.map((fn: any) => fn));
      return fns;
    }),
  },
}));

vi.mock("@/lib/core/event-bus", () => ({
  EventBus: {
    emit: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

import { CreditEngine, estimateCost, CREDIT_COSTS } from "@/lib/core/credit-engine";
import { db } from "@/lib/db";
import { EventBus } from "@/lib/core/event-bus";

// ============ TESTS ============

describe("CreditEngine.checkBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 0,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 50,
      userId: "user-1",
    });
  });

  it("returns hasEnough=true when credits are sufficient", async () => {
    const result = await CreditEngine.checkBalance("user-1", 50);
    expect(result.hasEnough).toBe(true);
    expect(result.available).toBe(100);
    expect(result.effective).toBe(100);
    expect(result.shortfall).toBe(0);
  });

  it("returns hasEnough=false when credits are insufficient", async () => {
    const result = await CreditEngine.checkBalance("user-1", 150);
    expect(result.hasEnough).toBe(false);
    expect(result.shortfall).toBe(50);
  });

  it("accounts for reserved credits in effective balance", async () => {
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 30,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 50,
      userId: "user-1",
    });

    const result = await CreditEngine.checkBalance("user-1", 80);
    expect(result.effective).toBe(70); // 100 - 30
    expect(result.hasEnough).toBe(false);
    expect(result.shortfall).toBe(10);
  });

  it("returns zero balance for user without wallet", async () => {
    (db.userCredits.findUnique as any).mockResolvedValue(null);

    const result = await CreditEngine.checkBalance("user-1", 10);
    expect(result.hasEnough).toBe(false);
    expect(result.available).toBe(0);
    expect(result.effective).toBe(0);
    expect(result.shortfall).toBe(10);
  });
});

describe("CreditEngine.reserve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 0,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 50,
      userId: "user-1",
    });
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
  });

  it("reserves credits successfully when balance is sufficient", async () => {
    const result = await CreditEngine.reserve("user-1", 20, "gen-1", "reserve-gen-1");
    expect(result.success).toBe(true);
    expect(result.reserved).toBe(20);
  });

  it("fails when balance is insufficient", async () => {
    const result = await CreditEngine.reserve("user-1", 150, "gen-1", "reserve-gen-1");
    expect(result.success).toBe(false);
    expect(result.reserved).toBe(0);
  });

  it("is idempotent: returns existing reservation if same idempotencyKey", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue({ amount: 20 });

    const result = await CreditEngine.reserve("user-1", 20, "gen-1", "reserve-gen-1");
    expect(result.success).toBe(true);
    expect(result.reserved).toBe(20);
  });

  it("emits CREDITS_RESERVED event", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
    await CreditEngine.reserve("user-1", 20, "gen-1", "reserve-gen-1-evt");
    expect(EventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ event: "CREDITS_RESERVED" })
    );
  });
});

describe("CreditEngine.consume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 20,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 50,
      userId: "user-1",
    });
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
  });

  it("consumes reserved credits successfully", async () => {
    const result = await CreditEngine.consume("user-1", 20, "gen-1", "consume-gen-1");
    expect(result.success).toBe(true);
    expect(result.consumed).toBe(20);
  });

  it("is idempotent: returns existing consumption if same idempotencyKey", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue({ amount: 20 });

    const result = await CreditEngine.consume("user-1", 20, "gen-1", "consume-gen-1");
    expect(result.success).toBe(true);
    expect(result.consumed).toBe(20);
  });

  it("emits CREDITS_CONSUMED event", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
    await CreditEngine.consume("user-1", 20, "gen-1", "consume-gen-1-evt");
    expect(EventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ event: "CREDITS_CONSUMED" })
    );
  });

  it("emits CREDITS_LOW event when effective balance drops below 10", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
    // After consuming, wallet has low effective balance
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 25, creditsReserved: 20, // effective = 5 (< 10)
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 50,
      userId: "user-1",
    });

    await CreditEngine.consume("user-1", 20, "gen-1", "consume-low-evt");
    expect(EventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ event: "CREDITS_LOW" })
    );
  });
});

describe("CreditEngine.refund", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 80, creditsReserved: 20,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 70,
      userId: "user-1",
    });
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
  });

  it("refunds reserved credits successfully", async () => {
    const result = await CreditEngine.refund("user-1", 20, "gen-1", "refund-gen-1");
    expect(result.success).toBe(true);
    expect(result.refunded).toBe(20);
  });

  it("is idempotent: returns existing refund if same idempotencyKey", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue({ amount: 20 });

    const result = await CreditEngine.refund("user-1", 20, "gen-1", "refund-gen-1");
    expect(result.success).toBe(true);
    expect(result.refunded).toBe(20);
  });

  it("emits CREDITS_REFUNDED event", async () => {
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
    await CreditEngine.refund("user-1", 20, "gen-1", "refund-gen-1-evt");
    expect(EventBus.emit).toHaveBeenCalledWith(
      expect.objectContaining({ event: "CREDITS_REFUNDED" })
    );
  });
});

describe("CreditEngine.getWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for user without wallet", async () => {
    (db.userCredits.findUnique as any).mockResolvedValue(null);
    const result = await CreditEngine.getWallet("unknown-user");
    expect(result).toBeNull();
  });

  it("returns wallet with effective balance", async () => {
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 15,
      songsRemaining: 10, coversRemaining: 10, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 85,
    });
    (db.creditTransaction.findMany as any).mockResolvedValue([]);

    const result = await CreditEngine.getWallet("user-1");
    expect(result).toBeDefined();
    expect(result!.effective).toBe(85); // 100 - 15
  });
});

// ============ FULL FLOW TEST ============

describe("Credit Flow: Estimate → Check → Reserve → Generate → Consume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 0,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 50,
      userId: "user-1",
    });
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
  });

  it("complete flow for audio generation (2 credits)", async () => {
    // Step 1: Estimate
    const estimate = estimateCost("generate_audio");
    expect(estimate.credits).toBe(2);

    // Step 2: Check balance
    const check = await CreditEngine.checkBalance("user-1", estimate.credits);
    expect(check.hasEnough).toBe(true);

    // Step 3: Reserve
    const reservation = await CreditEngine.reserve("user-1", estimate.credits, "gen-audio-1", "reserve-audio-1");
    expect(reservation.success).toBe(true);

    // Step 5: Consume
    const consumption = await CreditEngine.consume("user-1", estimate.credits, "gen-audio-1", "consume-audio-1");
    expect(consumption.success).toBe(true);
  });

  it("complete flow for video premium (75 credits × 3 units)", async () => {
    // Step 1: Estimate (30s = 3 units × 75 = 225 credits)
    const estimate = estimateCost("generate_video_premium", { durationSeconds: 30 });
    expect(estimate.credits).toBe(225);

    // Step 2: Check balance — not enough!
    const check = await CreditEngine.checkBalance("user-1", estimate.credits);
    expect(check.hasEnough).toBe(false);
    expect(check.shortfall).toBe(125);

    // Step 3: Reserve should fail
    const reservation = await CreditEngine.reserve("user-1", estimate.credits, "gen-vid-1", "reserve-vid-1");
    expect(reservation.success).toBe(false);
  });

  it("flow with failure and refund", async () => {
    // Step 1: Estimate
    const estimate = estimateCost("generate_cover"); // 3 credits
    expect(estimate.credits).toBe(3);

    // Step 2: Check balance
    const check = await CreditEngine.checkBalance("user-1", estimate.credits);
    expect(check.hasEnough).toBe(true);

    // Step 3: Reserve
    const reservation = await CreditEngine.reserve("user-1", estimate.credits, "gen-cover-1", "reserve-cover-1");
    expect(reservation.success).toBe(true);

    // Step 5: Refund (generation failed)
    const refund = await CreditEngine.refund("user-1", estimate.credits, "gen-cover-1", "refund-cover-1");
    expect(refund.success).toBe(true);
  });

  it("idempotency prevents double-consumption", async () => {
    // First consume succeeds
    (db.creditTransaction.findUnique as any).mockResolvedValueOnce(null);
    const result1 = await CreditEngine.consume("user-1", 5, "gen-1", "consume-idem-1");
    expect(result1.success).toBe(true);

    // Second consume with same key returns same result (no new transaction)
    (db.creditTransaction.findUnique as any).mockResolvedValueOnce({ amount: 5 });
    const result2 = await CreditEngine.consume("user-1", 5, "gen-1", "consume-idem-1");
    expect(result2.success).toBe(true);
    expect(result2.consumed).toBe(5);
  });
});
