// ===== MELODIA AI ROUTER — OpenRouter Multi-Model Architecture =====
// Chaque plan utilise des modèles LLM/Vidéo/Image adaptés à son niveau
// L'admin peut modifier chaque modèle sans changer le reste de l'app

// ============================================================
// OPENROUTER MODEL CONFIGURATION
// ============================================================

export interface ModelConfig {
  id: string;           // OpenRouter model ID
  name: string;         // Display name
  inputPricePerM: number;  // $ per million input tokens
  outputPricePerM: number; // $ per million output tokens
  contextWindow: number;   // tokens
  isFree: boolean;
  capabilities: string[];
}

export interface VideoModelConfig {
  id: string;
  name: string;
  pricePerSecond: number; // $ per second
  maxDuration: number;    // seconds
  resolutions: string[];
  hasAudio: boolean;
}

// ============================================================
// LLM MODELS — OpenRouter (TOUS GRATUITS POUR LE MOMENT)
// ============================================================

export const LLM_MODELS: Record<string, ModelConfig> = {
  // 🟢 GRATUIT — Nemotron 3.5 Lightning (1M ctx, rapide)
  "nemotron-3.5-lightning": {
    id: "nvidia/nemotron-3.5-lightning:free",
    name: "Nemotron 3.5 Lightning",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 1_000_000,
    isFree: true,
    capabilities: ["text", "chat"],
  },

  // 🟢 GRATUIT — Nemotron 3 Ultra (1M ctx, puissant)
  "nemotron-3-ultra": {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    name: "Nemotron 3 Ultra 550B",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 1_000_000,
    isFree: true,
    capabilities: ["text", "chat", "reasoning"],
  },

  // 🟢 GRATUIT — Gemma 4 31B (262K ctx, Google)
  "gemma-4-31b": {
    id: "google/gemma-4-31b-it:free",
    name: "Gemma 4 31B",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 262_144,
    isFree: true,
    capabilities: ["text", "chat", "reasoning"],
  },

  // 🟢 GRATUIT — Nemotron 3 Super 120B (262K ctx)
  "nemotron-3-super": {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "Nemotron 3 Super 120B",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 262_144,
    isFree: true,
    capabilities: ["text", "chat", "reasoning"],
  },

  // 🟢 GRATUIT — Nemotron 3 Nano Omni (multimodal, 256K ctx)
  "nemotron-3-nano-omni": {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    name: "Nemotron 3 Nano Omni",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 256_000,
    isFree: true,
    capabilities: ["text", "image", "video", "audio", "multimodal", "reasoning"],
  },

  // 🟢 GRATUIT — Poolside Laguna S 2.1 (262K ctx, code)
  "laguna-s": {
    id: "poolside/laguna-s-2.1:free",
    name: "Laguna S 2.1",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 262_144,
    isFree: true,
    capabilities: ["text", "chat", "code"],
  },

  // 🟢 GRATUIT — Nemotron Nano VL (vision, 128K ctx)
  "nemotron-nano-vl": {
    id: "nvidia/nemotron-nano-12b-v2-vl:free",
    name: "Nemotron Nano 12B VL",
    inputPricePerM: 0,
    outputPricePerM: 0,
    contextWindow: 128_000,
    isFree: true,
    capabilities: ["text", "image", "vision"],
  },

  // ============================================================
  // MODÈLES PAYANTS — Désactivés pour le moment
  // (Décommentez quand prêt à passer en production payante)
  // ============================================================
  // "deepseek-v4-flash": {
  //   id: "deepseek/deepseek-v4-flash",
  //   name: "DeepSeek V4 Flash",
  //   inputPricePerM: 0.0679, outputPricePerM: 0.168,
  //   contextWindow: 1_000_000, isFree: false,
  //   capabilities: ["text", "chat", "code"],
  // },
  // "glm-5.2": {
  //   id: "z-ai/glm-5.2",
  //   name: "GLM 5.2",
  //   inputPricePerM: 0.50, outputPricePerM: 3.15,
  //   contextWindow: 1_000_000, isFree: false,
  //   capabilities: ["text", "chat", "reasoning", "agents", "long-workflow"],
  // },
  // "kimi-k2.6": {
  //   id: "moonshot/kimi-k2.6",
  //   name: "Kimi K2.6",
  //   inputPricePerM: 0.60, outputPricePerM: 2.50,
  //   contextWindow: 128_000, isFree: false,
  //   capabilities: ["text", "chat", "reasoning"],
  // },
};

// ============================================================
// VIDEO MODELS — (tous payants, désactivés pour test gratuit)
// ============================================================

export const VIDEO_MODELS: Record<string, VideoModelConfig> = {
  // Désactivés pour le test gratuit — décommentez quand prêt
  // "veo-3.1-lite": {
  //   id: "google/veo-3.1-lite", name: "Veo 3.1 Lite",
  //   pricePerSecond: 0.05, maxDuration: 8,
  //   resolutions: ["720p", "1080p"], hasAudio: true,
  // },
  // "kling-v3-standard": {
  //   id: "kwaivgi/kling-v3-standard", name: "Kling v3.0 Standard",
  //   pricePerSecond: 0.126, maxDuration: 15,
  //   resolutions: ["720p", "1080p"], hasAudio: true,
  // },
  // "kling-v3-pro": {
  //   id: "kwaivgi/kling-v3-pro", name: "Kling v3.0 Pro",
  //   pricePerSecond: 0.168, maxDuration: 15,
  //   resolutions: ["1080p", "4K"], hasAudio: true,
  // },
  // "grok-imagine-video": {
  //   id: "xai/grok-imagine-video", name: "Grok Imagine Video",
  //   pricePerSecond: 0.05, maxDuration: 15,
  //   resolutions: ["480p", "720p"], hasAudio: false,
  // },
};

// ============================================================
// AI ROUTER — Sélection du modèle selon le plan (MODE GRATUIT)
// ============================================================

export type MelodiaPlan = "basic" | "artist_starter" | "artist_production" | "video_creator" | "artist_pro" | "label";

interface PlanModelConfig {
  primaryLLM: ModelConfig;
  fallbackLLM: ModelConfig;
  multimodalLLM?: ModelConfig;     // For video/image analysis
  videoStandard?: VideoModelConfig; // Standard video quality
  videoPremium?: VideoModelConfig;  // Premium video quality
  videoEconomy?: VideoModelConfig;  // Budget video
  canUseVideo: boolean;
  canUseAIProducer: boolean;
  canUseLabelFeatures: boolean;
}

export const PLAN_MODELS: Record<MelodiaPlan, PlanModelConfig> = {
  // 🌱 BASIC — 2 000 FCFA (gratuit pour test)
  basic: {
    primaryLLM: LLM_MODELS["nemotron-3.5-lightning"],
    fallbackLLM: LLM_MODELS["nemotron-3-super"],
    canUseVideo: false,
    canUseAIProducer: false,
    canUseLabelFeatures: false,
  },

  // 🔵 ARTIST STARTER — 5 000 FCFA (gratuit pour test)
  artist_starter: {
    primaryLLM: LLM_MODELS["nemotron-3-super"],
    fallbackLLM: LLM_MODELS["nemotron-3.5-lightning"],
    canUseVideo: false, // Vidéo désactivée en mode gratuit
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },

  // 🟣 ARTIST PRODUCTION — 10 000 FCFA (gratuit pour test)
  artist_production: {
    primaryLLM: LLM_MODELS["nemotron-3-ultra"],
    fallbackLLM: LLM_MODELS["nemotron-3-super"],
    multimodalLLM: LLM_MODELS["nemotron-3-nano-omni"],
    canUseVideo: false,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },

  // 🎬 VIDEO CREATOR — 15 000 FCFA (gratuit pour test)
  video_creator: {
    primaryLLM: LLM_MODELS["nemotron-3-ultra"],
    fallbackLLM: LLM_MODELS["nemotron-3-super"],
    multimodalLLM: LLM_MODELS["nemotron-3-nano-omni"],
    canUseVideo: false,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },

  // ⭐ ARTIST PRO — 25 000 FCFA (gratuit pour test)
  artist_pro: {
    primaryLLM: LLM_MODELS["nemotron-3-ultra"],
    fallbackLLM: LLM_MODELS["nemotron-3-super"],
    multimodalLLM: LLM_MODELS["nemotron-3-nano-omni"],
    canUseVideo: false,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
  },

  // 🏢 LABEL — 50 000 FCFA (gratuit pour test)
  label: {
    primaryLLM: LLM_MODELS["nemotron-3-ultra"],
    fallbackLLM: LLM_MODELS["nemotron-3-super"],
    multimodalLLM: LLM_MODELS["nemotron-3-nano-omni"],
    canUseVideo: false,
    canUseAIProducer: true,
    canUseLabelFeatures: true,
  },
};

// ============================================================
// HELPER — Get model for a plan
// ============================================================

export function getModelsForPlan(plan: MelodiaPlan): PlanModelConfig {
  return PLAN_MODELS[plan] || PLAN_MODELS.basic;
}

export function getVideoCost(videoModel: VideoModelConfig, durationSeconds: number): { usd: number; fcfa: number; credits: number } {
  const usd = videoModel.pricePerSecond * durationSeconds;
  const fcfa = usd * 569; // 1 USD ≈ 569 FCFA
  const credits = Math.ceil(fcfa / 8.33); // 1 credit ≈ 8.33 FCFA
  return { usd, fcfa: Math.ceil(fcfa), credits };
}

// ============================================================
// OPENROUTER API CALL
// ============================================================

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouter(
  model: ModelConfig,
  messages: OpenRouterMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
  }
): Promise<{ content: string; usage: { inputTokens: number; outputTokens: number; costUsd: number } }> {
  const apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required");
  }

  console.log(`[ai-router] Calling ${model.name} (${model.id}) — ${model.isFree ? '🟢 FREE' : '💰 PAID'}`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://melodia.africa",
      "X-Title": "Melodia Up To Africa",
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  const content = data.choices[0]?.message?.content || "";
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;

  // Calculate cost
  const costUsd =
    (inputTokens / 1_000_000) * model.inputPricePerM +
    (outputTokens / 1_000_000) * model.outputPricePerM;

  console.log(`[ai-router] ✅ ${model.name}: ${inputTokens}in + ${outputTokens}out tokens, $${costUsd.toFixed(6)}`);

  return {
    content,
    usage: { inputTokens, outputTokens, costUsd },
  };
}

// ============================================================
// MELLODIA AI ROUTER — Call with automatic fallback
// ============================================================

export async function callMelodiaAI(
  plan: MelodiaPlan,
  messages: OpenRouterMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    apiKey?: string;
    useFallback?: boolean; // Force fallback model
  }
): Promise<{
  content: string;
  model: ModelConfig;
  usage: { inputTokens: number; outputTokens: number; costUsd: number; costFcfa: number };
}> {
  const config = getModelsForPlan(plan);
  const model = options?.useFallback ? config.fallbackLLM : config.primaryLLM;
  const apiKey = options?.apiKey || process.env.OPENROUTER_API_KEY;

  try {
    const result = await callOpenRouter(model, messages, {
      ...options,
      apiKey,
    });

    return {
      content: result.content,
      model,
      usage: {
        ...result.usage,
        costFcfa: Math.ceil(result.usage.costUsd * 569),
      },
    };
  } catch (primaryError) {
    // Fallback to cheaper model
    if (!options?.useFallback && config.fallbackLLM.id !== model.id) {
      console.warn(`[ai-router] ⚠️ Primary ${model.id} failed, falling back to ${config.fallbackLLM.id}`);
      try {
        const fallbackResult = await callOpenRouter(config.fallbackLLM, messages, {
          ...options,
          apiKey,
        });
        return {
          content: fallbackResult.content,
          model: config.fallbackLLM,
          usage: {
            ...fallbackResult.usage,
            costFcfa: Math.ceil(fallbackResult.usage.costUsd * 569),
          },
        };
      } catch (fallbackError) {
        throw new Error(`Both primary and fallback models failed. Primary: ${primaryError}, Fallback: ${fallbackError}`);
      }
    }
    throw primaryError;
  }
}
