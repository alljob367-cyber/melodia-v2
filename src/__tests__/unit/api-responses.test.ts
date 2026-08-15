/**
 * MELODIA TESTS — API Responses Unit Tests
 * 
 * Tests the standardized API response format.
 * Every Core API route uses these helpers.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js server
let mockJsonResult: any;
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: ResponseInit) => {
      mockJsonResult = { body, status: init?.status || 200 };
      return mockJsonResult;
    },
  },
}));

import { Api } from "@/lib/core/api-responses";

// ============ TESTS ============

describe("Api.ok", () => {
  it("returns success response with data", () => {
    Api.ok({ id: "123", name: "Test" });
    expect(mockJsonResult.body).toEqual({
      success: true,
      data: { id: "123", name: "Test" },
    });
    expect(mockJsonResult.status).toBe(200);
  });

  it("includes meta when provided", () => {
    Api.ok({ items: [] }, { source: "cache" });
    expect(mockJsonResult.body).toEqual({
      success: true,
      data: { items: [] },
      meta: { source: "cache" },
    });
  });

  it("supports custom status code", () => {
    Api.ok({ accepted: true }, undefined, 202);
    expect(mockJsonResult.status).toBe(202);
  });
});

describe("Api.created", () => {
  it("returns 201 with data", () => {
    Api.created({ id: "new-123" });
    expect(mockJsonResult.body).toEqual({
      success: true,
      data: { id: "new-123" },
    });
    expect(mockJsonResult.status).toBe(201);
  });
});

describe("Api.paginated", () => {
  it("returns paginated response with pagination meta", () => {
    Api.paginated(
      [{ id: "1" }, { id: "2" }],
      { page: 1, limit: 20, total: 50, totalPages: 3 }
    );
    expect(mockJsonResult.body).toEqual({
      success: true,
      data: [{ id: "1" }, { id: "2" }],
      meta: { pagination: { page: 1, limit: 20, total: 50, totalPages: 3 } },
    });
  });

  it("includes extra meta fields", () => {
    Api.paginated(
      [],
      { page: 1, limit: 20, total: 0, totalPages: 0 },
      { filter: "audio" }
    );
    expect(mockJsonResult.body.meta.filter).toBe("audio");
  });
});

describe("Api.ack", () => {
  it("returns success with null data", () => {
    Api.ack();
    expect(mockJsonResult.body).toEqual({
      success: true,
      data: null,
    });
  });
});

describe("Api.error", () => {
  it("returns error response with code, message, status", () => {
    Api.error("VALIDATION_ERROR", "Champ requis manquant", 400);
    expect(mockJsonResult.body).toEqual({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Champ requis manquant" },
    });
    expect(mockJsonResult.status).toBe(400);
  });

  it("includes details when provided", () => {
    Api.error("VALIDATION_ERROR", "Invalid", 400, { field: "email" });
    expect(mockJsonResult.body.error.details).toEqual({ field: "email" });
  });
});

describe("Api.badRequest", () => {
  it("returns 400 with BAD_REQUEST code", () => {
    Api.badRequest("Données invalides");
    expect(mockJsonResult.body.error.code).toBe("BAD_REQUEST");
    expect(mockJsonResult.body.error.message).toBe("Données invalides");
    expect(mockJsonResult.status).toBe(400);
  });
});

describe("Api.unauthorized", () => {
  it("returns 401 with UNAUTHORIZED code", () => {
    Api.unauthorized();
    expect(mockJsonResult.body.error.code).toBe("UNAUTHORIZED");
    expect(mockJsonResult.status).toBe(401);
  });
});

describe("Api.forbidden", () => {
  it("returns 403 with FORBIDDEN code and default message", () => {
    Api.forbidden();
    expect(mockJsonResult.body.error.code).toBe("FORBIDDEN");
    expect(mockJsonResult.status).toBe(403);
    expect(mockJsonResult.body.error.message).toContain("Permission refusée");
  });

  it("accepts custom message", () => {
    Api.forbidden("Plan insuffisant");
    expect(mockJsonResult.body.error.message).toBe("Plan insuffisant");
  });
});

describe("Api.notFound", () => {
  it("returns 404 with default resource name", () => {
    Api.notFound();
    expect(mockJsonResult.body.error.code).toBe("NOT_FOUND");
    expect(mockJsonResult.body.error.message).toContain("Ressource");
    expect(mockJsonResult.status).toBe(404);
  });

  it("accepts custom resource name", () => {
    Api.notFound("Projet");
    expect(mockJsonResult.body.error.message).toContain("Projet");
  });
});

describe("Api.conflict", () => {
  it("returns 409 with CONFLICT code", () => {
    Api.conflict("Ressource déjà existante");
    expect(mockJsonResult.body.error.code).toBe("CONFLICT");
    expect(mockJsonResult.status).toBe(409);
  });
});

describe("Api.rateLimited", () => {
  it("returns 429 with RATE_LIMITED code", () => {
    Api.rateLimited();
    expect(mockJsonResult.body.error.code).toBe("RATE_LIMITED");
    expect(mockJsonResult.status).toBe(429);
  });
});

describe("Api.internalError", () => {
  it("returns 500 with INTERNAL_ERROR code", () => {
    Api.internalError();
    expect(mockJsonResult.body.error.code).toBe("INTERNAL_ERROR");
    expect(mockJsonResult.status).toBe(500);
  });

  it("accepts custom message", () => {
    Api.internalError("DB connection failed");
    expect(mockJsonResult.body.error.message).toBe("DB connection failed");
  });
});

describe("Api.handleRouteError", () => {
  it("handles Zod validation errors → 400", () => {
    const zodError = {
      issues: [
        { message: "Required", path: ["name"] },
        { message: "Too long", path: ["description"] },
      ],
    };
    const result = Api.handleRouteError(zodError);
    expect(result.body.error.code).toBe("BAD_REQUEST");
    expect(result.status).toBe(400);
  });

  it("handles PermissionDeniedError → 403", () => {
    const err = new Error("Operation not allowed");
    err.name = "PermissionDeniedError";
    const result = Api.handleRouteError(err);
    expect(result.body.error.code).toBe("FORBIDDEN");
    expect(result.status).toBe(403);
  });

  it("handles 'not found' error messages → 404", () => {
    const result = Api.handleRouteError(new Error("User not found"));
    expect(result.body.error.code).toBe("NOT_FOUND");
    expect(result.status).toBe(404);
  });

  it("handles French 'non trouvé' error messages → 404", () => {
    const result = Api.handleRouteError(new Error("Projet non trouvé"));
    expect(result.body.error.code).toBe("NOT_FOUND");
  });

  it("handles 'access denied' error messages → 403", () => {
    const result = Api.handleRouteError(new Error("access denied for this resource"));
    expect(result.body.error.code).toBe("FORBIDDEN");
  });

  it("handles French 'accès refusé' error messages → 403", () => {
    const result = Api.handleRouteError(new Error("Génération accès refusé"));
    expect(result.body.error.code).toBe("FORBIDDEN");
  });

  it("handles insufficient credits → 402", () => {
    const result = Api.handleRouteError(new Error("Crédits insuffisant"));
    expect(result.body.error.code).toBe("INSUFFICIENT_CREDITS");
    expect(result.status).toBe(402);
  });

  it("handles 'already exists' conflicts → 409", () => {
    const result = Api.handleRouteError(new Error("Projet déjà existant"));
    expect(result.body.error.code).toBe("CONFLICT");
    expect(result.status).toBe(409);
  });

  it("handles provider not configured → 503", () => {
    const result = Api.handleRouteError(new Error("STRIPE_SECRET_KEY non configuré"));
    expect(result.body.error.code).toBe("PROVIDER_NOT_CONFIGURED");
    expect(result.status).toBe(503);
  });

  it("handles unknown errors → 500", () => {
    const result = Api.handleRouteError(new Error("Something unexpected"));
    expect(result.body.error.code).toBe("INTERNAL_ERROR");
    expect(result.status).toBe(500);
  });

  it("handles non-Error thrown values → 500", () => {
    const result = Api.handleRouteError("string error");
    expect(result.body.error.code).toBe("INTERNAL_ERROR");
    expect(result.status).toBe(500);
  });
});
