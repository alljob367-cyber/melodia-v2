/**
 * MELODIA PERMISSION ENGINE V4
 * 
 * Centralized permission checking. Backend ALWAYS verifies.
 * Frontend can use PermissionGate to hide UI, but real enforcement is here.
 * 
 * Plans: basic → artist_starter → artist_production → video_creator → artist_pro → label
 */

import { db } from "../db";

// ============ OPERATIONS ============

export type MelodiaOperation =
  // Song / Audio
  | "CREATE_SONG"
  | "CREATE_LYRICS"
  | "CREATE_AUDIO"
  | "CREATE_COMPOSITION"
  // Cover
  | "CREATE_COVER"
  // Video
  | "CREATE_VIDEO"
  | "CREATE_STORYBOARD"
  | "EXPORT_VIDEO"
  // Artist
  | "CREATE_ARTIST"
  | "UPDATE_ARTIST_IDENTITY"
  | "VIEW_ARTIST"
  // Project
  | "CREATE_PROJECT"
  | "UPDATE_PROJECT"
  | "DELETE_PROJECT"
  | "VIEW_PROJECT"
  // Media
  | "UPLOAD_MEDIA"
  | "UPDATE_MEDIA"
  | "DELETE_MEDIA"
  | "VIEW_MEDIA"
  // AI
  | "USE_AI_PRODUCER"
  | "USE_VOICE_STUDIO"
  | "USE_MIX_MASTER"
  // Organization
  | "MANAGE_ORGANIZATION"
  | "MANAGE_MEMBERS"
  // Sharing & Download
  | "SHARE_CONTENT"
  | "DOWNLOAD_MEDIA"
  // Billing
  | "PURCHASE_CREDITS"
  | "CHANGE_PLAN"
  // Admin
  | "ADMIN_ACCESS"
  | "ADMIN_ANALYTICS";

// ============ V4 PLAN PERMISSIONS MAP ============

const PLAN_PERMISSIONS: Record<string, MelodiaOperation[]> = {
  // Plan 1 — BASIC (2 000 FCFA / 20 crédits)
  basic: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT",
    "SHARE_CONTENT", "DOWNLOAD_MEDIA",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
  ],
  // Plan 2 — ARTIST STARTER (5 000 FCFA / 60 crédits)
  artist_starter: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "USE_VOICE_STUDIO",   // Voice IA standard
    "USE_MIX_MASTER",     // Mix basique, Mastering basique
    "USE_AI_PRODUCER",    // MELO AI Producteur
    "SHARE_CONTENT", "DOWNLOAD_MEDIA",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
  ],
  // Plan 3 — ARTIST PRODUCTION (10 000 FCFA / 120 crédits)
  artist_production: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER",    // MELO AI Producteur
    "USE_VOICE_STUDIO",   // Voice Premium
    "USE_MIX_MASTER",     // Mix avancé, Mastering
    "SHARE_CONTENT", "DOWNLOAD_MEDIA",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
  ],
  // Plan 4 — VIDEO CREATOR (15 000 FCFA / 180 crédits) — Désactivé au lancement
  video_creator: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "SHARE_CONTENT", "DOWNLOAD_MEDIA",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
  ],
  // Plan 5 — ARTIST PRO (25 000 FCFA / 350 crédits)
  artist_pro: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "SHARE_CONTENT", "DOWNLOAD_MEDIA",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
  ],
  // Plan 6 — LABEL / STUDIO (50 000 FCFA / 800 crédits)
  label: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "MANAGE_ORGANIZATION", "MANAGE_MEMBERS",
    "SHARE_CONTENT", "DOWNLOAD_MEDIA",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
  ],
};

// Admin has all permissions
const ALL_OPERATIONS: MelodiaOperation[] = [
  "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
  "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
  "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
  "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
  "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
  "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
  "MANAGE_ORGANIZATION", "MANAGE_MEMBERS",
  "SHARE_CONTENT", "DOWNLOAD_MEDIA",
  "PURCHASE_CREDITS", "CHANGE_PLAN",
  "ADMIN_ACCESS", "ADMIN_ANALYTICS",
];

// ============ LAUNCH FEATURE FLAGS ============

export const LAUNCH_CONFIG = {
  /** Video Studio is architecturally ready but disabled for initial launch */
  VIDEO_STUDIO_ENABLED: false,
  /** Label module is architecturally ready but disabled for initial launch */
  LABEL_ENABLED: false,
  /** API Access is disabled for initial launch */
  API_ACCESS_ENABLED: false,
  /** Maximum parallel generations per plan */
  PARALLEL_GENERATIONS: {
    basic: 1,
    artist_starter: 2,
    artist_production: 2,
    video_creator: 3,
    artist_pro: 5,
    label: 10,
  } as Record<string, number>,
  /** Storage limits in GB per plan */
  STORAGE_LIMIT_GB: {
    basic: 0,
    artist_starter: 5,
    artist_production: 15,
    video_creator: 25,
    artist_pro: 50,
    label: 100,
  } as Record<string, number>,
} as const;

// Operations locked during initial launch (returns permission denied even if plan allows)
const LAUNCH_LOCKED_OPERATIONS: MelodiaOperation[] = LAUNCH_CONFIG.VIDEO_STUDIO_ENABLED
  ? []
  : ["CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO"];

// ============ PERMISSION ENGINE ============

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  plan: string;
  operation: MelodiaOperation;
}

export class PermissionEngine {
  /**
   * Check if a user can perform an operation.
   * Backend enforcement — ALWAYS call this before any action.
   */
  static checkPermission(
    plan: string,
    userRole: string,
    operation: MelodiaOperation
  ): PermissionCheckResult {
    // Admin always has all permissions
    if (userRole === "admin") {
      return { allowed: true, plan, operation };
    }

    // Launch gate: certain operations are locked regardless of plan
    if (LAUNCH_LOCKED_OPERATIONS.includes(operation)) {
      return {
        allowed: false,
        plan,
        operation,
        reason: `Opération '${operation}' non disponible lors du lancement initial. Bientôt disponible !`,
      };
    }

    // Get permissions for this plan
    const planPerms = PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.basic;

    const allowed = planPerms.includes(operation);

    return {
      allowed,
      plan,
      operation,
      reason: allowed ? undefined : `Opération '${operation}' non disponible sur le plan '${plan}'`,
    };
  }

  /**
   * Check if user can perform operation AND throw if not allowed.
   * Use this in API routes for enforcement.
   */
  static requirePermission(
    plan: string,
    userRole: string,
    operation: MelodiaOperation
  ): void {
    const result = this.checkPermission(plan, userRole, operation);
    if (!result.allowed) {
      throw new PermissionDeniedError(result.reason || "Permission denied");
    }
  }

  /**
   * Get all permissions for a plan
   */
  static getPermissionsForPlan(plan: string, userRole: string): MelodiaOperation[] {
    if (userRole === "admin") return ALL_OPERATIONS;
    const base = PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.basic;
    // Filter out launch-locked operations
    return base.filter(op => !LAUNCH_LOCKED_OPERATIONS.includes(op));
  }

  /**
   * Check if user owns a resource (project, media, generation, etc.)
   */
  static async checkOwnership(
    userId: string,
    resourceType: "project" | "media" | "generation" | "song" | "artist",
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case "project": {
          const project = await db.project.findUnique({ where: { id: resourceId } });
          return project?.userId === userId;
        }
        case "media": {
          const media = await db.media.findUnique({ where: { id: resourceId } });
          return media?.userId === userId;
        }
        case "generation": {
          const gen = await db.generation.findUnique({ where: { id: resourceId } });
          return gen?.userId === userId;
        }
        case "song": {
          const song = await db.song.findUnique({ where: { id: resourceId } });
          return song?.userId === userId;
        }
        case "artist": {
          const artist = await db.artist.findUnique({ where: { id: resourceId } });
          return artist?.userId === userId;
        }
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

// ============ ERROR CLASS ============

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}
