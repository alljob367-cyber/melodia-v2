// ===== MELODIA CREDIT SYSTEM — Pay As You Go =====
// Tous les coûts sont configurables par l'admin
// 1 crédit ≈ 8.33 FCFA (1 FCFA ≈ 0.12 crédits)

// ============================================================
// CREDIT COSTS PER OPERATION (configurable by admin)
// ============================================================

export interface CreditCosts {
  // LLM Operations
  lyricsGeneration: number;      // Paroles IA
  lyricsImprovement: number;     // Amélioration paroles
  
  // Music Operations
  musicStandard: number;         // Musique standard quality
  musicHighQuality: number;      // Musique haute qualité
  
  // Voice Operations
  voiceProcessing: number;       // Traitement voix
  ttsGeneration: number;         // Text-to-speech
  
  // Production Operations
  aiProducer: number;            // AI Producer consultation
  mixIA: number;                 // Mix IA
  masterIA: number;              // Master IA
  
  // Visual Operations
  coverArt: number;              // Pochette d'album
  storyboard: number;            // Storyboard vidéo
  
  // Video Operations (base per 10 seconds)
  videoEconomyPer10s: number;    // Clip économique (Veo Lite / Grok)
  videoStandardPer10s: number;   // Clip standard (Kling Standard)
  videoPremiumPer10s: number;    // Clip premium (Kling Pro)
}

// Default costs — Admin can override via DB
export const DEFAULT_CREDIT_COSTS: CreditCosts = {
  // LLM
  lyricsGeneration: 5,
  lyricsImprovement: 3,
  
  // Music
  musicStandard: 80,
  musicHighQuality: 120,
  
  // Voice
  voiceProcessing: 30,
  ttsGeneration: 15,
  
  // Production
  aiProducer: 10,
  mixIA: 40,
  masterIA: 30,
  
  // Visual
  coverArt: 15,
  storyboard: 20,
  
  // Video (per 10 seconds)
  videoEconomyPer10s: 30,
  videoStandardPer10s: 75,
  videoPremiumPer10s: 100,
};

// ============================================================
// VIDEO COST CALCULATOR — Duration-based pricing
// ============================================================

export type VideoQuality = "economy" | "standard" | "premium";

export function calculateVideoCredits(
  durationSeconds: number,
  quality: VideoQuality = "economy",
  costs: CreditCosts = DEFAULT_CREDIT_COSTS
): {
  credits: number;
  breakdown: string;
  realCostFcfa: number;
  marginFcfa: number;
} {
  // Round up to nearest 10 seconds for billing
  const billableUnits = Math.ceil(durationSeconds / 10);
  
  let creditsPerUnit: number;
  let label: string;
  
  switch (quality) {
    case "premium":
      creditsPerUnit = costs.videoPremiumPer10s;
      label = "Premium (Kling Pro)";
      break;
    case "standard":
      creditsPerUnit = costs.videoStandardPer10s;
      label = "Standard (Kling Standard)";
      break;
    case "economy":
    default:
      creditsPerUnit = costs.videoEconomyPer10s;
      label = "Économique (Veo Lite / Grok)";
      break;
  }
  
  const credits = billableUnits * creditsPerUnit;
  const creditValueFcfa = 8.33; // 1 credit ≈ 8.33 FCFA
  const chargedFcfa = credits * creditValueFcfa;
  
  // Real API cost estimation
  const realCostPerSec: Record<VideoQuality, number> = {
    economy: 28.45,   // ~$0.05/s * 569 FCFA
    standard: 71.69,   // ~$0.126/s * 569 FCFA
    premium: 95.59,    // ~$0.168/s * 569 FCFA
  };
  const realCostFcfa = Math.ceil(durationSeconds * realCostPerSec[quality]);
  
  return {
    credits,
    breakdown: `${billableUnits} × ${creditsPerUnit} crédits (${label}, ${durationSeconds}s)`,
    realCostFcfa,
    marginFcfa: Math.max(0, Math.floor(chargedFcfa - realCostFcfa)),
  };
}

// ============================================================
// PACK DEFINITIONS — Pay As You Go
// ============================================================

export interface CreditPack {
  id: string;
  name: string;
  emoji: string;
  priceFcfa: number;
  credits: number;
  color: string;             // Tailwind color class
  isBasic: boolean;          // Basic = fixed pack, not credits
  isPopular: boolean;
  description: string;
  includes: string[];
  canUseVideo: boolean;
  canUseAIProducer: boolean;
  canUseLabelFeatures: boolean;
  // Estimated costs & margins
  estimatedCostFcfa: [number, number]; // [min, max]
  estimatedMarginFcfa: [number, number]; // [min, max]
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: "basic",
    name: "Melodia Basic",
    emoji: "🌱",
    priceFcfa: 2_000,
    credits: 0, // Not credit-based — fixed pack
    color: "emerald",
    isBasic: true,
    isPopular: false,
    description: "Pack de découverte — tout pour commencer",
    includes: [
      "🎵 2 créations musicales",
      "🎨 2 pochettes IA",
      "✍️ Paroles IA",
      "▶️ Écoute illimitée",
      "⬇️ Téléchargement",
      "🔗 Partage",
    ],
    canUseVideo: false,
    canUseAIProducer: false,
    canUseLabelFeatures: false,
    estimatedCostFcfa: [175, 300],
    estimatedMarginFcfa: [1_700, 1_825],
  },
  {
    id: "artist_starter",
    name: "Artist Starter",
    emoji: "🎤",
    priceFcfa: 5_000,
    credits: 600,
    color: "blue",
    isBasic: false,
    isPopular: true,
    description: "Pay As You Go — Crée à ton rythme",
    includes: [
      "🎵 Music Studio",
      "🎤 Voice Studio",
      "✍️ Lyrics Studio",
      "🎚️ Mix & Master",
      "🎨 Cover Studio",
      "🎬 Clips courts (éco)",
    ],
    canUseVideo: true,
    canUseAIProducer: false,
    canUseLabelFeatures: false,
    estimatedCostFcfa: [1_000, 1_500],
    estimatedMarginFcfa: [3_500, 4_000],
  },
  {
    id: "artist_production",
    name: "Artist Production",
    emoji: "🎛️",
    priceFcfa: 10_000,
    credits: 1_400,
    color: "purple",
    isBasic: false,
    isPopular: false,
    description: "Production complète — plusieurs morceaux",
    includes: [
      "🎵 Music Studio",
      "🎤 Voice Studio",
      "🧠 AI Producer",
      "✍️ Lyrics Studio",
      "🎚️ Mix & Master",
      "🎨 Cover Studio",
      "🎬 Clips standard",
    ],
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
    estimatedCostFcfa: [2_500, 3_000],
    estimatedMarginFcfa: [7_000, 7_500],
  },
  {
    id: "video_creator",
    name: "Video Creator",
    emoji: "🎬",
    priceFcfa: 15_000,
    credits: 2_500,
    color: "pink",
    isBasic: false,
    isPopular: false,
    description: "Orienté clips — storyboard + montage",
    includes: [
      "🎵 2-3 chansons",
      "🧠 AI Director",
      "📋 Storyboard",
      "🎬 Plusieurs scènes",
      "🎞️ Clips standard",
      "✂️ Montage IA",
    ],
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
    estimatedCostFcfa: [4_500, 6_000],
    estimatedMarginFcfa: [9_000, 10_500],
  },
  {
    id: "artist_pro",
    name: "Artist Pro",
    emoji: "⭐",
    priceFcfa: 25_000,
    credits: 4_500,
    color: "amber",
    isBasic: false,
    isPopular: false,
    description: "Production professionnelle complète",
    includes: [
      "🎵 Music Studio",
      "🎤 Voice Studio",
      "🧠 AI Producer",
      "✍️ Lyrics Studio",
      "🎚️ Mix & Master",
      "🎨 Cover Studio",
      "🎬 Video Studio Premium",
      "📋 Storyboard",
      "✂️ Montage + exports pro",
    ],
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: false,
    estimatedCostFcfa: [8_000, 11_000],
    estimatedMarginFcfa: [14_000, 17_000],
  },
  {
    id: "label",
    name: "Label & Studio",
    emoji: "🏢",
    priceFcfa: 50_000,
    credits: 10_000,
    color: "yellow",
    isBasic: false,
    isPopular: false,
    description: "Pour labels, managers & studios — multi-artistes",
    includes: [
      "🎵 Music Studio",
      "🎤 Voice Studio",
      "🧠 AI Producer",
      "✍️ Lyrics Studio",
      "🎚️ Mix & Master",
      "🎨 Cover Studio",
      "🎬 Video Studio Premium",
      "👥 Multi-artistes",
      "📊 Dashboard label",
      "🎯 Stratégie IA",
    ],
    canUseVideo: true,
    canUseAIProducer: true,
    canUseLabelFeatures: true,
    estimatedCostFcfa: [17_000, 22_000],
    estimatedMarginFcfa: [28_000, 33_000],
  },
];

// ============================================================
// CREDIT WALLET — Top-up options (when user runs out)
// ============================================================

export const TOP_UP_OPTIONS = [
  { priceFcfa: 2_000, credits: 200, label: "Mini" },
  { priceFcfa: 5_000, credits: 600, label: "Artist" },
  { priceFcfa: 10_000, credits: 1_400, label: "Production" },
  { priceFcfa: 25_000, credits: 4_500, label: "Studio" },
  { priceFcfa: 50_000, credits: 10_000, label: "Label" },
];

// ============================================================
// HELPER — Get pack by ID
// ============================================================

export function getPackById(id: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === id);
}

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}

export function formatCredits(credits: number): string {
  return new Intl.NumberFormat("fr-FR").format(credits) + " crédits";
}
