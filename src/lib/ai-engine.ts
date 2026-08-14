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
// Use /tmp on Vercel (read-only filesystem), otherwise local path
const IS_VERCEL = !!process.env.VERCEL;
const OUTPUT_DIR = IS_VERCEL
  ? path.join("/tmp", "melodia-generated")
  : path.join(process.cwd(), "public", "generated");

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

// ============ AUDIO GENERATION (Beat + TTS Voice + Mix) ============

/** Style-to-BPM mapping for beat generation */
const STYLE_BPM: Record<string, number> = {
  afrobeat: 120,
  amapiano: 115,
  afropop: 105,
  coupé_décalé: 125,
  ndombolo: 110,
  soukous: 130,
  highlife: 100,
  rumba: 95,
  zouk: 108,
  dancehall: 130,
  reggae: 80,
  hiphop: 90,
  rnb: 85,
  pop: 120,
  rock: 130,
  jazz: 100,
  gospel: 95,
  traditional: 100,
};

/** Generate a synthetic beat (kick + snare + hihat + bass + shaker) for one bar */
async function generateBeatBar(bpm: number, style: string): Promise<string> {
  const tmpDir = path.join(OUTPUT_DIR, "audio", `_tmp_${Date.now()}`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const barFile = path.join(tmpDir, "bar.wav");

  // Style-specific frequency tuning
  const isAfrican = ["afrobeat","amapiano","afropop","coupé_décalé","ndombolo","soukous","highlife","rumba","zouk","traditional"].includes(style);
  const kickFreq = isAfrican ? 60 : 65;
  const bassFreq = isAfrican ? 100 : 110;
  const shakerVol = isAfrican ? 0.15 : 0.08;

  await execFileAsync("ffmpeg", [
    "-y",
    "-f", "lavfi", "-i", `sine=frequency=${kickFreq}:duration=0.12`,
    "-f", "lavfi", "-i", "anoisesrc=d=0.08:c=pink:r=44100",
    "-f", "lavfi", "-i", "anoisesrc=d=0.03:c=white:r=44100",
    "-f", "lavfi", "-i", `sine=frequency=${bassFreq}:duration=0.25`,
    "-f", "lavfi", "-i", "anoisesrc=d=0.02:c=pink:r=44100",
    "-filter_complex", [
      `[0:a]volume=0.8[kick]`,
      `[1:a]lowpass=f=2500,highpass=f=300,volume=0.5[snare]`,
      `[2:a]highpass=f=7000,lowpass=f=15000,volume=0.15[hihat]`,
      `[3:a]volume=0.3[bass]`,
      `[4:a]bandpass=f=5000:width_type=q:w=2,volume=${shakerVol}[shaker]`,
      // Beat pattern: Kick on 1,3 | Snare on 2,4 | HiHat on every 8th | Bass on 1,3 | Shaker on off-beats
      `[kick]adelay=0|0[k1]`,
      `[kick]adelay=1000|1000[k3]`,
      `[snare]adelay=500|500[s2]`,
      `[snare]adelay=1500|1500[s4]`,
      `[hihat]adelay=0|0[h1]`,
      `[hihat]adelay=250|250[h2]`,
      `[hihat]adelay=500|500[h3]`,
      `[hihat]adelay=750|750[h4]`,
      `[hihat]adelay=1000|1000[h5]`,
      `[hihat]adelay=1250|1250[h6]`,
      `[hihat]adelay=1500|1500[h7]`,
      `[hihat]adelay=1750|1750[h8]`,
      `[bass]adelay=0|0[b1]`,
      `[bass]adelay=1000|1000[b3]`,
      `[shaker]adelay=250|250[sh1]`,
      `[shaker]adelay=750|750[sh2]`,
      `[shaker]adelay=1250|1250[sh3]`,
      `[shaker]adelay=1750|1750[sh4]`,
      `[k1][k3][s2][s4][h1][h2][h3][h4][h5][h6][h7][h8][b1][b3][sh1][sh2][sh3][sh4]amix=inputs=18:duration=longest:dropout_transition=0[v]`,
    ].join(";"),
    "-map", "[v]", "-t", "2", "-ar", "44100", "-ac", "1", barFile,
  ], { timeout: 15000 });

  return barFile;
}

export async function generateAudio(
  lyrics: string,
  style: string,
  title: string
): Promise<AudioResult> {
  const timestamp = Date.now();
  const tmpDir = path.join(OUTPUT_DIR, "audio", `_tmp_${timestamp}`);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const finalFilename = `audio-${timestamp}.wav`;
  const finalPath = path.join(OUTPUT_DIR, "audio", finalFilename);

  const bpm = STYLE_BPM[style] || 110;

  // ============ Step 1: Generate beat/instrumental ============
  console.log(`[audio] Generating ${style} beat at ${bpm} BPM...`);
  let beatFile = "";
  try {
    beatFile = await generateBeatBar(bpm, style);
  } catch (err) {
    console.error("[audio] Beat generation failed:", err);
  }

  // ============ Step 2: Generate TTS voice from lyrics ============
  // Extract the most melodic parts: verse 1 + refrain (repeated)
  const chorusMatch = lyrics.match(/\[Refrain\]\n([\s\S]*?)(?=\n\[|\n*$)/);
  const verseMatch = lyrics.match(/\[Couplet 1\]\n([\s\S]*?)(?=\n\[|\n*$)/);

  const verseText = verseMatch ? verseMatch[1].trim() : "";
  const chorusText = chorusMatch ? chorusMatch[1].trim() : "";
  // Structure: verse -> chorus -> verse -> chorus -> chorus (outro)
  const audioText = `${verseText}\n\n${chorusText}\n\n${verseText}\n\n${chorusText}\n\n${chorusText}`;
  const textForTTS = audioText.substring(0, 1000); // FIX: TTS API limit is 1024 chars

  const ttsFile = path.join(tmpDir, "voice.wav");
  let hasVoice = false;
  try {
    console.log(`[audio] Generating TTS voice (${textForTTS.split(/\s+/).length} words)...`);
    await execFileAsync(ZAI_CLI, [
      "tts",
      "--input", textForTTS,
      "--output", ttsFile,
      "--format", "wav",
      "--speed", "0.85",
    ], { timeout: 120000 });
    hasVoice = true;
  } catch (err) {
    console.error("[audio] TTS generation failed:", err);
  }

  // ============ Step 3: Loop beat to match voice duration, then mix ============
  if (beatFile && fs.existsSync(beatFile)) {
    if (hasVoice && fs.existsSync(ttsFile)) {
      // Mix beat + voice: loop beat to match voice duration
      console.log("[audio] Mixing beat + voice...");
      // First get voice duration
      let voiceDuration = 90;
      try {
        const { stdout: probeOut } = await execFileAsync("ffprobe", [
          "-v", "error", "-show_entries", "format=duration",
          "-of", "default=noprint_wrappers=1:nokey=1", ttsFile,
        ], { timeout: 5000 });
        voiceDuration = Math.round(parseFloat(probeOut.trim())) || 90;
      } catch {}
      // Add 3 seconds padding
      const totalDuration = voiceDuration + 3;
      
      await execFileAsync("ffmpeg", [
        "-y",
        "-stream_loop", "-1",  // Loop the beat infinitely
        "-i", beatFile,
        "-i", ttsFile,
        "-filter_complex",
        "[0:a]volume=0.5[beat];[1:a]volume=0.8[voice];[beat][voice]amix=inputs=2:duration=longest:dropout_transition=3[mixed]",
        "-map", "[mixed]",
        "-t", String(totalDuration),
        "-ar", "44100", "-ac", "1",
        finalPath,
      ], { timeout: 60000 });
    } else {
      // No voice, just loop the beat for 90 seconds
      console.log("[audio] No voice, looping beat...");
      await execFileAsync("ffmpeg", [
        "-y",
        "-stream_loop", "-1",
        "-i", beatFile,
        "-t", "90",
        "-ar", "44100", "-ac", "1",
        finalPath,
      ], { timeout: 15000 });
    }
  } else if (hasVoice && fs.existsSync(ttsFile)) {
    // No beat, just use the voice
    fs.copyFileSync(ttsFile, finalPath);
  } else {
    // Fallback: generate silence
    await execFileAsync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
      "-t", "60", "-ar", "44100", "-ac", "1", finalPath,
    ], { timeout: 10000 });
  }

  // Get actual duration with ffprobe
  let duration = 90;
  try {
    const { stdout: probeOut } = await execFileAsync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1", finalPath,
    ], { timeout: 5000 });
    duration = Math.round(parseFloat(probeOut.trim())) || 90;
  } catch {}

  // Cleanup temp dir
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    if (beatFile) {
      const beatTmpDir = path.dirname(beatFile);
      if (beatTmpDir.includes("_tmp_")) fs.rmSync(beatTmpDir, { recursive: true, force: true });
    }
  } catch {}

  console.log(`[audio] ✅ Final audio: ${finalFilename} (${duration}s)`);

  return {
    audioPath: finalPath,
    audioUrl: `/generated/audio/${finalFilename}`,
    duration,
    cost: 0.03,
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
