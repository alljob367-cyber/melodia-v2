"use client";

import React from "react";
import { useMelodia } from "@/contexts/melodia-context";
import type { MelodiaOperation } from "@/lib/core/permission-engine";

// ============ PERMISSION GATE ============

interface PermissionGateProps {
  /** Required permission(s) — ALL must be granted */
  feature: MelodiaOperation | MelodiaOperation[];
  /** Content to show when permission is granted */
  children: React.ReactNode;
  /** Content to show when permission is denied (default: null) */
  fallback?: React.ReactNode;
  /** If true, shows children with disabled styling instead of hiding */
  showDisabled?: boolean;
}

/**
 * PermissionGate — Frontend permission control.
 * 
 * Usage:
 *   <PermissionGate feature="CREATE_VIDEO">
 *     <VideoStudio />
 *   </PermissionGate>
 * 
 *   <PermissionGate feature="CREATE_VIDEO" fallback={<UpgradePrompt />}>
 *     <VideoStudio />
 *   </PermissionGate>
 * 
 *   <PermissionGate feature={["CREATE_VIDEO", "USE_AI_PRODUCER"]}>
 *     <AdvancedVideoTools />
 *   </PermissionGate>
 * 
 * NOTE: Backend ALWAYS verifies permissions independently.
 * This component only controls UI visibility.
 */
export function PermissionGate({
  feature,
  children,
  fallback = null,
  showDisabled = false,
}: PermissionGateProps) {
  const { canPerform, loading } = useMelodia();

  if (loading) return null;

  const features = Array.isArray(feature) ? feature : [feature];
  const allowed = features.every((f) => canPerform(f));

  if (allowed) {
    return <>{children}</>;
  }

  if (showDisabled) {
    return (
      <div className="opacity-40 pointer-events-none select-none" aria-disabled="true">
        {children}
      </div>
    );
  }

  return <>{fallback}</>;
}

// ============ PLAN GATE ============

interface PlanGateProps {
  /** Required plan level — user must have this plan or higher */
  minPlan: "basic" | "artist_starter" | "artist_production" | "video_creator" | "artist_pro" | "label";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PLAN_HIERARCHY: Record<string, number> = {
  basic: 0,
  artist_starter: 1,
  artist_production: 2,
  video_creator: 3,
  artist_pro: 4,
  label: 5,
};

/**
 * PlanGate — Show content only for users on a minimum plan level.
 */
export function PlanGate({ minPlan, children, fallback = null }: PlanGateProps) {
  const { context, loading } = useMelodia();

  if (loading) return null;

  const userLevel = PLAN_HIERARCHY[context?.plan || "basic"] || 0;
  const requiredLevel = PLAN_HIERARCHY[minPlan] || 0;

  return userLevel >= requiredLevel ? <>{children}</> : <>{fallback}</>;
}

// ============ CREDITS GATE ============

interface CreditsGateProps {
  /** Minimum credits required */
  minCredits: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * CreditsGate — Show content only if user has enough credits.
 */
export function CreditsGate({ minCredits, children, fallback = null }: CreditsGateProps) {
  const { context, loading } = useMelodia();

  if (loading) return null;

  const effective = context?.creditsEffective || 0;
  return effective >= minCredits ? <>{children}</> : <>{fallback}</>;
}
