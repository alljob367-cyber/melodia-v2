import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { MelodiaCore, PermissionDeniedError, MediaService } from "@/lib/core";
import { db } from "@/lib/db";
import { z } from "zod";

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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
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
      return NextResponse.json(
        { error: "Média non trouvé" },
        { status: 404 }
      );
    }

    // Ownership check
    if (media.userId !== token.sub) {
      const user = await db.user.findUnique({
        where: { id: token.sub },
        select: { role: true },
      });
      if (user?.role !== "admin") {
        return NextResponse.json(
          { error: "Accès refusé" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ media });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[core/media/[id] GET] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("DELETE_MEDIA");

    // MediaService.delete() performs ownership check internally
    await MediaService.delete(id, token.sub);

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: "Permission refusée : " + err.message },
        { status: 403 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("not found") || errorMsg.includes("access denied")) {
      return NextResponse.json(
        { error: "Média non trouvé ou accès refusé" },
        { status: 404 }
      );
    }
    console.error("[core/media/[id] DELETE] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// ============ PATCH: Update media metadata ============

const mediaUpdateSchema = z.object({
  name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = mediaUpdateSchema.parse(body);

    const core = new MelodiaCore(token.sub);
    await core.initialize();
    core.requirePermission("UPDATE_MEDIA");

    const updated = await MediaService.update(id, token.sub, data);

    return NextResponse.json({ success: true, media: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: "Permission refusée : " + err.message },
        { status: 403 }
      );
    }
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("not found") || errorMsg.includes("access denied")) {
      return NextResponse.json(
        { error: "Média non trouvé ou accès refusé" },
        { status: 404 }
      );
    }
    console.error("[core/media/[id] PATCH] Error:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
