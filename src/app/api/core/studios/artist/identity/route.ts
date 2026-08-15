import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { ArtistStudio } from "@/lib/core/studio-modules";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/studios/artist/identity
 * 
 * Artist Studio endpoint for visual identity and AI tools.
 * Supports: update_identity, ai_producer, voice_studio, analytics
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.ArtistStudioSchema.parse(body);

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
          return Api.badRequest("projectId et prompt requis pour ai_producer");
        }
        core.requirePermission("USE_AI_PRODUCER");
        // eslint-disable-next-line react-hooks/rules-of-hooks -- ArtistStudio.useAiProducer is a class method, not a React hook
        result = await ArtistStudio.useAiProducer(ctx, {
          projectId: data.projectId,
          artistId: data.artistId,
          prompt: data.prompt,
          context: data.context,
        });
        break;

      case "voice_studio":
        if (!data.projectId || !data.lyricsText) {
          return Api.badRequest("projectId et lyricsText requis pour voice_studio");
        }
        core.requirePermission("USE_VOICE_STUDIO");
        // eslint-disable-next-line react-hooks/rules-of-hooks -- ArtistStudio.useVoiceStudio is a class method, not a React hook
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

    return Api.ok({
      action: data.action,
      data: result,
    });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
