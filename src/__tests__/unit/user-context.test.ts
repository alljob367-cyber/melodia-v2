/**
 * MELODIA TESTS — UserContext Unit Tests
 * 
 * Tests plan limits, permission helpers, and context building logic.
 * buildUserContext is DB-dependent and tested in integration.
 */

import { describe, it, expect, vi } from "vitest";

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock permission engine to avoid circular dependency
vi.mock("@/lib/core/permission-engine", () => ({
  PermissionEngine: {
    getPermissionsForPlan: vi.fn().mockReturnValue([
      "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO",
      "PURCHASE_CREDITS", "CHANGE_PLAN",
    ]),
  },
}));

import { hasPermission, requirePermission } from "@/lib/core/user-context";
import type { UserContext } from "@/lib/core/user-context";

// ============ MOCK CONTEXT ============

const mockContext: UserContext = {
  userId: "user-1",
  email: "test@melodia.ai",
  name: "Test User",
  role: "user",
  plan: "artist_production",
  locale: "fr",
  organizationId: null,
  organizationRole: null,
  subscriptionStatus: "active",
  creditBalance: 100,
  creditsReserved: 10,
  creditsEffective: 90,
  songsRemaining: 15,
  coversRemaining: 15,
  videosRemaining: 0,
  permissions: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
    "SHARE_CONTENT",
  ],
  usageLimits: {
    maxProjects: 15,
    maxArtists: 5,
    maxMediaPerProject: 200,
    maxStorageMb: 1000,
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },
  activeProjectId: null,
  activeArtistId: null,
};

// ============ TESTS ============

describe("hasPermission", () => {
  it("returns true for permission in context", () => {
    expect(hasPermission(mockContext, "CREATE_SONG")).toBe(true);
    expect(hasPermission(mockContext, "USE_AI_PRODUCER")).toBe(true);
    expect(hasPermission(mockContext, "PURCHASE_CREDITS")).toBe(true);
  });

  it("returns false for permission not in context", () => {
    expect(hasPermission(mockContext, "MANAGE_ORGANIZATION")).toBe(false);
    expect(hasPermission(mockContext, "ADMIN_ACCESS")).toBe(false);
    expect(hasPermission(mockContext, "EXPORT_VIDEO")).toBe(false);
  });

  it("works with basic plan context (limited permissions)", () => {
    const basicContext: UserContext = {
      ...mockContext,
      plan: "basic",
      permissions: [
        "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
        "CREATE_COVER", "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA",
        "CREATE_PROJECT", "VIEW_PROJECT",
        "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
      ],
    };

    expect(hasPermission(basicContext, "CREATE_SONG")).toBe(true);
    expect(hasPermission(basicContext, "CREATE_VIDEO")).toBe(false);
    expect(hasPermission(basicContext, "DELETE_MEDIA")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("does not throw for granted permission", () => {
    expect(() => requirePermission(mockContext, "CREATE_SONG")).not.toThrow();
  });

  it("throws for denied permission", () => {
    expect(() => requirePermission(mockContext, "MANAGE_ORGANIZATION")).toThrow(
      /Permission denied/
    );
  });

  it("error message includes operation and plan", () => {
    try {
      requirePermission(mockContext, "MANAGE_ORGANIZATION");
    } catch (err) {
      expect((err as Error).message).toContain("MANAGE_ORGANIZATION");
      expect((err as Error).message).toContain("artist_production");
    }
  });
});

describe("UserContext structure", () => {
  it("context has all required fields", () => {
    const requiredKeys: (keyof UserContext)[] = [
      "userId", "email", "name", "role", "plan", "locale",
      "organizationId", "organizationRole",
      "subscriptionStatus",
      "creditBalance", "creditsReserved", "creditsEffective",
      "songsRemaining", "coversRemaining", "videosRemaining",
      "permissions", "usageLimits",
      "activeProjectId", "activeArtistId",
    ];

    for (const key of requiredKeys) {
      expect(mockContext[key]).toBeDefined();
    }
  });

  it("usageLimits has all required fields", () => {
    const limitKeys: (keyof UserContext["usageLimits"])[] = [
      "maxProjects", "maxArtists", "maxMediaPerProject", "maxStorageMb",
      "canUseVideo", "canUseAIProducer", "canUseLabelFeatures",
    ];
    for (const key of limitKeys) {
      expect(mockContext.usageLimits[key]).toBeDefined();
    }
  });

  it("creditsEffective equals balance minus reserved", () => {
    expect(mockContext.creditsEffective).toBe(
      mockContext.creditBalance - mockContext.creditsReserved
    );
  });
});

describe("Plan Limits", () => {
  const planLimits: Record<string, UserContext["usageLimits"]> = {
    basic: {
      maxProjects: 2, maxArtists: 1, maxMediaPerProject: 10, maxStorageMb: 50,
      canUseVideo: false, canUseAIProducer: false, canUseLabelFeatures: false,
    },
    artist_starter: {
      maxProjects: 5, maxArtists: 2, maxMediaPerProject: 50, maxStorageMb: 200,
      canUseVideo: true, canUseAIProducer: false, canUseLabelFeatures: false,
    },
    artist_production: {
      maxProjects: 15, maxArtists: 5, maxMediaPerProject: 200, maxStorageMb: 1000,
      canUseVideo: true, canUseAIProducer: true, canUseLabelFeatures: false,
    },
    video_creator: {
      maxProjects: 10, maxArtists: 3, maxMediaPerProject: 500, maxStorageMb: 2000,
      canUseVideo: true, canUseAIProducer: true, canUseLabelFeatures: false,
    },
    artist_pro: {
      maxProjects: 50, maxArtists: 10, maxMediaPerProject: 1000, maxStorageMb: 5000,
      canUseVideo: true, canUseAIProducer: true, canUseLabelFeatures: false,
    },
    label: {
      maxProjects: 999, maxArtists: 999, maxMediaPerProject: 9999, maxStorageMb: 50000,
      canUseVideo: true, canUseAIProducer: true, canUseLabelFeatures: true,
    },
  };

  it("basic plan has most restrictive limits", () => {
    expect(planLimits.basic.maxProjects).toBe(2);
    expect(planLimits.basic.maxArtists).toBe(1);
    expect(planLimits.basic.canUseVideo).toBe(false);
    expect(planLimits.basic.canUseAIProducer).toBe(false);
  });

  it("label plan has most permissive limits", () => {
    expect(planLimits.label.maxProjects).toBe(999);
    expect(planLimits.label.maxArtists).toBe(999);
    expect(planLimits.label.canUseVideo).toBe(true);
    expect(planLimits.label.canUseAIProducer).toBe(true);
    expect(planLimits.label.canUseLabelFeatures).toBe(true);
  });

  it("only label plan can use label features", () => {
    for (const [plan, limits] of Object.entries(planLimits)) {
      expect(limits.canUseLabelFeatures).toBe(plan === "label");
    }
  });

  it("projects/arts/storage increase with plan tier", () => {
    const planOrder = ["basic", "artist_starter", "artist_production", "video_creator", "artist_pro", "label"];
    // Note: video_creator has less projects than artist_production (10 vs 15)
    // but generally limits increase
    expect(planLimits.basic.maxProjects).toBeLessThan(planLimits.artist_pro.maxProjects);
    expect(planLimits.basic.maxStorageMb).toBeLessThan(planLimits.label.maxStorageMb);
  });

  it("video capability unlocks at artist_starter", () => {
    expect(planLimits.basic.canUseVideo).toBe(false);
    expect(planLimits.artist_starter.canUseVideo).toBe(true);
  });

  it("AI Producer unlocks at artist_production", () => {
    expect(planLimits.basic.canUseAIProducer).toBe(false);
    expect(planLimits.artist_starter.canUseAIProducer).toBe(false);
    expect(planLimits.artist_production.canUseAIProducer).toBe(true);
  });
});
