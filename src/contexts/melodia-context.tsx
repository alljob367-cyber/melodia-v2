"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { MelodiaOperation } from "@/lib/core/permission-engine";

// ============ USER CONTEXT TYPE ============

export interface MelodiaUserContext {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  locale: string;

  organizationId: string | null;
  organizationRole: string | null;

  subscriptionStatus: "active" | "expired" | "trial";

  creditBalance: number;
  creditsReserved: number;
  creditsEffective: number;
  songsRemaining: number;
  coversRemaining: number;
  videosRemaining: number;

  permissions: MelodiaOperation[];

  usageLimits: {
    maxProjects: number;
    maxArtists: number;
    maxMediaPerProject: number;
    maxStorageMb: number;
    canUseVideo: boolean;
    canUseAIProducer: boolean;
    canUseLabelFeatures: boolean;
  };

  activeProjectId: string | null;
  activeArtistId: string | null;
}

// ============ CONTEXT ============

interface MelodiaContextValue {
  context: MelodiaUserContext | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  canPerform: (operation: MelodiaOperation) => boolean;
  setActiveProject: (projectId: string | null) => void;
  setActiveArtist: (artistId: string | null) => void;
}

const MelodiaContext = createContext<MelodiaContextValue>({
  context: null,
  loading: true,
  error: null,
  refresh: async () => {},
  canPerform: () => false,
  setActiveProject: () => {},
  setActiveArtist: () => {},
});

// ============ PROVIDER ============

export function MelodiaProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<MelodiaUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/core/context");
      if (res.ok) {
        const data = await res.json();
        setContext(data.context);
        setError(null);
      } else {
        setError("Failed to load context");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  const canPerform = useCallback(
    (operation: MelodiaOperation): boolean => {
      if (!context) return false;
      return context.permissions.includes(operation);
    },
    [context]
  );

  const setActiveProject = useCallback((projectId: string | null) => {
    setContext((prev) => prev ? { ...prev, activeProjectId: projectId } : prev);
  }, []);

  const setActiveArtist = useCallback((artistId: string | null) => {
    setContext((prev) => prev ? { ...prev, activeArtistId: artistId } : prev);
  }, []);

  return (
    <MelodiaContext.Provider
      value={{
        context,
        loading,
        error,
        refresh: fetchContext,
        canPerform,
        setActiveProject,
        setActiveArtist,
      }}
    >
      {children}
    </MelodiaContext.Provider>
  );
}

// ============ HOOK ============

export function useMelodia() {
  return useContext(MelodiaContext);
}

export function usePermissions() {
  const { canPerform, context } = useMelodia();
  return {
    canPerform,
    permissions: context?.permissions || [],
    plan: context?.plan || "basic",
    usageLimits: context?.usageLimits,
  };
}

export function useCredits() {
  const { context } = useMelodia();
  return {
    balance: context?.creditBalance || 0,
    reserved: context?.creditsReserved || 0,
    effective: context?.creditsEffective || 0,
    songsRemaining: context?.songsRemaining || 0,
    coversRemaining: context?.coversRemaining || 0,
    videosRemaining: context?.videosRemaining || 0,
  };
}
