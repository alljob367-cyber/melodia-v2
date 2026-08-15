/**
 * MELODIA PERMISSION ENGINE
 * 
 * Centralized permission checking. Backend ALWAYS verifies.
 * Frontend can use PermissionGate to hide UI, but real enforcement is here.
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
  // Sharing
  | "SHARE_CONTENT"
  // Billing
  | "PURCHASE_CREDITS"
  | "CHANGE_PLAN"
  // Admin
  | "ADMIN_ACCESS"
  | "ADMIN_ANALYTICS";

// ============ PLAN PERMISSIONS MAP ============

const PLAN_PERMISSIONS: Record<string, MelodiaOperation[]> = {
  basic: [
    "CREATE_SONG",
    "CREATE_LYRICS",
    "CREATE_AUDIO",
    "CREATE_COMPOSITION",
    "CREATE_COVER",
    "UPLOAD_MEDIA",
    "UPDATE_MEDIA",
    "VIEW_MEDIA",
    "CREATE_PROJECT",
    "VIEW_PROJECT",
    // Billing — available to all active users
    "PURCHASE_CREDITS",
    "CHANGE_PLAN",
    "SHARE_CONTENT",
  ],
  artist_starter: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO",  // Economy video
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST",
    "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
    "SHARE_CONTENT",
  ],
  artist_production: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
    "SHARE_CONTENT",
  ],
  video_creator: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
    "SHARE_CONTENT",
  ],
  artist_pro: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
    "SHARE_CONTENT",
  ],
  label: [
    "CREATE_SONG", "CREATE_LYRICS", "CREATE_AUDIO", "CREATE_COMPOSITION",
    "CREATE_COVER", "CREATE_VIDEO", "CREATE_STORYBOARD", "EXPORT_VIDEO",
    "UPLOAD_MEDIA", "UPDATE_MEDIA", "VIEW_MEDIA", "DELETE_MEDIA",
    "CREATE_PROJECT", "VIEW_PROJECT", "UPDATE_PROJECT", "DELETE_PROJECT",
    "CREATE_ARTIST", "VIEW_ARTIST", "UPDATE_ARTIST_IDENTITY",
    "USE_AI_PRODUCER", "USE_VOICE_STUDIO", "USE_MIX_MASTER",
    "MANAGE_ORGANIZATION", "MANAGE_MEMBERS",
    "PURCHASE_CREDITS", "CHANGE_PLAN",
    "SHARE_CONTENT",
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
  "PURCHASE_CREDITS", "CHANGE_PLAN",
  "SHARE_CONTENT",
  "ADMIN_ACCESS", "ADMIN_ANALYTICS",
];

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

    // Get permissions for this plan
    const planPerms = PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.basic;

    const allowed = planPerms.includes(operation);

    return {
      allowed,
      plan,
      operation,
      reason: allowed ? undefined : `Operation '${operation}' not available on plan '${plan}'`,
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
    return PLAN_PERMISSIONS[plan] || PLAN_PERMISSIONS.basic;
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
