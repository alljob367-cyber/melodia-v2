/**
 * MELODIA UP TO AFRICA — AI Engine
 * Central AI generation engine using z-ai-web-dev-sdk CLI
 * 
 * Cost optimization strategy:
 * - Lyrics: z-ai chat (cheap ~1-3 FCFA)
 * - Composition: z-ai chat (cheap ~2-5 FCFA)
 * - Cover art: z-ai image (moderate ~20-30 FCFA)
 * - Audio/TTS: z-ai tts (moderate ~6-18 FCFA)
 * - Video: z-ai video (expensive ~120-300 FCFA, controlled by plan limits)
 */

import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

const ZAI_CLI = "z-ai";
const OUTPUT_DIR = "/home/z/my-project/public/generated";

// Ensure output directories exist
const DIRS = ["audio", "covers", "videos", "lyrics"];
DIRS.forEach((dir) => {
  const full = path.join(OUTPUT_DIR, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// ============ TYPE DEFINITIONS ============

export interface LyricsResult {
  lyrics: string;
  structure: string;
  tokens: number;
  cost: number;
}

export interface CompositionResult {
  composition: string;
  tempo: string;
  key: string;
  instruments: string[];
  tokens: number;
  cost: number;
}

export interface CoverArtResult {
  coverPath: string;
  coverUrl: string;
  cost: number;
}

export interface AudioResult {
  audioPath: string;
  audioUrl: string;
  duration: number;
  cost: number;
}

export interface VideoResult {
  videoUrl: string;
  cost: number;
}

// ============ LYRICS GENERATION ============

export async function generateLyrics(
  title: string,
  style: string,
  mood: string,
  theme: string,
  language: string = "fr",
  additionalPrompt?: string
): Promise<LyricsResult> {
  const lang = language === "fr" ? "français" : language === "en" ? "English" : language;
  
  const systemPrompt = `Tu es un parolier professionnel africain. Tu écris des chansons originales, poétiques et authentiques pour les artistes africains. Tes paroles reflètent la culture, les rhythms et les réalités du continent. Tu écris en ${lang}. Tu dois TOUJOURS répondre UNIQUEMENT avec les paroles, sans commentaires ni explications.`;

  const userPrompt = `Écris les paroles complètes d'une chanson avec ces caractéristiques:
- Titre: "${title}"
- Style musical: ${style}
- Ambiance/Humeur: ${mood}
- Thème: ${theme}
${additionalPrompt ? `- Instructions supplémentaires: ${additionalPrompt}` : ""}

Format requis:
[Couplet 1]
(paroles...)

[Refrain]
(paroles...)

[Couplet 2]
(paroles...)

[Refrain]
(paroles...)

[Pont]
(paroles...)

[Refrain]
(paroles...)

[Outro]
(paroles...)

Les paroles doivent être authentiques, poétiques, et refléter l'âme africaine. Utilise des métaphores, des images fortes, et un flow naturel pour le style ${style}.`;

  const outputFile = path.join(OUTPUT_DIR, "lyrics", `lyrics-${Date.now()}.json`);
  
  const { stdout } = await execFileAsync(ZAI_CLI, [
    "chat",
    "--prompt", userPrompt,
    "--system", systemPrompt,
    "--output", outputFile,
  ], { timeout: 60000 });

  const result = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
  const lyrics = result.choices[0].message.content;
  const tokens = result.usage?.total_tokens || 0;
  
  // Clean up temp file
  try { fs.unlinkSync(outputFile); } catch {}

  return {
    lyrics,
    structure: "verse-chorus-verse-chorus-bridge-chorus-outro",
    tokens,
    cost: 0.003, // ~$0.003 per lyrics generation
  };
}

// ============ COMPOSITION DESCRIPTION ============

export async function generateComposition(
  title: string,
  style: string,
  mood: string,
  lyrics: string
): Promise<CompositionResult> {
  const systemPrompt = `Tu es un compositeur et producteur musical africain expert. Tu analyses les paroles et conçois une composition musicale détaillée avec accords, tempo, instruments et arrangement. Réponds en format structuré.`;

  const userPrompt = `Pour cette chanson "${title}" en style ${style} avec ambiance ${mood}, conçois la composition:

Paroles:
${lyrics.substring(0, 500)}

Donne-moi:
1. Tempo (BPM) et signature temporelle
2. Tonalité et progression d'accords principale
3. Instruments principaux et leur rôle
4. Structure de l'arrangement
5. Suggestions de production (effets, mix)

Sois spécifique au style ${style} africain.`;

  const outputFile = path.join(OUTPUT_DIR, "lyrics", `comp-${Date.now()}.json`);
  
  await execFileAsync(ZAI_CLI, [
    "chat",
    "--prompt", userPrompt,
    "--system", systemPrompt,
    "--output", outputFile,
  ], { timeout: 60000 });

  const result = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
  const composition = result.choices[0].message.content;
  const tokens = result.usage?.total_tokens || 0;
  
  try { fs.unlinkSync(outputFile); } catch {}

  return {
    composition,
    tempo: "120",
    key: "C minor",
    instruments: ["drums", "bass", "guitar", "synths"],
    tokens,
    cost: 0.004,
  };
}

// ============ COVER ART GENERATION ============

export async function generateCoverArt(
  title: string,
  style: string,
  mood: string,
  theme: string
): Promise<CoverArtResult> {
  const prompt = `Professional album cover art for an African music single titled "${title}". Style: ${style}, mood: ${mood}, theme: ${theme}. Vibrant colors, African aesthetic, modern design, high quality digital art, suitable for streaming platforms like Spotify. No text on the image. 4K quality.`;

  const filename = `cover-${Date.now()}.png`;
  const outputPath = path.join(OUTPUT_DIR, "covers", filename);

  await execFileAsync(ZAI_CLI, [
    "image",
    "--prompt", prompt,
    "--output", outputPath,
    "--size", "1024x1024",
  ], { timeout: 120000 });

  return {
    coverPath: outputPath,
    coverUrl: `/generated/covers/${filename}`,
    cost: 0.04, // ~$0.04 per image generation
  };
}

// ============ AUDIO GENERATION (TTS) ============

export async function generateAudio(
  lyrics: string,
  style: string,
  title: string
): Promise<AudioResult> {
  // Use TTS to generate audio from the chorus/refrain (most melodic part)
  const chorusMatch = lyrics.match(/\[Refrain\]\n([\s\S]*?)(?=\n\[|\n*$)/);
  const verseMatch = lyrics.match(/\[Couplet 1\]\n([\s\S]*?)(?=\n\[|\n*$)/);
  
  // Combine verse 1 + chorus for the audio
  const verseText = verseMatch ? verseMatch[1].trim() : "";
  const chorusText = chorusMatch ? chorusMatch[1].trim() : "";
  const audioText = `${verseText}\n\n${chorusText}\n\n${chorusText}`;
  
  // If text is too long, truncate
  const textForTTS = audioText.substring(0, 1000);

  const filename = `audio-${Date.now()}.wav`;
  const outputPath = path.join(OUTPUT_DIR, "audio", filename);

  await execFileAsync(ZAI_CLI, [
    "tts",
    "--input", textForTTS,
    "--output", outputPath,
    "--format", "wav",
    "--speed", "0.9",
  ], { timeout: 120000 });

  // Estimate duration based on text length (rough: ~150 words/min for singing)
  const wordCount = textForTTS.split(/\s+/).length;
  const duration = Math.round((wordCount / 120) * 60); // seconds

  return {
    audioPath: outputPath,
    audioUrl: `/generated/audio/${filename}`,
    duration: duration || 120,
    cost: 0.02, // ~$0.02 per TTS generation
  };
}

// ============ VIDEO CLIP GENERATION ============

export async function generateVideoClip(
  title: string,
  style: string,
  coverUrl: string
): Promise<VideoResult> {
  const prompt = `Music video clip for an African ${style} song titled "${title}". Cinematic shots, African landscapes and urban scenes, dynamic movement, vibrant colors, professional quality. 10 seconds.`;

  const outputFile = path.join(OUTPUT_DIR, "videos", `video-result-${Date.now()}.json`);

  await execFileAsync(ZAI_CLI, [
    "video",
    "--prompt", prompt,
    "--quality", "speed",
    "--duration", "5",
    "--size", "1344x768",
    "--poll",
    "--poll-interval", "10",
    "--max-polls", "30",
    "--output", outputFile,
  ], { timeout: 300000 }); // 5 min timeout for video

  // Parse result to get video URL
  const result = JSON.parse(fs.readFileSync(outputFile, "utf-8"));
  const videoUrl = result.video_url || result.url || result.data?.video_url || "";
  
  try { fs.unlinkSync(outputFile); } catch {}

  return {
    videoUrl,
    cost: 0.30, // ~$0.30 per video generation (most expensive)
  };
}

// ============ COST CALCULATION ============

/** Cost per generation type in FCFA (at ~600 FCFA per $1 USD) */
export const GENERATION_COSTS = {
  lyrics: 2,       // ~$0.003
  composition: 3,  // ~$0.004
  cover: 24,       // ~$0.04
  audio: 12,       // ~$0.02
  video: 180,      // ~$0.30
  fullSong: 41,    // lyrics + composition + cover + audio
  fullWithVideo: 221, // fullSong + video
} as const;

/** Credit cost per action (1 credit = 10 FCFA value) */
export const CREDIT_COSTS = {
  generateLyrics: 1,
  generateComposition: 1,
  generateCover: 3,
  generateAudio: 2,
  generateVideo: 20,
  fullSong: 7,     // lyrics + composition + cover + audio
  fullWithVideo: 27, // fullSong + video
} as const;
