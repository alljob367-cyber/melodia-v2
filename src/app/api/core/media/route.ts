import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";
import { z } from "zod";

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
const listMediaQuerySchema = z.object({
  type: z.enum(["audio", "image", "video", "document", "lyrics"]).optional(),
  projectId: z.string().optional(),
  artistId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { type, projectId, artistId, page, limit } = listMediaQuerySchema.parse(queryParams);

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

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/media GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
