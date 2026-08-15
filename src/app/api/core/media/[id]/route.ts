import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError, MediaService } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";
import { db } from "@/lib/db";

/**
 * GET /api/core/media/[id]
 * Get a single media item with ownership check.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    const media = await db.media.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        artist: { select: { id: true, name: true } },
        generation: { select: { id: true, operation: true, status: true } },
      },
    });

    if (!media) {
      return Api.notFound("Média");
    }

    // Ownership check
    if (media.userId !== token.sub) {
      const user = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true },
      });
      if (user?.role !== "admin") {
        return Api.forbidden("Accès refusé");
      }
    }

    return Api.ok({ media });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}

/**
 * DELETE /api/core/media/[id]
 * Delete a media item. Requires DELETE_MEDIA permission and ownership via MediaService.delete().
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("DELETE_MEDIA");

    // MediaService.delete() performs ownership check internally
    await MediaService.delete(id, token.sub);

    return Api.ack();
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}

/**
 * PATCH /api/core/media/[id]
 * Update media metadata (name, tags, custom metadata).
 * Requires UPDATE_MEDIA permission (or ownership).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = ApiSchemas.UpdateMediaSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("UPDATE_MEDIA");

    const updated = await MediaService.update(id, token.sub, data);

    return Api.ok({ media: updated });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
