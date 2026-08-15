/**
 * MELODIA TESTS — PermissionEngine Unit Tests
 * 
 * Tests the 28 operations × 6 plans permission matrix.
 * Ensures plan hierarchy is correct and admin has all permissions.
 */

import { describe, it, expect } from "vitest";

// We need to import the module directly since it imports `db` at the top level.
// For pure logic tests, we mock db.
vi.mock("@/lib/db", () => ({
  db: {
    project: { findUnique: vi.fn() },
    media: { findUnique: vi.fn() },
    generation: { findUnique: vi.fn() },
    song: { findUnique: vi.fn() },
    artist: { findUnique: vi.fn() },
  },
}));

import {
  PermissionEngine,
  PermissionDeniedError,
} from "@/lib/core/permission-engine";
import type { MelodiaOperation } from "@/lib/core/permission-engine";

// ============ ALL OPERATIONS ============

const ALL_OPS: MelodiaOperation[] = [
  "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
  "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
  "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
  "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
  "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
  "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
  "MANAGE_ORGANIZATION", "MANAGE_MEMBERS",
  "PURCHASE_CREDITS", "CHANGE_PLAN",
  "SHARE_CONTENT",
  "ADMIN_ACCESS", "ADMIN_ANALYTICS",
];

const PLANS = ["basic", "artist_starter", "artist_production", "video_creator", "artist_pro", "label"];

// ============ PERMISSION MATRIX EXPECTATIONS ============

const EXPECTED_PERMISSIONS: Record<string, MelodiaOperation[]> = {
  basic: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT",
    "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
  ],
  artist_starter: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST",
    "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
  ],
  artist_production: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
  ],
  video_creator: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
  ],
  artist_pro: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
  ],
  label: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "MANAGE_ORGANIZATION", "MANAGE_MEMBERS",
    "PURCHASE_CREDITS", "CHANGE_PLAN", "SHARE_CONTENT",
  ],
};

// ============ TESTS ============

describe("PermissionEngine", () => {
  // ---- checkPermission ----

  describe("checkPermission", () => {
    it("returns allowed=true for admin on any operation", () => {
      for (const op of ALL_OPS) {
        const result = PermissionEngine.checkPermission("basic", "admin", op);
        expect(result.allowed).toBe(true);
        expect(result.plan).toBe("basic");
        expect(result.operation).toBe(op);
      }
    });

    it("returns correct permissions for each plan", () => {
      for (const plan of PLANS) {
        const expected = EXPECTED_PERMISSIONS[plan];
        for (const op of ALL_OPS) {
          const result = PermissionEngine.checkPermission(plan, "user", op);
          const shouldBeAllowed = expected.includes(op);
          expect(result.allowed).toBe(shouldBeAllowed);
          if (!shouldBeAllowed) {
            expect(result.reason).toContain(op);
            expect(result.reason).toContain(plan);
          }
        }
      }
    });

    it("falls back to basic for unknown plan", () => {
      const result = PermissionEngine.checkPermission("unknown_plan", "user", "CREATE_SONG");
      expect(result.allowed).toBe(true); // CREATE_SONG is in basic
    });

    it("includes reason when denied", () => {
      const result = PermissionEngine.checkPermission("basic", "user", "CREATE_VIDEO");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
      expect(result.reason).toContain("CREATE_VIDEO");
      expect(result.reason).toContain("basic");
    });

    it("does not include reason when allowed", () => {
      const result = PermissionEngine.checkPermission("basic", "user", "CREATE_SONG");
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });

  // ---- requirePermission ----

  describe("requirePermission", () => {
    it("does not throw for allowed operation", () => {
      expect(() =>
        PermissionEngine.requirePermission("basic", "user", "CREATE_SONG")
      ).not.toThrow();
    });

    it("throws PermissionDeniedError for denied operation", () => {
      expect(() =>
        PermissionEngine.requirePermission("basic", "user", "CREATE_VIDEO")
      ).toThrow(PermissionDeniedError);
    });

    it("never throws for admin", () => {
      for (const op of ALL_OPS) {
        expect(() =>
          PermissionEngine.requirePermission("basic", "admin", op)
        ).not.toThrow();
      }
    });
  });

  // ---- getPermissionsForPlan ----

  describe("getPermissionsForPlan", () => {
    it("returns all operations for admin", () => {
      const perms = PermissionEngine.getPermissionsForPlan("basic", "admin");
      expect(perms).toHaveLength(ALL_OPS.length);
      for (const op of ALL_OPS) {
        expect(perms).toContain(op);
      }
    });

    it("returns correct count per plan", () => {
      const expectedCounts: Record<string, number> = {
        basic: 13,
        artist_starter: 20,
        artist_production: 23,
        video_creator: 24,
        artist_pro: 25,
        label: 27,
      };
      for (const plan of PLANS) {
        const perms = PermissionEngine.getPermissionsForPlan(plan, "user");
        expect(perms).toHaveLength(expectedCounts[plan]);
      }
    });

    it("returns basic permissions for unknown plan", () => {
      const unknownPerms = PermissionEngine.getPermissionsForPlan("nonexistent", "user");
      const basicPerms = PermissionEngine.getPermissionsForPlan("basic", "user");
      expect(unknownPerms).toEqual(basicPerms);
    });
  });

  // ---- Plan Hierarchy ----

  describe("plan hierarchy", () => {
    it("each higher plan includes all permissions from the plan below", () => {
      const planOrder = PLANS;
      for (let i = 1; i < planOrder.length; i++) {
        const lowerPerms = PermissionEngine.getPermissionsForPlan(planOrder[i - 1], "user");
        const higherPerms = PermissionEngine.getPermissionsForPlan(planOrder[i], "user");
        for (const perm of lowerPerms) {
          if (perm !== "ADMIN_ACCESS" && perm !== "ADMIN_ANALYTICS") {
            expect(higherPerms).toContain(perm);
          }
        }
      }
    });

    it("basic plan cannot create video", () => {
      expect(PermissionEngine.checkPermission("basic", "user", "CREATE_VIDEO").allowed).toBe(false);
    });

    it("basic plan cannot delete media", () => {
      expect(PermissionEngine.checkPermission("basic", "user", "DELETE_MEDIA").allowed).toBe(false);
    });

    it("basic plan cannot manage organization", () => {
      expect(PermissionEngine.checkPermission("basic", "user", "MANAGE_ORGANIZATION").allowed).toBe(false);
    });

    it("only label plan can manage organization and members", () => {
      for (const plan of PLANS) {
        const canManageOrg = PermissionEngine.checkPermission(plan, "user", "MANAGE_ORGANIZATION").allowed;
        const canManageMembers = PermissionEngine.checkPermission(plan, "user", "MANAGE_MEMBERS").allowed;
        expect(canManageOrg).toBe(plan === "label");
        expect(canManageMembers).toBe(plan === "label");
      }
    });

    it("only artist_pro and label can delete projects", () => {
      for (const plan of PLANS) {
        const canDelete = PermissionEngine.checkPermission(plan, "user", "DELETE_PROJECT").allowed;
        expect(canDelete).toBe(plan === "artist_pro" || plan === "label");
      }
    });

    it("video capabilities unlock progressively", () => {
      // basic: no video
      expect(PermissionEngine.checkPermission("basic", "user", "CREATE_VIDEO").allowed).toBe(false);
      // artist_starter+: can create video (economy)
      expect(PermissionEngine.checkPermission("artist_starter", "user", "CREATE_VIDEO").allowed).toBe(true);
      // artist_production+: can create storyboard
      expect(PermissionEngine.checkPermission("artist_production", "user", "CREATE_STORYBOARD").allowed).toBe(true);
      expect(PermissionEngine.checkPermission("artist_starter", "user", "CREATE_STORYBOARD").allowed).toBe(false);
      // video_creator+: can export
      expect(PermissionEngine.checkPermission("video_creator", "user", "EXPORT_VIDEO").allowed).toBe(true);
      expect(PermissionEngine.checkPermission("artist_production", "user", "EXPORT_VIDEO").allowed).toBe(false);
    });

    it("AI Producer unlocks at artist_production", () => {
      expect(PermissionEngine.checkPermission("basic", "user", "USE_AI_PRODUCER").allowed).toBe(false);
      expect(PermissionEngine.checkPermission("artist_starter", "user", "USE_AI_PRODUCER").allowed).toBe(false);
      expect(PermissionEngine.checkPermission("artist_production", "user", "USE_AI_PRODUCER").allowed).toBe(true);
    });

    it("Voice Studio unlocks at artist_starter", () => {
      expect(PermissionEngine.checkPermission("basic", "user", "USE_VOICE_STUDIO").allowed).toBe(false);
      expect(PermissionEngine.checkPermission("artist_starter", "user", "USE_VOICE_STUDIO").allowed).toBe(true);
    });

    it("billing operations available to all plans", () => {
      for (const plan of PLANS) {
        expect(PermissionEngine.checkPermission(plan, "user", "PURCHASE_CREDITS").allowed).toBe(true);
        expect(PermissionEngine.checkPermission(plan, "user", "CHANGE_PLAN").allowed).toBe(true);
      }
    });
  });

  // ---- PermissionDeniedError ----

  describe("PermissionDeniedError", () => {
    it("is an Error instance", () => {
      const err = new PermissionDeniedError("test");
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(PermissionDeniedError);
      expect(err.name).toBe("PermissionDeniedError");
      expect(err.message).toBe("test");
    });
  });
});
