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

  subscriptionStatus: "active" | "expired" | "trial" | "cancelled";

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

// ============ GENERATION STATE ============

export interface ActiveGeneration {
  id: string;
  operation: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;
  startedAt?: string;
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
  // Generation state
  activeGenerations: ActiveGeneration[];
  addGeneration: (gen: ActiveGeneration) => void;
  removeGeneration: (id: string) => void;
  updateGenerationProgress: (id: string, progress: number, status?: string) => void;
}

const MelodiaContext = createContext<MelodiaContextValue>({
  context: null,
  loading: true,
  error: null,
  refresh: async () => {},
  canPerform: () => false,
  setActiveProject: () => {},
  setActiveArtist: () => {},
  activeGenerations: [],
  addGeneration: () => {},
  removeGeneration: () => {},
  updateGenerationProgress: () => {},
});

// ============ PROVIDER ============

export function MelodiaProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<MelodiaUserContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGenerations, setActiveGenerations] = useState<ActiveGeneration[]>([]);

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
    // Don't fetch context on public pages (no auth required)
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    const publicPaths = ['/', '/login', '/signup'];
    if (publicPaths.includes(pathname)) {
      setLoading(false);
      return;
    }
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

  // Generation state management
  const addGeneration = useCallback((gen: ActiveGeneration) => {
    setActiveGenerations(prev => [...prev, gen]);
  }, []);

  const removeGeneration = useCallback((id: string) => {
    setActiveGenerations(prev => prev.filter(g => g.id !== id));
  }, []);

  const updateGenerationProgress = useCallback((id: string, progress: number, status?: string) => {
    setActiveGenerations(prev => prev.map(g =>
      g.id === id ? { ...g, progress, ...(status ? { status: status as ActiveGeneration["status"] } : {}) } : g
    ));
  }, []);

  // Poll active generations for progress updates
  useEffect(() => {
    const activeGens = activeGenerations.filter(g => g.status === "pending" || g.status === "processing");
    if (activeGens.length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const gen of activeGens) {
        try {
          const res = await fetch(`/api/core/generate-status/${gen.id}`);
          if (res.ok) {
            const data = await res.json();
            const g = data.generation;
            updateGenerationProgress(gen.id, g.progress, g.status);
            
            // If completed or failed, remove after a delay
            if (g.status === "completed" || g.status === "failed" || g.status === "cancelled") {
              setTimeout(() => removeGeneration(gen.id), 3000);
              // Refresh context to update credits
              fetchContext();
            }
          }
        } catch {
          // Silently fail
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [activeGenerations, updateGenerationProgress, removeGeneration, fetchContext]);

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
        activeGenerations,
        addGeneration,
        removeGeneration,
        updateGenerationProgress,
      }}
    >
      {children}
    </MelodiaContext.Provider>
  );
}

// ============ HOOKS ============

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

export function useGenerations() {
  const { activeGenerations, addGeneration, removeGeneration, updateGenerationProgress } = useMelodia();
  return {
    active: activeGenerations,
    hasActive: activeGenerations.some(g => g.status === "pending" || g.status === "processing"),
    add: addGeneration,
    remove: removeGeneration,
    updateProgress: updateGenerationProgress,
  };
}
