/**
 * MELODIA CORE — Central Coordinator
 * 
 * The single point of coordination for the entire platform.
 * No module bypasses MelodiaCore for important operations.
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

export { AIOrchestrator } from "./ai-orchestrator";
export type { GenerationContext, OrchestratorResult } from "./ai-orchestrator";

// ============ MELDODIA CORE CLASS ============

import { buildUserContext, UserContext } from "./user-context";
import { PermissionEngine, MelodiaOperation } from "./permission-engine";
import { CreditEngine, CreditOperation } from "./credit-engine";
import { AIOrchestrator, GenerationContext } from "./ai-orchestrator";
import { ProjectService, MediaService, ArtistService, GenerationService, NotificationService } from "./services";

/**
 * MelodiaCore — The heart of the platform.
 * 
 * Usage:
 *   const core = new MelodiaCore(userId);
 *   await core.initialize();
 *   core.requirePermission("CREATE_VIDEO");
 *   await core.generate({ operation: "generate_video_economy", ... });
 */
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

  /** Check if current user can perform operation */
  canPerform(operation: MelodiaOperation): boolean {
    this.ensureInitialized();
    return PermissionEngine.checkPermission(
      this.context.plan,
      this.context.role,
      operation
    ).allowed;
  }

  /** Require permission — throws if denied */
  requirePermission(operation: MelodiaOperation): void {
    this.ensureInitialized();
    PermissionEngine.requirePermission(
      this.context.plan,
      this.context.role,
      operation
    );
  }

  // ============ CREDITS ============

  /** Check if user has enough credits for an operation */
  async hasCredits(operation: CreditOperation, options?: { durationSeconds?: number }): Promise<boolean> {
    this.ensureInitialized();
    const estimate = await import("./credit-engine").then(m => m.estimateCost(operation, options));
    const check = await CreditEngine.checkBalance(this.userId, estimate.credits);
    return check.hasEnough;
  }

  /** Get credit wallet */
  async getWallet() {
    this.ensureInitialized();
    return CreditEngine.getWallet(this.userId);
  }

  // ============ GENERATION ============

  /**
   * Execute an AI generation through the full pipeline.
   * This is THE way to generate anything on Melodia.
   */
  async generate(genCtx: Omit<GenerationContext, "user">) {
    this.ensureInitialized();
    return AIOrchestrator.execute({
      ...genCtx,
      user: this.context,
    });
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

  // ============ MEDIA ============

  async createMedia(data: Parameters<typeof MediaService.create>[1]) {
    this.ensureInitialized();
    this.requirePermission("UPLOAD_MEDIA");
    return MediaService.create(this.context, data);
  }

  async getProjectMedia(projectId: string, type?: string) {
    return MediaService.getByProject(projectId, type);
  }

  // ============ ARTIST ============

  async createArtist(data: Parameters<typeof ArtistService.create>[1]) {
    this.ensureInitialized();
    this.requirePermission("CREATE_ARTIST");
    return ArtistService.create(this.context, data);
  }

  async getArtistIdentity(artistId: string) {
    return ArtistService.getIdentity(artistId);
  }

  // ============ NOTIFICATIONS ============

  async getNotifications(limit?: number) {
    return NotificationService.getRecent(this.userId, limit);
  }

  async getUnreadNotifications() {
    return NotificationService.getUnread(this.userId);
  }

  // ============ CONTEXT ============

  /** Get the full UserContext (for frontend hydration) */
  getContext(): UserContext {
    this.ensureInitialized();
    return this.context;
  }

  /** Set active project/artist context */
  setActiveContext(projectId?: string, artistId?: string): void {
    this.ensureInitialized();
    this.context.activeProjectId = projectId || null;
    this.context.activeArtistId = artistId || null;
  }
}
