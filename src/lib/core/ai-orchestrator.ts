/**
 * MELODIA AI ORCHESTRATOR
 * 
 * Context-aware AI generation coordinator.
 * Receives GenerationContext → selects model → generates → registers output.
 * Never operates alone — always goes through the Unified Action Pipeline.
 */

import { UserContext } from "./user-context";
import { CreditEngine, CreditOperation, estimateCost } from "./credit-engine";
import { GenerationService, MediaService } from "./services";
import { EventBus } from "./event-bus";
import {
  generateLyrics,
  generateComposition,
  generateCoverArt,
  generateAudio,
  generateVideoClip,
} from "../ai-engine";

// ============ GENERATION CONTEXT ============

export interface GenerationContext {
  // User context (from MelodiaCore)
  user: UserContext;

  // What to generate
  operation: CreditOperation;

  // Project context
  projectId?: string;
  artistId?: string;

  // Input data
  input: {
    title?: string;
    style?: string;
    mood?: string;
    theme?: string;
    language?: string;
    lyrics?: string;
    additionalPrompt?: string;
    coverUrl?: string;
  };

  // Quality & budget
  quality?: "economy" | "standard" | "premium";
  durationSeconds?: number; // For video

  // Available media (from Media Library — no re-upload needed)
  availableMediaIds?: string[];

  // Artist identity (auto-loaded if artistId is set)
  artistIdentity?: {
    name: string;
    genre?: string;
    styles?: string[];
    visualStyle?: Record<string, unknown>;
    colorPalette?: string[];
    referenceImages?: Array<{ id: string; url: string; label: string; type: string }>;
  };
}

// ============ GENERATION RESULT ============

export interface OrchestratorResult {
  generationId: string;
  operation: string;
  status: "completed" | "failed";
  provider: string;
  outputMediaIds: string[];
  creditsConsumed: number;
  duration: number;
  error?: string;
}

// ============ AI ORCHESTRATOR ============

export class AIOrchestrator {
  /**
   * Execute a generation through the full pipeline:
   * 1. Estimate cost
   * 2. Check credits
   * 3. Reserve credits
   * 4. Create Generation record
   * 5. Run AI generation
   * 6. Register output as Media
   * 7. Consume credits (or refund on failure)
   * 8. Emit events
   */
  static async execute(ctx: GenerationContext): Promise<OrchestratorResult> {
    const startTime = Date.now();
    const idempotencyKey = `${ctx.user.userId}-${ctx.operation}-${Date.now()}`;

    // ---- Step 1: Estimate cost ----
    const costEstimate = estimateCost(ctx.operation, {
      durationSeconds: ctx.durationSeconds,
    });

    // ---- Step 2: Check credits ----
    const creditCheck = await CreditEngine.checkBalance(
      ctx.user.userId,
      costEstimate.credits
    );

    if (!creditCheck.hasEnough) {
      return {
        generationId: "",
        operation: ctx.operation,
        status: "failed",
        provider: "",
        outputMediaIds: [],
        creditsConsumed: 0,
        duration: Date.now() - startTime,
        error: `Credits insuffisants: ${creditCheck.effective} disponibles, ${costEstimate.credits} requis`,
      };
    }

    // ---- Step 3: Create Generation record ----
    const generation = await GenerationService.create(ctx.user, {
      operation: ctx.operation,
      projectId: ctx.projectId,
      artistId: ctx.artistId,
      inputPrompt: JSON.stringify(ctx.input),
      inputMediaIds: ctx.availableMediaIds,
      inputParams: { quality: ctx.quality, durationSeconds: ctx.durationSeconds },
      estimatedCost: costEstimate.credits,
      creditsReserved: costEstimate.credits,
      idempotencyKey,
    });

    // ---- Step 4: Reserve credits ----
    const reserveResult = await CreditEngine.reserve(
      ctx.user.userId,
      costEstimate.credits,
      generation.id,
      `reserve-${idempotencyKey}`
    );

    if (!reserveResult.success) {
      await GenerationService.fail(generation.id, "Credit reservation failed");
      return {
        generationId: generation.id,
        operation: ctx.operation,
        status: "failed",
        provider: "",
        outputMediaIds: [],
        creditsConsumed: 0,
        duration: Date.now() - startTime,
        error: "Credit reservation failed",
      };
    }

    // ---- Step 5: Run AI generation ----
    await GenerationService.start(generation.id);
    await EventBus.emit({
      event: "GENERATION_STARTED",
      entityType: "generation",
      entityId: generation.id,
      userId: ctx.user.userId,
      data: { operation: ctx.operation, estimatedCost: costEstimate.credits },
    });

    try {
      const result = await this.runGeneration(ctx);
      const outputMediaIds: string[] = [];

      // ---- Step 6: Register output as Media ----
      for (const output of result.outputs) {
        const media = await MediaService.create(ctx.user, {
          name: output.name,
          type: output.type,
          mimeType: output.mimeType,
          url: output.url,
          duration: output.duration,
          width: output.width,
          height: output.height,
          projectId: ctx.projectId,
          artistId: ctx.artistId,
          generationId: generation.id,
          tags: output.tags,
          metadata: output.metadata,
        });
        outputMediaIds.push(media.id);
      }

      // ---- Step 7: Complete generation & consume credits ----
      await GenerationService.complete(generation.id, {
        outputMediaIds,
        provider: result.provider,
        model: result.model || "",
        actualCost: costEstimate.credits,
      });

      await CreditEngine.consume(
        ctx.user.userId,
        costEstimate.credits,
        generation.id,
        `consume-${idempotencyKey}`
      );

      return {
        generationId: generation.id,
        operation: ctx.operation,
        status: "completed",
        provider: result.provider,
        outputMediaIds,
        creditsConsumed: costEstimate.credits,
        duration: Date.now() - startTime,
      };
    } catch (err) {
      // ---- Step 7b: Fail & refund credits ----
      const errorMsg = err instanceof Error ? err.message : String(err);
      await GenerationService.fail(generation.id, errorMsg);

      await CreditEngine.refund(
        ctx.user.userId,
        costEstimate.credits,
        generation.id,
        `refund-${idempotencyKey}`
      );

      return {
        generationId: generation.id,
        operation: ctx.operation,
        status: "failed",
        provider: "",
        outputMediaIds: [],
        creditsConsumed: 0,
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Run the actual AI generation based on operation type.
   * This is the provider-specific logic.
   */
  private static async runGeneration(ctx: GenerationContext): Promise<{
    provider: string;
    model?: string;
    outputs: Array<{
      name: string;
      type: string;
      mimeType: string;
      url: string;
      duration?: number;
      width?: number;
      height?: number;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }>;
  }> {
    const { input } = ctx;
    const title = input.title || "Untitled";
    const style = input.style || "afrobeat";
    const mood = input.mood || "joyful";
    const theme = input.theme || "africa";
    const language = input.language || "fr";

    switch (ctx.operation) {
      case "generate_lyrics": {
        const result = await generateLyrics(title, style, mood, theme, language, input.additionalPrompt);
        return {
          provider: "z-ai",
          model: "chat",
          outputs: [{
            name: `lyrics-${title}.txt`,
            type: "lyrics",
            mimeType: "text/plain",
            url: "", // Lyrics are stored in DB, not as file
            tags: ["lyrics", style],
            metadata: { tokens: result.tokens, structure: result.structure },
          }],
        };
      }

      case "generate_composition": {
        const result = await generateComposition(title, style, mood, input.lyrics || "");
        return {
          provider: "z-ai",
          model: "chat",
          outputs: [{
            name: `composition-${title}.txt`,
            type: "lyrics",
            mimeType: "text/plain",
            url: "",
            tags: ["composition", style],
            metadata: { tempo: result.tempo, key: result.key, instruments: result.instruments },
          }],
        };
      }

      case "generate_cover": {
        const result = await generateCoverArt(title, style, mood, theme);
        return {
          provider: "multi-provider",
          model: "dall-e-3/stability/z-ai",
          outputs: [{
            name: `cover-${title}.png`,
            type: "image",
            mimeType: "image/png",
            url: result.coverUrl,
            width: 1024,
            height: 1024,
            tags: ["cover", style],
          }],
        };
      }

      case "generate_audio": {
        const result = await generateAudio(input.lyrics || "", style, title);
        return {
          provider: "multi-provider",
          model: "openai-tts/elevenlabs/mistral/z-ai",
          outputs: [{
            name: `audio-${title}.wav`,
            type: "audio",
            mimeType: "audio/wav",
            url: result.audioUrl,
            duration: result.duration,
            tags: ["audio", style],
          }],
        };
      }

      case "generate_video_economy":
      case "generate_video_standard":
      case "generate_video_premium": {
        const result = await generateVideoClip(title, style, input.coverUrl || "");
        return {
          provider: "multi-provider",
          model: "replicate/luma/z-ai",
          outputs: [{
            name: `video-${title}.mp4`,
            type: "video",
            mimeType: "video/mp4",
            url: result.videoUrl,
            duration: ctx.durationSeconds || 5,
            tags: ["video", style],
          }],
        };
      }

      case "full_song": {
        // Full song pipeline: lyrics → composition → cover → audio
        const outputs: Array<{
          name: string; type: string; mimeType: string; url: string;
          duration?: number; width?: number; height?: number;
          tags?: string[]; metadata?: Record<string, unknown>;
        }> = [];

        // Step 1: Lyrics
        const lyricsResult = await generateLyrics(title, style, mood, theme, language, input.additionalPrompt);
        outputs.push({
          name: `lyrics-${title}.txt`, type: "lyrics", mimeType: "text/plain", url: "",
          tags: ["lyrics", style], metadata: { tokens: lyricsResult.tokens },
        });

        // Step 2: Composition
        const compResult = await generateComposition(title, style, mood, lyricsResult.lyrics);
        outputs.push({
          name: `composition-${title}.txt`, type: "lyrics", mimeType: "text/plain", url: "",
          tags: ["composition", style],
          metadata: { tempo: compResult.tempo, key: compResult.key },
        });

        // Step 3: Cover
        const coverResult = await generateCoverArt(title, style, mood, theme);
        outputs.push({
          name: `cover-${title}.png`, type: "image", mimeType: "image/png",
          url: coverResult.coverUrl, width: 1024, height: 1024, tags: ["cover", style],
        });

        // Step 4: Audio
        const audioResult = await generateAudio(lyricsResult.lyrics, style, title);
        outputs.push({
          name: `audio-${title}.wav`, type: "audio", mimeType: "audio/wav",
          url: audioResult.audioUrl, duration: audioResult.duration, tags: ["audio", style],
        });

        return {
          provider: "multi-provider",
          model: "full-pipeline",
          outputs,
        };
      }

      default:
        throw new Error(`Unknown operation: ${ctx.operation}`);
    }
  }
}
