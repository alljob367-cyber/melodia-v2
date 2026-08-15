import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { Api, ApiSchemas } from "@/lib/core";

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

    const where = {
      userId: token.sub,
      ...(type ? { type } : {}),
      ...(projectId ? { projectId } : {}),
      ...(artistId ? { artistId } : {}),
    };

    const [total, media] = await Promise.all([
      db.media.count({ where }),
      db.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { id: true, name: true } },
          artist: { select: { id: true, name: true } },
        },
      }),
    ]);

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
