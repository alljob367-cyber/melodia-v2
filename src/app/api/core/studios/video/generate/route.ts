import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { VideoStudio } from "@/lib/core/studio-modules";
import { z } from "zod";

/**
 * POST /api/core/studios/video/generate
 * 
 * Video Studio generation endpoint.
 * Supports: generate_cover, generate_video, generate_storyboard
 * 
 * Pipeline: Auth → Core → Permission → Credit Reserve → Studio Module → Return Generation ID
 */
const videoGenerateSchema = z.object({
  operation: z.enum(["generate_cover", "generate_video", "generate_storyboard"]),
  projectId: z.string(),
  artistId: z.string().optional(),
  songId: z.string().optional(),
  // Cover fields
  style: z.string().optional(),
  mood: z.string().optional(),
  visualConcept: z.string().optional(),
  // Video fields
  quality: z.enum(["economy", "standard", "premium"]).optional(),
  durationSeconds: z.number().optional(),
  additionalPrompt: z.string().optional(),
  // Storyboard fields
  lyricsText: z.string().optional(),
});

const OPERATION_PERMISSION_MAP: Record<string, string> = {
  generate_cover: "CREATE_COVER",
  generate_video: "CREATE_VIDEO",
  generate_storyboard: "CREATE_STORYBOARD",
};

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = videoGenerateSchema.parse(body);

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
          return NextResponse.json(
            { error: "quality et durationSeconds requis pour generate_video" },
            { status: 400 }
          );
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
    console.error("[studios/video/generate] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
