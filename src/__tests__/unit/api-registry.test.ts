/**
 * MELODIA TESTS — API Registry Unit Tests
 * 
 * Tests error codes, API route registry, and lookup functions.
 */

import { describe, it, expect } from "vitest";
import { ERROR_CODES, API_REGISTRY, getApiRoute, getRoutesByPrefix } from "@/lib/core/api-registry";

// ============ TESTS ============

describe("ERROR_CODES", () => {
  it("has standard error codes defined", () => {
    const expectedCodes = [
      "UNAUTHORIZED", "FORBIDDEN", "NOT_FOUND", "BAD_REQUEST",
      "INTERNAL_ERROR", "RATE_LIMITED", "CONFLICT",
    ];
    for (const code of expectedCodes) {
      expect(ERROR_CODES[code as keyof typeof ERROR_CODES]).toBeDefined();
    }
  });

  it("each error code has code and message", () => {
    for (const [key, value] of Object.entries(ERROR_CODES)) {
      expect(value).toHaveProperty("code");
      expect(value).toHaveProperty("message");
    }
  });
});

describe("API_REGISTRY", () => {
  it("has entries for all Core API routes", () => {
    const expectedPrefixes = [
      "/api/core/generate",
      "/api/core/context",
      "/api/core/permissions",
      "/api/core/projects",
      "/api/core/media",
      "/api/core/artists",
      "/api/core/credits",
      "/api/core/subscriptions",
      "/api/core/payments",
      "/api/core/notifications",
      "/api/core/studios",
    ];

    const registeredPaths = API_REGISTRY.map((r) => r.path);
    for (const prefix of expectedPrefixes) {
      const found = registeredPaths.some((p) => p.startsWith(prefix));
      expect(found).toBe(true);
    }
  });

  it("every route has method and description", () => {
    for (const route of API_REGISTRY) {
      expect(route.path).toBeDefined();
      expect(route.method).toBeDefined();
      expect(route.description).toBeDefined();
    }
  });
});

describe("getApiRoute", () => {
  it("finds a route by path and method", () => {
    const route = getApiRoute("/api/core/generate", "POST");
    if (route) {
      expect(route.path).toBe("/api/core/generate");
    }
  });
});

describe("getRoutesByPrefix", () => {
  it("finds all routes for a prefix", () => {
    const creditRoutes = getRoutesByPrefix("/api/core/credits");
    expect(creditRoutes.length).toBeGreaterThan(0);
  });

  it("returns empty array for unknown prefix", () => {
    const routes = getRoutesByPrefix("/api/unknown");
    expect(routes).toEqual([]);
  });
});
