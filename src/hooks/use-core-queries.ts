/**
 * MELODIA CORE QUERIES — React Query hooks for all Core API endpoints
 *
 * Provides typed, cached, auto-updating data access for:
 * - User context & permissions
 * - Credits & transactions
 * - Projects & media
 * - Artists & identity
 * - Generations
 * - Notifications
 * - Subscriptions & payments
 * - Studios
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMelodia } from "@/contexts/melodia-context";

// ============ QUERY KEYS ============

export const coreKeys = {
  context: ["core", "context"] as const,
  credits: ["core", "credits"] as const,
  creditHistory: ["core", "credits", "history"] as const,
  permissions: ["core", "permissions"] as const,
  projects: ["core", "projects"] as const,
  project: (id: string) => ["core", "projects", id] as const,
  media: ["core", "media"] as const,
  artists: ["core", "artists"] as const,
  artist: (id: string) => ["core", "artists", id] as const,
  generations: ["core", "generations"] as const,
  generation: (id: string) => ["core", "generations", id] as const,
  notifications: ["core", "notifications"] as const,
  unreadCount: ["core", "notifications", "unread"] as const,
  subscription: ["core", "subscription"] as const,
};

// ============ GENERIC FETCHER ============

async function coreFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const json = await res.json();
  if (!json.success && json.error) {
    throw new Error(json.error.message || json.error.code || "Erreur API");
  }
  return json.data ?? json;
}

// ============ CONTEXT ============

export function useCoreContext() {
  return useQuery({
    queryKey: coreKeys.context,
    queryFn: () => coreFetch("/api/core/context"),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

// ============ CREDITS ============

export function useCreditWallet() {
  return useQuery({
    queryKey: coreKeys.credits,
    queryFn: () => coreFetch<any>("/api/core/credits/wallet"),
    staleTime: 15_000,
  });
}

export function useCreditHistory(page = 1, limit = 20) {
  return useQuery({
    queryKey: [...coreKeys.creditHistory, page, limit],
    queryFn: () => coreFetch<any>(`/api/core/credits/history?page=${page}&limit=${limit}`),
    staleTime: 30_000,
  });
}

export function usePurchaseCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { packId: string; provider: string; phoneNumber?: string }) =>
      coreFetch("/api/core/credits/purchase", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.credits });
      qc.invalidateQueries({ queryKey: coreKeys.context });
    },
  });
}

// ============ PERMISSIONS ============

export function usePermissions() {
  return useQuery({
    queryKey: coreKeys.permissions,
    queryFn: () => coreFetch<any>("/api/core/permissions"),
    staleTime: 60_000,
  });
}

// ============ PROJECTS ============

export function useProjects() {
  return useQuery({
    queryKey: coreKeys.projects,
    queryFn: () => coreFetch<any>("/api/core/projects"),
    staleTime: 30_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: coreKeys.project(id),
    queryFn: () => coreFetch<any>(`/api/core/projects/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type?: string; description?: string }) =>
      coreFetch("/api/core/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: coreKeys.projects }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; description?: string }) =>
      coreFetch(`/api/core/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_: any, { id }: { id: string }) => {
      qc.invalidateQueries({ queryKey: coreKeys.project(id) });
      qc.invalidateQueries({ queryKey: coreKeys.projects });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      coreFetch(`/api/core/projects/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: coreKeys.projects }),
  });
}

// ============ MEDIA ============

export function useMedia(projectId?: string) {
  const params = projectId ? `?projectId=${projectId}` : "";
  return useQuery({
    queryKey: [...coreKeys.media, projectId],
    queryFn: () => coreFetch<any>(`/api/core/media${params}`),
    staleTime: 30_000,
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { projectId?: string; type: string; fileName: string; fileSize: number; mimeType: string; url: string }) =>
      coreFetch("/api/core/media/upload", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: coreKeys.media }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      coreFetch(`/api/core/media/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: coreKeys.media }),
  });
}

// ============ ARTISTS ============

export function useArtists() {
  return useQuery({
    queryKey: coreKeys.artists,
    queryFn: () => coreFetch<any>("/api/core/artists"),
    staleTime: 60_000,
  });
}

export function useArtist(id: string) {
  return useQuery({
    queryKey: coreKeys.artist(id),
    queryFn: () => coreFetch<any>(`/api/core/artists/${id}`),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; bio?: string; country?: string; genres?: string[] }) =>
      coreFetch("/api/core/artists", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: coreKeys.artists }),
  });
}

export function useUpdateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; bio?: string; visualStyle?: string; colorPalette?: string[] }) =>
      coreFetch(`/api/core/artists/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_: any, { id }: { id: string }) => {
      qc.invalidateQueries({ queryKey: coreKeys.artist(id) });
      qc.invalidateQueries({ queryKey: coreKeys.artists });
    },
  });
}

// ============ GENERATIONS ============

export function useGenerate() {
  const qc = useQueryClient();
  const { addGeneration } = useMelodia();
  return useMutation({
    mutationFn: (params: { operation: string; projectId?: string; artistId?: string; [key: string]: any }) =>
      coreFetch("/api/core/generate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: coreKeys.generations });
      qc.invalidateQueries({ queryKey: coreKeys.credits });
      if (data?.generation?.id) {
        addGeneration({
          id: data.generation.id,
          operation: data.generation.operation || "generate",
          status: "processing",
          progress: 0,
          startedAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function useGenerationStatus(id: string) {
  return useQuery({
    queryKey: coreKeys.generation(id),
    queryFn: () => coreFetch<any>(`/api/core/generate-status/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.generation?.status;
      return status === "completed" || status === "failed" || status === "cancelled" ? false : 2000;
    },
  });
}

// ============ NOTIFICATIONS ============

export function useNotifications(limit = 20) {
  return useQuery({
    queryKey: [...coreKeys.notifications, limit],
    queryFn: () => coreFetch<any>(`/api/core/notifications?limit=${limit}`),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: coreKeys.unreadCount,
    queryFn: () => coreFetch<any>("/api/core/notifications/unread"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      coreFetch(`/api/core/notifications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead: true }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.notifications });
      qc.invalidateQueries({ queryKey: coreKeys.unreadCount });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      coreFetch("/api/core/notifications", {
        method: "PATCH",
        body: JSON.stringify({ action: "markAllRead" }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.notifications });
      qc.invalidateQueries({ queryKey: coreKeys.unreadCount });
    },
  });
}

// ============ SUBSCRIPTIONS ============

export function useCurrentSubscription() {
  return useQuery({
    queryKey: coreKeys.subscription,
    queryFn: () => coreFetch<any>("/api/core/subscriptions/current"),
    staleTime: 60_000,
  });
}

export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { planId: string; provider?: string }) =>
      coreFetch("/api/core/subscriptions/change", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.subscription });
      qc.invalidateQueries({ queryKey: coreKeys.context });
      qc.invalidateQueries({ queryKey: coreKeys.credits });
    },
  });
}

// ============ PAYMENTS ============

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { packId: string; provider: string; phoneNumber?: string; mobileProvider?: string }) =>
      coreFetch("/api/core/payments/checkout", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.credits });
      qc.invalidateQueries({ queryKey: coreKeys.context });
    },
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { paymentId: string; checkoutId: string; provider: string }) =>
      coreFetch("/api/core/payments/verify", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.credits });
      qc.invalidateQueries({ queryKey: coreKeys.context });
      qc.invalidateQueries({ queryKey: coreKeys.subscription });
    },
  });
}

// ============ STUDIO OPERATIONS ============

export function useAudioStudioGenerate() {
  const qc = useQueryClient();
  const { addGeneration } = useMelodia();
  return useMutation({
    mutationFn: (data: { operation: string; style?: string; mood?: string; lyrics?: string; [key: string]: any }) =>
      coreFetch("/api/core/studios/audio/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: coreKeys.credits });
      if (result?.generation?.id) {
        addGeneration({
          id: result.generation.id,
          operation: result.generation.operation,
          status: "processing",
          progress: 0,
          startedAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function useVideoStudioGenerate() {
  const qc = useQueryClient();
  const { addGeneration } = useMelodia();
  return useMutation({
    mutationFn: (data: { operation: string; audioUrl?: string; coverUrl?: string; style?: string; duration?: number; [key: string]: any }) =>
      coreFetch("/api/core/studios/video/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (result: any) => {
      qc.invalidateQueries({ queryKey: coreKeys.credits });
      if (result?.generation?.id) {
        addGeneration({
          id: result.generation.id,
          operation: result.generation.operation,
          status: "processing",
          progress: 0,
          startedAt: new Date().toISOString(),
        });
      }
    },
  });
}

export function useArtistStudioIdentity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { artistId: string; visualStyle?: string; colorPalette?: string[]; referenceImageUrls?: string[] }) =>
      coreFetch("/api/core/studios/artist/identity", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: coreKeys.artists });
    },
  });
}
