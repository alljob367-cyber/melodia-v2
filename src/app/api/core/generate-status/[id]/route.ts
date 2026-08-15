import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, Api } from "@/lib/core";

/**
 * GET /api/core/generate-status/[id]
 * Returns the status of a generation job (for polling progress).
 * Uses MelodiaCore.getGenerationStatus() which checks ownership.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const { id } = await params;

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const generation = await core.getGenerationStatus(id);

    return Api.ok({
      generation: {
        id: generation.id,
        operation: generation.operation,
        status: generation.status,
        progress: generation.progress,
        provider: generation.provider,
        model: generation.model,
        error: generation.error,
        estimatedCost: generation.estimatedCost,
        actualCost: generation.actualCost,
        creditsConsumed: generation.creditsConsumed,
        startedAt: generation.startedAt,
        completedAt: generation.completedAt,
        duration: generation.duration,
        outputMedia: generation.outputMedia,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("non trouvée")) {
      return Api.notFound("Génération");
    }
    if (err instanceof Error && err.message.includes("accès refusé")) {
      return Api.forbidden("Accès refusé");
    }
    return Api.handleRouteError(err);
  }
}
