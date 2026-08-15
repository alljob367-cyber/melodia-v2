/**
 * MELODIA STUDIO SERVICE MODULES
 * 
 * Specialized service modules for each Studio in the platform.
 * Each module goes through MelodiaCore (permissions, credits, events).
 * 
 * Studios:
 * - AudioStudio   → Lyrics, Composition, Audio generation, Mix/Master
 * - VideoStudio   → Cover art, Video generation, Storyboard
 * - ArtistStudio  → Visual identity, AI Producer, Voice Studio
 * - LabelStudio   → Organization management, bulk operations, analytics
 */

import { db } from "../db";
import { EventBus } from "./event-bus";
import { UserContext } from "./user-context";
import { CreditEngine, estimateCost, CreditOperation } from "./credit-engine";

// ============================================================
// AUDIO STUDIO
// ============================================================

export class AudioStudio {
  /**
   * Generate lyrics through AI Orchestrator.
   * Pipeline: Permission → Credit Reserve → AI Generate → Media Register → Credit Consume → Emit
   */
  static async generateLyrics(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    title?: string;
    style: string;
    mood: string;
    language?: string;
    additionalPrompt?: string;
  }) {
    const cost = estimateCost("generate_lyrics");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `lyrics-${ctx.userId}-${data.projectId}-${Date.now()}`;

    // Create generation record
    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "generate_lyrics",
        inputPrompt: JSON.stringify({ title: data.title, style: data.style, mood: data.mood, language: data.language, additionalPrompt: data.additionalPrompt }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    // Reserve credits
    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    await EventBus.emit({
      event: "GENERATION_STARTED",
      entityType: "generation",
      entityId: generation.id,
      userId: ctx.userId,
      data: { operation: "generate_lyrics", projectId: data.projectId, cost: cost.credits },
    });

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Generate full audio (composition + audio rendering).
   * Higher credit cost than lyrics alone.
   */
  static async generateAudio(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    lyricsText?: string;
    style: string;
    mood: string;
    durationSeconds?: number;
  }) {
    const cost = estimateCost("generate_audio");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `audio-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "generate_audio",
        inputPrompt: JSON.stringify({ style: data.style, mood: data.mood, durationSeconds: data.durationSeconds }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    await EventBus.emit({
      event: "GENERATION_STARTED",
      entityType: "generation",
      entityId: generation.id,
      userId: ctx.userId,
      data: { operation: "generate_audio", projectId: data.projectId, cost: cost.credits },
    });

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Mix and master an existing audio track.
   * Takes an existing audio media as input and produces a mastered version.
   */
  static async mixAndMaster(ctx: UserContext, data: {
    projectId: string;
    sourceMediaId: string;
    artistId?: string;
    style?: string;
  }) {
    const cost = estimateCost("use_mix_master");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `mixmaster-${ctx.userId}-${data.sourceMediaId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "use_mix_master",
        inputMediaIds: JSON.stringify([data.sourceMediaId]),
        inputPrompt: JSON.stringify({ style: data.style }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Full song generation pipeline: lyrics → composition → cover → audio.
   * The most expensive operation (7 credits).
   */
  static async fullSong(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    title?: string;
    style: string;
    mood: string;
    theme?: string;
    language?: string;
    additionalPrompt?: string;
  }) {
    const cost = estimateCost("full_song");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `fullsong-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "full_song",
        inputPrompt: JSON.stringify({
          title: data.title, style: data.style, mood: data.mood,
          theme: data.theme, language: data.language, additionalPrompt: data.additionalPrompt,
        }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    await EventBus.emit({
      event: "GENERATION_STARTED",
      entityType: "generation",
      entityId: generation.id,
      userId: ctx.userId,
      data: { operation: "full_song", projectId: data.projectId, cost: cost.credits },
    });

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }
}

// ============================================================
// VIDEO STUDIO
// ============================================================

export class VideoStudio {
  /**
   * Generate cover art for a song/project.
   */
  static async generateCover(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    songId?: string;
    style?: string;
    mood?: string;
    visualConcept?: string;
  }) {
    const cost = estimateCost("generate_cover");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `cover-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "generate_cover",
        inputPrompt: JSON.stringify({ style: data.style, mood: data.mood, visualConcept: data.visualConcept }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Generate music video. Cost varies by quality tier and duration.
   * Economy: 20 credits per 10s | Standard: 50 | Premium: 75
   */
  static async generateVideo(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    songId?: string;
    quality: "economy" | "standard" | "premium";
    durationSeconds: number;
    style?: string;
    additionalPrompt?: string;
  }) {
    const operationMap: Record<string, CreditOperation> = {
      economy: "generate_video_economy",
      standard: "generate_video_standard",
      premium: "generate_video_premium",
    };
    const operation = operationMap[data.quality];
    const cost = estimateCost(operation, { durationSeconds: data.durationSeconds });
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `video-${data.quality}-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation,
        inputPrompt: JSON.stringify({ quality: data.quality, durationSeconds: data.durationSeconds, style: data.style, additionalPrompt: data.additionalPrompt }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    await EventBus.emit({
      event: "GENERATION_STARTED",
      entityType: "generation",
      entityId: generation.id,
      userId: ctx.userId,
      data: { operation, projectId: data.projectId, cost: cost.credits, quality: data.quality, durationSeconds: data.durationSeconds },
    });

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Generate a storyboard from song lyrics/mood.
   * Lower cost than full video — used for planning.
   */
  static async generateStoryboard(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    lyricsText?: string;
    mood: string;
    style?: string;
  }) {
    const cost = estimateCost("generate_storyboard");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `storyboard-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "generate_storyboard",
        inputPrompt: JSON.stringify({ mood: data.mood, style: data.style }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }
}

// ============================================================
// ARTIST STUDIO
// ============================================================

export class ArtistStudio {
  /**
   * Use AI Producer to get creative suggestions for a project.
   * Suggestions: arrangement ideas, chord progressions, instrument choices.
   */
  static async useAiProducer(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    songId?: string;
    prompt: string;
    context?: string; // Additional context (existing lyrics, mood, etc.)
  }) {
    const cost = estimateCost("use_ai_producer");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `aiproducer-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "use_ai_producer",
        inputPrompt: JSON.stringify({ prompt: data.prompt, context: data.context }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Voice Studio: AI-assisted vocal generation or transformation.
   * Generate vocals in a specific style, or transform existing vocals.
   */
  static async useVoiceStudio(ctx: UserContext, data: {
    projectId: string;
    artistId?: string;
    lyricsText: string;
    voiceStyle?: string; // "male_deep", "female_sweet", "raspy", etc.
    language?: string;
  }) {
    const cost = estimateCost("use_voice_studio");
    const check = await CreditEngine.checkBalance(ctx.userId, cost.credits);
    if (!check.hasEnough) {
      throw new Error(`Crédits insuffisants: ${check.effective} disponibles, ${cost.credits} requis`);
    }

    const idempotencyKey = `voice-${ctx.userId}-${data.projectId}-${Date.now()}`;

    const generation = await db.generation.create({
      data: {
        userId: ctx.userId,
        projectId: data.projectId,
        artistId: data.artistId || ctx.activeArtistId,
        operation: "use_voice_studio",
        inputPrompt: JSON.stringify({ voiceStyle: data.voiceStyle, language: data.language }),
        estimatedCost: cost.credits,
        creditsReserved: cost.credits,
        idempotencyKey,
        status: "pending",
      },
    });

    await CreditEngine.reserve(ctx.userId, cost.credits, generation.id, `reserve-${idempotencyKey}`);

    return { generationId: generation.id, estimatedCost: cost.credits, idempotencyKey };
  }

  /**
   * Update artist visual identity in bulk.
   * Sets visual style, color palette, reference images all at once.
   */
  static async updateVisualIdentity(ctx: UserContext, artistId: string, data: {
    visualStyle?: Record<string, unknown>;
    referenceImages?: Array<{ id: string; url: string; label: string; type: string }>;
    colorPalette?: string[];
    visualConcepts?: Array<{ name: string; description: string; imageUrl?: string }>;
  }) {
    const artist = await db.artist.findUnique({ where: { id: artistId } });
    if (!artist || artist.userId !== ctx.userId) {
      throw new Error("Artiste non trouvé ou accès refusé");
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
      userId: ctx.userId,
      data: { fields: Object.keys(data), source: "artist_studio" },
    });

    return updated;
  }

  /**
   * Get artist analytics: total projects, songs, generations, credit usage.
   */
  static async getAnalytics(artistId: string, userId: string) {
    const artist = await db.artist.findUnique({ where: { id: artistId } });
    if (!artist || artist.userId !== userId) {
      throw new Error("Artiste non trouvé ou accès refusé");
    }

    const [projectCount, songCount, generationCount, mediaCount] = await Promise.all([
      db.project.count({ where: { artistId, status: "active" } }),
      db.song.count({ where: { artistId } }),
      db.generation.count({ where: { artistId } }),
      db.media.count({ where: { artistId } }),
    ]);

    const recentGenerations = await db.generation.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, operation: true, status: true, createdAt: true, actualCost: true },
    });

    return {
      artistId,
      name: artist.name,
      genre: artist.genre,
      stats: { projectCount, songCount, generationCount, mediaCount },
      recentGenerations,
    };
  }
}

// ============================================================
// LABEL STUDIO
// ============================================================

export class LabelStudio {
  /**
   * Get organization dashboard: members, artists, projects, credits.
   */
  static async getDashboard(organizationId: string, userId: string) {
    // Verify membership
    const membership = await db.organizationMember.findFirst({
      where: { organizationId, userId },
    });
    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette organisation");
    }

    const org = await db.organization.findUnique({
      where: { id: organizationId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        artists: {
          select: { id: true, name: true, genre: true, totalSongs: true, totalProjects: true },
        },
        projects: {
          where: { status: "active" },
          select: { id: true, name: true, type: true, createdAt: true },
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!org) {
      throw new Error("Organisation non trouvée");
    }

    // Aggregate stats
    const totalSongs = org.artists.reduce((sum, a) => sum + a.totalSongs, 0);
    const totalProjects = org.artists.reduce((sum, a) => sum + a.totalProjects, 0);

    return {
      organization: { id: org.id, name: org.name, type: org.type, credits: org.credits, creditsUsed: org.creditsUsed },
      members: org.members,
      artists: org.artists,
      recentProjects: org.projects,
      stats: { totalArtists: org.artists.length, totalSongs, totalProjects, totalMembers: org.members.length },
      userRole: membership.role,
    };
  }

  /**
   * Add an artist to the organization (label roster).
   */
  static async addArtist(organizationId: string, userId: string, data: {
    name: string;
    bio?: string;
    country?: string;
    genre?: string;
  }) {
    const membership = await db.organizationMember.findFirst({
      where: { organizationId, userId, role: { in: ["owner", "admin"] } },
    });
    if (!membership) {
      throw new Error("Permission refusée: seuls les owners/admins peuvent ajouter des artistes");
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

    const artist = await db.artist.create({
      data: {
        userId, // The admin who creates it is the initial owner
        organizationId,
        name: data.name,
        slug,
        bio: data.bio,
        country: data.country,
        genre: data.genre,
      },
    });

    await EventBus.emit({
      event: "ARTIST_CREATED",
      entityType: "artist",
      entityId: artist.id,
      userId,
      data: { name: data.name, organizationId, source: "label_studio" },
    });

    return artist;
  }

  /**
   * Invite a member to the organization.
   */
  static async inviteMember(organizationId: string, userId: string, data: {
    targetUserId: string;
    role: string; // "admin", "member", "viewer"
  }) {
    const membership = await db.organizationMember.findFirst({
      where: { organizationId, userId, role: { in: ["owner", "admin"] } },
    });
    if (!membership) {
      throw new Error("Permission refusée: seuls les owners/admins peuvent inviter");
    }

    // Check if already a member
    const existing = await db.organizationMember.findFirst({
      where: { organizationId, userId: data.targetUserId },
    });
    if (existing) {
      throw new Error("Cet utilisateur est déjà membre");
    }

    const orgMember = await db.organizationMember.create({
      data: {
        organizationId,
        userId: data.targetUserId,
        role: data.role,
        permissions: JSON.stringify(["all"]),
        invitedBy: userId,
      },
    });

    await EventBus.emit({
      event: "ORG_MEMBER_INVITED",
      entityType: "organization",
      entityId: organizationId,
      userId: data.targetUserId,
      data: { role: data.role, invitedBy: userId },
    });

    return orgMember;
  }

  /**
   * Get bulk analytics across all artists in the organization.
   */
  static async getBulkAnalytics(organizationId: string, userId: string) {
    const membership = await db.organizationMember.findFirst({
      where: { organizationId, userId },
    });
    if (!membership) {
      throw new Error("Vous n'êtes pas membre de cette organisation");
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalGenerations, totalMedia, totalCreditsUsed, recentActivity] = await Promise.all([
      db.generation.count({
        where: {
          organizationId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      db.media.count({
        where: {
          artist: { organizationId },
        },
      }),
      db.creditTransaction.aggregate({
        where: {
          type: "debit",
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { amount: true },
      }),
      db.eventLog.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          data: { contains: organizationId },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    return {
      period: "30d",
      totalGenerations,
      totalMedia,
      totalCreditsUsed: totalCreditsUsed._sum.amount || 0,
      recentActivity,
    };
  }
}
