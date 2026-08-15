import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError, ArtistService } from "@/lib/core";
import { Api, ApiSchemas } from "@/lib/core";
import { db } from "@/lib/db";

/**
 * GET /api/core/artists/[id]
 * Get an artist identity (visual style, reference images, etc.) via MelodiaCore.
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
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const identity = await core.getArtistIdentity(id);
    if (!identity) {
      return Api.notFound("Artiste");
    }

    return Api.ok({ identity });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}

/**
 * PATCH /api/core/artists/[id]
 * Update an artist identity. Requires UPDATE_ARTIST_IDENTITY permission and ownership.
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
    const data = ApiSchemas.UpdateArtistIdentitySchema.parse(body);

    // Ownership check
    const artist = await db.artist.findUnique({ where: { id } });
    if (!artist) {
      return Api.notFound("Artiste");
    }
    if (artist.userId !== token.sub) {
      return Api.forbidden("Accès refusé");
    }

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("UPDATE_ARTIST_IDENTITY");

    const updated = await ArtistService.updateIdentity(id, token.sub, data);

    return Api.ok({ artist: updated });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
