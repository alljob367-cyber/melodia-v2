import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { db } from "@/lib/db";
import { Api, ApiSchemas } from "@/lib/core";

/**
 * GET /api/core/artists
 * List the authenticated user's artists.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const artists = await db.artist.findMany({
      where: { userId: token.sub },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { projects: true, media: true },
        },
      },
    });

    return Api.ok({ artists });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}

/**
 * POST /api/core/artists
 * Create a new artist. Requires CREATE_ARTIST permission.
 */
export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const body = await req.json();
    const data = ApiSchemas.CreateArtistSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // CREATE_ARTIST permission is checked inside core.createArtist()
    const artist = await core.createArtist(data);

    return Api.created({ artist });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return Api.forbidden(err.message);
    }
    return Api.handleRouteError(err);
  }
}
