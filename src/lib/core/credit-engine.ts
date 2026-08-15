/**
 * MELODIA CREDIT ENGINE
 * 
 * Idempotent credit management pipeline:
 * 1. ESTIMATE cost
 * 2. CHECK balance
 * 3. RESERVE credits (for in-progress jobs)
 * 4. GENERATE (job runs)
 * 5. CONSUME on success / REFUND on failure
 * 
 * A generation must NEVER consume credits twice.
 */

import { db } from "../db";
import { EventBus, CoreEvent } from "./event-bus";

// ============ COST ESTIMATION ============

export type CreditOperation =
  | "generate_lyrics"       // 1 credit
  | "generate_composition"  // 1 credit
  | "generate_cover"        // 3 credits
  | "generate_audio"        // 2 credits
  | "generate_video_economy" // 20 credits per 10s
  | "generate_video_standard" // 50 credits per 10s
  | "generate_video_premium" // 75 credits per 10s
  | "generate_storyboard"   // 5 credits
  | "use_ai_producer"       // 3 credits
  | "use_voice_studio"      // 5 credits
  | "use_mix_master"        // 4 credits
  | "full_song";            // 7 credits (lyrics+comp+cover+audio)

export const CREDIT_COSTS: Record<CreditOperation, number> = {
  generate_lyrics: 1,
  generate_composition: 1,
  generate_cover: 3,
  generate_audio: 2,
  generate_video_economy: 20,
  generate_video_standard: 50,
  generate_video_premium: 75,
  generate_storyboard: 5,
  use_ai_producer: 3,
  use_voice_studio: 5,
  use_mix_master: 4,
  full_song: 7,
};

// ============ ESTIMATE ============

export interface CostEstimate {
  operation: CreditOperation;
  credits: number;
  breakdown: string;
}

export function estimateCost(
  operation: CreditOperation,
  options?: { durationSeconds?: number }
): CostEstimate {
  let credits = CREDIT_COSTS[operation];
  let breakdown = `${operation}: ${credits} credits`;

  // Video is duration-based
  if (operation.startsWith("generate_video") && options?.durationSeconds) {
    const billableUnits = Math.ceil(options.durationSeconds / 10);
    credits = billableUnits * CREDIT_COSTS[operation];
    breakdown = `${operation}: ${billableUnits} × ${CREDIT_COSTS[operation]} credits (${options.durationSeconds}s)`;
  }

  return { operation, credits, breakdown };
}

// ============ CREDIT ENGINE ============

export interface CreditCheckResult {
  hasEnough: boolean;
  available: number;
  reserved: number;
  effective: number; // available - reserved
  required: number;
  shortfall: number;
}

export class CreditEngine {
  /**
   * Check if user has enough credits (accounting for reservations)
   */
  static async checkBalance(userId: string, required: number): Promise<CreditCheckResult> {
    const wallet = await db.userCredits.findUnique({ where: { userId } });
    if (!wallet) {
      return {
        hasEnough: false,
        available: 0,
        reserved: 0,
        effective: 0,
        required,
        shortfall: required,
      };
    }

    const effective = wallet.credits - wallet.creditsReserved;
    const hasEnough = effective >= required;
    const shortfall = hasEnough ? 0 : required - effective;

    return {
      hasEnough,
      available: wallet.credits,
      reserved: wallet.creditsReserved,
      effective,
      required,
      shortfall,
    };
  }

  /**
   * RESERVE credits for an in-progress generation.
   * This prevents double-spending if user triggers multiple jobs.
   */
  static async reserve(
    userId: string,
    credits: number,
    generationId: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; reserved: number }> {
    // Check balance first
    const check = await this.checkBalance(userId, credits);
    if (!check.hasEnough) {
      return { success: false, reserved: 0 };
    }

    // Idempotency check: if this reservation already exists, skip
    const existing = await db.creditTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { success: true, reserved: existing.amount };
    }

    // Reserve: increment creditsReserved and log transaction
    await db.$transaction([
      db.userCredits.update({
        where: { userId },
        data: { creditsReserved: { increment: credits } },
      }),
      db.creditTransaction.create({
        data: {
          userId,
          type: "reserve",
          category: "generation",
          amount: credits,
          description: `Reserved for generation ${generationId}`,
          generationId,
          idempotencyKey,
        },
      }),
    ]);

    await EventBus.emit({
      event: "CREDITS_RESERVED",
      entityType: "generation",
      entityId: generationId,
      userId,
      data: { credits, generationId },
    });

    return { success: true, reserved: credits };
  }

  /**
   * CONSUME reserved credits after successful generation.
   * Idempotent: won't consume twice.
   */
  static async consume(
    userId: string,
    credits: number,
    generationId: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; consumed: number }> {
    // Idempotency check
    const existing = await db.creditTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { success: true, consumed: existing.amount };
    }

    // Consume: deduct from balance, release reservation, log debit
    await db.$transaction([
      db.userCredits.update({
        where: { userId },
        data: {
          credits: { decrement: credits },
          creditsReserved: { decrement: credits },
          totalCreditsUsed: { increment: credits },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId,
          type: "debit",
          category: "generation",
          amount: credits,
          description: `Consumed for generation ${generationId}`,
          generationId,
          idempotencyKey,
        },
      }),
    ]);

    // Mark generation as credits consumed
    await db.generation.update({
      where: { id: generationId },
      data: { creditsConsumed: true },
    });

    // Check for low credits
    const wallet = await db.userCredits.findUnique({ where: { userId } });
    const effective = (wallet?.credits || 0) - (wallet?.creditsReserved || 0);
    if (effective < 10) {
      await EventBus.emit({
        event: "CREDITS_LOW",
        userId,
        data: { effective, threshold: 10 },
      });
    }

    await EventBus.emit({
      event: "CREDITS_CONSUMED",
      entityType: "generation",
      entityId: generationId,
      userId,
      data: { credits, generationId },
    });

    return { success: true, consumed: credits };
  }

  /**
   * REFUND reserved credits if generation fails.
   * Idempotent: won't refund twice.
   */
  static async refund(
    userId: string,
    credits: number,
    generationId: string,
    idempotencyKey: string
  ): Promise<{ success: boolean; refunded: number }> {
    // Idempotency check
    const existing = await db.creditTransaction.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      return { success: true, refunded: existing.amount };
    }

    // Refund: release reservation without deducting from balance
    await db.$transaction([
      db.userCredits.update({
        where: { userId },
        data: {
          creditsReserved: { decrement: credits },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId,
          type: "refund",
          category: "generation",
          amount: credits,
          description: `Refunded for failed generation ${generationId}`,
          generationId,
          idempotencyKey,
        },
      }),
    ]);

    await EventBus.emit({
      event: "CREDITS_REFUNDED",
      entityType: "generation",
      entityId: generationId,
      userId,
      data: { credits, generationId },
    });

    return { success: true, refunded: credits };
  }

  /**
   * Get user's credit wallet summary
   */
  static async getWallet(userId: string) {
    const wallet = await db.userCredits.findUnique({ where: { userId } });
    if (!wallet) return null;

    const lastTransactions = await db.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return {
      ...wallet,
      effective: wallet.credits - wallet.creditsReserved,
      lastTransactions,
    };
  }
}
