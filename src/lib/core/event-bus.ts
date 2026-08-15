/**
 * MELODIA EVENT BUS — Internal Event System
 * 
 * Decouples services by using an event-driven architecture.
 * Any service can emit events; any service can subscribe.
 * Events are also persisted to EventLog for audit trail.
 */

import { db } from "../db";

// ============ EVENT TYPES ============

export type CoreEvent =
  // Generation events
  | "GENERATION_STARTED"
  | "GENERATION_COMPLETED"
  | "GENERATION_FAILED"
  | "GENERATION_CANCELLED"
  // Media events
  | "MEDIA_CREATED"
  | "MEDIA_UPLOADED"
  | "MEDIA_DELETED"
  // Credit events
  | "CREDITS_RESERVED"
  | "CREDITS_CONSUMED"
  | "CREDITS_REFUNDED"
  | "CREDITS_LOW"
  | "CREDITS_PURCHASED"
  // Project events
  | "PROJECT_CREATED"
  | "PROJECT_UPDATED"
  | "PROJECT_ARCHIVED"
  // Artist events
  | "ARTIST_CREATED"
  | "ARTIST_IDENTITY_UPDATED"
  // Song events
  | "SONG_CREATED"
  | "SONG_COMPLETED"
  // Plan events
  | "PLAN_CHANGED"
  | "PLAN_EXPIRED"
  // Subscription events
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  // Notification events
  | "NOTIFICATION_SENT"
  // Export events
  | "EXPORT_COMPLETED"
  | "EXPORT_FAILED"
  // Media update events
  | "MEDIA_UPDATED"
  // Organization events
  | "ORG_MEMBER_INVITED";

export interface EventPayload {
  event: CoreEvent;
  entityType?: string;
  entityId?: string;
  userId?: string;
  data?: Record<string, unknown>;
}

// ============ SUBSCRIBER TYPE ============

type EventSubscriber = (payload: EventPayload) => Promise<void>;

// ============ EVENT BUS ============

class EventBusClass {
  private subscribers: Map<CoreEvent, EventSubscriber[]> = new Map();

  /**
   * Subscribe to an event
   */
  on(event: CoreEvent, handler: EventSubscriber): void {
    const handlers = this.subscribers.get(event) || [];
    handlers.push(handler);
    this.subscribers.set(event, handlers);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: CoreEvent, handler: EventSubscriber): void {
    const handlers = this.subscribers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }

  /**
   * Emit an event — notifies all subscribers AND persists to EventLog
   */
  async emit(payload: EventPayload): Promise<void> {
    // 1. Persist to database (audit trail)
    try {
      await db.eventLog.create({
        data: {
          event: payload.event,
          entityType: payload.entityType || null,
          entityId: payload.entityId || null,
          userId: payload.userId || null,
          data: payload.data ? JSON.stringify(payload.data) : null,
          processed: true,
        },
      });
    } catch (err) {
      console.error("[EventBus] Failed to persist event:", err);
    }

    // 2. Notify subscribers (non-blocking — don't await)
    const handlers = this.subscribers.get(payload.event) || [];
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (err) {
        console.error(`[EventBus] Subscriber error for ${payload.event}:`, err);
      }
    }
  }

  /**
   * Get recent events from the log
   */
  async getRecent(limit: number = 50): Promise<EventPayload[]> {
    const logs = await db.eventLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    return logs.map((log) => ({
      event: log.event as CoreEvent,
      entityType: log.entityType || undefined,
      entityId: log.entityId || undefined,
      userId: log.userId || undefined,
      data: log.data ? JSON.parse(log.data) : undefined,
    }));
  }
}

// Singleton
export const EventBus = new EventBusClass();
