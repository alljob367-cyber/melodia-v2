/**
 * MELODIA CORE HOOKS — React hooks for Core API interaction
 * 
 * useCoreAction  — Generic API call with loading/error/success states
 * usePayment     — Payment checkout flow (Stripe/Wave/FPay)
 * useGeneration  — Generation status polling
 */

"use client";

import { useState, useCallback, useRef } from "react";
import { useMelodia } from "@/contexts/melodia-context";

// ============ USE CORE ACTION ============

export interface CoreActionResult<T = unknown> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  execute: (...args: unknown[]) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook for making Core API calls with automatic loading/error/success states.
 * 
 * Usage:
 *   const { execute, loading, error } = useCoreAction(async (title) => {
 *     const res = await fetch("/api/core/projects", { method: "POST", body: JSON.stringify({ name: title }) });
 *     const json = await res.json();
 *     if (!json.success) throw new Error(json.error.message);
 *     return json.data;
 *   });
 */
export function useCoreAction<T = unknown>(
  action: (...args: unknown[]) => Promise<T>,
  options?: { onSuccess?: (data: T) => void; onError?: (error: string) => void }
): CoreActionResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const execute = useCallback(async (...args: unknown[]): Promise<T | null> => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const result = await action(...args);
      setData(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      const code = (err as any)?.code || null;
      setError(msg);
      setErrorCode(code);
      options?.onError?.(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [action, options]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setErrorCode(null);
    setLoading(false);
  }, []);

  return { data, loading, error, errorCode, execute, reset };
}

// ============ USE PAYMENT ============

export interface PaymentState {
  loading: boolean;
  checkoutUrl: string | null;
  paymentId: string | null;
  verifying: boolean;
  error: string | null;
  startCheckout: (packId: string, provider: "stripe" | "wave" | "fpay" | "manual", options?: { phoneNumber?: string; mobileProvider?: "orange" | "mtn" | "moov" }) => Promise<{ checkoutUrl?: string } | null>;
  verifyPayment: (paymentId: string, checkoutId: string, provider: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Hook for the complete payment checkout flow.
 * Handles: create checkout → redirect/verify → complete
 * 
 * Usage:
 *   const { startCheckout, loading, checkoutUrl } = usePayment();
 *   await startCheckout("pack-id", "wave");
 */
export function usePayment(): PaymentState {
  const { refresh } = useMelodia();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async (
    packId: string,
    provider: "stripe" | "wave" | "fpay" | "manual",
    options?: { phoneNumber?: string; mobileProvider?: "orange" | "mtn" | "moov" }
  ): Promise<{ checkoutUrl?: string } | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/core/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, provider, ...options }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error?.message || "Erreur lors de la création du paiement");
      }

      setPaymentId(json.data?.payment?.id || json.payment?.id);
      setCheckoutUrl(json.data?.checkout?.checkoutUrl || json.checkout?.checkoutUrl);

      // For manual provider, credits are added immediately
      if (provider === "manual") {
        await refresh();
        return { checkoutUrl: undefined };
      }

      // For redirect-based providers (Stripe, Wave), redirect user
      const url = json.data?.checkout?.checkoutUrl || json.checkout?.checkoutUrl;
      if (url) {
        window.location.href = url;
      }

      return { checkoutUrl: url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de paiement";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const verifyPayment = useCallback(async (
    paymentId: string,
    checkoutId: string,
    provider: string
  ): Promise<boolean> => {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch("/api/core/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, checkoutId, provider }),
      });
      const json = await res.json();

      if (json.success && json.data?.status === "completed") {
        await refresh(); // Refresh user context with new credits
        return true;
      }

      if (json.data?.status === "pending") {
        return false; // Still processing
      }

      throw new Error(json.error?.message || "Paiement échoué");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur de vérification";
      setError(msg);
      return false;
    } finally {
      setVerifying(false);
    }
  }, [refresh]);

  const reset = useCallback(() => {
    setLoading(false);
    setVerifying(false);
    setCheckoutUrl(null);
    setPaymentId(null);
    setError(null);
  }, []);

  return { loading, checkoutUrl, paymentId, verifying, error, startCheckout, verifyPayment, reset };
}

// ============ USE GENERATION POLL ============

export interface GenerationPollResult {
  generation: any | null;
  polling: boolean;
  startPolling: (generationId: string) => void;
  stopPolling: () => void;
}

/**
 * Hook for polling generation status until completion.
 * 
 * Usage:
 *   const { generation, polling, startPolling } = useGenerationPoll();
 *   startPolling(genId);
 *   // Will auto-poll every 2s until status is completed/failed/cancelled
 */
export function useGenerationPoll(interval = 2000): GenerationPollResult {
  const [generation, setGeneration] = useState<any | null>(null);
  const [polling, setPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPolling(false);
  }, []);

  const startPolling = useCallback((generationId: string) => {
    setPolling(true);
    
    const poll = async () => {
      try {
        const res = await fetch(`/api/core/generate-status/${generationId}`);
        const json = await res.json();
        const gen = json.data || json.generation;
        setGeneration(gen);

        if (gen && ["completed", "failed", "cancelled"].includes(gen.status)) {
          stopPolling();
        }
      } catch {
        // Continue polling on transient errors
      }
    };

    poll(); // Initial fetch
    intervalRef.current = setInterval(poll, interval);
  }, [interval, stopPolling]);

  return { generation, polling, startPolling, stopPolling };
}
