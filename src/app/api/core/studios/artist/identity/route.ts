import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { ArtistStudio } from "@/lib/core/studio-modules";
import { z } from "zod";

/**
 * POST /api/core/studios/artist/identity
 * 
 * Artist Studio endpoint for visual identity and AI tools.
 * Supports: update_identity, ai_producer, voice_studio, analytics
 */
const artistIdentitySchema = z.object({
  action: z.enum(["update_identity", "ai_producer", "voice_studio", "analytics"]),
  artistId: z.string(),
  // Update identity fields
  visualStyle: z.record(z.unknown()).optional(),
  referenceImages: z.array(z.object({ id: z.string(), url: z.string(), label: z.string(), type: z.string() })).optional(),
  colorPalette: z.array(z.string()).optional(),
  visualConcepts: z.array(z.object({ name: z.string(), description: z.string(), imageUrl: z.string().optional() })).optional(),
  // AI Producer / Voice Studio fields
  projectId: z.string().optional(),
  prompt: z.string().optional(),
  context: z.string().optional(),
  lyricsText: z.string().optional(),
  voiceStyle: z.string().optional(),
  language: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = artistIdentitySchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const ctx = core.getContext();
    let result;

    switch (data.action) {
      case "update_identity":
        core.requirePermission("UPDATE_ARTIST_IDENTITY");
        result = await ArtistStudio.updateVisualIdentity(ctx, data.artistId, {
          visualStyle: data.visualStyle,
          referenceImages: data.referenceImages,
          colorPalette: data.colorPalette,
          visualConcepts: data.visualConcepts,
        });
        break;

      case "ai_producer":
        if (!data.projectId || !data.prompt) {
          return NextResponse.json({ error: "projectId et prompt requis pour ai_producer" }, { status: 400 });
        }
        core.requirePermission("USE_AI_PRODUCER");
        result = await ArtistStudio.useAiProducer(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          prompt: data.prompt,
          context: data.context,
        });
        break;

      case "voice_studio":
        if (!data.projectId || !data.lyricsText) {
          return NextResponse.json({ error: "projectId et lyricsText requis pour voice_studio" }, { status: 400 });
        }
        core.requirePermission("USE_VOICE_STUDIO");
        result = await ArtistStudio.useVoiceStudio(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          lyricsText: data.lyricsText,
          voiceStyle: data.voiceStyle,
          language: data.language,
        });
        break;

      case "analytics":
        result = await ArtistStudio.getAnalytics(data.artistId, token.sub);
        break;
    }

    return NextResponse.json({
      success: true,
      action: data.action,
      data: result,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json({ error: "Permission refusée : " + err.message }, { status: 403 });
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[studios/artist/identity] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
