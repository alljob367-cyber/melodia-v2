import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * POST /api/core/generate
 * Unified generation endpoint — ALL AI generations go through this.
 * 
 * Pipeline: Auth → UserContext → Permission → Credit → Reserve → Generate → Media → Consume
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.GenerateSchema.parse(body);

    // Initialize Core
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // Permission check based on operation
    const permMap = ApiSchemas.OPERATION_PERMISSION_MAP;
    const requiredPerm = permMap[data.operation];
    if (requiredPerm) {
      core.requirePermission(requiredPerm as any);
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
      return Api.error("GENERATION_FAILED", result.error || "Generation failed", 500, {
        generationId: result.generationId,
      });
    }

    return Api.ok({
      generationId: result.generationId,
      operation: result.operation,
      provider: result.provider,
      outputMediaIds: result.outputMediaIds,
      creditsConsumed: result.creditsConsumed,
      duration: result.duration,
    });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
