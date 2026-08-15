/**
 * MELODIA CORE SERVICES
 * 
 * ProjectService, MediaService, ArtistService, GenerationService, NotificationService
 * All services use the same central infrastructure (EventBus, Permissions, Credits).
 */

import { db } from "../db";
import { EventBus } from "./event-bus";
import { UserContext } from "./user-context";

// ============================================================
// PROJECT SERVICE
// ============================================================

export class ProjectService {
  static async create(ctx: UserContext, data: {
    name: string;
    type?: string;
    description?: string;
    artistId?: string;
    genre?: string;
    mood?: string;
  }) {
    const project = await db.project.create({
      data: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        artistId: data.artistId || ctx.activeArtistId,
        name: data.name,
        type: data.type || "single",
        description: data.description,
        genre: data.genre,
        mood: data.mood,
        language: ctx.locale,
      },
    });

    await EventBus.emit({
      event: "PROJECT_CREATED",
      entityType: "project",
      entityId: project.id,
      userId: ctx.userId,
      data: { name: data.name, type: data.type },
    });

    return project;
  }

  static async getById(projectId: string, userId: string) {
    return db.project.findFirst({
      where: { id: projectId, userId },
      include: {
        artist: true,
        songs: true,
        media: { take: 50, orderBy: { createdAt: "desc" } },
        generations: { take: 20, orderBy: { createdAt: "desc" } },
      },
    });
  }

  static async listByUser(userId: string, options?: { limit?: number }) {
    return db.project.findMany({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      take: options?.limit || 50,
      include: { artist: true, _count: { select: { songs: true, media: true } } },
    });
  }

  static async addMedia(projectId: string, mediaId: string) {
    return db.media.update({
      where: { id: mediaId },
      data: { projectId },
    });
  }
}

// ============================================================
// MEDIA SERVICE
// ============================================================

export class MediaService {
  static async create(ctx: UserContext, data: {
    name: string;
    type: string;
    mimeType: string;
    url: string;
    thumbnailUrl?: string;
    fileSizeKb?: number;
    duration?: number;
    width?: number;
    height?: number;
    projectId?: string;
    artistId?: string;
    generationId?: string;
    songId?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }) {
    const media = await db.media.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId || ctx.activeProjectId,
        artistId: data.artistId || ctx.activeArtistId,
        generationId: data.generationId,
        songId: data.songId,
        name: data.name,
        type: data.type,
        mimeType: data.mimeType,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        fileSizeKb: data.fileSizeKb,
        duration: data.duration,
        width: data.width,
        height: data.height,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: "ready",
      },
    });

    // Update project media count
    if (media.projectId) {
      await db.project.update({
        where: { id: media.projectId },
        data: { totalMedia: { increment: 1 } },
      });
    }

    await EventBus.emit({
      event: data.generationId ? "MEDIA_CREATED" : "MEDIA_UPLOADED",
      entityType: "media",
      entityId: media.id,
      userId: ctx.userId,
      data: { type: data.type, name: data.name, projectId: media.projectId },
    });

    return media;
  }

  static async getByProject(projectId: string, type?: string) {
    return db.media.findMany({
      where: { projectId, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getByArtist(artistId: string, type?: string) {
    return db.media.findMany({
      where: { artistId, ...(type ? { type } : {}) },
      orderBy: { createdAt: "desc" },
    });
  }

  static async delete(mediaId: string, userId: string) {
    // Verify ownership
    const media = await db.media.findUnique({ where: { id: mediaId } });
    if (!media || media.userId !== userId) {
      throw new Error("Media not found or access denied");
    }

    await db.media.delete({ where: { id: mediaId } });

    if (media.projectId) {
      await db.project.update({
        where: { id: media.projectId },
        data: { totalMedia: { decrement: 1 } },
      });
    }

    await EventBus.emit({
      event: "MEDIA_DELETED",
      entityType: "media",
      entityId: mediaId,
      userId,
    });
  }
}

// ============================================================
// ARTIST SERVICE
// ============================================================

export class ArtistService {
  static async create(ctx: UserContext, data: {
    name: string;
    bio?: string;
    country?: string;
    genre?: string;
    styles?: string[];
    avatarUrl?: string;
  }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

    const artist = await db.artist.create({
      data: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        name: data.name,
        slug,
        bio: data.bio,
        country: data.country,
        genre: data.genre,
        styles: data.styles ? JSON.stringify(data.styles) : null,
        avatarUrl: data.avatarUrl,
      },
    });

    await EventBus.emit({
      event: "ARTIST_CREATED",
      entityType: "artist",
      entityId: artist.id,
      userId: ctx.userId,
      data: { name: data.name },
    });

    return artist;
  }

  /**
   * Get artist identity for AI Orchestrator
   * Returns visual style, reference images, color palette, etc.
   */
  static async getIdentity(artistId: string) {
    const artist = await db.artist.findUnique({
      where: { id: artistId },
      include: {
        media: {
          where: { type: "image" },
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!artist) return null;

    return {
      id: artist.id,
      name: artist.name,
      genre: artist.genre,
      styles: artist.styles ? JSON.parse(artist.styles) : [],
      visualStyle: artist.visualStyle ? JSON.parse(artist.visualStyle) : null,
      referenceImages: artist.referenceImages ? JSON.parse(artist.referenceImages) : [],
      colorPalette: artist.colorPalette ? JSON.parse(artist.colorPalette) : [],
      visualConcepts: artist.visualConcepts ? JSON.parse(artist.visualConcepts) : [],
      recentImages: artist.media.map((m) => ({ id: m.id, url: m.url, name: m.name })),
    };
  }

  static async updateIdentity(artistId: string, userId: string, data: {
    visualStyle?: Record<string, unknown>;
    referenceImages?: Array<{ id: string; url: string; label: string; type: string }>;
    colorPalette?: string[];
    visualConcepts?: Array<{ name: string; description: string; imageUrl?: string }>;
  }) {
    const artist = await db.artist.findUnique({ where: { id: artistId } });
    if (!artist || artist.userId !== userId) {
      throw new Error("Artist not found or access denied");
    }

    const updated = await db.artist.update({
      where: { id: artistId },
      data: {
        visualStyle: data.visualStyle ? JSON.stringify(data.visualStyle) : undefined,
        referenceImages: data.referenceImages ? JSON.stringify(data.referenceImages) : undefined,
        colorPalette: data.colorPalette ? JSON.stringify(data.colorPalette) : undefined,
        visualConcepts: data.visualConcepts ? JSON.stringify(data.visualConcepts) : undefined,
      },
    });

    await EventBus.emit({
      event: "ARTIST_IDENTITY_UPDATED",
      entityType: "artist",
      entityId: artistId,
      userId,
      data: { fields: Object.keys(data) },
    });

    return updated;
  }
}

// ============================================================
// GENERATION SERVICE
// ============================================================

export class GenerationService {
  static async create(ctx: UserContext, data: {
    operation: string;
    projectId?: string;
    artistId?: string;
    inputPrompt?: string;
    inputMediaIds?: string[];
    inputParams?: Record<string, unknown>;
    estimatedCost: number;
    creditsReserved: number;
    idempotencyKey: string;
  }) {
    return db.generation.create({
      data: {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        projectId: data.projectId || ctx.activeProjectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: data.operation,
        inputPrompt: data.inputPrompt,
        inputMediaIds: data.inputMediaIds ? JSON.stringify(data.inputMediaIds) : null,
        inputParams: data.inputParams ? JSON.stringify(data.inputParams) : null,
        estimatedCost: data.estimatedCost,
        creditsReserved: data.creditsReserved,
        idempotencyKey: data.idempotencyKey,
        status: "pending",
      },
    });
  }

  static async start(generationId: string) {
    return db.generation.update({
      where: { id: generationId },
      data: { status: "processing", startedAt: new Date(), progress: 0 },
    });
  }

  static async updateProgress(generationId: string, progress: number) {
    return db.generation.update({
      where: { id: generationId },
      data: { progress: Math.min(100, progress) },
    });
  }

  static async complete(generationId: string, data: {
    outputMediaIds: string[];
    provider: string;
    model: string;
    actualCost: number;
  }) {
    const gen = await db.generation.update({
      where: { id: generationId },
      data: {
        status: "completed",
        outputMediaIds: JSON.stringify(data.outputMediaIds),
        provider: data.provider,
        model: data.model,
        actualCost: data.actualCost,
        progress: 100,
        completedAt: new Date(),
        duration: 0, // Will be calculated
      },
    });

    // Calculate duration
    if (gen.startedAt) {
      const durationMs = Date.now() - gen.startedAt.getTime();
      await db.generation.update({
        where: { id: generationId },
        data: { duration: durationMs },
      });
    }

    // Update project generation count
    if (gen.projectId) {
      await db.project.update({
        where: { id: gen.projectId },
        data: { totalGenerations: { increment: 1 } },
      });
    }

    await EventBus.emit({
      event: "GENERATION_COMPLETED",
      entityType: "generation",
      entityId: generationId,
      userId: gen.userId || undefined,
      data: { operation: gen.operation, provider: data.provider, actualCost: data.actualCost },
    });

    return gen;
  }

  static async fail(generationId: string, error: string) {
    const gen = await db.generation.update({
      where: { id: generationId },
      data: {
        status: "failed",
        error,
        completedAt: new Date(),
      },
    });

    await EventBus.emit({
      event: "GENERATION_FAILED",
      entityType: "generation",
      entityId: generationId,
      userId: gen.userId || undefined,
      data: { operation: gen.operation, error },
    });

    return gen;
  }

  static async getByProject(projectId: string) {
    return db.generation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}

// ============================================================
// NOTIFICATION SERVICE
// ============================================================

export class NotificationService {
  static async send(userId: string, data: {
    type: string;
    title: string;
    message?: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await db.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.stringify(data.data) : null,
      },
    });

    await EventBus.emit({
      event: "NOTIFICATION_SENT",
      entityType: "notification",
      entityId: notification.id,
      userId,
      data: { type: data.type, title: data.title },
    });

    return notification;
  }

  static async markRead(notificationId: string) {
    return db.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllRead(userId: string) {
    return db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async getUnread(userId: string) {
    return db.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  static async getRecent(userId: string, limit: number = 20) {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

// Register EventBus → NotificationService wiring
EventBus.on("GENERATION_COMPLETED", async (payload) => {
  if (payload.userId) {
    await NotificationService.send(payload.userId, {
      type: "generation_complete",
      title: "Génération terminée",
      message: `Votre génération ${payload.data?.operation || ""} est prête.`,
      data: payload.data as Record<string, unknown>,
    });
  }
});

EventBus.on("GENERATION_FAILED", async (payload) => {
  if (payload.userId) {
    await NotificationService.send(payload.userId, {
      type: "generation_failed",
      title: "Génération échouée",
      message: "Une erreur est survenue. Vos crédits ont été remboursés.",
      data: payload.data as Record<string, unknown>,
    });
  }
});

EventBus.on("CREDITS_LOW", async (payload) => {
  if (payload.userId) {
    await NotificationService.send(payload.userId, {
      type: "credits_low",
      title: "Crédits faibles",
      message: `Il vous reste ${payload.data?.effective || 0} crédits. Pensez à recharger.`,
    });
  }
});
