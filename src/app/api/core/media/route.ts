import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, Api, ApiSchemas } from "@/lib/core";

/**
 * GET /api/core/media
 * List the authenticated user's media with optional filters.
 *
 * Query params:
 *   type      — filter by media type (audio, image, video, document, lyrics)
 *   projectId — filter by project
 *   artistId  — filter by artist
 *   page      — page number (default 1)
 *   limit     — items per page (default 50, max 100)
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return Api.unauthorized();
  }

  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { type, projectId, artistId, page, limit } = ApiSchemas.ListMediaSchema.parse(queryParams);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const { total, media } = await core.listMedia({
      page,
      limit,
      type,
      projectId,
      artistId,
    });

    return Api.paginated(media, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    return Api.handleRouteError(err);
  }
}
