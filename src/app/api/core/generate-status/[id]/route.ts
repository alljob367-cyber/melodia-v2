import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { Api } from "@/lib/core/api-responses";

/**
 * GET /api/core/generate-status/[id]
 * Returns the status of a generation job (for polling progress).
 * Also checks ownership — users can only see their own generations.
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

    const generation = await db.generation.findUnique({
      where: { id },
      include: {
        outputMedia: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
            mimeType: true,
            duration: true,
            width: true,
            height: true,
          },
        },
      },
    });

    if (!generation) {
      return Api.notFound("Génération");
    }

    // Ownership check
    if (generation.userId !== token.sub) {
      const user = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true },
      });
      if (user?.role !== "admin") {
        return Api.forbidden("Accès refusé");
      }
    }

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
    return Api.handleRouteError(err);
  }
}
