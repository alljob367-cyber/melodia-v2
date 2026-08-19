/**
 * MELODIA USER CONTEXT
 * 
 * Built for every user action. Contains everything the Core needs
 * to make decisions: identity, plan, permissions, credits, limits.
 */

import { db } from "../db";
import { PermissionEngine, MelodiaOperation } from "./permission-engine";

// ============ USER CONTEXT ============

export interface UserContext {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  locale: string;

  // Organization (if applicable)
  organizationId: string | null;
  organizationRole: string | null;

  // Subscription
  subscriptionStatus: "active" | "expired" | "trial";

  // Credits
  creditBalance: number;
  creditsReserved: number;
  creditsEffective: number; // balance - reserved
  songsRemaining: number;
  coversRemaining: number;
  videosRemaining: number;

  // Permissions (pre-computed for this plan)
  permissions: MelodiaOperation[];

  // Usage limits
  usageLimits: {
    maxProjects: number;
    maxArtists: number;
    maxMediaPerProject: number;
    maxStorageMb: number;
    canUseVideo: boolean;
    canUseAIProducer: boolean;
    canUseLabelFeatures: boolean;
  };

  // Active context (optional — set when user is working on something)
  activeProjectId: string | null;
  activeArtistId: string | null;
}

// ============ PLAN LIMITS ============

const PLAN_LIMITS: Record<string, UserContext["usageLimits"]> = {
  basic: {
    maxProjects: 2,
    maxArtists: 1,
    maxMediaPerProject: 10,
    maxStorageMb: 50,
    canUseVideo: false,
    canUseAIProducer: false,
    canUseLabelFeatures: false,
  },
  artist_starter: {
    maxProjects: 5,
    maxArtists: 2,
    maxMediaPerProject: 50,
    maxStorageMb: 200,
    canUseVideo: true,
    canUseAIProducer: false,
    canUseLabelFeatures: false,
  },
  artist_production: {
    maxProjects: 15,
    maxArtists: 5,
    maxMediaPerProject: 200,
    maxStorageMb: 1000,
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },
  video_creator: {
    maxProjects: 10,
    maxArtists: 3,
    maxMediaPerProject: 500,
    maxStorageMb: 2000,
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },
  artist_pro: {
    maxProjects: 50,
    maxArtists: 10,
    maxMediaPerProject: 1000,
    maxStorageMb: 5000,
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },
  label: {
    maxProjects: 999,
    maxArtists: 999,
    maxMediaPerProject: 9999,
    maxStorageMb: 50000,
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: true,
  },
};

// ============ BUILD USER CONTEXT ============

export async function buildUserContext(userId: string): Promise<UserContext | null> {
  // Fetch user with credits
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      credits: true,
      organizationMemberships: {
        take: 1,
        orderBy: { joinedAt: "desc" },
      },
    },
  });

  if (!user || !user.isActive) return null;

  const wallet = user.credits;
  const creditBalance = wallet?.credits || 0;
  const creditsReserved = wallet?.creditsReserved || 0;
  const creditsEffective = creditBalance - creditsReserved;

  // Get organization context
  const orgMembership = user.organizationMemberships[0];

  // Compute permissions for this plan
  const permissions = PermissionEngine.getPermissionsForPlan(user.plan, user.role);

  // Get usage limits for this plan
  const usageLimits = PLAN_LIMITS[user.plan] || PLAN_LIMITS.basic;

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan,
    locale: user.locale || "fr",

    organizationId: orgMembership?.organizationId || null,
    organizationRole: orgMembership?.role || null,

    subscriptionStatus: user.isActive ? "active" : "expired",

    creditBalance,
    creditsReserved,
    creditsEffective,
    songsRemaining: wallet?.songsRemaining || 0,
    coversRemaining: wallet?.coversRemaining || 0,
    videosRemaining: wallet?.videosRemaining || 0,

    permissions,
    usageLimits,

    activeProjectId: null, // Set by frontend context
    activeArtistId: null,  // Set by frontend context
  };
}

/**
 * Quick permission check using pre-built context.
 * Faster than PermissionEngine.checkPermission when context is already available.
 */
export function hasPermission(ctx: UserContext, operation: MelodiaOperation): boolean {
  return ctx.permissions.includes(operation);
}

/**
 * Throw if permission not granted.
 */
export function requirePermission(ctx: UserContext, operation: MelodiaOperation): void {
  if (!hasPermission(ctx, operation)) {
    throw new Error(`Permission denied: '${operation}' not available on plan '${ctx.plan}'`);
  }
}
