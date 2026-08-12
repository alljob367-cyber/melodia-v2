import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const generateSchema = z.object({
  userId: z.string(),
  style: z.string(),
  theme: z.string().optional(),
  mood: z.string().optional(),
  title: z.string().min(1),
  language: z.string().default("fr"),
  additionalPrompt: z.string().optional(),
});

// Mock lyrics generation
function generateMockLyrics(title: string, style: string, mood: string, theme: string): string {
  const moodWords: Record<string, string[]> = {
    joyful: ["soleil", "danse", "joie", "célébration", "rires"],
    melancholic: ["pluie", "souvenirs", "silence", "nostalgie", "ombres"],
    energetic: ["feu", "puissance", "mouvement", "frénésie", "électricité"],
    chill: ["brise", "calme", "sérénité", "horizon", "vague"],
    powerful: ["tonnerre", "force", "victoire", "révolution", "ascension"],
    dreamy: ["étoiles", "rêves", "nuages", "lune", "horizon"],
  };

  const themeWords: Record<string, string> = {
    love: "l'amour qui nous guide",
    freedom: "la liberté tant rêvée",
    party: "la fête qui nous unit",
    struggle: "la lutte quotidienne",
    faith: "la foi qui nous porte",
    africa: "l'Afrique qui se lève",
    family: "la famille comme ancrage",
    dreams: "les rêves qui nous poussent",
  };

  const words = moodWords[mood] || moodWords.joyful;
  const themeText = themeWords[theme] || themeWords.africa;

  return `[Couplet 1]
Dans le souffle du ${words[0]}, ${themeText}
Les ${words[1]} résonnent comme un appel
${title}, c'est notre histoire
Qui s'écrit sur les ${words[4]} du ciel

[Refrain]
${title}, ${title}
${words[2]} et ${words[3]}, notre mélodie
${title}, ${title}
L'${style} de nos vies

[Couplet 2]
Sous le ${words[0]} et les ${words[4]}
Notre ${words[1]} traverse les frontières
Chaque note porte ${themeText}
Jusqu'au bout de l'${words[3]}

[Refrain]
${title}, ${title}
${words[2]} et ${words[3]}, notre mélodie
${title}, ${title}
L'${style} de nos vies

[Pont]
Et si le ${words[0]} s'arrête un instant
On ${words[1]} encore, on ${words[1]} toujours
Car ${themeText}
C'est plus fort que le ${words[4]}

[Refrain]
${title}, ${title}
${words[2]} et ${words[3]}, notre mélodie
${title}, ${title}
L'${style} de nos vies`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = generateSchema.parse(body);

    // Check user credits
    const credits = await db.userCredits.findUnique({
      where: { userId: data.userId },
    });

    if (!credits || credits.songsRemaining <= 0) {
      return NextResponse.json(
        { error: "Crédits insuffisants. Passez à un plan supérieur." },
        { status: 403 }
      );
    }

    // Create song record
    const song = await db.song.create({
      data: {
        userId: data.userId,
        title: data.title,
        style: data.style,
        mood: data.mood,
        theme: data.theme,
        language: data.language,
        status: "generating",
      },
    });

    // Log AI request
    await db.aIRequestLog.create({
      data: {
        userId: data.userId,
        endpoint: "/api/generate",
        model: "melodia-v1",
        promptTokens: 150,
        completionTokens: 500,
        totalTokens: 650,
        cost: 0.02,
        status: "success",
        duration: 25000,
      },
    });

    // Generate mock lyrics
    const lyricsText = generateMockLyrics(
      data.title,
      data.style,
      data.mood || "joyful",
      data.theme || "africa"
    );

    // Save lyrics
    await db.lyrics.create({
      data: {
        songId: song.id,
        content: lyricsText,
        language: data.language,
        version: 1,
      },
    });

    // Update song to completed
    await db.song.update({
      where: { id: song.id },
      data: {
        status: "completed",
        duration: 204, // 3:24 mock
        audioUrl: `/audio/${song.id}.mp3`,
        coverUrl: `/covers/${song.id}.png`,
      },
    });

    // Debit credits
    await db.userCredits.update({
      where: { userId: data.userId },
      data: {
        songsRemaining: { decrement: 1 },
        totalSongsUsed: { increment: 1 },
      },
    });

    // Log credit transaction
    await db.creditTransaction.create({
      data: {
        userId: data.userId,
        type: "debit",
        category: "song",
        amount: 1,
        description: `Génération chanson: ${data.title}`,
      },
    });

    // Log analytics
    await db.analyticsEvent.create({
      data: {
        userId: data.userId,
        event: "song_generated",
        data: JSON.stringify({ style: data.style, mood: data.mood, theme: data.theme }),
        page: "/create",
      },
    });

    return NextResponse.json({
      success: true,
      song: {
        id: song.id,
        title: data.title,
        style: data.style,
        mood: data.mood,
        status: "completed",
        lyrics: lyricsText,
        duration: 204,
        audioUrl: `/audio/${song.id}.mp3`,
        coverUrl: `/covers/${song.id}.png`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération" },
      { status: 500 }
    );
  }
}
