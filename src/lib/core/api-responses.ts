/**
 * MELODIA API — Standardized Response Helpers
 * 
 * Every Core API route MUST use these helpers for consistent responses.
 * No route should ever return raw `NextResponse.json()` directly.
 * 
 * Format:
 *   Success:  { success: true, data: T, meta?: { ... } }
 *   Error:    { success: false, error: { code, message, details? } }
 *   Paginated: { success: true, data: T[], meta: { pagination: { page, limit, total, totalPages }, ... } }
 */

import { NextResponse } from "next/server";

// ============ TYPES ============

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T = unknown> {
  success: true;
  data: T[];
  meta: {
    pagination: PaginationMeta;
    [key: string]: unknown;
  };
}

// ============ SUCCESS HELPERS ============

/**
 * Return a success response with data.
 * Usage: return Api.ok({ project })
 */
export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  const response: ApiSuccessResponse<T> = { success: true, data };
  if (meta) response.meta = meta;
  return NextResponse.json(response, { status });
}

/**
 * Return a success response for a created resource (201).
 * Usage: return Api.created({ project })
 */
export function created<T>(data: T, meta?: Record<string, unknown>) {
  return ok(data, meta, 201);
}

/**
 * Return a paginated list of items.
 * Usage: return Api.paginated(items, { page, limit, total, totalPages })
 */
export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  extraMeta?: Record<string, unknown>
) {
  const response: ApiPaginatedResponse<T> = {
    success: true,
    data,
    meta: { pagination, ...extraMeta },
  };
  return NextResponse.json(response);
}

/**
 * Return a simple success acknowledgment (no data).
 * Usage: return Api.ack()
 */
export function ack(meta?: Record<string, unknown>) {
  const response: ApiSuccessResponse<null> = { success: true, data: null };
  if (meta) response.meta = meta;
  return NextResponse.json(response);
}

// ============ ERROR HELPERS ============

/**
 * Return a standardized error response.
 * Usage: return Api.error("UNAUTHORIZED", "Non autorisé", 401)
 */
export function error(code: string, message: string, status: number, details?: unknown) {
  const response: ApiErrorResponse = {
    success: false,
    error: { code, message, details },
  };
  return NextResponse.json(response, { status });
}

// ============ PRE-BUILT ERROR RESPONSES ============

/** 400 Bad Request */
export function badRequest(message: string, details?: unknown) {
  return error("BAD_REQUEST", message, 400, details);
}

/** 401 Unauthorized */
export function unauthorized() {
  return error("UNAUTHORIZED", "Non autorisé. Connectez-vous pour continuer.", 401);
}

/** 403 Forbidden */
export function forbidden(message?: string) {
  return error("FORBIDDEN", message || "Permission refusée. Votre plan ne permet pas cette action.", 403);
}

/** 404 Not Found */
export function notFound(resource: string = "Ressource") {
  return error("NOT_FOUND", `${resource} non trouvé.`, 404);
}

/** 409 Conflict */
export function conflict(message: string) {
  return error("CONFLICT", message, 409);
}

/** 429 Too Many Requests */
export function rateLimited() {
  return error("RATE_LIMITED", "Trop de requêtes. Réessayez dans un instant.", 429);
}

/** 500 Internal Server Error */
export function internalError(message?: string) {
  return error("INTERNAL_ERROR", message || "Erreur interne du serveur. Veuillez réessayer.", 500);
}

// ============ ERROR HANDLER ============

/**
 * Handle any error thrown in an API route and return the appropriate response.
 * This should be used in every route's catch block.
 * 
 * Usage:
 *   try { ... } catch (err) { return Api.handleRouteError(err); }
 */
export function handleRouteError(err: unknown): NextResponse {
  // Zod validation error → 400
  if (err && typeof err === "object" && "issues" in err) {
    const zodErr = err as { issues: Array<{ message: string; path?: (string | number)[] }> };
    return badRequest(
      zodErr.issues[0]?.message || "Données invalides",
      zodErr.issues.map((i) => ({ path: i.path?.join("."), message: i.message }))
    );
  }

  // PermissionDeniedError → 403
  if (err && typeof err === "object" && "name" in err && (err as Error).name === "PermissionDeniedError") {
    return forbidden((err as Error).message);
  }

  // Known error messages → specific responses
  if (err instanceof Error) {
    const msg = err.message;

    // Not found patterns
    if (msg.includes("not found") || msg.includes("non trouvé")) {
      return notFound();
    }

    // Access denied patterns
    if (msg.includes("access denied") || msg.includes("accès refusé")) {
      return forbidden(msg);
    }

    // Insufficient credits
    if (msg.includes("insuffisant") || msg.includes("Insufficient")) {
      return error("INSUFFICIENT_CREDITS", msg, 402);
    }

    // Already exists
    if (msg.includes("déjà") || msg.includes("already")) {
      return conflict(msg);
    }

    // Provider not configured
    if (msg.includes("non configuré") || msg.includes("not configured")) {
      return error("PROVIDER_NOT_CONFIGURED", msg, 503);
    }

    // Log unexpected errors
    console.error("[API Error]", msg);
    return internalError(msg);
  }

  // Unknown error type
  console.error("[API Error] Unknown:", err);
  return internalError();
}

// ============ COMBINED EXPORT ============

export const Api = {
  ok,
  created,
  paginated,
  ack,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  rateLimited,
  internalError,
  handleRouteError,
};
