/**
 * MELODIA TESTS — API Schemas (Zod) Unit Tests
 * 
 * Tests all Zod validation schemas to ensure correct validation
 * of request bodies across all Core API routes.
 */

import { describe, it, expect } from "vitest";
import {
  PaginationSchema,
  GenerateSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateArtistSchema,
  UpdateArtistIdentitySchema,
  UploadMediaSchema,
  PurchaseCreditsSchema,
  CreditHistorySchema,
  ChangePlanSchema,
  CheckoutSchema,
  VerifyPaymentSchema,
  AudioStudioSchema,
  VideoStudioSchema,
  ArtistStudioSchema,
  ListNotificationsSchema,
  MarkNotificationsSchema,
  OPERATION_PERMISSION_MAP,
} from "@/lib/core/api-schemas";

// ============ PAGINATION ============

describe("PaginationSchema", () => {
  it("defaults page to 1 and limit to 50", () => {
    const result = PaginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it("accepts valid page and limit", () => {
    const result = PaginationSchema.parse({ page: 2, limit: 20 });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(20);
  });

  it("rejects limit > 100", () => {
    expect(() => PaginationSchema.parse({ limit: 200 })).toThrow();
  });

  it("rejects negative page", () => {
    expect(() => PaginationSchema.parse({ page: -1 })).toThrow();
  });

  it("coerces string values to numbers", () => {
    const result = PaginationSchema.parse({ page: "3", limit: "10" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
  });
});

// ============ GENERATE ============

describe("GenerateSchema", () => {
  it("accepts valid generation request with operation only", () => {
    const result = GenerateSchema.parse({ operation: "generate_lyrics" });
    expect(result.operation).toBe("generate_lyrics");
    expect(result.language).toBe("fr"); // default
  });

  it("accepts all 12 operation types", () => {
    const operations = [
      "generate_lyrics", "generate_composition", "generate_cover", "generate_audio",
      "generate_video_economy", "generate_video_standard", "generate_video_premium",
      "generate_storyboard", "use_ai_producer", "use_voice_studio", "use_mix_master", "full_song",
    ];
    for (const op of operations) {
      const result = GenerateSchema.parse({ operation: op });
      expect(result.operation).toBe(op);
    }
  });

  it("rejects invalid operation", () => {
    expect(() => GenerateSchema.parse({ operation: "invalid_op" })).toThrow();
  });

  it("accepts optional fields", () => {
    const result = GenerateSchema.parse({
      operation: "generate_audio",
      projectId: "proj-123",
      artistId: "art-123",
      title: "My Song",
      style: "Afrobeat",
      mood: "Energetic",
      language: "wo",
      lyrics: "Some lyrics text",
      quality: "premium",
      durationSeconds: 30,
    });
    expect(result.style).toBe("Afrobeat");
    expect(result.language).toBe("wo");
    expect(result.quality).toBe("premium");
  });

  it("accepts African languages", () => {
    for (const lang of ["fr", "en", "wo", "ln", "lg", "pt", "es"]) {
      const result = GenerateSchema.parse({ operation: "generate_lyrics", language: lang });
      expect(result.language).toBe(lang);
    }
  });

  it("rejects lyrics > 5000 chars", () => {
    expect(() =>
      GenerateSchema.parse({ operation: "generate_lyrics", lyrics: "x".repeat(5001) })
    ).toThrow();
  });

  it("rejects durationSeconds > 300", () => {
    expect(() =>
      GenerateSchema.parse({ operation: "generate_audio", durationSeconds: 301 })
    ).toThrow();
  });
});

// ============ PROJECTS ============

describe("CreateProjectSchema", () => {
  it("requires name, defaults type to single", () => {
    const result = CreateProjectSchema.parse({ name: "My Album" });
    expect(result.name).toBe("My Album");
    expect(result.type).toBe("single");
  });

  it("accepts all project types", () => {
    for (const type of ["single", "ep", "album", "mixtape", "playlist"]) {
      const result = CreateProjectSchema.parse({ name: "Test", type });
      expect(result.type).toBe(type);
    }
  });

  it("rejects empty name", () => {
    expect(() => CreateProjectSchema.parse({ name: "" })).toThrow();
  });
});

describe("UpdateProjectSchema", () => {
  it("accepts partial updates", () => {
    const result = UpdateProjectSchema.parse({ name: "Updated" });
    expect(result.name).toBe("Updated");
  });

  it("accepts status change", () => {
    const result = UpdateProjectSchema.parse({ status: "archived" });
    expect(result.status).toBe("archived");
  });

  it("allows empty object (no fields required)", () => {
    const result = UpdateProjectSchema.parse({});
    expect(result.name).toBeUndefined();
  });
});

// ============ ARTISTS ============

describe("CreateArtistSchema", () => {
  it("requires name", () => {
    const result = CreateArtistSchema.parse({ name: "African Star" });
    expect(result.name).toBe("African Star");
  });

  it("accepts optional fields", () => {
    const result = CreateArtistSchema.parse({
      name: "Star",
      bio: "A great artist",
      country: "SN",
      genre: "Afrobeat",
      styles: ["Afrobeat", "Amapiano"],
    });
    expect(result.country).toBe("SN");
    expect(result.styles).toHaveLength(2);
  });
});

describe("UpdateArtistIdentitySchema", () => {
  it("accepts visual style update", () => {
    const result = UpdateArtistIdentitySchema.parse({
      visualStyle: { primary: "dark", accent: "gold" },
    });
    expect(result.visualStyle).toBeDefined();
  });

  it("accepts color palette", () => {
    const result = UpdateArtistIdentitySchema.parse({
      colorPalette: ["#FF0000", "#00FF00", "#0000FF"],
    });
    expect(result.colorPalette).toHaveLength(3);
  });

  it("accepts reference images", () => {
    const result = UpdateArtistIdentitySchema.parse({
      referenceImages: [
        { id: "img1", url: "https://example.com/img.jpg", label: "Cover", type: "photo" },
      ],
    });
    expect(result.referenceImages).toHaveLength(1);
  });
});

// ============ MEDIA ============

describe("UploadMediaSchema", () => {
  it("accepts valid upload", () => {
    const result = UploadMediaSchema.parse({
      name: "song.mp3",
      type: "audio",
      mimeType: "audio/mpeg",
      url: "https://cdn.melodia.ai/song.mp3",
    });
    expect(result.type).toBe("audio");
    expect(result.isPublic).toBe(false); // default
  });

  it("rejects invalid URL", () => {
    expect(() =>
      UploadMediaSchema.parse({
        name: "song.mp3",
        type: "audio",
        mimeType: "audio/mpeg",
        url: "not-a-url",
      })
    ).toThrow();
  });

  it("accepts all media types", () => {
    for (const type of ["audio", "image", "video", "document", "lyrics"]) {
      const result = UploadMediaSchema.parse({
        name: "file",
        type,
        mimeType: "application/octet-stream",
        url: "https://cdn.melodia.ai/file",
      });
      expect(result.type).toBe(type);
    }
  });
});

// ============ CREDITS ============

describe("PurchaseCreditsSchema", () => {
  it("requires packId, defaults provider to manual", () => {
    const result = PurchaseCreditsSchema.parse({ packId: "pack-123" });
    expect(result.packId).toBe("pack-123");
    expect(result.paymentProvider).toBe("manual");
  });

  it("accepts all providers", () => {
    for (const provider of ["stripe", "wave", "fpay", "orange_money", "manual"]) {
      const result = PurchaseCreditsSchema.parse({ packId: "pack-1", paymentProvider: provider });
      expect(result.paymentProvider).toBe(provider);
    }
  });
});

describe("CreditHistorySchema", () => {
  it("accepts category and type filters", () => {
    const result = CreditHistorySchema.parse({
      category: "generation",
      type: "debit",
    });
    expect(result.category).toBe("generation");
    expect(result.type).toBe("debit");
  });
});

// ============ SUBSCRIPTIONS ============

describe("ChangePlanSchema", () => {
  it("accepts all 6 plans", () => {
    const plans = ["basic", "artist_starter", "artist_production", "video_creator", "artist_pro", "label"];
    for (const plan of plans) {
      const result = ChangePlanSchema.parse({ newPlan: plan });
      expect(result.newPlan).toBe(plan);
    }
  });

  it("rejects invalid plan", () => {
    expect(() => ChangePlanSchema.parse({ newPlan: "premium_ultra" })).toThrow();
  });
});

// ============ PAYMENTS ============

describe("CheckoutSchema", () => {
  it("requires packId and provider", () => {
    const result = CheckoutSchema.parse({ packId: "pack-1", provider: "stripe" });
    expect(result.provider).toBe("stripe");
  });

  it("accepts optional phone and mobile provider", () => {
    const result = CheckoutSchema.parse({
      packId: "pack-1",
      provider: "fpay",
      phoneNumber: "+22177123456",
      mobileProvider: "orange",
    });
    expect(result.mobileProvider).toBe("orange");
  });
});

describe("VerifyPaymentSchema", () => {
  it("requires all 3 fields", () => {
    const result = VerifyPaymentSchema.parse({
      paymentId: "pay-1",
      checkoutId: "co-1",
      provider: "wave",
    });
    expect(result.paymentId).toBe("pay-1");
  });
});

// ============ STUDIOS ============

describe("AudioStudioSchema", () => {
  it("accepts valid audio studio request", () => {
    const result = AudioStudioSchema.parse({
      operation: "generate_lyrics",
      projectId: "proj-1",
    });
    expect(result.operation).toBe("generate_lyrics");
  });

  it("requires projectId", () => {
    expect(() => AudioStudioSchema.parse({ operation: "generate_lyrics" })).toThrow();
  });

  it("accepts all audio operations", () => {
    for (const op of ["generate_lyrics", "generate_audio", "mix_master", "full_song"]) {
      const result = AudioStudioSchema.parse({ operation: op, projectId: "proj-1" });
      expect(result.operation).toBe(op);
    }
  });
});

describe("VideoStudioSchema", () => {
  it("accepts valid video studio request", () => {
    const result = VideoStudioSchema.parse({
      operation: "generate_video",
      projectId: "proj-1",
    });
    expect(result.operation).toBe("generate_video");
  });

  it("accepts quality tiers", () => {
    for (const q of ["economy", "standard", "premium"]) {
      const result = VideoStudioSchema.parse({
        operation: "generate_video",
        projectId: "proj-1",
        quality: q,
      });
      expect(result.quality).toBe(q);
    }
  });
});

describe("ArtistStudioSchema", () => {
  it("accepts identity update action", () => {
    const result = ArtistStudioSchema.parse({
      action: "update_identity",
      artistId: "art-1",
    });
    expect(result.action).toBe("update_identity");
  });

  it("accepts all studio actions", () => {
    for (const action of ["update_identity", "ai_producer", "voice_studio", "analytics"]) {
      const result = ArtistStudioSchema.parse({
        action,
        artistId: "art-1",
      });
      expect(result.action).toBe(action);
    }
  });
});

// ============ NOTIFICATIONS ============

describe("ListNotificationsSchema", () => {
  it("accepts isRead filter", () => {
    const result = ListNotificationsSchema.parse({ isRead: false });
    expect(result.isRead).toBe(false);
  });
});

describe("MarkNotificationsSchema", () => {
  it("accepts markAllRead action", () => {
    const result = MarkNotificationsSchema.parse({ action: "markAllRead" });
    expect(result.action).toBe("markAllRead");
  });
});

// ============ OPERATION → PERMISSION MAPPING ============

describe("OPERATION_PERMISSION_MAP", () => {
  it("maps all 12 credit operations to permissions", () => {
    const expectedMappings: Record<string, string> = {
      generate_lyrics: "CREATE_LYRICS",
      generate_composition: "CREATE_COMPOSITION",
      generate_cover: "CREATE_COVER",
      generate_audio: "CREATE_AUDIO",
      generate_video_economy: "CREATE_VIDEO",
      generate_video_standard: "CREATE_VIDEO",
      generate_video_premium: "CREATE_VIDEO",
      generate_storyboard: "CREATE_STORYBOARD",
      use_ai_producer: "USE_AI_PRODUCER",
      use_voice_studio: "USE_VOICE_STUDIO",
      use_mix_master: "USE_MIX_MASTER",
      full_song: "CREATE_SONG",
    };

    for (const [op, perm] of Object.entries(expectedMappings)) {
      expect(OPERATION_PERMISSION_MAP[op]).toBe(perm);
    }
  });

  it("has mapping for every credit operation", () => {
    const creditOps = [
      "generate_lyrics", "generate_composition", "generate_cover", "generate_audio",
      "generate_video_economy", "generate_video_standard", "generate_video_premium",
      "generate_storyboard", "use_ai_producer", "use_voice_studio", "use_mix_master", "full_song",
    ];
    for (const op of creditOps) {
      expect(OPERATION_PERMISSION_MAP[op]).toBeDefined();
    }
  });
});
