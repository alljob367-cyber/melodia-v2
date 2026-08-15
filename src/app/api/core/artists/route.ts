import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError } from "@/lib/core";
import { db } from "@/lib/db";
import { z } from "zod";

/**
 * GET /api/core/artists
 * List the authenticated user's artists.
 */
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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

    return NextResponse.json({ artists });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/artists GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * POST /api/core/artists
 * Create a new artist. Requires CREATE_ARTIST permission.
 */
const createArtistSchema = z.object({
  name: z.string().min(1, "Le nom de l'artiste est requis"),
  bio: z.string().optional(),
  country: z.string().optional(),
  genre: z.string().optional(),
  styles: z.array(z.string()).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createArtistSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();

    // CREATE_ARTIST permission is checked inside core.createArtist()
    const artist = await core.createArtist(data);

    return NextResponse.json(
      { success: true, artist },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: "Permission refusée : " + err.message },
        { status: 403 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/artists POST] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
