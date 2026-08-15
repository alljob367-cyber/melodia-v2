import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError, ArtistService } from "@/lib/core";
import { db } from "@/lib/db";
import { z } from "zod";

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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();

    const identity = await core.getArtistIdentity(id);
    if (!identity) {
      return NextResponse.json(
        { error: "Artiste non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ identity });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/artists/[id] GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * PATCH /api/core/artists/[id]
 * Update an artist identity. Requires UPDATE_ARTIST_IDENTITY permission and ownership.
 */
const updateArtistIdentitySchema = z.object({
  visualStyle: z.record(z.string(), z.unknown()).optional(),
  referenceImages: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      label: z.string(),
      type: z.string(),
    })
  ).optional(),
  colorPalette: z.array(z.string()).optional(),
  visualConcepts: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      imageUrl: z.string().optional(),
    })
  ).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateArtistIdentitySchema.parse(body);

    // Ownership check
    const artist = await db.artist.findUnique({ where: { id } });
    if (!artist) {
      return NextResponse.json(
        { error: "Artiste non trouvé" },
        { status: 404 }
      );
    }
    if (artist.userId !== token.sub) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      );
    }

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("UPDATE_ARTIST_IDENTITY");

    const updated = await ArtistService.updateIdentity(id, token.sub, data);

    return NextResponse.json({ success: true, artist: updated });
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
    console.error("[core/artists/[id] PATCH] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
