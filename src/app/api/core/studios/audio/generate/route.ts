import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { AudioStudio } from "@/lib/core/studio-modules";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/studios/audio/generate
 * 
 * Audio Studio generation endpoint.
 * Supports: generate_lyrics, generate_audio, mix_master, full_song
 * 
 * Pipeline: Auth → Core → Permission → Credit Reserve → Studio Module → Return Generation ID
 */
const OPERATION_PERMISSION_MAP: Record<string, string> = {
  generate_lyrics: "CREATE_LYRICS",
  generate_audio: "CREATE_AUDIO",
  mix_master: "USE_MIX_MASTER",
  full_song: "CREATE_SONG",
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.AudioStudioSchema.parse(body);

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
          return Api.badRequest("sourceMediaId requis pour mix_master");
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

    return Api.ok({
      operation: data.operation,
      ...result,
    });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
