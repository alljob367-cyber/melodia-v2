import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore } from "@/lib/core";
import { z } from "zod";

/**
 * POST /api/core/generate
 * Unified generation endpoint — ALL AI generations go through this.
 * 
 * Pipeline: Auth → UserContext → Permission → Credit → Reserve → Generate → Media → Consume
 */
const generateSchema = z.object({
  operation: z.string(),
  projectId: z.string().optional(),
  artistId: z.string().optional(),
  title: z.string().optional(),
  style: z.string().optional(),
  mood: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().default("fr"),
  lyrics: z.string().optional(),
  additionalPrompt: z.string().optional(),
  coverUrl: z.string().optional(),
  quality: z.enum(["economy", "standard", "premium"]).optional(),
  durationSeconds: z.number().optional(),
  availableMediaIds: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = generateSchema.parse(body);

    // Initialize Core
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // Permission check based on operation
    const permMap: Record<string, string> = {
      generate_lyrics: "CREATE_LYRICS",
      generate_composition: "CREATE_COMPOSITION",
      generate_cover: "CREATE_COVER",
      generate_audio: "CREATE_AUDIO",
      generate_video_economy: "CREATE_VIDEO",
      generate_video_standard: "CREATE_VIDEO",
      generate_video_premium: "CREATE_VIDEO",
      generate_storyboard: "CREATE_STORYBOARD",
      full_song: "CREATE_SONG",
    };

    const requiredPerm = permMap[data.operation];
    if (requiredPerm) {
      try {
        core.requirePermission(requiredPerm as any);
      } catch {
        return NextResponse.json(
          { error: `Permission refusée: '${data.operation}' non disponible sur votre plan` },
          { status: 403 }
        );
      }
    }

    // Execute through the unified pipeline
    const result = await core.generate({
      operation: data.operation as any,
      projectId: data.projectId,
      artistId: data.artistId,
      input: {
        title: data.title,
        style: data.style,
        mood: data.mood,
        theme: data.theme,
        language: data.language,
        lyrics: data.lyrics,
        additionalPrompt: data.additionalPrompt,
        coverUrl: data.coverUrl,
      },
      quality: data.quality,
      durationSeconds: data.durationSeconds,
      availableMediaIds: data.availableMediaIds,
    });

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.error, generationId: result.generationId },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      generationId: result.generationId,
      operation: result.operation,
      provider: result.provider,
      outputMediaIds: result.outputMediaIds,
      creditsConsumed: result.creditsConsumed,
      duration: result.duration,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/generate] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
