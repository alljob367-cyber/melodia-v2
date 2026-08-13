/**
 * Test script for the /api/generate flow
 * Simulates exactly what the API route does
 */

import { db } from "../src/lib/db";
import {
  generateLyrics,
  generateComposition,
  generateCoverArt,
  generateAudio,
  CREDIT_COSTS,
} from "../src/lib/ai-engine";

async function testGenerate() {
  const userId = "cmsrz17tj0000vlqpq581u7yd"; // admin user
  const title = "JE VOIS LA VIE";
  const style = "afrobeat";
  const mood = "joyful";
  const theme = "life";
  const language = "fr";
  const additionalPrompt = "tempo rapide, percussions africaines, basse profonde";

  console.log("=== TEST GENERATION FLOW ===\n");

  // Step 0: Check credits
  console.log("Step 0: Checking credits...");
  const credits = await db.userCredits.findUnique({ where: { userId } });
  if (!credits) {
    console.error("ERROR: No credits found for user");
    return;
  }
  console.log(`Credits: ${credits.credits}, Songs remaining: ${credits.songsRemaining}`);
  console.log(`Cost: ${CREDIT_COSTS.fullSong} credits\n`);

  // Step 1: Create song record
  console.log("Step 1: Creating song record...");
  const song = await db.song.create({
    data: {
      userId,
      title,
      style,
      mood,
      theme,
      language,
      status: "generating",
    },
  });
  console.log(`Song created: ${song.id}\n`);

  // Step 2: Generate lyrics
  console.log("Step 2: Generating lyrics with z-ai...");
  let lyricsText = "";
  try {
    const lyricsResult = await generateLyrics(title, style, mood, theme, language, additionalPrompt);
    lyricsText = lyricsResult.lyrics;
    console.log(`Lyrics generated (${lyricsResult.tokens} tokens):`);
    console.log(lyricsText.substring(0, 200) + "...\n");
  } catch (err) {
    console.error("Lyrics generation FAILED:", err);
    lyricsText = `[Couplet 1]\nDans le souffle du continent, ${title}\nNotre voix s'élève, portée par le vent\n\n[Refrain]\n${title}, ${title}\nNotre mélodie, notre identité\n\n[Couplet 2]\nSous le soleil et les étoiles\nNotre rythme traverse les frontières\n\n[Refrain]\n${title}, ${title}\nNotre mélodie, notre identité`;
    console.log("Using fallback lyrics\n");
  }

  // Step 3: Save lyrics
  console.log("Step 3: Saving lyrics to DB...");
  const lyricsRecord = await db.lyrics.create({
    data: {
      songId: song.id,
      content: lyricsText,
      language,
      version: 1,
    },
  });
  console.log(`Lyrics saved: ${lyricsRecord.id}\n`);

  // Step 4: Generate composition
  console.log("Step 4: Generating composition...");
  let compositionText = "";
  try {
    const compResult = await generateComposition(title, style, mood, lyricsText);
    compositionText = compResult.composition;
    console.log(`Composition generated: ${compositionText.substring(0, 150)}...\n`);
  } catch (err) {
    console.error("Composition generation FAILED:", err);
    compositionText = `Composition ${style} - Tempo: 120 BPM - Tonalité: Do mineur`;
    console.log("Using fallback composition\n");
  }

  // Step 5: Generate cover
  console.log("Step 5: Generating cover art...");
  let coverUrl = "";
  try {
    if (credits.coversRemaining > 0) {
      const coverResult = await generateCoverArt(title, style, mood, theme);
      coverUrl = coverResult.coverUrl;
      console.log(`Cover generated: ${coverUrl}\n`);
    }
  } catch (err) {
    console.error("Cover art generation FAILED:", err);
    console.log("Skipping cover\n");
  }

  // Step 6: Generate audio
  console.log("Step 6: Generating audio...");
  let audioUrl = "";
  let duration = 180;
  try {
    const audioResult = await generateAudio(lyricsText, style, title);
    audioUrl = audioResult.audioUrl;
    duration = audioResult.duration;
    console.log(`Audio generated: ${audioUrl} (${duration}s)\n`);
  } catch (err) {
    console.error("Audio generation FAILED:", err);
    console.log("Skipping audio\n");
  }

  // Step 7: Update song
  console.log("Step 7: Updating song to completed...");
  await db.song.update({
    where: { id: song.id },
    data: {
      status: "completed",
      duration,
      audioUrl: audioUrl || `/audio/${song.id}.mp3`,
      coverUrl: coverUrl || `/covers/${song.id}.png`,
      lyricsText,
    },
  });
  console.log("Song updated\n");

  // Step 8: Debit credits
  console.log("Step 8: Debiting credits...");
  await db.userCredits.update({
    where: { userId },
    data: {
      credits: { decrement: CREDIT_COSTS.fullSong },
      songsRemaining: { decrement: 1 },
      coversRemaining: coverUrl ? { decrement: 1 } : undefined,
      totalSongsUsed: { increment: 1 },
      totalCoversUsed: coverUrl ? { increment: 1 } : undefined,
      totalCreditsUsed: { increment: CREDIT_COSTS.fullSong },
    },
  });
  console.log(`Debited ${CREDIT_COSTS.fullSong} credits\n`);

  // Step 9: Log transactions
  console.log("Step 9: Logging transactions...");
  await db.creditTransaction.createMany({
    data: [
      {
        userId,
        type: "debit",
        category: "song",
        amount: CREDIT_COSTS.generateLyrics + CREDIT_COSTS.generateComposition,
        description: `Paroles & Composition: ${title}`,
      },
      {
        userId,
        type: "debit",
        category: "cover",
        amount: CREDIT_COSTS.generateCover,
        description: `Pochette IA: ${title}`,
      },
      {
        userId,
        type: "debit",
        category: "song",
        amount: CREDIT_COSTS.generateAudio,
        description: `Audio IA: ${title}`,
      },
    ],
  });
  console.log("Transactions logged\n");

  // Step 10: Log AI request
  console.log("Step 10: Logging AI request...");
  await db.aIRequestLog.create({
    data: {
      userId,
      endpoint: "/api/generate",
      model: "z-ai-sdk",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      cost: 0,
      status: "success",
      duration: 0,
    },
  });
  console.log("AI request logged\n");

  // Step 11: Log analytics
  console.log("Step 11: Logging analytics...");
  await db.analyticsEvent.create({
    data: {
      userId,
      event: "song_generated",
      data: JSON.stringify({ style, mood, theme, hasCover: !!coverUrl, hasAudio: !!audioUrl }),
      page: "/create",
    },
  });
  console.log("Analytics logged\n");

  console.log("=== ALL STEPS COMPLETED SUCCESSFULLY ===");
  console.log(`Song ID: ${song.id}`);
  console.log(`Title: ${title}`);
  console.log(`Lyrics length: ${lyricsText.length} chars`);
  console.log(`Cover URL: ${coverUrl || "none"}`);
  console.log(`Audio URL: ${audioUrl || "none"}`);
  console.log(`Duration: ${duration}s`);

  await db.$disconnect();
}

testGenerate().catch(async (err) => {
  console.error("\n=== FATAL ERROR ===");
  console.error(err);
  await db.$disconnect();
  process.exit(1);
});
