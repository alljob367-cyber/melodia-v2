/**
 * MELODIA AI PROVIDERS — Multi-provider fallback system
 * 
 * Provides reliable alternatives for Audio/TTS, Cover Art, and Video generation.
 * Each provider tries multiple APIs in order, with automatic fallback.
 * 
 * Strategy:
 * - Audio/TTS:  OpenAI TTS → ElevenLabs → Mistral Voxtral → z-ai CLI → Web Speech API
 * - Cover Art:  OpenAI DALL-E 3 → Stability AI → z-ai image CLI
 * - Video:      Replicate API → Luma AI → z-ai video CLI
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { put } from "@vercel/blob";

const execFileAsync = promisify(execFile);

const IS_VERCEL = !!process.env.VERCEL;
const OUTPUT_DIR = IS_VERCEL
  ? path.join("/tmp", "melodia-generated")
  : path.join(process.cwd(), "public", "generated");

// Ensure output directories exist
["audio", "covers", "videos"].forEach((dir) => {
  const full = path.join(OUTPUT_DIR, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// ============ BLOB UPLOAD HELPER ============

async function uploadToBlob(
  filePath: string,
  blobPathname: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  if (!IS_VERCEL) return "";
  const fileBuffer = fs.readFileSync(filePath);
  const blob = await put(blobPathname, fileBuffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  console.log(`[blob] Uploaded ${blobPathname} → ${blob.url}`);
  return blob.url;
}

// ============================================================
// SECTION 1: AUDIO / TTS PROVIDERS
// ============================================================

export interface TTSProviderResult {
  audioPath: string;
  audioUrl: string;
  provider: string;
  duration?: number;
}

/**
 * Provider 1: OpenAI TTS API
 * - Excellent French voices (alloy, echo, fable, onyx, nova, shimmer)
 * - Works on Vercel serverless
 * - ~$0.015 per 1K chars
 */
async function openaiTTS(text: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    console.log("[tts-openai] Generating with OpenAI TTS...");
    
    // OpenAI TTS limit: 4096 chars
    const inputText = text.slice(0, 4000);
    
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        input: inputText,
        voice: "nova",        // Best French-capable female voice
        response_format: "wav",
        speed: 0.9,           // Slightly slower for musical feel
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[tts-openai] Failed (${response.status}): ${errText}`);
      return false;
    }

    // OpenAI returns audio binary directly (not JSON)
    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`[tts-openai] Success: ${audioBuffer.length} bytes`);
    return true;
  } catch (err) {
    console.error("[tts-openai] Error:", err);
    return false;
  }
}

/**
 * Provider 2: ElevenLabs TTS API
 * - Best French voices available
 * - High quality, expressive
 * - ~$0.30 per 1K chars (but very high quality)
 */
async function elevenLabsTTS(text: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return false;

  try {
    console.log("[tts-elevenlabs] Generating with ElevenLabs TTS...");
    
    // Use a French voice ID (Rachel - professional French female)
    // Users can change this in .env
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikVAM"; // Default: Rachel
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/wav",
      },
      body: JSON.stringify({
        text: text.slice(0, 5000),
        model_id: "eleven_multilingual_v2", // Supports French natively
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[tts-elevenlabs] Failed (${response.status}): ${errText}`);
      return false;
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, audioBuffer);
    console.log(`[tts-elevenlabs] Success: ${audioBuffer.length} bytes`);
    return true;
  } catch (err) {
    console.error("[tts-elevenlabs] Error:", err);
    return false;
  }
}

/**
 * Provider 3: Mistral Voxtral TTS (FIXED - French voices)
 * - Improved: uses French voice instead of English
 * - Chunked for long text
 */
async function mistralTTSFixed(text: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return false;

  try {
    console.log("[tts-mistral] Generating with Mistral Voxtral TTS (French voice)...");
    
    const MAX_CHUNK = 1800;
    const inputText = text.slice(0, 4000);
    
    // Use French voice: "fr_celeste" or fallback to available
    const voice = process.env.MISTRAL_TTS_VOICE || "fr_celeste";

    if (inputText.length <= MAX_CHUNK) {
      const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "voxtral-mini-tts-latest",
          input: inputText,
          voice,
          response_format: "wav",
        }),
      });

      if (!response.ok) {
        console.error(`[tts-mistral] Failed (${response.status})`);
        return false;
      }

      // Try JSON format first (base64 audio_data)
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (data.audio_data) {
          const audioBuffer = Buffer.from(data.audio_data, "base64");
          fs.writeFileSync(outputPath, audioBuffer);
          console.log(`[tts-mistral] Success (JSON): ${audioBuffer.length} bytes`);
          return true;
        }
        return false;
      }
      
      // Binary audio response
      const audioBuffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(outputPath, audioBuffer);
      console.log(`[tts-mistral] Success (binary): ${audioBuffer.length} bytes`);
      return true;
    }

    // Multi-chunk: split by sentences, generate each, then concat with ffmpeg
    const sentences = inputText.match(/[^.!?]+[.!?]+/g) || [inputText];
    const chunks: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      if ((current + sentence).length > MAX_CHUNK) {
        if (current) chunks.push(current.trim());
        current = sentence;
      } else {
        current += sentence;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    console.log(`[tts-mistral] Splitting into ${chunks.length} chunks`);

    const chunkFiles: string[] = [];
    const tmpChunkDir = path.join(path.dirname(outputPath), `_tts_chunks_${Date.now()}`);
    if (!fs.existsSync(tmpChunkDir)) fs.mkdirSync(tmpChunkDir, { recursive: true });

    for (let i = 0; i < chunks.length; i++) {
      const chunkFile = path.join(tmpChunkDir, `chunk-${i}.wav`);
      
      const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "voxtral-mini-tts-latest",
          input: chunks[i],
          voice,
          response_format: "wav",
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral TTS chunk ${i + 1} failed (${response.status})`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        if (!data.audio_data) throw new Error(`Chunk ${i + 1}: no audio_data`);
        const audioBuffer = Buffer.from(data.audio_data, "base64");
        fs.writeFileSync(chunkFile, audioBuffer);
      } else {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        fs.writeFileSync(chunkFile, audioBuffer);
      }
      chunkFiles.push(chunkFile);
    }

    // Concatenate chunks with ffmpeg
    if (chunkFiles.length === 1) {
      fs.copyFileSync(chunkFiles[0], outputPath);
    } else {
      const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
      const concatList = chunkFiles.map(f => `file '${f}'`).join("\n");
      const concatFile = path.join(tmpChunkDir, "concat.txt");
      fs.writeFileSync(concatFile, concatList);
      await execFileAsync(ffmpegPath, [
        "-y", "-f", "concat", "-safe", "0", "-i", concatFile,
        "-ar", "44100", "-ac", "1", outputPath,
      ], { timeout: 30000 });
    }

    try { fs.rmSync(tmpChunkDir, { recursive: true, force: true }); } catch {}
    console.log("[tts-mistral] Success (chunked)");
    return true;
  } catch (err) {
    console.error("[tts-mistral] Error:", err);
    return false;
  }
}

/**
 * Provider 4: z-ai CLI TTS (local fallback)
 */
async function zaiCliTTS(text: string, outputPath: string): Promise<boolean> {
  try {
    console.log("[tts-zai] Generating with z-ai CLI TTS...");
    await execFileAsync("z-ai", [
      "tts",
      "--input", text.slice(0, 1000),
      "--format", "wav",
      "--speed", "0.85",
      "--output", outputPath,
    ], { timeout: 120000 });
    console.log("[tts-zai] Success");
    return true;
  } catch (err) {
    console.error("[tts-zai] Error:", err);
    return false;
  }
}

/**
 * MAIN TTS FUNCTION — Tries providers in order until one succeeds
 * 
 * Priority: OpenAI → ElevenLabs → Mistral (French) → z-ai CLI
 */
export async function generateTTS(
  text: string,
  filename?: string
): Promise<TTSProviderResult> {
  const fname = filename || `tts-${Date.now()}.wav`;
  const outputPath = path.join(OUTPUT_DIR, "audio", fname);
  
  // Provider chain — try each in order
  const providers = [
    { name: "openai", fn: () => openaiTTS(text, outputPath) },
    { name: "elevenlabs", fn: () => elevenLabsTTS(text, outputPath) },
    { name: "mistral", fn: () => mistralTTSFixed(text, outputPath) },
    { name: "z-ai", fn: () => zaiCliTTS(text, outputPath) },
  ];

  for (const provider of providers) {
    try {
      const success = await provider.fn();
      if (success && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        // Upload to Blob on Vercel
        let audioUrl = `/generated/audio/${fname}`;
        if (IS_VERCEL) {
          try {
            const blobUrl = await uploadToBlob(outputPath, `melodia/audio/${fname}`, "audio/wav");
            if (blobUrl) audioUrl = blobUrl;
          } catch (blobErr) {
            console.error(`[tts] Blob upload failed for ${provider.name}:`, blobErr);
          }
        }
        
        return {
          audioPath: outputPath,
          audioUrl,
          provider: provider.name,
        };
      }
    } catch (err) {
      console.error(`[tts] Provider ${provider.name} threw:`, err);
    }
  }

  // All providers failed — return error
  throw new Error("All TTS providers failed. Set OPENAI_API_KEY, ELEVENLABS_API_KEY, or MISTRAL_API_KEY");
}

// ============================================================
// SECTION 2: COVER ART PROVIDERS
// ============================================================

export interface CoverArtProviderResult {
  imagePath: string;
  imageUrl: string;
  provider: string;
}

/**
 * Provider 1: OpenAI DALL-E 3
 * - Highest quality cover art
 * - 1024x1024, 1024x1792, 1792x1024
 * - Works on Vercel serverless
 * - ~$0.04-0.08 per image
 */
async function dalle3CoverArt(prompt: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    console.log("[cover-dalle3] Generating with DALL-E 3...");
    
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[cover-dalle3] Failed (${response.status}): ${errText}`);
      return false;
    }

    const data = await response.json();
    if (!data.data?.[0]?.b64_json) {
      console.error("[cover-dalle3] No image data in response");
      return false;
    }

    const imageBuffer = Buffer.from(data.data[0].b64_json, "base64");
    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`[cover-dalle3] Success: ${imageBuffer.length} bytes`);
    return true;
  } catch (err) {
    console.error("[cover-dalle3] Error:", err);
    return false;
  }
}

/**
 * Provider 2: Stability AI (Stable Diffusion)
 * - Good quality, cheaper than DALL-E
 * - Style presets available
 * - ~$0.01-0.03 per image
 */
async function stabilityCoverArt(prompt: string, outputPath: string): Promise<boolean> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) return false;

  try {
    console.log("[cover-stability] Generating with Stability AI...");
    
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "image/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          output_format: "png",
          aspect_ratio: "1:1",
          model: "sd3-large",
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[cover-stability] Failed (${response.status}): ${errText}`);
      return false;
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, imageBuffer);
    console.log(`[cover-stability] Success: ${imageBuffer.length} bytes`);
    return true;
  } catch (err) {
    console.error("[cover-stability] Error:", err);
    return false;
  }
}

/**
 * Provider 3: z-ai CLI image generation (local fallback)
 */
async function zaiCliCoverArt(prompt: string, outputPath: string): Promise<boolean> {
  try {
    console.log("[cover-zai] Generating with z-ai image CLI...");
    await execFileAsync("z-ai", [
      "image",
      "--prompt", prompt,
      "--output", outputPath,
      "--size", "1024x1024",
    ], { timeout: 120000 });
    console.log("[cover-zai] Success");
    return true;
  } catch (err) {
    console.error("[cover-zai] Error:", err);
    return false;
  }
}

/**
 * MAIN COVER ART FUNCTION — Tries providers in order
 * 
 * Priority: DALL-E 3 → Stability AI → z-ai image CLI
 */
export async function generateCoverArtMulti(
  title: string,
  style: string,
  mood: string,
  theme: string
): Promise<CoverArtProviderResult> {
  const prompt = `Professional album cover art for an African music single titled "${title}". Style: ${style}, mood: ${mood}, theme: ${theme}. Vibrant colors, African aesthetic, modern design, high quality digital art, suitable for streaming platforms like Spotify. No text on the image. 4K quality.`;
  
  const filename = `cover-${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, "covers", filename);
  
  const providers = [
    { name: "dalle3", fn: () => dalle3CoverArt(prompt, outputPath) },
    { name: "stability", fn: () => stabilityCoverArt(prompt, outputPath) },
    { name: "z-ai", fn: () => zaiCliCoverArt(prompt, outputPath) },
  ];

  for (const provider of providers) {
    try {
      const success = await provider.fn();
      if (success && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
        let imageUrl = `/generated/covers/${filename}`;
        if (IS_VERCEL) {
          try {
            const blobUrl = await uploadToBlob(outputPath, `melodia/covers/${filename}`, "image/png");
            if (blobUrl) imageUrl = blobUrl;
          } catch (blobErr) {
            console.error(`[cover] Blob upload failed for ${provider.name}:`, blobErr);
          }
        }
        
        return {
          imagePath: outputPath,
          imageUrl,
          provider: provider.name,
        };
      }
    } catch (err) {
      console.error(`[cover] Provider ${provider.name} threw:`, err);
    }
  }

  throw new Error("All cover art providers failed. Set OPENAI_API_KEY, STABILITY_API_KEY, or ensure z-ai CLI is available");
}

// ============================================================
// SECTION 3: VIDEO PROVIDERS
// ============================================================

export interface VideoProviderResult {
  videoUrl: string;
  provider: string;
  duration?: number;
}

/**
 * Provider 1: Replicate API (Stable Video Diffusion / AnimateDiff)
 * - Multiple open-source video models
 * - Affordable pricing
 * - Works on Vercel serverless
 */
async function replicateVideo(prompt: string, outputFile: string): Promise<string | null> {
  const apiKey = process.env.REPLICATE_API_TOKEN;
  if (!apiKey) return null;

  try {
    console.log("[video-replicate] Generating with Replicate API (Stable Video Diffusion)...");
    
    // Step 1: Create prediction
    const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Use stable-video-diffusion (affordable, good quality)
        version: "stability-ai/stable-video-diffusion",
        input: {
          prompt,
          fps: 24,
          num_frames: 120,  // 5 seconds at 24fps
          width: 1024,
          height: 576,
        },
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      console.error(`[video-replicate] Create failed (${createResponse.status}): ${errText}`);
      return null;
    }

    const prediction = await createResponse.json();
    const predictionId = prediction.id;
    console.log(`[video-replicate] Prediction created: ${predictionId}`);

    // Step 2: Poll for result (max 5 minutes)
    const maxPolls = 60;
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s interval
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      
      const status = await statusResponse.json();
      
      if (status.status === "succeeded") {
        const videoUrl = status.output?.[0] || status.output;
        console.log(`[video-replicate] Success: ${videoUrl}`);
        
        // Save result JSON
        fs.writeFileSync(outputFile, JSON.stringify({ 
          video_url: videoUrl, 
          provider: "replicate",
          prediction_id: predictionId,
        }, null, 2));
        
        return videoUrl;
      }
      
      if (status.status === "failed" || status.status === "canceled") {
        console.error(`[video-replicate] Prediction ${status.status}: ${status.error}`);
        return null;
      }
      
      console.log(`[video-replicate] Polling... (${i + 1}/${maxPolls}) status=${status.status}`);
    }

    console.error("[video-replicate] Timed out after polling");
    return null;
  } catch (err) {
    console.error("[video-replicate] Error:", err);
    return null;
  }
}

/**
 * Provider 2: Luma AI (Dream Machine)
 * - High quality video generation
 * - ~$0.05 per second
 */
async function lumaVideo(prompt: string, outputFile: string): Promise<string | null> {
  const apiKey = process.env.LUMA_API_KEY;
  if (!apiKey) return null;

  try {
    console.log("[video-luma] Generating with Luma AI Dream Machine...");
    
    const response = await fetch("https://api.lumalabs.ai/dream-machine/v1/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: "16:9",
        loop: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[video-luma] Failed (${response.status}): ${errText}`);
      return null;
    }

    const generation = await response.json();
    const generationId = generation.id;
    console.log(`[video-luma] Generation created: ${generationId}`);

    // Poll for result
    const maxPolls = 60;
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(
        `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
        { headers: { "Authorization": `Bearer ${apiKey}` } }
      );
      const status = await statusResponse.json();
      
      if (status.state === "completed") {
        const videoUrl = status.assets?.video;
        console.log(`[video-luma] Success: ${videoUrl}`);
        
        fs.writeFileSync(outputFile, JSON.stringify({
          video_url: videoUrl,
          provider: "luma",
          generation_id: generationId,
        }, null, 2));
        
        return videoUrl;
      }
      
      if (status.state === "failed") {
        console.error(`[video-luma] Generation failed: ${status.failure_reason}`);
        return null;
      }
      
      console.log(`[video-luma] Polling... (${i + 1}/${maxPolls}) state=${status.state}`);
    }

    return null;
  } catch (err) {
    console.error("[video-luma] Error:", err);
    return null;
  }
}

/**
 * Provider 3: z-ai CLI video (local fallback)
 */
async function zaiCliVideo(prompt: string, outputFile: string): Promise<string | null> {
  try {
    console.log("[video-zai] Generating with z-ai video CLI...");
    await execFileAsync("z-ai", [
      "video",
      "--prompt", prompt,
      "--quality", "speed",
      "--duration", "5",
      "--size", "1344x768",
      "--poll",
      "--poll-interval", "10",
      "--max-polls", "30",
      "--output", outputFile,
    ], { timeout: 300000 });

    const result = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
    const videoUrl = result.video_url || result.url || result.data?.video_url || "";
    if (videoUrl) {
      console.log(`[video-zai] Success: ${videoUrl}`);
      return videoUrl;
    }
    return null;
  } catch (err) {
    console.error("[video-zai] Error:", err);
    return null;
  }
}

/**
 * MAIN VIDEO GENERATION FUNCTION — Tries providers in order
 * 
 * Priority: Replicate → Luma AI → z-ai video CLI
 */
export async function generateVideoMulti(
  title: string,
  style: string,
  coverUrl?: string
): Promise<VideoProviderResult> {
  const prompt = `Music video clip for an African ${style} song titled "${title}". Cinematic shots, African landscapes and urban scenes, dynamic movement, vibrant colors, professional quality. 5 seconds.`;
  
  const outputFile = path.join(OUTPUT_DIR, "videos", `video-result-${Date.now()}.json`);
  
  const providers = [
    { name: "replicate", fn: () => replicateVideo(prompt, outputFile) },
    { name: "luma", fn: () => lumaVideo(prompt, outputFile) },
    { name: "z-ai", fn: () => zaiCliVideo(prompt, outputFile) },
  ];

  for (const provider of providers) {
    try {
      const videoUrl = await provider.fn();
      if (videoUrl) {
        // Cleanup temp result file
        try { fs.unlinkSync(outputFile); } catch {}
        
        return {
          videoUrl,
          provider: provider.name,
          duration: 5,
        };
      }
    } catch (err) {
      console.error(`[video] Provider ${provider.name} threw:`, err);
    }
  }

  throw new Error("All video providers failed. Set REPLICATE_API_TOKEN, LUMA_API_KEY, or ensure z-ai CLI is available");
}

// ============================================================
// SECTION 4: AVAILABILITY CHECK
// ============================================================

export interface ProviderAvailability {
  tts: {
    openai: boolean;
    elevenlabs: boolean;
    mistral: boolean;
    zai: boolean;
  };
  cover: {
    dalle3: boolean;
    stability: boolean;
    zai: boolean;
  };
  video: {
    replicate: boolean;
    luma: boolean;
    zai: boolean;
  };
}

/** Check which providers are available based on API keys */
export function checkProviderAvailability(): ProviderAvailability {
  return {
    tts: {
      openai: !!process.env.OPENAI_API_KEY,
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
      zai: !IS_VERCEL, // z-ai CLI only works locally
    },
    cover: {
      dalle3: !!process.env.OPENAI_API_KEY,
      stability: !!process.env.STABILITY_API_KEY,
      zai: !IS_VERCEL,
    },
    video: {
      replicate: !!process.env.REPLICATE_API_TOKEN,
      luma: !!process.env.LUMA_API_KEY,
      zai: !IS_VERCEL,
    },
  };
}

/** Get a summary of available providers for logging */
export function getProviderSummary(): string {
  const avail = checkProviderAvailability();
  const lines: string[] = [];
  
  lines.push("TTS: " + Object.entries(avail.tts).filter(([,v]) => v).map(([k]) => k).join(" → ") || "NONE");
  lines.push("Cover: " + Object.entries(avail.cover).filter(([,v]) => v).map(([k]) => k).join(" → ") || "NONE");
  lines.push("Video: " + Object.entries(avail.video).filter(([,v]) => v).map(([k]) => k).join(" → ") || "NONE");
  
  return lines.join(" | ");
}
