/**
 * MELODIA TESTS — CreditEngine Unit Tests
 * 
 * Tests cost estimation, CREDIT_COSTS, and the credit pipeline logic.
 * CreditEngine methods that use DB are tested in integration tests.
 */

import { describe, it, expect } from "vitest";
import { estimateCost, CREDIT_COSTS } from "@/lib/core/credit-engine";
import type { CreditOperation } from "@/lib/core/credit-engine";

// ============ TESTS ============

describe("CREDIT_COSTS", () => {
  it("has cost defined for all 12 credit operations", () => {
    const operations: CreditOperation[] = [
      "generate_lyrics",
      "generate_composition",
      "generate_cover",
      "generate_audio",
      "generate_video_economy",
      "generate_video_standard",
      "generate_video_premium",
      "generate_storyboard",
      "use_ai_producer",
      "use_voice_studio",
      "use_mix_master",
      "full_song",
    ];
    expect(operations).toHaveLength(12);
    for (const op of operations) {
      expect(CREDIT_COSTS[op]).toBeDefined();
      expect(CREDIT_COSTS[op]).toBeGreaterThan(0);
    }
  });

  it("lyrics and composition cost 1 credit each", () => {
    expect(CREDIT_COSTS.generate_lyrics).toBe(1);
    expect(CREDIT_COSTS.generate_composition).toBe(1);
  });

  it("audio costs 2 credits", () => {
    expect(CREDIT_COSTS.generate_audio).toBe(2);
  });

  it("cover costs 3 credits", () => {
    expect(CREDIT_COSTS.generate_cover).toBe(3);
  });

  it("video costs are tiered: economy=20, standard=50, premium=75", () => {
    expect(CREDIT_COSTS.generate_video_economy).toBe(20);
    expect(CREDIT_COSTS.generate_video_standard).toBe(50);
    expect(CREDIT_COSTS.generate_video_premium).toBe(75);
  });

  it("storyboard costs 5 credits", () => {
    expect(CREDIT_COSTS.generate_storyboard).toBe(5);
  });

  it("AI Producer costs 3 credits", () => {
    expect(CREDIT_COSTS.use_ai_producer).toBe(3);
  });

  it("Voice Studio costs 5 credits", () => {
    expect(CREDIT_COSTS.use_voice_studio).toBe(5);
  });

  it("Mix & Master costs 4 credits", () => {
    expect(CREDIT_COSTS.use_mix_master).toBe(4);
  });

  it("full_song costs 7 credits", () => {
    expect(CREDIT_COSTS.full_song).toBe(7);
  });

  it("video costs follow economy < standard < premium hierarchy", () => {
    expect(CREDIT_COSTS.generate_video_economy).toBeLessThan(CREDIT_COSTS.generate_video_standard);
    expect(CREDIT_COSTS.generate_video_standard).toBeLessThan(CREDIT_COSTS.generate_video_premium);
  });
});

describe("estimateCost", () => {
  it("returns correct estimate for simple operations", () => {
    const estimate = estimateCost("generate_lyrics");
    expect(estimate.operation).toBe("generate_lyrics");
    expect(estimate.credits).toBe(1);
    expect(estimate.breakdown).toContain("generate_lyrics");
    expect(estimate.breakdown).toContain("1");
  });

  it("returns correct estimate for audio generation", () => {
    const estimate = estimateCost("generate_audio");
    expect(estimate.credits).toBe(2);
  });

  it("returns correct estimate for cover generation", () => {
    const estimate = estimateCost("generate_cover");
    expect(estimate.credits).toBe(3);
  });

  it("returns base cost for video without duration", () => {
    const economy = estimateCost("generate_video_economy");
    expect(economy.credits).toBe(20);

    const standard = estimateCost("generate_video_standard");
    expect(standard.credits).toBe(50);

    const premium = estimateCost("generate_video_premium");
    expect(premium.credits).toBe(75);
  });

  it("calculates duration-based cost for video economy (10s = 1 unit)", () => {
    const estimate = estimateCost("generate_video_economy", { durationSeconds: 10 });
    expect(estimate.credits).toBe(20); // 1 × 20
  });

  it("calculates duration-based cost for video standard (30s = 3 units)", () => {
    const estimate = estimateCost("generate_video_standard", { durationSeconds: 30 });
    expect(estimate.credits).toBe(150); // 3 × 50
  });

  it("calculates duration-based cost for video premium (60s = 6 units)", () => {
    const estimate = estimateCost("generate_video_premium", { durationSeconds: 60 });
    expect(estimate.credits).toBe(450); // 6 × 75
  });

  it("rounds up partial 10s units for video", () => {
    // 15 seconds = ceil(15/10) = 2 units
    const estimate = estimateCost("generate_video_economy", { durationSeconds: 15 });
    expect(estimate.credits).toBe(40); // 2 × 20
  });

  it("1 second still costs 1 unit (minimum charge)", () => {
    const estimate = estimateCost("generate_video_economy", { durationSeconds: 1 });
    expect(estimate.credits).toBe(20); // ceil(1/10) = 1 × 20
  });

  it("includes breakdown string with operation details", () => {
    const estimate = estimateCost("generate_video_economy", { durationSeconds: 25 });
    expect(estimate.breakdown).toContain("generate_video_economy");
    expect(estimate.breakdown).toContain("3"); // ceil(25/10) = 3 units
    expect(estimate.breakdown).toContain("20"); // cost per unit
  });

  it("full_song estimate returns 7 credits", () => {
    const estimate = estimateCost("full_song");
    expect(estimate.credits).toBe(7);
  });

  it("AI operations return correct estimates", () => {
    expect(estimateCost("use_ai_producer").credits).toBe(3);
    expect(estimateCost("use_voice_studio").credits).toBe(5);
    expect(estimateCost("use_mix_master").credits).toBe(4);
  });

  it("storyboard returns 5 credits", () => {
    expect(estimateCost("generate_storyboard").credits).toBe(5);
  });
});

describe("Credit Cost Consistency", () => {
  it("full_song (7cr) is cheaper than individual operations combined", () => {
    // lyrics(1) + composition(1) + cover(3) + audio(2) = 7
    const individualTotal =
      CREDIT_COSTS.generate_lyrics +
      CREDIT_COSTS.generate_composition +
      CREDIT_COSTS.generate_cover +
      CREDIT_COSTS.generate_audio;
    expect(CREDIT_COSTS.full_song).toBe(individualTotal);
  });

  it("no operation costs more than 75 credits (video premium base)", () => {
    const maxCost = Math.max(...Object.values(CREDIT_COSTS));
    expect(maxCost).toBe(75);
  });

  it("all costs are positive integers", () => {
    for (const [op, cost] of Object.entries(CREDIT_COSTS)) {
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
    }
  });
});
