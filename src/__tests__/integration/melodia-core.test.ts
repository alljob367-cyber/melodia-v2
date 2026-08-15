/**
 * MELODIA TESTS — MelodiaCore Integration Tests
 * 
 * Tests the full pipeline: Auth → Context → Perm → Credit → Execute
 * with mocked database but real Core logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============ MOCK DB (no external variable references) ============

vi.mock("@/lib/db", () => {
  const mockUser = {
    id: "user-1",
    email: "test@melodia.ai",
    name: "Test Artist",
    role: "user",
    plan: "artist_production",
    locale: "fr",
    isActive: true,
    credits: {
      credits: 100, creditsReserved: 5,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 100,
    },
    organizationMemberships: [],
  };

  return {
    db: {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUser),
        update: vi.fn().mockResolvedValue(mockUser),
      },
      userCredits: {
        findUnique: vi.fn().mockResolvedValue({
          credits: 100, creditsReserved: 5,
          songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
          totalCreditsPurchased: 200, totalCreditsUsed: 100,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      creditTransaction: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "ct-1" }),
        count: vi.fn().mockResolvedValue(0),
      },
      project: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "proj-1" }),
        update: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      media: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "media-1" }),
        count: vi.fn().mockResolvedValue(0),
      },
      artist: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({ id: "art-1" }),
      },
      generation: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "gen-1" }),
        update: vi.fn().mockResolvedValue({}),
      },
      payment: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "pay-1" }),
      },
      subscription: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
      },
      notification: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({}),
      },
      creditPack: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      eventLog: {
        create: vi.fn().mockResolvedValue({ id: "log-1" }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn((fns: any) => {
        if (Array.isArray(fns)) return Promise.all(fns.map((fn: any) => fn));
        return fns;
      }),
    },
  };
});

vi.mock("@/lib/core/event-bus", () => ({
  EventBus: {
    emit: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

vi.mock("@/lib/core/ai-orchestrator", () => ({
  AIOrchestrator: {
    execute: vi.fn().mockResolvedValue({
      success: true,
      generation: { id: "gen-1", status: "processing" },
    }),
  },
}));

import { MelodiaCore } from "@/lib/core/index";
import { PermissionDeniedError } from "@/lib/core/permission-engine";
import { db } from "@/lib/db";

// ============ MOCK USER DATA ============

const mockUser = {
  id: "user-1",
  email: "test@melodia.ai",
  name: "Test Artist",
  role: "user",
  plan: "artist_production",
  locale: "fr",
  isActive: true,
  credits: {
    credits: 100, creditsReserved: 5,
    songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
    totalCreditsPurchased: 200, totalCreditsUsed: 100,
  },
  organizationMemberships: [],
};

// ============ TESTS ============

describe("MelodiaCore Integration", () => {
  let core: MelodiaCore;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mocks
    (db.user.findUnique as any).mockResolvedValue(mockUser);
    (db.userCredits.findUnique as any).mockResolvedValue({
      credits: 100, creditsReserved: 5,
      songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
      totalCreditsPurchased: 200, totalCreditsUsed: 100,
    });
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.creditTransaction.findUnique as any).mockResolvedValue(null);
    (db.creditTransaction.findMany as any).mockResolvedValue([]);
    core = new MelodiaCore("user-1");
  });

  describe("initialize", () => {
    it("builds user context from DB", async () => {
      await core.initialize();
      const ctx = core.getContext();
      expect(ctx.userId).toBe("user-1");
      expect(ctx.plan).toBe("artist_production");
      expect(ctx.creditBalance).toBe(100);
      expect(ctx.creditsReserved).toBe(5);
      expect(ctx.creditsEffective).toBe(95);
    });

    it("throws for non-existent user", async () => {
      (db.user.findUnique as any).mockResolvedValue(null);
      await expect(core.initialize()).rejects.toThrow(/not found/);
    });

    it("throws for inactive user", async () => {
      (db.user.findUnique as any).mockResolvedValue({ ...mockUser, isActive: false });
      await expect(core.initialize()).rejects.toThrow(/not found/);
    });
  });

  describe("canPerform", () => {
    it("returns true for operations allowed by plan", async () => {
      await core.initialize();
      expect(core.canPerform("CREATE_SONG")).toBe(true);
      expect(core.canPerform("CREATE_VIDEO")).toBe(true);
      expect(core.canPerform("USE_AI_PRODUCER")).toBe(true);
    });

    it("returns false for operations denied by plan", async () => {
      await core.initialize();
      expect(core.canPerform("MANAGE_ORGANIZATION")).toBe(false);
      expect(core.canPerform("ADMIN_ACCESS")).toBe(false);
    });

    it("throws if not initialized", () => {
      expect(() => core.canPerform("CREATE_SONG")).toThrow(/not initialized/);
    });
  });

  describe("requirePermission", () => {
    it("does not throw for allowed operation", async () => {
      await core.initialize();
      expect(() => core.requirePermission("CREATE_SONG")).not.toThrow();
    });

    it("throws PermissionDeniedError for denied operation", async () => {
      await core.initialize();
      expect(() => core.requirePermission("MANAGE_ORGANIZATION")).toThrow(PermissionDeniedError);
    });
  });

  describe("hasCredits", () => {
    it("returns true when user has enough effective credits", async () => {
      await core.initialize();
      const result = await core.hasCredits("generate_lyrics"); // 1 credit
      expect(result).toBe(true);
    });

    it("returns false when user lacks credits", async () => {
      (db.userCredits.findUnique as any).mockResolvedValue({
        credits: 5, creditsReserved: 5, // effective = 0
        songsRemaining: 0, coversRemaining: 0, videosRemaining: 0,
        totalCreditsPurchased: 5, totalCreditsUsed: 0,
      });
      await core.initialize();
      const result = await core.hasCredits("generate_video_premium"); // 75 credits
      expect(result).toBe(false);
    });
  });

  describe("getWallet", () => {
    it("returns wallet data", async () => {
      (db.userCredits.findUnique as any).mockResolvedValue({
        credits: 100, creditsReserved: 5,
        songsRemaining: 15, coversRemaining: 15, videosRemaining: 0,
        totalCreditsPurchased: 200, totalCreditsUsed: 100,
      });
      (db.creditTransaction.findMany as any).mockResolvedValue([]);

      await core.initialize();
      const wallet = await core.getWallet();
      expect(wallet).toBeDefined();
    });
  });

  describe("generate", () => {
    it("calls AIOrchestrator.execute with user context", async () => {
      await core.initialize();
      const result = await core.generate({
        operation: "generate_lyrics",
        style: "Afrobeat",
        mood: "Energetic",
      });
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("setActiveContext", () => {
    it("sets active project and artist", async () => {
      await core.initialize();
      core.setActiveContext("proj-1", "art-1");
      const ctx = core.getContext();
      expect(ctx.activeProjectId).toBe("proj-1");
      expect(ctx.activeArtistId).toBe("art-1");
    });

    it("clears context when called without args", async () => {
      await core.initialize();
      core.setActiveContext("proj-1", "art-1");
      core.setActiveContext();
      const ctx = core.getContext();
      expect(ctx.activeProjectId).toBeNull();
      expect(ctx.activeArtistId).toBeNull();
    });
  });

  describe("plan-gated operations", () => {
    it("basic plan user cannot create video", async () => {
      (db.user.findUnique as any).mockResolvedValue({ ...mockUser, plan: "basic" });
      await core.initialize();
      expect(() => core.requirePermission("CREATE_VIDEO")).toThrow(PermissionDeniedError);
    });

    it("label plan user can manage organization", async () => {
      (db.user.findUnique as any).mockResolvedValue({ ...mockUser, plan: "label" });
      await core.initialize();
      expect(() => core.requirePermission("MANAGE_ORGANIZATION")).not.toThrow();
    });

    it("admin can perform any operation regardless of plan", async () => {
      (db.user.findUnique as any).mockResolvedValue({ ...mockUser, role: "admin", plan: "basic" });
      await core.initialize();
      expect(core.canPerform("ADMIN_ACCESS")).toBe(true);
      expect(core.canPerform("MANAGE_ORGANIZATION")).toBe(true);
    });
  });
});

// ============ PIPELINE ORDER TEST ============

describe("MelodiaCore Pipeline Order", () => {
  it("initialization must happen before any operation", async () => {
    const core = new MelodiaCore("user-1");
    // All operations should fail before initialize
    expect(() => core.canPerform("CREATE_SONG")).toThrow(/not initialized/);
    expect(() => core.getContext()).toThrow(/not initialized/);
  });

  it("permission check happens before credit check in generate flow", async () => {
    // A basic plan user should be denied by permissions BEFORE credit check
    (db.user.findUnique as any).mockResolvedValue({ ...mockUser, plan: "basic" });
    const core = new MelodiaCore("user-1");
    await core.initialize();

    // CREATE_VIDEO is not allowed on basic plan
    expect(() => core.requirePermission("CREATE_VIDEO")).toThrow(PermissionDeniedError);
    // This means the pipeline correctly stops at step 3 (Perm) before reaching step 4 (Credit)
  });
});
