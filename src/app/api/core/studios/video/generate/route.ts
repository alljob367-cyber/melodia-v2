import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { VideoStudio } from "@/lib/core/studio-modules";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/studios/video/generate
 * 
 * Video Studio generation endpoint.
 * Supports: generate_cover, generate_video, generate_storyboard
 * 
 * Pipeline: Auth → Core → Permission → Credit Reserve → Studio Module → Return Generation ID
 */
const OPERATION_PERMISSION_MAP: Record<string, string> = {
  generate_cover: "CREATE_COVER",
  generate_video: "CREATE_VIDEO",
  generate_storyboard: "CREATE_STORYBOARD",
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.VideoStudioSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    const permission = OPERATION_PERMISSION_MAP[data.operation];
    if (permission) {
      core.requirePermission(permission as any);
    }

    const ctx = core.getContext();
    let result;

    switch (data.operation) {
      case "generate_cover":
        result = await VideoStudio.generateCover(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          songId: data.songId,
          style: data.style,
          mood: data.mood,
          visualConcept: data.visualConcept,
        });
        break;

      case "generate_video":
        if (!data.quality || !data.durationSeconds) {
          return Api.badRequest("quality et durationSeconds requis pour generate_video");
        }
        result = await VideoStudio.generateVideo(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          songId: data.songId,
          quality: data.quality,
          durationSeconds: data.durationSeconds,
          style: data.style,
          additionalPrompt: data.additionalPrompt,
        });
        break;

      case "generate_storyboard":
        result = await VideoStudio.generateStoryboard(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          lyricsText: data.lyricsText,
          mood: data.mood || "dramatic",
          style: data.style,
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
