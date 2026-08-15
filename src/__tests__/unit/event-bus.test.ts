/**
 * MELODIA TESTS — EventBus Unit Tests
 * 
 * Tests the event bus subscribe/emit/unsubscribe pattern.
 * DB persistence is mocked since we test in-memory behavior.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB for EventBus using hoisted mock
vi.mock("@/lib/db", () => ({
  db: {
    eventLog: {
      create: vi.fn().mockResolvedValue({ id: "log-1" }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

// Re-import after mock
import { EventBus } from "@/lib/core/event-bus";
import type { CoreEvent, EventPayload } from "@/lib/core/event-bus";

// Get reference to the mock
const { db } = await import("@/lib/db");

// ============ TESTS ============

describe("EventBus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-setup mock return values after clear
    (db.eventLog.create as any).mockResolvedValue({ id: "log-1" });
    (db.eventLog.findMany as any).mockResolvedValue([]);
  });

  describe("on/emit", () => {
    it("notifies subscriber when event is emitted", async () => {
      const handler = vi.fn();
      EventBus.on("GENERATION_COMPLETED", handler);

      await EventBus.emit({
        event: "GENERATION_COMPLETED",
        entityType: "generation",
        entityId: "gen-123",
        userId: "user-1",
        data: { duration: 30 },
      });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          event: "GENERATION_COMPLETED",
          entityId: "gen-123",
          userId: "user-1",
        })
      );

      // Cleanup
      EventBus.off("GENERATION_COMPLETED", handler);
    });

    it("notifies multiple subscribers for the same event", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      EventBus.on("CREDITS_CONSUMED", handler1);
      EventBus.on("CREDITS_CONSUMED", handler2);

      await EventBus.emit({
        event: "CREDITS_CONSUMED",
        userId: "user-1",
        data: { credits: 5 },
      });

      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();

      EventBus.off("CREDITS_CONSUMED", handler1);
      EventBus.off("CREDITS_CONSUMED", handler2);
    });

    it("does not notify subscribers of different events", async () => {
      const handler = vi.fn();
      EventBus.on("GENERATION_COMPLETED", handler);

      await EventBus.emit({
        event: "CREDITS_CONSUMED",
        userId: "user-1",
      });

      expect(handler).not.toHaveBeenCalled();

      EventBus.off("GENERATION_COMPLETED", handler);
    });

    it("persists event to EventLog (audit trail)", async () => {
      await EventBus.emit({
        event: "PROJECT_CREATED",
        entityType: "project",
        entityId: "proj-1",
        userId: "user-1",
        data: { name: "My Album" },
      });

      expect(db.eventLog.create).toHaveBeenCalledOnce();
      expect(db.eventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            event: "PROJECT_CREATED",
            entityType: "project",
            entityId: "proj-1",
            userId: "user-1",
            processed: true,
          }),
        })
      );
    });

    it("serializes data to JSON for storage", async () => {
      await EventBus.emit({
        event: "GENERATION_COMPLETED",
        data: { credits: 5, duration: 30 },
      });

      expect(db.eventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            data: JSON.stringify({ credits: 5, duration: 30 }),
          }),
        })
      );
    });

    it("handles null entityType/entityId/userId", async () => {
      await EventBus.emit({
        event: "CREDITS_LOW",
        data: { effective: 5 },
      });

      expect(db.eventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: null,
            entityId: null,
            userId: null,
          }),
        })
      );
    });

    it("continues if subscriber throws error", async () => {
      const badHandler = vi.fn().mockRejectedValue(new Error("Subscriber error"));
      const goodHandler = vi.fn();

      EventBus.on("PLAN_CHANGED", badHandler);
      EventBus.on("PLAN_CHANGED", goodHandler);

      // Should not throw despite badHandler failing
      await EventBus.emit({
        event: "PLAN_CHANGED",
        userId: "user-1",
      });

      expect(badHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();

      EventBus.off("PLAN_CHANGED", badHandler);
      EventBus.off("PLAN_CHANGED", goodHandler);
    });
  });

  describe("off", () => {
    it("removes subscriber", async () => {
      const handler = vi.fn();
      EventBus.on("SONG_CREATED", handler);
      EventBus.off("SONG_CREATED", handler);

      await EventBus.emit({
        event: "SONG_CREATED",
        userId: "user-1",
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("does nothing if handler not found", () => {
      const handler = vi.fn();
      // Removing a handler that was never added should not throw
      expect(() => EventBus.off("UNKNOWN_EVENT", handler)).not.toThrow();
    });
  });

  describe("event types coverage", () => {
    it("all 28 CoreEvent types are valid string literals", () => {
      const events: CoreEvent[] = [
        "GENERATION_STARTED", "GENERATION_COMPLETED", "GENERATION_FAILED", "GENERATION_CANCELLED",
        "MEDIA_CREATED", "MEDIA_UPLOADED", "MEDIA_DELETED",
        "CREDITS_RESERVED", "CREDITS_CONSUMED", "CREDITS_REFUNDED", "CREDITS_LOW", "CREDITS_PURCHASED",
        "PROJECT_CREATED", "PROJECT_UPDATED", "PROJECT_ARCHIVED",
        "ARTIST_CREATED", "ARTIST_IDENTITY_UPDATED",
        "SONG_CREATED", "SONG_COMPLETED",
        "PLAN_CHANGED", "PLAN_EXPIRED",
        "SUBSCRIPTION_CREATED", "SUBSCRIPTION_CANCELLED",
        "NOTIFICATION_SENT",
        "EXPORT_COMPLETED", "EXPORT_FAILED",
        "MEDIA_UPDATED",
        "ORG_MEMBER_INVITED",
      ];
      // All should be valid string values
      for (const event of events) {
        expect(typeof event).toBe("string");
        expect(event.length).toBeGreaterThan(0);
      }
      expect(events).toHaveLength(28);
    });
  });

  describe("EventPayload interface", () => {
    it("accepts minimal payload with event only", async () => {
      const handler = vi.fn();
      EventBus.on("NOTIFICATION_SENT", handler);

      await EventBus.emit({ event: "NOTIFICATION_SENT" });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ event: "NOTIFICATION_SENT" })
      );

      EventBus.off("NOTIFICATION_SENT", handler);
    });

    it("accepts full payload with all fields", async () => {
      const handler = vi.fn();
      EventBus.on("GENERATION_COMPLETED", handler);

      const payload: EventPayload = {
        event: "GENERATION_COMPLETED",
        entityType: "generation",
        entityId: "gen-123",
        userId: "user-1",
        data: { credits: 7, duration: 30, style: "Afrobeat" },
      };

      await EventBus.emit(payload);

      expect(handler).toHaveBeenCalledWith(payload);

      EventBus.off("GENERATION_COMPLETED", handler);
    });
  });
});
