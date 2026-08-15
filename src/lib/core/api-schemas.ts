/**
 * MELODIA API — Centralized Zod Schemas
 * 
 * All request validation schemas in one place.
 * Every Core API route MUST use these schemas.
 * This ensures consistency, documentation, and type safety.
 */

import { z } from "zod";

// ============ COMMON ============

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const IdParamSchema = z.object({
  id: z.string().cuid(),
});

// ============ AUTH ============

export const SignupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  locale: z.enum(["fr", "en"]).default("fr"),
});

// ============ GENERATION ============

export const GenerateSchema = z.object({
  operation: z.enum([
    "generate_lyrics",
    "generate_composition",
    "generate_cover",
    "generate_audio",
    "generate_video_economy",
    "generate_video_standard",
    "generate_video_premium",
    "generate_storyboard",
    "use_ai_producer",
    "use_voice_studio",
    "use_mix_master",
    "full_song",
  ]),
  projectId: z.string().optional(),
  artistId: z.string().optional(),
  title: z.string().max(200).optional(),
  style: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
  theme: z.string().max(200).optional(),
  language: z.enum(["fr", "en", "wo", "ln", "lg", "pt", "es"]).default("fr"),
  lyrics: z.string().max(5000).optional(),
  additionalPrompt: z.string().max(1000).optional(),
  coverUrl: z.string().url().optional(),
  quality: z.enum(["economy", "standard", "premium"]).optional(),
  durationSeconds: z.number().min(5).max(300).optional(),
  availableMediaIds: z.array(z.string()).max(20).optional(),
});

// ============ PROJECTS ============

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["single", "ep", "album", "mixtape", "playlist"]).default("single"),
  description: z.string().max(2000).optional(),
  artistId: z.string().optional(),
  genre: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["single", "ep", "album", "mixtape", "playlist"]).optional(),
  description: z.string().max(2000).optional(),
  genre: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
  status: z.enum(["active", "archived", "draft"]).optional(),
});

// ============ ARTISTS ============

export const CreateArtistSchema = z.object({
  name: z.string().min(1).max(200),
  bio: z.string().max(2000).optional(),
  country: z.string().max(5).optional(), // ISO code: CI, SN, CM, ML
  genre: z.string().max(100).optional(),
  styles: z.array(z.string()).max(10).optional(),
  avatarUrl: z.string().url().optional(),
});

export const UpdateArtistIdentitySchema = z.object({
  visualStyle: z.record(z.string(), z.unknown()).optional(),
  referenceImages: z.array(z.object({
    id: z.string(),
    url: z.string().url(),
    label: z.string().max(100),
    type: z.string().max(50),
  })).max(20).optional(),
  colorPalette: z.array(z.string()).max(20).optional(),
  visualConcepts: z.array(z.object({
    name: z.string().max(100),
    description: z.string().max(500),
    imageUrl: z.string().url().optional(),
  })).max(10).optional(),
});

// ============ MEDIA ============

export const ListMediaSchema = PaginationSchema.extend({
  type: z.enum(["audio", "image", "video", "document", "lyrics"]).optional(),
  projectId: z.string().optional(),
  artistId: z.string().optional(),
});

export const UploadMediaSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["audio", "image", "video", "document", "lyrics"]),
  mimeType: z.string().max(100),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  fileSizeKb: z.number().min(1).max(500_000).optional(), // 500MB max
  duration: z.number().min(0).optional(),
  width: z.number().int().min(1).optional(),
  height: z.number().int().min(1).optional(),
  projectId: z.string().optional(),
  artistId: z.string().optional(),
  songId: z.string().optional(),
  tags: z.array(z.string()).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  isPublic: z.boolean().default(false),
});

export const UpdateMediaSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  tags: z.array(z.string()).max(20).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ============ CREDITS ============

export const PurchaseCreditsSchema = z.object({
  packId: z.string(),
  paymentProvider: z.enum(["stripe", "wave", "fpay", "orange_money", "manual"]).default("manual"),
});

export const CreditHistorySchema = PaginationSchema.extend({
  category: z.enum(["generation", "purchase", "subscription", "refund"]).optional(),
  type: z.enum(["debit", "credit", "reserve", "refund"]).optional(),
});

// ============ SUBSCRIPTIONS ============

export const ChangePlanSchema = z.object({
  newPlan: z.enum([
    "decouverte",
    "production",
    "artiste_actif",
    "video_studio",
    "artiste_pro",
    "label",
  ]),
});

// ============ PAYMENTS ============

export const CheckoutSchema = z.object({
  packId: z.string(),
  provider: z.enum(["stripe", "wave", "fpay", "manual"]),
  phoneNumber: z.string().max(20).optional(),
  mobileProvider: z.enum(["orange", "mtn", "moov"]).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const VerifyPaymentSchema = z.object({
  paymentId: z.string(),
  checkoutId: z.string(),
  provider: z.enum(["stripe", "wave", "fpay", "manual"]),
});

// ============ NOTIFICATIONS ============

export const ListNotificationsSchema = PaginationSchema.extend({
  isRead: z.coerce.boolean().optional(),
});

export const MarkNotificationsSchema = z.object({
  action: z.enum(["markAllRead"]),
});

// ============ STUDIOS ============

export const AudioStudioSchema = z.object({
  operation: z.enum(["generate_lyrics", "generate_audio", "mix_master", "full_song"]),
  projectId: z.string(),
  artistId: z.string().optional(),
  title: z.string().max(200).optional(),
  style: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
  theme: z.string().max(200).optional(),
  language: z.string().max(5).optional(),
  additionalPrompt: z.string().max(1000).optional(),
  lyricsText: z.string().max(5000).optional(),
  durationSeconds: z.number().min(5).max(300).optional(),
  sourceMediaId: z.string().optional(),
});

export const VideoStudioSchema = z.object({
  operation: z.enum(["generate_cover", "generate_video", "generate_storyboard"]),
  projectId: z.string(),
  artistId: z.string().optional(),
  songId: z.string().optional(),
  style: z.string().max(100).optional(),
  mood: z.string().max(100).optional(),
  visualConcept: z.string().max(500).optional(),
  quality: z.enum(["economy", "standard", "premium"]).optional(),
  durationSeconds: z.number().min(5).max(300).optional(),
  additionalPrompt: z.string().max(1000).optional(),
  lyricsText: z.string().max(5000).optional(),
});

export const ArtistStudioSchema = z.object({
  action: z.enum(["update_identity", "ai_producer", "voice_studio", "analytics"]),
  artistId: z.string(),
  visualStyle: z.record(z.string(), z.unknown()).optional(),
  referenceImages: z.array(z.object({
    id: z.string(), url: z.string().url(), label: z.string().max(100), type: z.string().max(50),
  })).optional(),
  colorPalette: z.array(z.string()).optional(),
  visualConcepts: z.array(z.object({
    name: z.string().max(100), description: z.string().max(500), imageUrl: z.string().url().optional(),
  })).optional(),
  projectId: z.string().optional(),
  prompt: z.string().max(2000).optional(),
  context: z.string().max(2000).optional(),
  lyricsText: z.string().max(5000).optional(),
  voiceStyle: z.string().max(50).optional(),
  language: z.string().max(5).optional(),
});

// ============ OPERATION → PERMISSION MAPPING ============

export const OPERATION_PERMISSION_MAP: Record<string, string> = {
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

export const AUDIO_OPERATION_PERMISSION_MAP: Record<string, string> = {
  generate_lyrics: "CREATE_LYRICS",
  generate_audio: "CREATE_AUDIO",
  mix_master: "USE_MIX_MASTER",
  full_song: "CREATE_SONG",
};

export const VIDEO_OPERATION_PERMISSION_MAP: Record<string, string> = {
  generate_cover: "CREATE_COVER",
  generate_video: "CREATE_VIDEO",
  generate_storyboard: "CREATE_STORYBOARD",
};
