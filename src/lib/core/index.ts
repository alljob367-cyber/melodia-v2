/**
 * MELODIA CORE — Central Coordinator v2.0
 * 
 * The single point of coordination for the entire platform.
 * No module bypasses MelodiaCore for important operations.
 * 
 * Usage:
 *   const core = new MelodiaCore(userId);
 *   await core.initialize();
 *   core.requirePermission("CREATE_VIDEO");
 *   await core.generate({ operation: "generate_video_economy", ... });
 */

// Re-export all Core services
export { EventBus } from "./event-bus";
export type { CoreEvent, EventPayload } from "./event-bus";

export { PermissionEngine, PermissionDeniedError } from "./permission-engine";
export type { MelodiaOperation, PermissionCheckResult } from "./permission-engine";

export { CreditEngine, estimateCost, CREDIT_COSTS } from "./credit-engine";
export type { CreditOperation, CostEstimate, CreditCheckResult } from "./credit-engine";

export { buildUserContext, hasPermission, requirePermission } from "./user-context";
export type { UserContext } from "./user-context";

export { ProjectService, MediaService, ArtistService, GenerationService, NotificationService } from "./services";

export { AudioStudio, VideoStudio, ArtistStudio, LabelStudio } from "./studio-modules";

export {
  StripeProvider, WaveProvider, FPayProvider, PaymentOrchestrator,
} from "./payment-providers";
export type {
  CheckoutParams, CheckoutResult, PaymentVerification, WebhookResult,
} from "./payment-providers";

export { AIOrchestrator } from "./ai-orchestrator";
export type { GenerationContext, OrchestratorResult } from "./ai-orchestrator";

// API layer
export { Api } from "./api-responses";
export type { ApiSuccessResponse, ApiErrorResponse, PaginationMeta, ApiPaginatedResponse } from "./api-responses";
export * as ApiSchemas from "./api-schemas";
export { ERROR_CODES, API_REGISTRY, getApiRoute, getRoutesByPrefix } from "./api-registry";
export type { ErrorCodeDef, ApiRouteDef } from "./api-registry";

// ============ MELDODIA CORE CLASS ============

import { buildUserContext, UserContext } from "./user-context";
import { PermissionEngine, MelodiaOperation } from "./permission-engine";
import { CreditEngine, CreditOperation } from "./credit-engine";
import { AIOrchestrator, GenerationContext } from "./ai-orchestrator";
import { ProjectService, MediaService, ArtistService, GenerationService, NotificationService } from "./services";
import { EventBus } from "./event-bus";
import { db } from "../db";

export class MelodiaCore {
  public context!: UserContext;
  private initialized = false;

  constructor(private userId: string) {}

  /**
   * Initialize: build the UserContext from DB.
   * MUST be called before any other method.
   */
  async initialize(): Promise<void> {
    const ctx = await buildUserContext(this.userId);
    if (!ctx) {
      throw new Error(`User ${this.userId} not found or inactive`);
    }
    this.context = ctx;
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("MelodiaCore not initialized. Call await core.initialize() first.");
    }
  }

  // ============ PERMISSIONS ============

  canPerform(operation: MelodiaOperation): boolean {
    this.ensureInitialized();
    return PermissionEngine.checkPermission(
      this.context.plan,
      this.context.role,
      operation
    ).allowed;
  }

  requirePermission(operation: MelodiaOperation): void {
    this.ensureInitialized();
    PermissionEngine.requirePermission(
      this.context.plan,
      this.context.role,
      operation
    );
  }

  // ============ CREDITS ============

  async hasCredits(operation: CreditOperation, options?: { durationSeconds?: number }): Promise<boolean> {
    this.ensureInitialized();
    const estimate = await import("./credit-engine").then(m => m.estimateCost(operation, options));
    const check = await CreditEngine.checkBalance(this.userId, estimate.credits);
    return check.hasEnough;
  }

  async getWallet() {
    this.ensureInitialized();
    return CreditEngine.getWallet(this.userId);
  }

  /**
   * Get paginated credit transaction history.
   */
  async getCreditHistory(params: { page?: number; limit?: number; category?: string; type?: string }) {
    this.ensureInitialized();
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: any = { userId: this.userId };
    if (params.category) where.category = params.category;
    if (params.type) where.type = params.type;

    const [transactions, total] = await Promise.all([
      db.creditTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.creditTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Purchase credits through a credit pack.
   * Creates Payment + CreditTransaction + updates wallet.
   */
  async purchaseCredits(packId: string, provider: string = "manual") {
    this.ensureInitialized();
    this.requirePermission("PURCHASE_CREDITS");

    const pack = await db.creditPack.findFirst({
      where: { id: packId, isActive: true },
    });

    if (!pack) {
      throw new Error("Pack de crédits non trouvé ou inactif");
    }

    const idempotencyKey = `purchase-${this.userId}-${pack.id}-${Date.now()}`;

    // Create Payment
    const payment = await db.payment.create({
      data: {
        userId: this.userId,
        amountFcfa: pack.price,
        credits: pack.credits,
        type: "credit_pack",
        provider,
        status: "completed",
        packId: pack.id,
        idempotencyKey,
        metadata: JSON.stringify({ packName: pack.name, packPlan: pack.plan }),
      },
    });

    // Add credits atomically
    await db.$transaction([
      db.userCredits.update({
        where: { userId: this.userId },
        data: {
          credits: { increment: pack.credits },
          songsRemaining: { increment: pack.songsLimit },
          coversRemaining: { increment: pack.coversLimit },
          videosRemaining: { increment: pack.videosLimit },
          totalCreditsPurchased: { increment: pack.credits },
        },
      }),
      db.creditTransaction.create({
        data: {
          userId: this.userId,
          type: "credit",
          category: "purchase",
          amount: pack.credits,
          description: `Achat pack ${pack.name}: ${pack.credits} crédits (${pack.price} FCFA)`,
          packId: pack.id,
          paymentId: payment.id,
          idempotencyKey: `credit-${idempotencyKey}`,
        },
      }),
    ]);

    await EventBus.emit({
      event: "CREDITS_PURCHASED",
      entityType: "payment",
      entityId: payment.id,
      userId: this.userId,
      data: { packId: pack.id, credits: pack.credits, priceFcfa: pack.price, provider },
    });

    return { payment, credits: pack.credits, priceFcfa: pack.price };
  }

  // ============ GENERATION ============

  async generate(genCtx: Omit<GenerationContext, "user">) {
    this.ensureInitialized();
    return AIOrchestrator.execute({
      ...genCtx,
      user: this.context,
    });
  }

  async getGenerationStatus(generationId: string) {
    this.ensureInitialized();
    const gen = await db.generation.findUnique({
      where: { id: generationId },
      include: { outputMedia: true },
    });
    if (!gen || (gen.userId !== this.userId && this.context.role !== "admin")) {
      throw new Error("Génération non trouvée ou accès refusé");
    }
    return gen;
  }

  async cancelGeneration(generationId: string) {
    this.ensureInitialized();
    const gen = await db.generation.findUnique({ where: { id: generationId } });
    if (!gen || gen.userId !== this.userId) {
      throw new Error("Génération non trouvée ou accès refusé");
    }
    if (gen.status !== "pending" && gen.status !== "processing") {
      throw new Error("Seules les générations en attente ou en cours peuvent être annulées");
    }

    const updated = await db.generation.update({
      where: { id: generationId },
      data: { status: "cancelled", completedAt: new Date() },
    });

    // Refund reserved credits
    if (gen.creditsReserved > 0) {
      await CreditEngine.refund(
        this.userId,
        gen.creditsReserved,
        gen.id,
        `refund-cancel-${gen.idempotencyKey}`
      );
    }

    await EventBus.emit({
      event: "GENERATION_CANCELLED",
      entityType: "generation",
      entityId: generationId,
      userId: this.userId,
    });

    return updated;
  }

  // ============ PROJECTS ============

  async createProject(data: Parameters<typeof ProjectService.create>[1]) {
    this.ensureInitialized();
    this.requirePermission("CREATE_PROJECT");
    return ProjectService.create(this.context, data);
  }

  async getProject(projectId: string) {
    return ProjectService.getById(projectId, this.userId);
  }

  async listProjects() {
    return ProjectService.listByUser(this.userId);
  }

  async updateProject(projectId: string, data: { name?: string; description?: string; genre?: string; mood?: string; status?: string }) {
    this.ensureInitialized();
    this.requirePermission("UPDATE_PROJECT");

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== this.userId && this.context.role !== "admin")) {
      throw new Error("Projet non trouvé ou accès refusé");
    }

    const updated = await db.project.update({
      where: { id: projectId },
      data,
    });

    await EventBus.emit({
      event: "PROJECT_UPDATED",
      entityType: "project",
      entityId: projectId,
      userId: this.userId,
      data: { fields: Object.keys(data) },
    });

    return updated;
  }

  async archiveProject(projectId: string) {
    this.ensureInitialized();
    this.requirePermission("DELETE_PROJECT");

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project || (project.userId !== this.userId && this.context.role !== "admin")) {
      throw new Error("Projet non trouvé ou accès refusé");
    }

    const updated = await db.project.update({
      where: { id: projectId },
      data: { status: "archived" },
    });

    await EventBus.emit({
      event: "PROJECT_ARCHIVED",
      entityType: "project",
      entityId: projectId,
      userId: this.userId,
    });

    return updated;
  }

  // ============ MEDIA ============

  async listMedia(options?: { page?: number; limit?: number; type?: string; projectId?: string; artistId?: string }) {
    this.ensureInitialized();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const where: any = { userId: this.userId };
    if (options?.type) where.type = options.type;
    if (options?.projectId) where.projectId = options.projectId;
    if (options?.artistId) where.artistId = options.artistId;

    const [total, media] = await Promise.all([
      db.media.count({ where }),
      db.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { id: true, name: true } },
          artist: { select: { id: true, name: true } },
        },
      }),
    ]);

    return { total, media };
  }

  async createMedia(data: Parameters<typeof MediaService.create>[1]) {
    this.ensureInitialized();
    this.requirePermission("UPLOAD_MEDIA");
    return MediaService.create(this.context, data);
  }

  async getProjectMedia(projectId: string, type?: string) {
    return MediaService.getByProject(projectId, type);
  }

  async deleteMedia(mediaId: string) {
    this.ensureInitialized();
    this.requirePermission("DELETE_MEDIA");
    return MediaService.delete(mediaId, this.userId);
  }

  // ============ ARTIST ============

  async listArtists(options?: { page?: number; limit?: number }) {
    this.ensureInitialized();
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    return db.artist.findMany({
      where: { userId: this.userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { projects: true, media: true },
        },
      },
    });
  }

  async createArtist(data: Parameters<typeof ArtistService.create>[1]) {
    this.ensureInitialized();
    this.requirePermission("CREATE_ARTIST");
    return ArtistService.create(this.context, data);
  }

  async getArtistIdentity(artistId: string) {
    return ArtistService.getIdentity(artistId);
  }

  async updateArtistIdentity(artistId: string, data: Parameters<typeof ArtistService.updateIdentity>[2]) {
    this.ensureInitialized();
    this.requirePermission("UPDATE_ARTIST_IDENTITY");
    return ArtistService.updateIdentity(artistId, this.userId, data);
  }

  // ============ NOTIFICATIONS ============

  async getNotifications(limit?: number) {
    return NotificationService.getRecent(this.userId, limit);
  }

  async getUnreadNotifications(limit: number = 10) {
    this.ensureInitialized();
    const [count, notifications] = await Promise.all([
      db.notification.count({
        where: { userId: this.userId, isRead: false },
      }),
      db.notification.findMany({
        where: { userId: this.userId, isRead: false },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);
    return { count, notifications };
  }

  async markNotificationRead(notificationId: string) {
    return NotificationService.markRead(notificationId);
  }

  async markAllNotificationsRead() {
    return NotificationService.markAllRead(this.userId);
  }

  // ============ SUBSCRIPTIONS ============

  async getCurrentSubscription() {
    this.ensureInitialized();
    const subscription = await db.subscription.findUnique({
      where: { userId: this.userId },
    });

    if (!subscription) {
      return {
        plan: this.context.plan || "basic",
        status: "active",
        amountFcfa: 0,
        interval: "month",
      };
    }

    return subscription;
  }

  async changePlan(newPlan: string) {
    this.ensureInitialized();
    this.requirePermission("CHANGE_PLAN");

    const PLAN_PRICES: Record<string, number> = {
      basic: 2000, artist_starter: 5000, artist_production: 10000,
      video_creator: 15000, artist_pro: 25000, label: 50000,
    };

    const PLAN_CREDITS: Record<string, { credits: number; songs: number; covers: number; videos: number }> = {
      basic: { credits: 20, songs: 3, covers: 3, videos: 0 },
      artist_starter: { credits: 50, songs: 8, covers: 8, videos: 0 },
      artist_production: { credits: 100, songs: 15, covers: 15, videos: 0 },
      video_creator: { credits: 150, songs: 20, covers: 20, videos: 3 },
      artist_pro: { credits: 250, songs: 50, covers: 50, videos: 10 },
      label: { credits: 500, songs: 999, covers: 999, videos: 30 },
    };

    if (!PLAN_PRICES[newPlan]) throw new Error("Plan invalide");
    if (this.context.plan === newPlan) throw new Error("Vous êtes déjà sur ce plan");

    const currentPlan = this.context.plan;
    const isUpgrade = PLAN_PRICES[newPlan] > PLAN_PRICES[currentPlan];
    const allocation = PLAN_CREDITS[newPlan];

    await db.user.update({ where: { id: this.userId }, data: { plan: newPlan } });

    await db.subscription.upsert({
      where: { userId: this.userId },
      update: {
        plan: newPlan, status: "active", amountFcfa: PLAN_PRICES[newPlan],
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        userId: this.userId, plan: newPlan, status: "active",
        amountFcfa: PLAN_PRICES[newPlan], interval: "month",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const wallet = await db.userCredits.findUnique({ where: { userId: this.userId } });
    if (wallet) {
      await db.userCredits.update({
        where: { userId: this.userId },
        data: {
          songsRemaining: isUpgrade ? allocation.songs : Math.min(wallet.songsRemaining, allocation.songs),
          coversRemaining: isUpgrade ? allocation.covers : Math.min(wallet.coversRemaining, allocation.covers),
          videosRemaining: isUpgrade ? allocation.videos : Math.min(wallet.videosRemaining, allocation.videos),
        },
      });
    }

    await EventBus.emit({
      event: "PLAN_CHANGED",
      entityType: "subscription",
      entityId: this.userId,
      userId: this.userId,
      data: { fromPlan: currentPlan, toPlan: newPlan, isUpgrade, newPriceFcfa: PLAN_PRICES[newPlan] },
    });

    return { from: currentPlan, to: newPlan, isUpgrade, newPriceFcfa: PLAN_PRICES[newPlan] };
  }

  // ============ CONTEXT ============

  getContext(): UserContext {
    this.ensureInitialized();
    return this.context;
  }

  setActiveContext(projectId?: string, artistId?: string): void {
    this.ensureInitialized();
    this.context.activeProjectId = projectId || null;
    this.context.activeArtistId = artistId || null;
  }
}
