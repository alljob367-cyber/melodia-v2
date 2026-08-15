import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { AudioStudio } from "@/lib/core/studio-modules";
import { buildUserContext } from "@/lib/core/user-context";
import { z } from "zod";

/**
 * POST /api/core/studios/audio/generate
 * 
 * Audio Studio generation endpoint.
 * Supports: generate_lyrics, generate_audio, mix_master, full_song
 * 
 * Pipeline: Auth → Core → Permission → Credit Reserve → Studio Module → Return Generation ID
 */
const audioGenerateSchema = z.object({
  operation: z.enum(["generate_lyrics", "generate_audio", "mix_master", "full_song"]),
  projectId: z.string(),
  artistId: z.string().optional(),
  // Lyrics / Full Song fields
  title: z.string().optional(),
  style: z.string().optional(),
  mood: z.string().optional(),
  theme: z.string().optional(),
  language: z.string().optional(),
  additionalPrompt: z.string().optional(),
  lyricsText: z.string().optional(),
  // Audio fields
  durationSeconds: z.number().optional(),
  // Mix/Master fields
  sourceMediaId: z.string().optional(),
});

const OPERATION_PERMISSION_MAP: Record<string, string> = {
  generate_lyrics: "CREATE_LYRICS",
  generate_audio: "CREATE_SONG",
  mix_master: "USE_MIX_MASTER",
  full_song: "CREATE_SONG",
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = audioGenerateSchema.parse(body);

    // Initialize Core and check permission
    const core = new MelodiaCore(token.sub);
    await core.initialize();
    const permission = OPERATION_PERMISSION_MAP[data.operation];
    if (permission) {
      core.requirePermission(permission as any);
    }

    const ctx = core.getContext();

    let result;

    switch (data.operation) {
      case "generate_lyrics":
        result = await AudioStudio.generateLyrics(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          title: data.title,
          style: data.style || "afrobeat",
          mood: data.mood || "joyful",
          language: data.language,
          additionalPrompt: data.additionalPrompt,
        });
        break;

      case "generate_audio":
        result = await AudioStudio.generateAudio(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          lyricsText: data.lyricsText,
          style: data.style || "afrobeat",
          mood: data.mood || "joyful",
          durationSeconds: data.durationSeconds,
        });
        break;

      case "mix_master":
        if (!data.sourceMediaId) {
          return NextResponse.json({ error: "sourceMediaId requis pour mix_master" }, { status: 400 });
        }
        result = await AudioStudio.mixAndMaster(ctx, {
          projectId: data.projectId,
          sourceMediaId: data.sourceMediaId,
          artistId: data.artistId,
          style: data.style,
        });
        break;

      case "full_song":
        result = await AudioStudio.fullSong(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          title: data.title,
          style: data.style || "afrobeat",
          mood: data.mood || "joyful",
          theme: data.theme,
          language: data.language,
          additionalPrompt: data.additionalPrompt,
        });
        break;
    }

    return NextResponse.json({
      success: true,
      operation: data.operation,
      ...result,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "Permission refusée : " + err.message }, { status: 403 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[studios/audio/generate] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
