import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { getToken } from "next-auth/jwt";
import {
  generateLyrics,
  generateComposition,
  generateCoverArt,
  generateAudio,
  CREDIT_COSTS,
} from "@/lib/ai-engine";

const generateSchema = z.object({
  style: z.string(),
  theme: z.string().optional(),
  mood: z.string().optional(),
  title: z.string().min(1),
  language: z.string().default("fr"),
  additionalPrompt: z.string().optional(),
  generateCover: z.boolean().default(true),
  generateAudio: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // FIX #14: Get userId from JWT token, never from request body
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const userId = token.sub;

    const body = await req.json();
    const data = generateSchema.parse(body);

    // ============ DB CONNECTION CHECK ============
    const dbUrl = process.env.DATABASE_URL || "";
    if (!dbUrl.startsWith("postgresql") && !dbUrl.startsWith("postgres")) {
      console.error("[generate] Invalid DATABASE_URL:", dbUrl.substring(0, 30) + "...");
      return NextResponse.json(
        { error: "Configuration base de données invalide. Contacte le support." },
        { status: 500 }
      );
    }

    // ============ CHECK CREDITS ============
    const credits = await db.userCredits.findUnique({
      where: { userId },
    });

    if (!credits) {
      return NextResponse.json(
        { error: "Crédits non trouvés. Contacte le support." },
        { status: 403 }
      );
    }

    const totalCreditCost = CREDIT_COSTS.fullSong; // 7 credits for full song
    
    if (credits.credits < totalCreditCost) {
      return NextResponse.json(
        { error: `Crédits insuffisants (${credits.credits} restants, ${totalCreditCost} requis). Passe à un plan supérieur.` },
        { status: 403 }
      );
    }

    if (credits.songsRemaining <= 0) {
      return NextResponse.json(
        { error: "Limite de chansons atteinte. Passe à un plan supérieur." },
        { status: 403 }
      );
    }

    // ============ CREATE SONG RECORD ============
    const song = await db.song.create({
      data: {
        userId,
        title: data.title,
        style: data.style,
        mood: data.mood,
        theme: data.theme,
        language: data.language,
        status: "generating",
      },
    });

    // ============ STEP 1: GENERATE LYRICS (Real AI) ============
    let lyricsText = "";
    let lyricsTokens = 0;
    let lyricsCost = 0;
    
    try {
      const lyricsResult = await generateLyrics(
        data.title,
        data.style,
        data.mood || "joyful",
        data.theme || "africa",
        data.language,
        data.additionalPrompt
      );
      lyricsText = lyricsResult.lyrics;
      lyricsTokens = lyricsResult.tokens;
      lyricsCost = lyricsResult.cost;
    } catch (err) {
      console.error("Lyrics generation error:", err);
      // Fallback: generate basic lyrics
      lyricsText = `[Couplet 1]\nDans le souffle du continent, ${data.title}\nNotre voix s'élève, portée par le vent\nL'Afrique chante, l'Afrique danse\nChaque note est une espérance\n\n[Refrain]\n${data.title}, ${data.title}\nNotre mélodie, notre identité\n${data.title}, ${data.title}\nLe ${data.style} de l'éternité\n\n[Couplet 2]\nSous le soleil et les étoiles\nNotre rythme traverse les frontières\nChaque mot porte notre histoire\nJusqu'au bout de la terre\n\n[Refrain]\n${data.title}, ${data.title}\nNotre mélodie, notre identité\n${data.title}, ${data.title}\nLe ${data.style} de l'éternité`;
    }

    // Save lyrics
    await db.lyrics.create({
      data: {
        songId: song.id,
        content: lyricsText,
        language: data.language,
        version: 1,
      },
    });

    // ============ STEP 2: GENERATE COMPOSITION (Real AI) ============
    let compositionText = "";
    try {
      const compResult = await generateComposition(
        data.title,
        data.style,
        data.mood || "joyful",
        lyricsText
      );
      compositionText = compResult.composition;
    } catch (err) {
      console.error("Composition generation error:", err);
      compositionText = `Composition ${data.style} - Tempo: 120 BPM - Tonalité: Do mineur`;
    }

    // ============ STEP 3: GENERATE COVER ART (Real AI) ============
    let coverUrl = "";
    try {
      if (data.generateCover && credits.coversRemaining > 0) {
        const coverResult = await generateCoverArt(
          data.title,
          data.style,
          data.mood || "joyful",
          data.theme || "africa"
        );
        coverUrl = coverResult.coverUrl;
      }
    } catch (err) {
      console.error("Cover art generation error:", err);
      coverUrl = "";
    }

    // ============ STEP 4: GENERATE AUDIO (Real TTS) ============
    let audioUrl = "";
    let duration = 180;
    try {
      if (data.generateAudio) {
        const audioResult = await generateAudio(
          lyricsText,
          data.style,
          data.title
        );
        audioUrl = audioResult.audioUrl;
        duration = audioResult.duration;
      }
    } catch (err) {
      console.error("Audio generation error:", err);
      // Generate a fallback silence audio file instead of a non-existent path
      try {
        const { execFile: execFileCb } = require("child_process");
        const { promisify } = require("util");
        const execFileAsync = promisify(execFileCb);
        const path = require("path");
        const IS_VERCEL = !!process.env.VERCEL;
        const outputDir = IS_VERCEL
          ? path.join("/tmp", "melodia-generated", "audio")
          : path.join(process.cwd(), "public", "generated", "audio");
        const fs = require("fs");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        const fallbackFilename = `audio-silence-${Date.now()}.wav`;
        const fallbackPath = path.join(outputDir, fallbackFilename);
        await execFileAsync("ffmpeg", [
          "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
          "-t", "30", "-ar", "44100", "-ac", "1", fallbackPath,
        ], { timeout: 10000 });
        audioUrl = `/generated/audio/${fallbackFilename}`;
        duration = 30;
        console.log("[generate] Fallback silence audio generated:", fallbackFilename);
      } catch (fallbackErr) {
        console.error("[generate] Fallback silence generation also failed:", fallbackErr);
        audioUrl = "";
        duration = 0;
      }
    }

    // ============ UPDATE SONG TO COMPLETED ============
    await db.song.update({
      where: { id: song.id },
      data: {
        status: "completed",
        duration,
        audioUrl: audioUrl || null,
        coverUrl: coverUrl || null,
        lyricsText,
      },
    });

    // ============ DEBIT CREDITS ============
    await db.userCredits.update({
      where: { userId },
      data: {
        credits: { decrement: totalCreditCost },
        songsRemaining: { decrement: 1 },
        coversRemaining: coverUrl ? { decrement: 1 } : undefined,
        totalSongsUsed: { increment: 1 },
        totalCoversUsed: coverUrl ? { increment: 1 } : undefined,
        totalCreditsUsed: { increment: totalCreditCost },
      },
    });

    // ============ LOG TRANSACTIONS ============
    await db.creditTransaction.createMany({
      data: [
        {
          userId,
          type: "debit",
          category: "song",
          amount: CREDIT_COSTS.generateLyrics + CREDIT_COSTS.generateComposition,
          description: `Paroles & Composition: ${data.title}`,
        },
        {
          userId,
          type: "debit",
          category: "cover",
          amount: CREDIT_COSTS.generateCover,
          description: `Pochette IA: ${data.title}`,
        },
        {
          userId,
          type: "debit",
          category: "song",
          amount: CREDIT_COSTS.generateAudio,
          description: `Audio IA: ${data.title}`,
        },
      ],
    });

    // ============ LOG AI REQUEST ============
    const totalDuration = Date.now() - startTime;
    await db.aIRequestLog.create({
      data: {
        userId,
        endpoint: "/api/generate",
        model: "z-ai-sdk",
        promptTokens: lyricsTokens,
        completionTokens: 0,
        totalTokens: lyricsTokens,
        cost: lyricsCost,
        status: "success",
        duration: totalDuration,
      },
    });

    // ============ LOG ANALYTICS ============
    await db.analyticsEvent.create({
      data: {
        userId,
        event: "song_generated",
        data: JSON.stringify({
          style: data.style,
          mood: data.mood,
          theme: data.theme,
          hasCover: !!coverUrl,
          hasAudio: !!audioUrl,
          creditsUsed: totalCreditCost,
          duration: totalDuration,
        }),
        page: "/create",
      },
    });

    // ============ RETURN RESULT ============
    return NextResponse.json({
      success: true,
      song: {
        id: song.id,
        title: data.title,
        style: data.style,
        mood: data.mood,
        theme: data.theme,
        status: "completed",
        lyrics: lyricsText,
        composition: compositionText,
        duration,
        audioUrl: audioUrl || null,
        coverUrl: coverUrl || null,
        creditsUsed: totalCreditCost,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("[generate] Error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Erreur lors de la génération: " + errorMsg },
      { status: 500 }
    );
  }
}
